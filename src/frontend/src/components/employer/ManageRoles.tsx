import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

type RoleStatus = 'active' | 'paused' | 'closed' | 'draft';

interface Role {
  id: string;
  title: string;
  description: string | null;
  requirements: string[] | null;
  nice_to_have: string[] | null;
  location: string | null;
  work_style: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: RoleStatus;
  created_at: string;
  applicant_count: number;
}

// Enum values to labels: full_time -> Full time
function enumLabel(str: string): string {
  const s = str.replace(/[-_]/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ManageRoles() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoleStatus | 'all'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const showLoader = useMinLoader(isLoading, 1500);

  useEffect(() => {
    if (!user) return;
    loadRoles();
  }, [user]);

  const loadRoles = async () => {
    if (!user) return;

    try {
      const { data: employer } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employer) {
        setIsLoading(false);
        return;
      }

      const { data: rolesData, error } = await supabase
        .from('roles')
        .select('*')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const roleIds = (rolesData || []).map(r => r.id);
      let appCounts: Record<string, number> = {};

      if (roleIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('role_id')
          .in('role_id', roleIds);

        if (apps) {
          appCounts = apps.reduce((acc: Record<string, number>, app) => {
            acc[app.role_id] = (acc[app.role_id] || 0) + 1;
            return acc;
          }, {});
        }
      }

      const formattedRoles: Role[] = (rolesData || []).map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        requirements: r.requirements,
        nice_to_have: r.nice_to_have,
        location: r.location,
        work_style: r.work_style,
        employment_type: r.employment_type,
        salary_min: r.salary_min,
        salary_max: r.salary_max,
        status: r.status as RoleStatus,
        created_at: r.created_at,
        applicant_count: appCounts[r.id] || 0,
      }));

      setRoles(formattedRoles);
    } catch (err) {
      console.error('Error loading roles:', err);
      showError('Failed to load roles', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (roleId: string, newStatus: RoleStatus) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ status: newStatus })
        .eq('id', roleId);

      if (error) throw error;

      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, status: newStatus } : r));
      setOpenMenu(null);
      success('Role updated', `Role has been ${newStatus === 'active' ? 'activated' : newStatus}.`);
    } catch (err) {
      console.error('Error updating role:', err);
      showError('Failed to update role', 'Please try again.');
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(prev => prev.filter(r => r.id !== roleId));
      setOpenMenu(null);
      success('Role deleted', 'The role has been removed.');
    } catch (err) {
      console.error('Error deleting role:', err);
      showError('Failed to delete role', 'Please try again.');
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch =
      role.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || role.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    active: roles.filter(r => r.status === 'active').length,
    paused: roles.filter(r => r.status === 'paused').length,
    totalApplicants: roles.reduce((sum, r) => sum + r.applicant_count, 0),
    totalRoles: roles.length,
  };

  // Status is a dot and a word; only the dot carries color
  const statusDot: Record<RoleStatus, string> = {
    active: 'var(--color-success)',
    paused: 'var(--color-warning)',
    closed: 'var(--color-textMuted)',
    draft: 'var(--color-textMuted)',
  };

  if (showLoader) {
    return <CoffeeBrewLoader variant="fullscreen" />;
  }

  const menuItemClass = 'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[var(--color-surfaceHover)]';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title="Manage roles"
        subtitle="Each role sets its own trait ranges"
        belowSubtitle={
          <Facts
            items={[
              { label: 'Active', value: stats.active },
              { label: 'Paused', value: stats.paused },
              { label: 'Applicants', value: stats.totalApplicants },
              { label: 'Total', value: stats.totalRoles },
            ]}
          />
        }
        rightContent={
          <Link to="/app/employer/roles/new">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create role
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--color-textMuted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search roles…"
            className="w-full pl-10 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent)] border border-[var(--color-border)]"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
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
        <div className="flex gap-1 overflow-x-auto scrollbar-hidden">
          {(['all', 'active', 'paused', 'closed'] as const).map(status => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                aria-pressed={isActive}
                className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--color-text)]"
                style={{
                  backgroundColor: isActive ? 'var(--color-surfaceHover)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)',
                }}
              >
                {status === 'all' ? 'All' : enumLabel(status)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Roles: one card, divided rows */}
      <div className="bento-card !p-0">
        {filteredRoles.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-heading mb-1" style={{ color: 'var(--color-text)' }}>
              {searchQuery || statusFilter !== 'all'
                ? 'No roles match your filters'
                : 'No roles yet'}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-textSecondary)' }}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Create your first role to start matching candidates'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link to="/app/employer/roles/new" className="inline-block">
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create your first role</Button>
              </Link>
            )}
          </div>
        ) : (
          <ul>
            {filteredRoles.map((role, i) => {
              const meta = [
                role.work_style && enumLabel(role.work_style),
                role.location,
                role.employment_type && enumLabel(role.employment_type),
                role.salary_min && role.salary_max
                  ? `$${(role.salary_min / 1000).toFixed(0)}k – $${(role.salary_max / 1000).toFixed(0)}k`
                  : null,
              ].filter(Boolean).join(' · ');
              return (
                <li
                  key={role.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4"
                  style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {role.title}
                    </h3>
                    {meta && (
                      <p className="text-label font-normal mt-0.5" style={{ color: 'var(--color-textSecondary)' }}>
                        {meta}
                      </p>
                    )}
                    <p className="text-caption mt-1" style={{ color: 'var(--color-textMuted)' }}>
                      Created {new Date(role.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    <span className="flex items-center gap-2 sm:w-20">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: statusDot[role.status] }} />
                      {enumLabel(role.status)}
                    </span>
                    <span className="tabular-nums sm:w-24">
                      {role.applicant_count} applicant{role.applicant_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to="/app/employer/top-candidates">
                      <Button variant="outline" size="sm">
                        View candidates
                      </Button>
                    </Link>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === role.id ? null : role.id)}
                        aria-label={`Options for ${role.title}`}
                        className="p-2 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
                        style={{ color: 'var(--color-textMuted)' }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenu === role.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenu(null)}
                          />
                          <div
                            className="absolute right-0 top-full mt-1 w-44 py-1 rounded-lg shadow-lg z-20"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {role.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(role.id, 'paused')}
                                className={menuItemClass}
                                style={{ color: 'var(--color-text)' }}
                              >
                                Pause role
                              </button>
                            ) : role.status === 'paused' ? (
                              <button
                                onClick={() => handleStatusChange(role.id, 'active')}
                                className={menuItemClass}
                                style={{ color: 'var(--color-text)' }}
                              >
                                Activate role
                              </button>
                            ) : null}
                            {role.status !== 'closed' && (
                              <button
                                onClick={() => handleStatusChange(role.id, 'closed')}
                                className={menuItemClass}
                                style={{ color: 'var(--color-text)' }}
                              >
                                Close role
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(role.id)}
                              className={menuItemClass}
                              style={{ color: 'var(--color-error)' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete role
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
