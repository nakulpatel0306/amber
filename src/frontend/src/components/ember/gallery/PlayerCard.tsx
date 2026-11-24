import { Bookmark, BookmarkCheck, Check } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { ConnectionStatus } from '../../../types/connections.types';

interface PlayerCardProps {
  id: string;
  name: string;
  subtitle: string;
  archetype: { name: string; key: string };
  overallScore: number;
  cultureScore: number;
  workStyleScore: number;
  traitScore: number;
  highlightPills: string[];
  avatarUrl?: string | null;
  index?: number;
  isSaved?: boolean;
  isSelected?: boolean;
  showSelect?: boolean;
  connectionStatus?: ConnectionStatus;
  onDeepDive: () => void;
  onBrew: () => void;
  onToggleSave: () => void;
  onToggleSelect?: () => void;
  onConnect?: () => void;
}

export function PlayerCard({
  name, subtitle, archetype, overallScore, cultureScore, workStyleScore,
  traitScore, avatarUrl, isSaved = false,
  isSelected = false, showSelect = false, connectionStatus = 'accepted',
  onDeepDive, onBrew, onToggleSave, onToggleSelect, onConnect,
}: PlayerCardProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className="bento-card card-hover flex h-full flex-col"
      style={{ borderColor: isSelected ? 'var(--color-accent)' : undefined }}
    >
      {/* The body opens the deep dive too, so the whole card is a target, not just the button */}
      <div className="cursor-pointer" onClick={onDeepDive}>
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
          ) : (
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {name}
            </h3>
            <p className="truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
              {subtitle}
            </p>
          </div>
          <div className="-mr-1.5 -mt-1 flex flex-shrink-0 items-center">
            {showSelect && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
                aria-pressed={isSelected}
                aria-label={isSelected ? 'Remove from compare' : 'Select to compare'}
                title={isSelected ? 'Remove from compare' : 'Select to compare'}
                className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surfaceHover)]"
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded border"
                  style={{
                    borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-borderHover)',
                    backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  {isSelected && <Check className="h-3 w-3" style={{ color: 'var(--color-accentText)' }} />}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}
              title={isSaved ? 'Remove bookmark' : 'Bookmark'}
              className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surfaceHover)]"
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              ) : (
                <Bookmark className="h-4 w-4" style={{ color: 'var(--color-textMuted)' }} />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span
            className="truncate rounded-full px-2 py-0.5 text-caption"
            style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
          >
            {archetype.name}
          </span>
          <span className="flex-shrink-0 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            <span className="text-heading tabular-nums" style={{ color: 'var(--color-text)' }}>{overallScore}%</span>
            {' '}match
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { label: 'Culture', score: cultureScore },
            { label: 'Traits', score: traitScore },
            { label: 'Style', score: workStyleScore },
          ].map(({ label, score }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-12 flex-shrink-0 text-caption" style={{ color: 'var(--color-textSecondary)' }}>
                {label}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${score}%`, backgroundColor: 'var(--color-textMuted)' }}
                />
              </div>
              <span className="w-9 text-right text-caption tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                {score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <Button size="sm" variant="outline" className="flex-1 whitespace-nowrap" onClick={onDeepDive}>
          Deep dive
        </Button>
        {connectionStatus === 'accepted' ? (
          <Button size="sm" className="flex-1 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onBrew(); }}>
            Let's brew
          </Button>
        ) : connectionStatus === 'pending_sent' ? (
          <span
            className="inline-flex min-h-8 flex-1 items-center justify-center gap-2 whitespace-nowrap text-label"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
            Pending
          </span>
        ) : (
          <Button size="sm" className="flex-1 whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onConnect?.(); }}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
