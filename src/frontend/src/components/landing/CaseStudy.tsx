/**
 * Site root: Amber as a case study. The story runs problem, what we built
 * (try it), how it works, where it was going, why we stopped, what we learned
 * and who built it.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';
import { FeatureBento } from './FeatureBento';
import { MatchingExplainer } from './MatchingExplainer';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { BLUEPRINT_URL, DEMO_LABEL, DEMO_PATH, REPO_URL, TEAM } from './links';
import { ARCHETYPES } from '../../lib/archetypes';
import { IS_DEMO } from '../../demo/flag';
import { usePageTitle } from '../../hooks/usePageTitle';

const KRISTOF_BROWN = 'https://doi.org/10.1111/j.1744-6570.2005.00672.x';

// From BLUEPRINT.md, "Where Amber Was Going (never built)"
const ROADMAP = [
  {
    t: 'Conversational Ember AI',
    d: 'Ember would have replaced the multiple-choice assessment with an open-ended interview, reading trait signals from how people answer, and stayed on afterwards as a career advisor.',
  },
  {
    t: 'Team DNA mapping',
    d: 'Employers would have mapped the personalities of an existing team, so matching could favor candidates who balance its gaps instead of matching the company as a whole.',
  },
  {
    t: 'Culture verification',
    d: "Current and former employees would have anonymously checked an employer's culture claims against the same OCEAN framework used for matching.",
  },
  {
    t: 'Predictive retention',
    d: 'A model would have estimated how likely a hire was to stay and do well, from patterns in personality and culture alignment.',
  },
  {
    t: 'Passive culture signals',
    d: 'Preliminary culture profiles generated from public data, so candidates would have seen companies before those companies ever signed up.',
  },
  {
    t: 'Blind culture matching',
    d: 'A mode that hid names, brands and pedigree, so both sides judged each other on culture and personality alone.',
  },
];

const STATUS = [
  {
    title: 'Paused',
    body: 'The culture-fit hiring space filled up quickly. Competing would have meant raising money, and we decided not to. So Amber will not launch, and none of that roadmap will be built.',
  },
  {
    title: 'Kept',
    body: 'The code stays open under MIT, the full stack still runs locally, and this page ships a demo of the real app with invented data so anyone can try it.',
  },
];

const WEIGHTS = [
  { n: '40%', t: 'Trait distance', d: 'Euclidean distance across the five traits, scaled so identical profiles score 100.' },
  { n: '30%', t: 'Culture and role fit', d: 'Each culture value maps to traits (innovation leans on openness), plus how many traits land inside the role ranges.' },
  { n: '20%', t: 'Work style', d: 'Remote, hybrid, onsite or flexible, from a small compatibility table.' },
  { n: '10%', t: 'Communication', d: 'Closeness on extraversion and agreeableness.' },
];

const FLOW = [
  { t: 'Assess', d: 'Candidates take the assessment and get an archetype. Employers define culture and per-role ranges.' },
  { t: 'Match', d: 'Both sides see ranked matches with a per-trait breakdown and an Ember write-up of strengths and gaps.' },
  { t: 'Chat', d: 'Either side sends a request with proposed times. Accepted chats get realtime messaging, a prep brief and feedback.' },
];

const LESSONS = [
  {
    title: 'Explainable math beat a black box',
    body:
      'Ember is weighted distance plus a culture table, not a model. Every score breaks down trait by trait, which made matches easy to trust and easy to argue with in a coffee chat.',
  },
  {
    title: 'Supabase from the client was fast, RLS was the cost',
    body:
      'Talking to Postgres directly from React let three people ship both sides of the product. It also meant Row Level Security carried authorization, and policies that referenced each other recursed. The supabase/ folder still has the fix-*-recursion scripts that taught us.',
  },
  {
    title: 'Two scoring engines need one test',
    body:
      'Scoring lived in Python for the API and in TypeScript for instant UI. They drifted. For this showcase the TS side became a line-for-line port with a shared fixture both test suites must pass, and it caught a real copy mismatch on the first run.',
  },
  {
    title: 'Two-sided products start cold twice',
    body:
      'Candidates want companies before they invest fifteen minutes in an assessment, and companies want candidates before they define a culture. The coffee-chat-first flow was the part people liked most, and the part that needs both sides present to work.',
  },
];

function Section({ id, title, intro, children }: { id?: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <h2 className="text-headline" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          {intro && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              {intro}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// Text blocks separated by a rule instead of boxed: the page has one card style and uses it sparingly
function Column({ title, children, lead }: { title: string; children: ReactNode; lead?: string }) {
  return (
    <div className="border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
      {lead && (
        <p className="text-title tabular-nums mb-1" style={{ color: 'var(--color-accent)' }}>
          {lead}
        </p>
      )}
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
        {children}
      </p>
    </div>
  );
}

const primaryCta =
  'inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-medium transition-colors bg-[var(--color-accent)] text-[var(--color-accentText)] hover:bg-[var(--color-accentHover)]';

export function CaseStudy() {
  usePageTitle('');

  return (
    <div className="min-h-screen [overflow-x:clip]" style={{ backgroundColor: 'var(--color-background)' }}>
      <LandingNav />

      <header className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-10 sm:pb-14">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="text-display" style={{ color: 'var(--color-text)' }}>
            Hiring that starts with how you work
          </h1>
          <p className="mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
            Hiring matches on resumes and keywords, while culture fit only shows up after someone starts. Amber measured
            how people work and compared it with a team's real culture, so both sides met over a coffee chat before
            anyone applied. Three of us built it through 2026 and took it close to launch.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={DEMO_PATH} className={`w-full sm:w-auto ${primaryCta}`}>
              {DEMO_LABEL}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--color-surfaceHover)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <Github className="w-4 h-4" />
              Read the code
            </a>
          </div>
          <p className="mt-8 text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
            Why measure fit early: in a meta-analysis, person-organization fit correlated .51 with organizational
            commitment and -.35 with intent to quit (
            <a className="underline underline-offset-2 hover:text-[var(--color-text)]" href={KRISTOF_BROWN} target="_blank" rel="noreferrer">
              Kristof-Brown, Zimmerman and Johnson, 2005
            </a>
            ).
          </p>
          <p className="mt-3 text-xs" style={{ color: 'var(--color-textMuted)' }}>
            Shelved in 2026.{' '}
            {IS_DEMO
              ? 'The demo runs entirely in your browser: no signup, invented people and companies, nothing sent anywhere.'
              : 'This build talks to your own Supabase project and FastAPI server.'}
          </p>
        </motion.div>
      </header>

      {/* What we built: animated recreations of the real screens */}
      <FeatureBento />

      <Section
        id="matching"
        title="How it works"
        intro="Five traits, eight archetypes and one score you can read. Candidates answer scenario questions that map to the Big Five (OCEAN): openness, conscientiousness, extraversion, agreeableness and neuroticism. Employers take a culture quiz that sets the scores they hope for, pick culture values, and give each role an acceptable range per trait. The Ember engine compares the two."
      >
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-14">
          {WEIGHTS.map((w) => (
            <Column key={w.t} lead={w.n} title={w.t}>
              {w.d}
            </Column>
          ))}
        </div>

        <MatchingExplainer />

        <div className="mt-14">
          <p className="text-sm max-w-2xl mb-6 leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
            Each profile is classified into one of eight work archetypes. An 8 by 8 table of archetype pairs then nudges the
            score by up to 10 points either way, which is the Ember score shown in the app.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
            {Object.values(ARCHETYPES).map((a) => (
              <div key={a.key}>
                <dt className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{a.name}</dt>
                <dd className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>{a.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section title="Coffee first, application later">
        <div className="grid gap-8 md:grid-cols-3">
          {FLOW.map((s) => (
            <Column key={s.t} title={s.t}>
              {s.d}
            </Column>
          ))}
        </div>
      </Section>

      <Section
        id="architecture"
        title="React, FastAPI, Supabase and Stripe"
        intro="The app reads and writes Postgres directly through supabase-js, with Row Level Security deciding who sees what and Realtime pushing messages and requests. FastAPI handles the things a browser shouldn't: the Ember agent, connection side effects, and Stripe."
      >
        <ArchitectureDiagram />
      </Section>

      <Section
        id="roadmap"
        title="Where it was going"
        intro={
          <>
            None of this was built. It's the roadmap from our{' '}
            <a className="underline underline-offset-2 hover:text-[var(--color-text)]" href={BLUEPRINT_URL} target="_blank" rel="noreferrer">
              blueprint
            </a>
            : six phases that would have turned a matching product into a hiring intelligence system.
          </>
        }
      >
        <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r, i) => (
            <li key={r.t} className="border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
                Phase {i + 1} · Not built
              </p>
              <h3 className="mt-1.5 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                {r.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                {r.d}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="shelf" title="Why it's on the shelf">
        <div className="grid gap-8 md:grid-cols-2">
          {STATUS.map((s) => (
            <Column key={s.title} title={s.title}>
              {s.body}
            </Column>
          ))}
        </div>
      </Section>

      <Section id="lessons" title="What we learned">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {LESSONS.map((l) => (
            <Column key={l.title} title={l.title}>
              {l.body}
            </Column>
          ))}
        </div>
      </Section>

      <Section id="team" title="Built by three">
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {TEAM.map((m) => (
            <li key={m.github} className="border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
              <a
                href={`https://github.com/${m.github}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between"
              >
                <span>
                  <span className="block font-semibold" style={{ color: 'var(--color-text)' }}>{m.name}</span>
                  <span className="block text-sm mt-0.5 group-hover:underline underline-offset-2" style={{ color: 'var(--color-textSecondary)' }}>
                    @{m.github}
                  </span>
                </span>
                <Github className="w-4 h-4" style={{ color: 'var(--color-textSecondary)' }} />
              </a>
            </li>
          ))}
        </ul>

        <div className="bento-card mt-16 !p-8 sm:!p-10 text-center">
          <h3 className="text-headline" style={{ color: 'var(--color-text)' }}>
            See it for yourself
          </h3>
          <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'var(--color-textSecondary)' }}>
            Take the assessment as a job seeker, or define a culture as an employer, and book a coffee chat with someone
            who doesn't exist.
          </p>
          <Link to={DEMO_PATH} className={`mt-7 ${primaryCta}`}>
            {DEMO_LABEL}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}
