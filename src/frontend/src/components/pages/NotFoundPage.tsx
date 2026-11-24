import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AmberLogo } from '../ui/AmberLogo';

const linkBase =
  'inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]';

/**
 * Unknown URLs. Inside /app it renders in the app shell, so the sidebar stays
 * available; elsewhere it stands alone with the logo.
 */
export function NotFoundPage({ inApp = false }: { inApp?: boolean }) {
  const { isAuthenticated, isEmployer } = useAuth();
  const home = isAuthenticated ? (isEmployer ? '/app/employer' : '/app/dashboard') : '/';

  return (
    <div
      className={`flex items-center justify-center px-4 ${inApp ? 'flex-1 py-24' : 'min-h-screen'}`}
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-md w-full text-center">
        {!inApp && (
          <Link to="/" className="inline-flex mb-8 rounded-md" aria-label="Amber home">
            <AmberLogo size="lg" />
          </Link>
        )}
        <p className="text-label" style={{ color: 'var(--color-textSecondary)' }}>
          404
        </p>
        <h1 className="mt-2 text-title" style={{ color: 'var(--color-text)' }}>
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
          This page doesn't exist, or it moved when Amber became a case study.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated && (
            <Link
              to={home}
              className={`w-full sm:w-auto ${linkBase} bg-[var(--color-accent)] text-[var(--color-accentText)] hover:bg-[var(--color-accentHover)]`}
            >
              Go to your dashboard
            </Link>
          )}
          <Link
            to="/"
            className={`w-full sm:w-auto ${linkBase} border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the case study
          </Link>
        </div>
      </div>
    </div>
  );
}
