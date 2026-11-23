import { Link } from 'react-router-dom';
import { AmberLogo } from '../ui/AmberLogo';
import { DEMO_PATH, REPO_URL, TEAM } from './links';

export function LandingFooter() {
  return (
    <footer
      className="px-4 sm:px-6 lg:px-8 py-10 border-t"
      style={{ backgroundColor: 'var(--color-backgroundSecondary)', borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-6 sm:items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <AmberLogo size="sm" />
          <span style={{ color: 'var(--color-textSecondary)' }}>
            Amber, 2026. Built by {TEAM.map((m) => m.name).join(', ')}. MIT licensed.
          </span>
        </div>
        <div className="flex items-center gap-5" style={{ color: 'var(--color-textSecondary)' }}>
          <Link to={DEMO_PATH} className="hover:opacity-70">Demo</Link>
          <Link to="/pricing" className="hover:opacity-70">Plans</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:opacity-70">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
