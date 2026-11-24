import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SUFFIX = 'Amber | Culture match';

/**
 * Maps a URL path → page title.
 * Exact paths checked first; then prefix matches.
 */
const EXACT: Record<string, string> = {
  '/': '',
  '/demo': 'Try the demo',
  '/pricing': 'Plans',
  '/auth/login': 'Sign in',
  '/auth/signup': 'Sign up',
  '/auth/forgot-password': 'Reset password',
  '/auth/callback': 'Signing in',
  '/auth/select-role': 'Choose your role',
  '/auth/verify-email': 'Verify email',
  '/auth/onboarding': 'Welcome',
  '/app': 'Dashboard',
  '/app/dashboard': 'Dashboard',
  '/app/assessment': 'Assessment',
  '/app/insights': 'Insights',
  '/app/ember': 'Ember',
  '/app/matches': 'Matches',
  '/app/coffee-chats': 'Coffee chats',
  '/app/chats': 'Coffee chats',
  '/app/network': 'Network',
  '/app/practice': 'Practice',
  '/app/settings': 'Settings',
  '/app/pricing': 'Pricing',
  '/app/employer/dashboard': 'Employer dashboard',
  '/app/employer/culture-quiz': 'Culture quiz',
  '/app/employer/culture': 'Culture insights',
  '/app/employer/roles': 'Manage roles',
  '/app/employer/roles/create': 'Create role',
  '/app/employer/candidates': 'Candidates',
  '/app/employer/coffee-chats': 'Coffee chats',
  '/app/employer/ember': 'Ember',
};

/**
 * Prefix-to-title fallback for dynamic routes.
 * Order matters — longer prefixes first.
 */
const PREFIXES: Array<[string, string]> = [
  ['/app/assessments/', 'Assessment'],
  ['/app/matches/', 'Match'],
  ['/app/ember/', 'Ember'],
  ['/app/billing/', 'Billing'],
  ['/app/employer/roles/', 'Role'],
  ['/app/employer/', 'Employer'],
  ['/auth/', 'Auth'],
  ['/app/', 'Amber'],
];

function titleFor(path: string): string {
  if (path in EXACT) return EXACT[path];
  for (const [prefix, label] of PREFIXES) {
    if (path.startsWith(prefix)) return label;
  }
  return '';
}

export function RouteTitleSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = titleFor(pathname);
    document.title = page ? `${page} · ${SUFFIX}` : SUFFIX;
  }, [pathname]);

  return null;
}
