import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Github, Moon, Sun } from 'lucide-react';
import { AmberLogo } from '../ui/AmberLogo';
import { useTheme } from '../../contexts/ThemeContext';
import { DEMO_LABEL, DEMO_PATH, REPO_URL } from './links';

const SECTIONS = [
  { href: '#matching', label: 'Matching' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#lessons', label: 'Lessons' },
  { href: '#team', label: 'Team' },
];

export function LandingNav() {
  const { isDark, toggleTheme } = useTheme();
  // Section anchors only exist on the case-study page
  const onCaseStudy = useLocation().pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pointer-events-none">
      <div
        className="max-w-5xl mx-auto pl-3 pr-2 sm:pl-5 py-2 rounded-2xl border pointer-events-auto flex items-center justify-between gap-3"
        style={{
          background: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderColor: 'color-mix(in srgb, var(--color-border) 60%, transparent)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Link to="/" className="flex items-center gap-1 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="transition-transform group-hover:rotate-3" style={{ transform: 'translateY(2px)' }}>
            <AmberLogo size="lg" />
          </span>
          <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>
            Amber
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          {onCaseStudy && SECTIONS.map((s) => (
            <a key={s.href} href={s.href} className="transition-opacity hover:opacity-70" style={{ color: 'var(--color-textSecondary)' }}>
              {s.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textSecondary)' }}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textSecondary)' }}
            aria-label="Source on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <Link
            to={DEMO_PATH}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accentText)' }}
          >
            {DEMO_LABEL}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
