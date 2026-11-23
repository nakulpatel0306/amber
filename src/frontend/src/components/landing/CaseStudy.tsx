/**
 * Site root: Amber as a case study. What it was, why it is shelved, how the
 * matching works, how it was built, and a way into the in-browser demo.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Building2, Coffee, Github, Layers, Lightbulb, Heart, Zap, Target, Music, Compass } from 'lucide-react';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';
import { FeatureBento } from './FeatureBento';
import { MatchingExplainer } from './MatchingExplainer';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { AnimatedBlobs } from './AnimatedBlobs';
import { DEMO_LABEL, DEMO_PATH, REPO_URL, TEAM } from './links';
import { ARCHETYPES } from '../../lib/archetypes';
import { IS_DEMO } from '../../demo/flag';
import { usePageTitle } from '../../hooks/usePageTitle';

const ARCHETYPE_ICONS: Record<string, typeof Brain> = {
  lightbulb: Lightbulb,
  layers: Layers,
  heart: Heart,
  zap: Zap,
  target: Target,
  music: Music,
  compass: Compass,
  brain: Brain,
};

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

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
      <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-semibold" style={{ color: 'var(--color-accent)' }}>
        {children}
      </span>
    </div>
  );
}

function Section({ id, eyebrow, title, intro, children }: { id?: string; eyebrow: string; title: ReactNode; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-2xl mb-10"
        >
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-3xl sm:text-5xl font-serif tracking-tight leading-[1.05]" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          {intro && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              {intro}
            </p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {children}
    </div>
  );
}

export function CaseStudy() {
  usePageTitle('');

  return (
    <div className="min-h-screen relative [overflow-x:clip]" style={{ backgroundColor: 'var(--color-background)' }}>
      <AnimatedBlobs />
      <LandingNav />

      {/* Hero */}
      <header className="relative px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 pb-16">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-textSecondary)', backgroundColor: 'var(--color-surface)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-textMuted)' }} />
            Shelved in 2026 · case study and working demo
          </span>
          <h1
            className="mt-6 text-5xl sm:text-7xl lg:text-8xl font-serif tracking-tighter leading-[0.95]"
            style={{ color: 'var(--color-text)' }}
          >
            Hiring that starts with{' '}
            <span className="italic" style={{ color: 'var(--color-accent)' }}>
              how you work
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
            Amber matched candidates and companies on personality and culture instead of resume keywords, then put a
            short coffee chat before any application. Three of us built it through 2026 and took it close to launch.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={DEMO_PATH}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accentText)' }}
            >
              {DEMO_LABEL}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold border transition-colors hover:bg-[var(--color-surfaceHover)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-surface)' }}
            >
              <Github className="w-4 h-4" />
              Read the code
            </a>
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--color-textMuted)' }}>
            {IS_DEMO
              ? 'The demo runs entirely in your browser: no signup, invented people and companies, nothing sent anywhere.'
              : 'This build talks to your own Supabase project and FastAPI server.'}
          </p>
        </motion.div>
      </header>

      {/* Status */}
      <Section
        eyebrow="Status"
        title={
          <>
            Why it's on the <span className="italic" style={{ color: 'var(--color-accent)' }}>shelf</span>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Built</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              From January to November 2026 we built both sides of the product: assessments, matching, culture profiles,
              connections, scheduling, realtime chat and billing.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Paused</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              The culture-fit hiring space filled up quickly. Competing would have meant raising money, and we decided
              not to. So Amber will not launch.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Kept</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              The code stays open under MIT, the full stack still runs locally, and this page ships a demo of the real
              app with invented data so anyone can try it.
            </p>
          </Card>
        </div>
      </Section>

      {/* Product tour (animated recreations of the real screens) */}
      <FeatureBento />

      {/* Matching */}
      <Section
        id="matching"
        eyebrow="How matching works"
        title={
          <>
            Five traits, eight archetypes, <span className="italic" style={{ color: 'var(--color-accent)' }}>one score you can read</span>
          </>
        }
        intro={
          <>
            Candidates answer scenario questions that map to the Big Five (OCEAN): openness, conscientiousness,
            extraversion, agreeableness and neuroticism. Employers take a culture quiz that sets the scores they hope
            for, pick culture values, and give each role an acceptable range per trait. The Ember engine compares the
            two. Person-organization fit is worth measuring: in a meta-analysis, it correlated .51 with organizational
            commitment and -.35 with intent to quit (
            <a
              className="underline underline-offset-2"
              href="https://doi.org/10.1111/j.1744-6570.2005.00672.x"
              target="_blank"
              rel="noreferrer"
            >
              Kristof-Brown, Zimmerman and Johnson, 2005
            </a>
            ).
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10 text-sm">
          {[
            { n: '40%', t: 'Trait distance', d: 'Euclidean distance across the five traits, scaled so identical profiles score 100.' },
            { n: '30%', t: 'Culture and role fit', d: 'Each culture value maps to traits (innovation leans on openness), plus how many traits land inside the role ranges.' },
            { n: '20%', t: 'Work style', d: 'Remote, hybrid, onsite or flexible, from a small compatibility table.' },
            { n: '10%', t: 'Communication', d: 'Closeness on extraversion and agreeableness.' },
          ].map((w) => (
            <Card key={w.t}>
              <p className="text-3xl font-serif" style={{ color: 'var(--color-accent)' }}>{w.n}</p>
              <p className="mt-1 font-semibold" style={{ color: 'var(--color-text)' }}>{w.t}</p>
              <p className="mt-2 leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>{w.d}</p>
            </Card>
          ))}
        </div>

        <MatchingExplainer />

        <div className="mt-10">
          <p className="text-sm mb-4" style={{ color: 'var(--color-textSecondary)' }}>
            Each profile is classified into one of eight work archetypes. An 8 by 8 table of archetype pairs then nudges the
            score by up to 10 points either way, which is the Ember score shown in the app.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(ARCHETYPES).map((a) => {
              const Icon = ARCHETYPE_ICONS[a.emoji] ?? Brain;
              return (
                <div key={a.key} className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{a.name}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-textMuted)' }}>{a.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Flow */}
      <Section
        eyebrow="The flow"
        title={
          <>
            Coffee first, <span className="italic" style={{ color: 'var(--color-accent)' }}>application later</span>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Brain, t: 'Assess', d: 'Candidates take the assessment and get an archetype. Employers define culture and per-role ranges.' },
            { icon: Building2, t: 'Match', d: 'Both sides see ranked matches with a per-trait breakdown and an Ember write-up of strengths and gaps.' },
            { icon: Coffee, t: 'Chat', d: 'Either side sends a request with proposed times. Accepted chats get realtime messaging, a prep brief and feedback.' },
          ].map((s) => (
            <Card key={s.t}>
              <s.icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              <p className="mt-3 font-semibold" style={{ color: 'var(--color-text)' }}>{s.t}</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>{s.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Architecture */}
      <Section
        id="architecture"
        eyebrow="Architecture"
        title={
          <>
            React, FastAPI, <span className="italic" style={{ color: 'var(--color-accent)' }}>Supabase, Stripe</span>
          </>
        }
        intro="The app reads and writes Postgres directly through supabase-js, with Row Level Security deciding who sees what and Realtime pushing messages and requests. FastAPI handles the things a browser shouldn't: the Ember agent, connection side effects, and Stripe."
      >
        <ArchitectureDiagram />
      </Section>

      {/* Lessons */}
      <Section
        id="lessons"
        eyebrow="Decisions and lessons"
        title={
          <>
            What we'd <span className="italic" style={{ color: 'var(--color-accent)' }}>keep, and change</span>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {LESSONS.map((l) => (
            <Card key={l.title}>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{l.title}</p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>{l.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Team */}
      <Section id="team" eyebrow="Team" title="Built by three">
        <div className="grid gap-4 sm:grid-cols-3">
          {TEAM.map((m) => (
            <a
              key={m.github}
              href={`https://github.com/${m.github}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border p-5 flex items-center justify-between transition-colors hover:bg-[var(--color-surfaceHover)]"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <span>
                <span className="block font-semibold" style={{ color: 'var(--color-text)' }}>{m.name}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--color-textMuted)' }}>@{m.github}</span>
              </span>
              <Github className="w-4 h-4" style={{ color: 'var(--color-textSecondary)' }} />
            </a>
          ))}
        </div>

        <div
          className="mt-12 rounded-3xl border p-8 sm:p-10 text-center"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <h3 className="text-3xl sm:text-4xl font-serif" style={{ color: 'var(--color-text)' }}>
            See it for yourself
          </h3>
          <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'var(--color-textSecondary)' }}>
            Take the assessment as a job seeker, or define a culture as an employer, and book a coffee chat with someone
            who doesn't exist.
          </p>
          <Link
            to={DEMO_PATH}
            className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accentText)' }}
          >
            {DEMO_LABEL}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}
