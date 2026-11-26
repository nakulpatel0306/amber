import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, FastForward, User } from 'lucide-react';
import { AmberLogo } from '../components/ui/AmberLogo';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { resetDemo } from './store';
import { applySampleCulture, completeSampleAssessment, prepareVisitor, VISITOR_NAME, visitorEmail, type DemoRole } from './visitor';

const ROLES: {
  id: DemoRole;
  label: string;
  icon: typeof User;
  summary: string;
  steps: string[];
}[] = [
  {
    id: 'candidate',
    label: 'Job seeker',
    icon: User,
    summary: 'Take the personality assessment, see your archetype and get ranked against six invented companies.',
    steps: ['Assessment', 'Archetype', 'Ranked matches', 'Coffee chat'],
  },
  {
    id: 'employer',
    label: 'Employer',
    icon: Building2,
    summary: 'Define your culture, set OCEAN ranges per role and see sixteen invented candidates ranked for each one.',
    steps: ['Culture quiz', 'Roles', 'Ranked candidates', 'Coffee chat'],
  },
];

export function DemoStart() {
  usePageTitle('Try the demo');
  const navigate = useNavigate();
  const { user, profile, signUpWithEmail, signOut } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const start = async (role: DemoRole, skip: boolean) => {
    setBusy(`${role}-${skip}`);
    if (user) await signOut();
    // Each run starts from the seed so earlier demo accounts don't show up as matches
    resetDemo();
    const { user: created } = await signUpWithEmail(visitorEmail(role), 'demo-only-password', role, { full_name: VISITOR_NAME });
    if (!created) {
      setBusy(null);
      return;
    }
    prepareVisitor(created.id, role);
    if (role === 'candidate') {
      if (skip) completeSampleAssessment(created.id);
      navigate(skip ? '/app/personality/results' : '/app/personality');
    } else {
      if (skip) applySampleCulture(created.id);
      navigate(skip ? '/app/employer/culture-results' : '/app/employer/culture-assessment');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      <header className="px-4 sm:px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to the case study
        </Link>
        <AmberLogo size="sm" />
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-24 max-w-5xl w-full mx-auto">
        <div className="text-center mt-8 sm:mt-14 mb-10">
          <h1 className="text-headline" style={{ color: 'var(--color-text)' }}>
            Try Amber
          </h1>
          <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto text-balance" style={{ color: 'var(--color-textSecondary)' }}>
            Pick a side. A throwaway account is created in your browser, so there is no signup and nothing is sent
            anywhere. The people and companies are invented.
          </p>
        </div>

        {user && profile?.role && (
          <div
            className="bento-card mb-6 !p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
          >
            <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              You have a demo {profile.role === 'candidate' ? 'job seeker' : 'employer'} run in progress. Starting a new one replaces it.
            </p>
            <button
              onClick={() => navigate(profile.role === 'candidate' ? '/app/dashboard' : '/app/employer')}
              className="inline-flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Continue where you left off
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map((role) => (
            <section key={role.id} className="bento-card !p-6 flex flex-col">
              <div className="flex items-center gap-2.5">
                <role.icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
                  {role.label}
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                {role.summary}
              </p>
              <p className="mt-3 text-label font-normal" style={{ color: 'var(--color-textMuted)' }}>
                {role.steps.join(' → ')}
              </p>
              <div className="mt-auto pt-7 flex flex-col gap-2">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => start(role.id, false)}
                  disabled={busy !== null}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {busy === `${role.id}-false` ? 'Setting up...' : role.id === 'candidate' ? 'Take the assessment' : 'Take the culture quiz'}
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  variant="outline"
                  onClick={() => start(role.id, true)}
                  disabled={busy !== null}
                  leftIcon={<FastForward className="w-4 h-4" />}
                >
                  {busy === `${role.id}-true` ? 'Setting up...' : 'Skip with a sample profile'}
                </Button>
                <p className="text-xs text-center mt-1" style={{ color: 'var(--color-textMuted)' }}>
                  {role.id === 'candidate'
                    ? 'Skipping gives you a random sample personality profile.'
                    : 'Skipping gives your company a random sample culture.'}
                </p>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
