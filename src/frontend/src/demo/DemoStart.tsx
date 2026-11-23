import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, FastForward, User } from 'lucide-react';
import { AmberLogo } from '../components/ui/AmberLogo';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { applySampleCulture, fillSampleAssessment, prepareVisitor, VISITOR_NAME, visitorEmail, type DemoRole } from './visitor';

const ROLES: {
  id: DemoRole;
  label: string;
  icon: typeof User;
  summary: string;
  steps: string[];
}[] = [
  {
    id: 'candidate',
    label: 'Job Seeker',
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
  usePageTitle('Try the Demo');
  const navigate = useNavigate();
  const { user, profile, signUpWithEmail, signOut } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const start = async (role: DemoRole, skip: boolean) => {
    setBusy(`${role}-${skip}`);
    if (user) await signOut();
    const { user: created } = await signUpWithEmail(visitorEmail(role), 'demo-only-password', role, { full_name: VISITOR_NAME });
    if (!created) {
      setBusy(null);
      return;
    }
    prepareVisitor(created.id, role);
    if (role === 'candidate') {
      if (skip) fillSampleAssessment(created.id);
      navigate('/app/personality');
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
        <AmberLogo size="md" />
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-24 max-w-5xl w-full mx-auto">
        <div className="text-center mt-6 sm:mt-12 mb-10">
          <h1 className="text-4xl sm:text-5xl font-serif tracking-tight" style={{ color: 'var(--color-text)' }}>
            Try Amber
          </h1>
          <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'var(--color-textSecondary)' }}>
            Pick a side. A throwaway account is created in your browser, so there is no signup and nothing is sent
            anywhere. The people and companies are invented.
          </p>
        </div>

        {user && profile?.role && (
          <div
            className="mb-6 rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              You already have a demo {profile.role === 'candidate' ? 'job seeker' : 'employer'} account in this browser.
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

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {ROLES.map((role) => (
            <section
              key={role.id}
              className="rounded-2xl border p-6 sm:p-7 flex flex-col"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  <role.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {role.label}
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                {role.summary}
              </p>
              <ol className="mt-5 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--color-textMuted)' }}>
                {role.steps.map((step, i) => (
                  <li
                    key={step}
                    className="rounded-full border px-2.5 py-1"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    {i + 1}. {step}
                  </li>
                ))}
              </ol>
              <div className="mt-auto pt-7 flex flex-col gap-2">
                <button
                  onClick={() => start(role.id, false)}
                  disabled={busy !== null}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {busy === `${role.id}-false` ? 'Setting up...' : role.id === 'candidate' ? 'Take the assessment' : 'Take the culture quiz'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => start(role.id, true)}
                  disabled={busy !== null}
                  className="w-full rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[var(--color-background)] disabled:opacity-60"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <FastForward className="w-4 h-4" />
                  {busy === `${role.id}-true` ? 'Setting up...' : 'Skip with sample answers'}
                </button>
                <p className="text-xs text-center mt-1" style={{ color: 'var(--color-textMuted)' }}>
                  {role.id === 'candidate'
                    ? 'Skipping pre-fills all but the last question with a random persona.'
                    : 'Skipping answers the quiz with a random persona.'}
                </p>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
