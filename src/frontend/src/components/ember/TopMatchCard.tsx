import { ArrowRight } from 'lucide-react';

interface TopMatchCardProps {
  name: string;
  subtitle: string;
  score: number;
  avatarUrl?: string | null;
  onDeepDive: () => void;
}

export function TopMatchCard({ name, subtitle, score, avatarUrl, onDeepDive }: TopMatchCardProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <button type="button" className="bento-card group flex w-full flex-col text-left" onClick={onDeepDive}>
      <span className="text-label" style={{ color: 'var(--color-textSecondary)' }}>
        Top match
      </span>

      <span className="mt-3 flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
        ) : (
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
          >
            {initial}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {name}
          </span>
          <span className="block truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
            {subtitle}
          </span>
        </span>
        <span className="text-heading tabular-nums" style={{ color: 'var(--color-text)' }}>
          {score}%
        </span>
      </span>

      <span className="mt-4 inline-flex items-center gap-1.5 text-label" style={{ color: 'var(--color-accent)' }}>
        See full breakdown
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
