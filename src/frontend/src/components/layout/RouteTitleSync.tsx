import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { formatTitle } from '../../hooks/usePageTitle';

/**
 * Maps a URL path → page title.
 * Exact paths checked first; then prefix matches.
 */
const EXACT: Record<string, string> = {
  '/': '',
  '/demo': 'Try the demo',
  '/pricing': 'Plans',
  '/billing/success': 'Billing',
  '/billing/cancel': 'Billing',
  '/auth/login': 'Sign in',
  '/auth/signup': 'Sign up',
  '/auth/forgot-password': 'Reset password',
  '/auth/reset-password': 'Reset password',
  '/auth/callback': 'Signing in',
  '/auth/select-role': 'Choose your role',
  '/auth/verify-email': 'Verify email',
  '/app': 'Dashboard',
  '/app/onboarding': 'Welcome',
  '/app/dashboard': 'Dashboard',
  '/app/assessment': 'Assessment',
  '/app/personality': 'Personality assessment',
  '/app/personality/results': 'Your results',
  '/app/insights': 'Insights',
  '/app/ember': 'Ember',
  '/app/chats': 'Coffee chats',
  '/app/network': 'Network',
  '/app/practice': 'Practice chat',
  '/app/roles': 'Roles',
  '/app/settings': 'Settings',
  '/app/pricing': 'Plans',
  '/app/employer': 'Dashboard',
  '/app/employer/culture-assessment': 'Culture assessment',
  '/app/employer/culture-results': 'Culture results',
  '/app/employer/insights': 'Culture insights',
  '/app/employer/roles': 'Roles',
  '/app/employer/roles/new': 'New role',
  '/app/employer/top-candidates': 'Top candidates',
  '/app/employer/ember': 'Ember',
  '/app/employer/chats': 'Coffee chats',
};

/**
 * Prefix-to-title fallback for dynamic routes.
 * Order matters — longer prefixes first.
 */
const PREFIXES: Array<[string, string]> = [
  ['/app/employer/assessments/', 'Assessment'],
  ['/app/assessments/', 'Assessment'],
  ['/app/settings/', 'Settings'],
];

function titleFor(path: string): string {
  if (path in EXACT) return EXACT[path];
  for (const [prefix, label] of PREFIXES) {
    if (path.startsWith(prefix)) return label;
  }
  return 'Page not found';
}

export function RouteTitleSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = formatTitle(titleFor(pathname));
  }, [pathname]);

  return null;
}
