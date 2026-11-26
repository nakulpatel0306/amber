/**
 * Site root: Amber as a case study. The story runs problem, what we built
 * (try it), how it works, where it was going, why we stopped, what we learned
 * and who built it.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Archive,
  Bot,
  Brain,
  Building2,
  ClipboardList,
  Coffee,
  Compass,
  EyeOff,
  Github,
  Heart,
  Laptop,
  Layers,
  Lightbulb,
  MessageCircle,
  Music,
  PauseCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';
import { FeatureBento } from './FeatureBento';
import { MatchingExplainer } from './MatchingExplainer';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { HeroVisual } from './HeroVisual';
import { Section, TintCard, TRAIT } from './Section';
import { BLUEPRINT_URL, DEMO_LABEL, DEMO_PATH, REPO_URL, TEAM } from './links';
import { ARCHETYPES } from '../../lib/archetypes';
import { IS_DEMO } from '../../demo/flag';
import { usePageTitle } from '../../hooks/usePageTitle';

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  layers: Layers,
  heart: Heart,
  zap: Zap,
  target: Target,
  music: Music,
  compass: Compass,
  brain: Brain,
};
const PALETTE = [TRAIT.o, TRAIT.c, TRAIT.e, TRAIT.a, TRAIT.n];

// Trait colors are tuned for fills; as text they lean toward the text color so yellow and cyan stay legible on white
const readable = (c: string) => `color-mix(in srgb, ${c} 70%, var(--color-text))`;

// From BLUEPRINT.md, "Where Amber Was Going (never built)"
const ROADMAP: { t: string; d: string; icon: LucideIcon }[] = [
  {
    t: 'Conversational Ember AI',
    icon: Bot,
    d: 'Ember would have replaced the multiple-choice assessment with an open-ended interview, reading trait signals from how people answer, and stayed on afterwards as a career advisor.',
  },
  {
    t: 'Team DNA mapping',
    icon: Users,
    d: 'Employers would have mapped the personalities of an existing team, so matching could favor candidates who balance its gaps instead of matching the company as a whole.',
  },
  {
    t: 'Culture verification',
    icon: ShieldCheck,
    d: "Current and former employees would have anonymously checked an employer's culture claims against the same OCEAN framework used for matching.",
  },
  {
    t: 'Predictive retention',
    icon: TrendingUp,
    d: 'A model would have estimated how likely a hire was to stay and do well, from patterns in personality and culture alignment.',
  },
  {
    t: 'Passive culture signals',
    icon: Radar,
    d: 'Preliminary culture profiles generated from public data, so candidates would have seen companies before those companies ever signed up.',
  },
  {
    t: 'Blind culture matching',
    icon: EyeOff,
    d: 'A mode that hid names, brands and pedigree, so both sides judged each other on culture and personality alone.',
  },
];

const STATUS = [
  {
    title: 'Paused',
    icon: PauseCircle,
    color: TRAIT.a,
    body: 'The culture-fit hiring space filled up quickly. Competing would have meant raising money, and we decided not to. So Amber will not launch, and none of that roadmap will be built.',
  },
  {
    title: 'Kept',
    icon: Archive,
    color: TRAIT.c,
    body: 'The code stays open under MIT, the full stack still runs locally, and this page ships a demo of the real app with invented data so anyone can try it.',
  },
];

const WEIGHTS = [
  { n: 40, t: 'Trait distance', icon: Activity, c: TRAIT.o, d: 'Euclidean distance across the five traits, scaled so identical profiles score 100.' },
  { n: 30, t: 'Culture and role fit', icon: Building2, c: TRAIT.c, d: 'Each culture value maps to traits (innovation leans on openness), plus how many traits land inside the role ranges.' },
  { n: 20, t: 'Work style', icon: Laptop, c: TRAIT.e, d: 'Remote, hybrid, onsite or flexible, from a small compatibility table.' },
  { n: 10, t: 'Communication', icon: MessageCircle, c: TRAIT.a, d: 'Closeness on extraversion and agreeableness.' },
];

const FLOW = [
  { t: 'Assess', icon: ClipboardList, c: TRAIT.o, d: 'Candidates take the assessment and get an archetype. Employers define culture and per-role ranges.' },
  { t: 'Match', icon: Sparkles, c: TRAIT.a, d: 'Both sides see ranked matches with a per-trait breakdown and an Ember write-up of strengths and gaps.' },
  { t: 'Chat', icon: Coffee, c: TRAIT.e, d: 'Either side sends a request with proposed times. Accepted chats get realtime messaging, a prep brief and feedback.' },
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

const primaryCta =
  'inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-medium transition-[background-color,transform] active:scale-[0.98] bg-[var(--color-accent)] text-[var(--color-accentText)] hover:bg-[var(--color-accentHover)]';

function IconBadge({ icon: Icon, color, size = 'md' }: { icon: LucideIcon; color: string; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl';
  return (
    <span
      className={`${box} shrink-0 inline-flex items-center justify-center`}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      <Icon className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </span>
  );
}

function ArchetypeMarquee() {
  const items = Object.values(ARCHETYPES);
  return (
    <div className="marquee overflow-hidden py-6 border-y" style={{ borderColor: 'var(--color-border)' }} aria-hidden>
      <div className="marquee-track flex w-max gap-3">
        {[...items, ...items].map((a, i) => {
          const Icon = ARCHETYPE_ICONS[a.emoji] ?? Lightbulb;
          const color = PALETTE[i % PALETTE.length];
          return (
            <span
              key={`${a.key}-${i}`}
              className="inline-flex items-center gap-2 h-10 pl-2 pr-4 rounded-full border text-sm font-medium whitespace-nowrap"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              <span
                className="w-7 h-7 rounded-full inline-flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
              >
                <Icon className="w-4 h-4" />
              </span>
              {a.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function CaseStudy() {
  usePageTitle('');

  return (
    <div className="min-h-screen [overflow-x:clip]" style={{ backgroundColor: 'var(--color-background)' }}>
      <LandingNav />

      <header className="relative px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 sm:pb-20">
        <div className="hero-backdrop" aria-hidden>
          <span className="hero-blob w-[420px] h-[420px] -top-24 left-[8%]" style={{ backgroundColor: TRAIT.e }} />
          <span className="hero-blob w-[380px] h-[380px] top-10 right-[6%]" style={{ backgroundColor: TRAIT.a, animationDelay: '-6s' }} />
          <span className="hero-blob w-[340px] h-[340px] top-[420px] left-[30%]" style={{ backgroundColor: TRAIT.o, animationDelay: '-12s' }} />
        </div>

        <motion.div
          className="relative max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <span
            className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border text-caption font-medium"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-surface) 70%, transparent)', color: 'var(--color-textSecondary)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TRAIT.e }} />
            A startup we built in 2026, now shelved and open source
          </span>
          <h1 className="mt-6 text-display" style={{ color: 'var(--color-text)' }}>
            Hiring that starts with <span className="text-gradient-warm">how you work</span>
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
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'color-mix(in srgb, var(--color-surface) 70%, transparent)' }}
            >
              <Github className="w-4 h-4" />
              Read the code
            </a>
          </div>
          <p className="mt-5 text-xs" style={{ color: 'var(--color-textMuted)' }}>
            {IS_DEMO
              ? 'The demo runs entirely in your browser: no signup, invented people and companies, nothing sent anywhere.'
              : 'This build talks to your own Supabase project and FastAPI server.'}
          </p>
        </motion.div>

        <HeroVisual />
      </header>

      <ArchetypeMarquee />

      {/* What we built: animated recreations of the real screens */}
      <FeatureBento />

      <Section
        id="matching"
        eyebrow="How it works"
        color={TRAIT.o}
        title="Five traits, eight archetypes, one score you can read"
        intro="Candidates answer scenario questions that map to the Big Five (OCEAN): openness, conscientiousness, extraversion, agreeableness and neuroticism. Employers take a culture quiz that sets the scores they hope for, pick culture values, and give each role an acceptable range per trait. The Ember engine compares the two."
      >
        <div className="flex h-3 rounded-full overflow-hidden mb-6" aria-hidden>
          {WEIGHTS.map((w) => (
            <span key={w.t} style={{ width: `${w.n}%`, backgroundColor: w.c }} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-14">
          {WEIGHTS.map((w) => (
            <TintCard key={w.t} color={w.c}>
              <div className="flex items-center justify-between">
                <IconBadge icon={w.icon} color={w.c} />
                <span className="text-title tabular-nums" style={{ color: readable(w.c) }}>
                  {w.n}%
                </span>
              </div>
              <h3 className="mt-4 text-heading" style={{ color: 'var(--color-text)' }}>
                {w.t}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                {w.d}
              </p>
            </TintCard>
          ))}
        </div>

        <MatchingExplainer />

        <div className="mt-14">
          <p className="text-sm max-w-2xl mb-6 leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
            Each profile is classified into one of eight work archetypes. An 8 by 8 table of archetype pairs then nudges the
            score by up to 10 points either way, which is the Ember score shown in the app.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(ARCHETYPES).map((a, i) => {
              const Icon = ARCHETYPE_ICONS[a.emoji] ?? Lightbulb;
              const color = PALETTE[i % PALETTE.length];
              return (
                <div
                  key={a.key}
                  className="rounded-2xl border p-4 transition-colors hover:border-[var(--color-borderHover)]"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <dt className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    <span
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    {a.name}
                  </dt>
                  <dd className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                    {a.description}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </Section>

      <Section id="coffee" eyebrow="The flow" color={TRAIT.e} title="Coffee first, application later">
        <ol className="relative grid gap-4 md:grid-cols-3">
          <span
            className="hidden md:block absolute top-11 left-[16%] right-[16%] border-t-2 border-dashed"
            style={{ borderColor: 'var(--color-border)' }}
            aria-hidden
          />
          {FLOW.map((s, i) => (
            <li key={s.t} className="relative">
              <TintCard color={s.c} className="h-full">
                <div className="flex items-center gap-3">
                  <IconBadge icon={s.icon} color={s.c} size="lg" />
                  <span className="text-caption font-medium" style={{ color: 'var(--color-textMuted)' }}>
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-title" style={{ color: 'var(--color-text)' }}>
                  {s.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                  {s.d}
                </p>
              </TintCard>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="architecture"
        eyebrow="Architecture"
        color={TRAIT.n}
        title="React, FastAPI, Supabase and Stripe"
        intro="The app reads and writes Postgres directly through supabase-js, with Row Level Security deciding who sees what and Realtime pushing messages and requests. FastAPI handles the things a browser shouldn't: the Ember agent, connection side effects, and Stripe."
      >
        <ArchitectureDiagram />
      </Section>

      <Section
        id="roadmap"
        eyebrow="Roadmap"
        color={TRAIT.a}
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
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r, i) => {
            const color = PALETTE[i % PALETTE.length];
            return (
              <li
                key={r.t}
                className="rounded-2xl border-2 border-dashed p-5 sm:p-6"
                style={{ borderColor: `color-mix(in srgb, ${color} 35%, var(--color-border))` }}
              >
                <div className="flex items-center justify-between">
                  <IconBadge icon={r.icon} color={color} />
                  <span className="text-caption font-medium tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                    Phase {i + 1} · Not built
                  </span>
                </div>
                <h3 className="mt-4 text-heading" style={{ color: 'var(--color-text)' }}>
                  {r.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                  {r.d}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section id="shelf" eyebrow="Status" color={TRAIT.c} title="Why it's on the shelf">
        <div className="grid gap-4 md:grid-cols-2">
          {STATUS.map((s) => (
            <TintCard key={s.title} color={s.color}>
              <div className="flex items-center gap-3">
                <IconBadge icon={s.icon} color={s.color} />
                <h3 className="text-title" style={{ color: 'var(--color-text)' }}>
                  {s.title}
                </h3>
              </div>
              <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                {s.body}
              </p>
            </TintCard>
          ))}
        </div>
      </Section>

      <Section id="lessons" eyebrow="Lessons" color={TRAIT.e} title="What we learned">
        <div className="grid gap-4 md:grid-cols-2">
          {LESSONS.map((l, i) => {
            const color = PALETTE[i % PALETTE.length];
            return (
              <div
                key={l.title}
                className="rounded-2xl border p-5 sm:p-6 flex gap-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <span className="text-headline tabular-nums leading-none" style={{ color: readable(color) }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-heading" style={{ color: 'var(--color-text)' }}>
                    {l.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                    {l.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="team" eyebrow="Team" color={TRAIT.o} title="Built by three">
        <ul className="grid gap-4 sm:grid-cols-3">
          {TEAM.map((m, i) => {
            const from = PALETTE[i % PALETTE.length];
            const to = PALETTE[(i + 2) % PALETTE.length];
            return (
              <li key={m.github}>
                <a
                  href={`https://github.com/${m.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[var(--color-borderHover)]"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <span
                    className="w-12 h-12 shrink-0 rounded-full inline-flex items-center justify-center text-heading text-white"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    aria-hidden
                  >
                    {m.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold" style={{ color: 'var(--color-text)' }}>{m.name}</span>
                    <span className="block text-sm mt-0.5 truncate group-hover:underline underline-offset-2" style={{ color: 'var(--color-textSecondary)' }}>
                      @{m.github}
                    </span>
                  </span>
                  <Github className="w-4 h-4 shrink-0" style={{ color: 'var(--color-textSecondary)' }} />
                </a>
              </li>
            );
          })}
        </ul>

        <div
          className="relative mt-16 overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-16 text-center"
          style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 45%, #DB2777 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            aria-hidden
          />
          <div className="relative">
            <h3 className="text-headline text-white">See it for yourself</h3>
            <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto text-white/90">
              Take the assessment as a job seeker, or define a culture as an employer, and book a coffee chat with someone
              who doesn't exist.
            </p>
            <Link
              to={DEMO_PATH}
              className="mt-7 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold bg-white text-stone-900 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {DEMO_LABEL}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}
