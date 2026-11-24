import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AmberLogo } from '../ui/AmberLogo';

// Shared frame for sign in, sign up and password reset, so the three pages read as one flow
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  back = { to: '/', label: 'Back to the case study' },
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className={`flex items-center gap-2 rounded-md ${focusRing}`}>
          <AmberLogo size="sm" />
          <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Amber
          </span>
        </Link>
        <Link
          to={back.to}
          className={`text-sm rounded-sm transition-colors hover:text-[var(--color-text)] ${focusRing}`}
          style={{ color: 'var(--color-textSecondary)' }}
        >
          {back.label}
        </Link>
      </header>

      <main className="flex-1 flex justify-center px-4 pt-8 pb-16 sm:pt-16">
        <div className="w-full max-w-sm">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              {subtitle}
            </p>
          )}
          <div className="bento-card !p-5 sm:!p-6 mt-6">{children}</div>
          {footer && (
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {footer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]';

export const authLinkClass = `font-medium rounded-sm text-[var(--color-accent)] hover:underline underline-offset-4 ${focusRing}`;

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 text-caption" style={{ color: 'var(--color-textSecondary)' }}>
      <span className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
      {label}
      <span className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  );
}

export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className={`rounded-sm ${focusRing}`}
    >
      {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}
