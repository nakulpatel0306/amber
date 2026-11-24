import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { SortOption } from '../../../types/matching.types';

interface GalleryFilterBarProps {
  mode: 'candidate' | 'employer';
  matchCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
  activeFilterCount: number;
  onToggleFilters: () => void;
  showFilters: boolean;
  // Candidate filters
  industries?: string[];
  selectedIndustry?: string;
  onIndustryChange?: (industry: string) => void;
  workStyles?: string[];
  selectedWorkStyle?: string;
  onWorkStyleChange?: (ws: string) => void;
  locations?: string[];
  selectedLocation?: string;
  onLocationChange?: (loc: string) => void;
  // Employer filters
  archetypes?: string[];
  selectedArchetypes?: Set<string>;
  onToggleArchetype?: (arch: string) => void;
  // Role dropdown (employer only)
  roles?: { id: string; title: string }[];
  selectedRoleId?: string | null;
  onRoleChange?: (roleId: string | null) => void;
  // Score range
  minScore: number;
  maxScore: number;
  onMinScoreChange: (score: number) => void;
  onMaxScoreChange: (score: number) => void;
  onClearFilters: () => void;
}

const quickFilters = [
  { value: 'all', label: 'All matches' },
  { value: 'top5', label: 'Top 5' },
  { value: 'top10', label: 'Top 10' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'score', label: 'Best match' },
  { value: 'culture', label: 'Culture fit' },
  { value: 'workstyle', label: 'Work style' },
  { value: 'recent', label: 'Recent' },
];

const controlClass = 'min-h-8 px-3 py-1.5 rounded-lg text-sm';
const controlStyle = {
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
};

export function GalleryFilterBar({
  mode,
  matchCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  quickFilter,
  onQuickFilterChange,
  activeFilterCount,
  onToggleFilters,
  showFilters,
  industries,
  selectedIndustry,
  onIndustryChange,
  selectedWorkStyle,
  onWorkStyleChange,
  locations,
  selectedLocation,
  onLocationChange,
  archetypes,
  selectedArchetypes,
  onToggleArchetype,
  roles,
  selectedRoleId,
  onRoleChange,
  minScore,
  maxScore,
  onMinScoreChange,
  onMaxScoreChange,
  onClearFilters,
}: GalleryFilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={mode === 'candidate' ? 'Search companies' : 'Search candidates'}
            aria-label={mode === 'candidate' ? 'Search companies' : 'Search candidates'}
            className={`${controlClass} w-full pl-9 pr-8`}
            style={controlStyle}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'var(--color-textMuted)' }} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
          <div className="flex items-center gap-0.5" role="group" aria-label="Show">
            {quickFilters.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => onQuickFilterChange(f.value)}
                aria-pressed={quickFilter === f.value}
                className="px-2.5 py-1.5 rounded-lg text-label whitespace-nowrap transition-colors hover:text-[var(--color-text)]"
                style={{
                  backgroundColor: quickFilter === f.value ? 'var(--color-surfaceHover)' : 'transparent',
                  color: quickFilter === f.value ? 'var(--color-text)' : 'var(--color-textSecondary)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {mode === 'employer' && roles && roles.length > 0 && (
            <select
              value={selectedRoleId ?? ''}
              onChange={e => onRoleChange?.(e.target.value || null)}
              aria-label="Score for role"
              className={`${controlClass} cursor-pointer max-w-[12rem]`}
              style={controlStyle}
            >
              <option value="">All roles</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          )}

          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            aria-label="Sort by"
            className={`${controlClass} cursor-pointer`}
            style={controlStyle}
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <Button
            size="sm"
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={onToggleFilters}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && <span className="tabular-nums">({activeFilterCount})</span>}
          </Button>
        </div>
      </div>

      <p className="text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
        {matchCount} {mode === 'candidate'
          ? (matchCount === 1 ? 'match' : 'matches')
          : (matchCount === 1 ? 'candidate' : 'candidates')}
      </p>

      {showFilters && (
        <div className="bento-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Filters</h3>
            {activeFilterCount > 0 && (
              <Button size="xs" variant="link" onClick={onClearFilters}>
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {mode === 'candidate' && industries && industries.length > 0 && (
              <FilterField label="Industry">
                <select
                  value={selectedIndustry || ''}
                  onChange={e => onIndustryChange?.(e.target.value)}
                  className={`${controlClass} w-full`}
                  style={controlStyle}
                >
                  <option value="">All industries</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </FilterField>
            )}

            {mode === 'candidate' && (
              <FilterField label="Work style">
                <select
                  value={selectedWorkStyle || ''}
                  onChange={e => onWorkStyleChange?.(e.target.value)}
                  className={`${controlClass} w-full`}
                  style={controlStyle}
                >
                  <option value="">All styles</option>
                  {['remote', 'hybrid', 'onsite', 'flexible'].map(ws => (
                    <option key={ws} value={ws}>{ws.charAt(0).toUpperCase() + ws.slice(1)}</option>
                  ))}
                </select>
              </FilterField>
            )}

            {mode === 'candidate' && locations && locations.length > 0 && (
              <FilterField label="Location">
                <select
                  value={selectedLocation || ''}
                  onChange={e => onLocationChange?.(e.target.value)}
                  className={`${controlClass} w-full`}
                  style={controlStyle}
                >
                  <option value="">All locations</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </FilterField>
            )}

            {mode === 'employer' && archetypes && archetypes.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-label mb-1.5" style={{ color: 'var(--color-textSecondary)' }}>Archetypes</p>
                <div className="flex flex-wrap gap-1.5">
                  {archetypes.map(arch => {
                    const on = selectedArchetypes?.has(arch) ?? false;
                    return (
                      <button
                        key={arch}
                        type="button"
                        onClick={() => onToggleArchetype?.(arch)}
                        aria-pressed={on}
                        className="px-2.5 py-1 rounded-full text-caption transition-colors"
                        style={{
                          backgroundColor: on ? 'var(--color-surfaceHover)' : 'transparent',
                          color: on ? 'var(--color-text)' : 'var(--color-textSecondary)',
                          border: `1px solid ${on ? 'var(--color-borderHover)' : 'var(--color-border)'}`,
                        }}
                      >
                        {arch}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <FilterField label="Min score">
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={e => onMinScoreChange(Number(e.target.value))}
                className={`${controlClass} w-full tabular-nums`}
                style={controlStyle}
              />
            </FilterField>
            <FilterField label="Max score">
              <input
                type="number"
                min={0}
                max={100}
                value={maxScore}
                onChange={e => onMaxScoreChange(Number(e.target.value))}
                className={`${controlClass} w-full tabular-nums`}
                style={controlStyle}
              />
            </FilterField>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-label mb-1.5 block" style={{ color: 'var(--color-textSecondary)' }}>{label}</span>
      {children}
    </label>
  );
}
