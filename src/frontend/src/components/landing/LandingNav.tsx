import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Github, Moon, Sun } from 'lucide-react';
import { AmberLogo } from '../ui/AmberLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { DEMO_LABEL, DEMO_PATH, REPO_URL } from './links';

const SECTIONS = [
  { href: '#tour', label: 'Product' },
  { href: '#matching', label: 'Matching' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#lessons', label: 'Lessons' },
  { href: '#team', label: 'Team' },
];

export function LandingNav() {
  const { isDark, toggleTheme } = useTheme();
  // Section anchors only exist on the case-study page
  const onCaseStudy = useLocation().pathname === '/';

  return (
    <nav
      className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 border-b"
      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-5xl mx-auto h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <AmberLogo size="sm" />
          <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Amber
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {onCaseStudy && SECTIONS.map((s) => (
            <a key={s.href} href={s.href} className="transition-colors hover:text-[var(--color-text)]" style={{ color: 'var(--color-textSecondary)' }}>
              {s.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textSecondary)' }}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textSecondary)' }}
            aria-label="Source on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <Link
            to={DEMO_PATH}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium transition-colors bg-[var(--color-accent)] text-[var(--color-accentText)] hover:bg-[var(--color-accentHover)]"
          >
            {DEMO_LABEL}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
