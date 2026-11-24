import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: React.ReactNode;
  detail: string;
  action: string;
  to: string;
  loading?: boolean;
}

// One dashboard tile: what it is, the one number or name that matters, a line of context, where to go next
export function SummaryCard({ label, value, detail, action, to, loading = false }: SummaryCardProps) {
  return (
    <Link to={to} className="bento-card group flex flex-col">
      <p className="text-label" style={{ color: 'var(--color-textSecondary)' }}>
        {label}
      </p>
      {loading ? (
        <div className="mt-3 animate-pulse space-y-2">
          <div className="h-8 w-24 rounded-md" style={{ backgroundColor: 'var(--color-surfaceHover)' }} />
          <div className="h-4 w-44 rounded" style={{ backgroundColor: 'var(--color-surfaceHover)' }} />
        </div>
      ) : (
        <>
          <div className="mt-2 text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
            {value}
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {detail}
          </p>
        </>
      )}
      <span
        className="mt-auto pt-5 inline-flex items-center gap-1.5 text-label"
        style={{ color: 'var(--color-accent)' }}
      >
        {action}
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
