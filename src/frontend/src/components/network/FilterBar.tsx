import { LayoutGrid, Columns2, AlignJustify, LayoutDashboard } from 'lucide-react';

export type FeedFilter = 'all' | 'job_seekers' | 'employers' | 'connections';
export type LayoutMode = 'grid-3' | 'grid-2' | 'feed' | 'masonry';

interface FilterBarProps {
  filter: FeedFilter;
  layout: LayoutMode;
  onFilterChange: (f: FeedFilter) => void;
  onLayoutChange: (l: LayoutMode) => void;
}

const FILTER_TABS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All posts' },
  { value: 'job_seekers', label: 'Job seekers' },
  { value: 'employers', label: 'Employers' },
  { value: 'connections', label: 'Connections' },
];

const LAYOUT_OPTIONS: { value: LayoutMode; icon: typeof LayoutGrid; label: string }[] = [
  { value: 'grid-3', icon: LayoutGrid, label: '3 columns' },
  { value: 'grid-2', icon: Columns2, label: '2 columns' },
  { value: 'feed', icon: AlignJustify, label: 'Feed' },
  { value: 'masonry', icon: LayoutDashboard, label: 'Masonry' },
];

export function FilterBar({
  filter,
  layout,
  onFilterChange,
  onLayoutChange,
}: FilterBarProps) {
  return (
    <div
      className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 backdrop-blur-xl border-b"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-background) 80%, transparent)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hidden">
        {/* Filter tabs: a quiet selected state, the accent stays on "New post" */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {FILTER_TABS.map(tab => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onFilterChange(tab.value)}
                aria-pressed={isActive}
                className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--color-text)]"
                style={{
                  backgroundColor: isActive ? 'var(--color-surfaceHover)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-4" />

        {/* Layout toggle: phones are always one column, so it only shows from sm up */}
        <div
          className="hidden sm:flex items-center gap-0.5 p-1 rounded-lg flex-shrink-0"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {LAYOUT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = layout === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onLayoutChange(opt.value)}
                className="p-1.5 rounded-md transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--color-surfaceHover)' : 'transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-textMuted)',
                }}
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={isActive}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
