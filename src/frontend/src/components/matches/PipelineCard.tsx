import { Button } from '../ui/Button';
import type { SavedMatch } from '../../types/matching.types';
import { formatDistanceToNow } from 'date-fns';

interface PipelineCardProps {
  match: SavedMatch;
  mode: 'candidate' | 'employer';
  onViewInEmber: () => void;
  onRemove: () => void;
  onCoffeeChat: () => void;
}

// Status is a dot and a word; only the dot carries color
const statusDots: Record<string, string> = {
  saved: 'var(--color-accent)',
  pending: 'var(--color-warning)',
  connected: 'var(--color-success)',
};

const statusLabels: Record<string, string> = {
  saved: 'Saved',
  pending: 'Pending',
  connected: 'Connected',
};

// One row of the pipeline list; the list supplies the card and the dividers
export function PipelineCard({
  match,
  mode: _mode,
  onViewInEmber,
  onRemove,
  onCoffeeChat,
}: PipelineCardProps) {
  const timeAgo = formatDistanceToNow(new Date(match.created_at), { addSuffix: true });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
          {match.target_type === 'role' ? 'Role match' : 'Candidate match'}
        </p>
        <p className="flex items-center gap-1.5 text-label font-normal mt-0.5" style={{ color: 'var(--color-textSecondary)' }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusDots[match.status] ?? 'var(--color-textMuted)' }} />
          {statusLabels[match.status]} {timeAgo}
        </p>
        {match.notes && (
          <p className="text-label font-normal mt-1 line-clamp-1" style={{ color: 'var(--color-textMuted)' }}>
            {match.notes}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
        {match.match_score != null && match.match_score > 0 && (
          <span className="mr-3 text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
            {match.match_score}%
          </span>
        )}
        {match.status === 'saved' && (
          <Button size="sm" variant="outline" onClick={onCoffeeChat}>
            Coffee chat
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onViewInEmber}>
          View in Ember
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
