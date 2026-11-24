import { RefreshCw } from 'lucide-react';

export interface RankedRow {
  key: string;
  initial: string;
  imageUrl?: string | null;
  primary: string;
  secondary: string;
  meta: string;
  status: string;
  // Rows the viewer has acted on get the accent dot; untouched matches stay neutral
  active: boolean;
  score: number;
}

interface RankedListProps {
  title: string;
  rows: RankedRow[];
  locked: boolean;
  lockedMessage: string;
  onRowClick?: (index: number) => void;
  onRefresh?: () => void;
}

// The dashboard's ranked matches: one card, divided rows, score on the right
export function RankedList({ title, rows, locked, lockedMessage, onRowClick, onRefresh }: RankedListProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        {onRefresh && !locked && rows.length > 0 && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-label transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Show others
          </button>
        )}
      </div>

      <div className="bento-card !p-0 overflow-hidden">
        {locked || rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {locked ? lockedMessage : 'No matches yet'}
          </p>
        ) : (
          <ul>
            {rows.map((row, i) => (
              <li key={row.key} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>
                <button
                  type="button"
                  onClick={() => onRowClick?.(i)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_9rem_8rem_3.5rem] items-center gap-4 px-4 sm:px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-surfaceHover)]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
                        style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
                      >
                        {row.initial}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {row.primary}
                      </span>
                      <span className="block truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
                        {row.secondary}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:block truncate text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    {row.meta}
                  </span>
                  <span className="hidden sm:flex items-center gap-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: row.active ? 'var(--color-accent)' : 'var(--color-borderHover)' }}
                    />
                    {row.status}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
                    {row.score}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
