import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ExternalLink } from 'lucide-react';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { formatSalary } from '../../utils/matchHelpers';

interface RoleRow {
  id: string;
  title: string;
  description: string;
  location: string;
  work_style: string | null;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  required_openness_min: number | null;
  required_openness_max: number | null;
  required_conscientiousness_min: number | null;
  required_conscientiousness_max: number | null;
  required_extraversion_min: number | null;
  required_extraversion_max: number | null;
  required_agreeableness_min: number | null;
  required_agreeableness_max: number | null;
  required_neuroticism_min: number | null;
  required_neuroticism_max: number | null;
  employers: {
    id: string;
    user_id: string;
    company_name: string;
    company_size: string;
    industry: string;
    location: string;
    company_website: string;
    company_logo_url: string | null;
  };
  // Joined after load
  _hiringName?: string;
}

// Enum values to labels: full_time -> Full time
function enumLabel(str: string): string {
  const s = str.replace(/[-_]/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const traitMeta: { minField: keyof RoleRow; maxField: keyof RoleRow; highLabel: string; lowLabel: string }[] = [
  { minField: 'required_openness_min', maxField: 'required_openness_max', highLabel: 'Creative', lowLabel: 'Practical' },
  { minField: 'required_conscientiousness_min', maxField: 'required_conscientiousness_max', highLabel: 'Detail-oriented', lowLabel: 'Flexible' },
  { minField: 'required_extraversion_min', maxField: 'required_extraversion_max', highLabel: 'Collaborative', lowLabel: 'Independent' },
  { minField: 'required_agreeableness_min', maxField: 'required_agreeableness_max', highLabel: 'Team player', lowLabel: 'Assertive' },
  { minField: 'required_neuroticism_min', maxField: 'required_neuroticism_max', highLabel: 'Passionate', lowLabel: 'Calm and steady' },
];

function getTraitHighlights(role: RoleRow): { label: string }[] {
  const highlights: { label: string; avg: number }[] = [];
  for (const t of traitMeta) {
    const min = role[t.minField] as number | null;
    const max = role[t.maxField] as number | null;
    if (min == null || max == null) continue;
    const avg = (min + max) / 2;
    if (avg >= 65) highlights.push({ label: t.highLabel, avg });
    else if (avg <= 35) highlights.push({ label: t.lowLabel, avg });
  }
  highlights.sort((a, b) => Math.abs(b.avg - 50) - Math.abs(a.avg - 50));
  return highlights.slice(0, 2);
}

export function RolesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedWorkStyle, setSelectedWorkStyle] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);
  const navigate = useNavigate();

  const showLoader = useMinLoader(isLoading, 1500);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, title, description, location, work_style, employment_type, salary_min, salary_max, required_openness_min, required_openness_max, required_conscientiousness_min, required_conscientiousness_max, required_extraversion_min, required_extraversion_max, required_agreeableness_min, required_agreeableness_max, required_neuroticism_min, required_neuroticism_max, employers!inner(id, user_id, company_name, company_size, industry, location, company_website, company_logo_url)')
        .eq('status', 'active');

      if (error) throw error;
      const rolesData = (data as unknown as RoleRow[]) || [];

      // Fetch hiring manager names from profiles
      const userIds = [...new Set(rolesData.map(r => r.employers.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        let profiles: { id: string; full_name: string | null }[] = [];
        try {
          const { data: rpcData, error: rpcErr } = await supabase
            .rpc('get_profiles_by_ids', { user_ids: userIds });
          if (rpcErr) {
            const { data: fallback } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);
            profiles = (fallback as any) || [];
          } else {
            profiles = (rpcData as any) || [];
          }
        } catch { /* profile lookup failed, continue without names */ }
        const nameMap = new Map(profiles.map(p => [p.id, p.full_name]));
        rolesData.forEach(r => {
          r._hiringName = nameMap.get(r.employers.user_id) || undefined;
        });
      }

      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const industries = useMemo(() =>
    [...new Set(roles.map(r => r.employers.industry).filter(Boolean))].sort(),
    [roles]
  );

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    roles.forEach(r => map.set(r.employers.id, r.employers.company_name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [roles]);

  const uniqueCompanies = companies.length;

  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.employers.company_name.toLowerCase().includes(q) &&
          !(r.employers.industry || '').toLowerCase().includes(q) &&
          !(r.location || '').toLowerCase().includes(q)
        ) return false;
      }
      if (selectedIndustry && r.employers.industry !== selectedIndustry) return false;
      if (selectedWorkStyle && r.work_style !== selectedWorkStyle) return false;
      if (selectedCompanyId && r.employers.id !== selectedCompanyId) return false;
      return true;
    });
  }, [roles, searchQuery, selectedIndustry, selectedWorkStyle, selectedCompanyId]);

  const hasActiveFilters = !!(selectedIndustry || selectedWorkStyle || selectedCompanyId);

  if (showLoader) return <CoffeeBrewLoader variant="fullscreen" message="Loading roles…" />;

  const selectClass = 'flex-1 sm:flex-none min-w-0 px-3 py-2 rounded-lg text-sm cursor-pointer border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]';
  const selectStyle = { backgroundColor: 'var(--color-surface)', color: 'var(--color-textSecondary)' };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title="Available roles"
        subtitle="Browse all open positions"
        belowSubtitle={
          <Facts
            items={[
              { label: 'Active roles', value: roles.length },
              { label: 'Companies', value: uniqueCompanies },
              { label: 'Industries', value: industries.length },
            ]}
          />
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--color-textMuted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search roles, companies, locations…"
            className="w-full pl-10 pr-8 py-2 rounded-lg text-sm border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'var(--color-textMuted)' }} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {industries.length > 0 && (
            <select
              value={selectedIndustry || ''}
              onChange={e => setSelectedIndustry(e.target.value || null)}
              aria-label="Industry"
              className={selectClass}
              style={selectStyle}
            >
              <option value="">All industries</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}
          <select
            value={selectedWorkStyle || ''}
            onChange={e => setSelectedWorkStyle(e.target.value || null)}
            aria-label="Work style"
            className={selectClass}
            style={selectStyle}
          >
            <option value="">All work styles</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
          {companies.length > 1 && (
            <select
              value={selectedCompanyId || ''}
              onChange={e => setSelectedCompanyId(e.target.value || null)}
              aria-label="Company"
              className={selectClass}
              style={selectStyle}
            >
              <option value="">All companies</option>
              {companies.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Results count + clear */}
      <div className="mt-8 mb-3 flex items-center justify-between gap-2">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
          {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedIndustry(null); setSelectedWorkStyle(null); setSelectedCompanyId(null); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Roles: one card, divided rows; a row opens in place to show the details and actions */}
      <div className="bento-card !p-0 overflow-hidden">
        {filteredRoles.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              {roles.length === 0 ? 'No active roles yet' : 'No roles match your filters'}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {roles.length === 0 ? 'Check back soon for new opportunities' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <ul>
            {filteredRoles.map((role, i) => {
              const emp = role.employers;
              const salary = formatSalary(role.salary_min, role.salary_max);
              const traits = getTraitHighlights(role);
              const isOpen = openRoleId === role.id;
              const place = [role.location, role.work_style && enumLabel(role.work_style)].filter(Boolean).join(' · ');
              return (
                <li key={role.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>
                  <button
                    type="button"
                    onClick={() => setOpenRoleId(isOpen ? null : role.id)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_12rem_8rem] items-center gap-4 px-4 sm:px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-surfaceHover)]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {emp.company_logo_url ? (
                        <img
                          src={emp.company_logo_url}
                          alt=""
                          className="h-9 w-9 flex-shrink-0 rounded-lg object-contain"
                          style={{ backgroundColor: '#fff' }}
                        />
                      ) : (
                        <span
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
                          style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
                        >
                          {emp.company_name.charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {role.title}
                        </span>
                        <span className="block truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
                          {emp.company_name}
                          {role._hiringName ? ` · ${role._hiringName} is hiring` : emp.industry ? ` · ${emp.industry}` : ''}
                        </span>
                      </span>
                    </span>
                    <span className="hidden sm:block truncate text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                      {place}
                    </span>
                    <span className="text-right text-sm font-medium tabular-nums" style={{ color: salary !== 'Not specified' ? 'var(--color-text)' : 'var(--color-textMuted)' }}>
                      {salary !== 'Not specified' ? salary : '—'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 sm:pl-[4.25rem] animate-fade-in">
                      {role.description && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                          {role.description}
                        </p>
                      )}
                      <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        {place && <Detail label="Location" value={place} />}
                        {role.employment_type && <Detail label="Type" value={enumLabel(role.employment_type)} />}
                        {emp.company_size && <Detail label="Company size" value={`${emp.company_size} employees`} />}
                        {emp.industry && <Detail label="Industry" value={emp.industry} />}
                        {traits.length > 0 && <Detail label="Ideal personality" value={traits.map(t => t.label).join(', ')} />}
                      </dl>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => navigate(`/app/ember?deepdive=${emp.id}`)}>
                          {role._hiringName ? `Connect with ${role._hiringName.split(' ')[0]}` : 'Connect'}
                        </Button>
                        {emp.company_website && (
                          <a
                            href={emp.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 py-1 text-label transition-colors hover:bg-[var(--color-surfaceHover)]"
                            style={{ color: 'var(--color-textSecondary)' }}
                          >
                            Company website
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <dt className="flex-shrink-0" style={{ color: 'var(--color-textMuted)' }}>{label}</dt>
      <dd className="min-w-0" style={{ color: 'var(--color-text)' }}>{value}</dd>
    </div>
  );
}
