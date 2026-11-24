import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationDropdown } from '../layout/NotificationDropdown';

interface DashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export function DashboardHeader({ greeting, firstName }: DashboardHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          {dateStr}
        </p>
      </div>

      {/* Theme toggle + notifications (the mobile top bar has its own) */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ color: 'var(--color-textSecondary)' }}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <NotificationDropdown />
      </div>
    </header>
  );
}
