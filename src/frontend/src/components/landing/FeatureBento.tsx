import { useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';
import { Eyebrow, TRAIT } from './Section';

/*
 * Product tour: scaled-down recreations of four real screens. They reuse the
 * app's tokens and layout (one card style, neutral bars, accent only for the
 * primary action and selection) so the tour previews what the demo shows.
 */

const STEPS = [
  { label: 'Dashboard', path: 'app/dashboard', caption: 'Home base: your archetype, your average match and your coffee chats.' },
  { label: 'Assessment', path: 'app/personality', caption: 'A 15-minute Big Five assessment built from workplace scenarios.' },
  { label: 'Deep dive', path: 'app/ember', caption: 'Every match breaks down trait by trait, against what the employer is looking for.' },
  { label: 'Connect', path: 'app/ember', caption: 'Send a request with proposed times for a short coffee chat.' },
];

const STEP_DURATION = 4500;

const text = { color: 'var(--color-text)' };
const secondary = { color: 'var(--color-textSecondary)' };
const muted = { color: 'var(--color-textMuted)' };
const card: CSSProperties = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' };

const TRAITS = [
  { name: 'Openness', color: 'var(--color-trait-openness)', you: 68, them: 90 },
  { name: 'Conscientiousness', color: 'var(--color-trait-conscientiousness)', you: 57, them: 55 },
  { name: 'Extraversion', color: 'var(--color-trait-extraversion)', you: 66, them: 70 },
  { name: 'Agreeableness', color: 'var(--color-trait-agreeableness)', you: 62, them: 70 },
  { name: 'Stability', color: 'var(--color-trait-stability)', you: 51, them: 60 },
];

function CountUp({ value, suffix = '', delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now() + delay * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(Math.max(0, now - start) / 800, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay, reduce]);
  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

// The companies in the demo are invented, so the app shows a letter tile instead of a logo
function LetterTile({ letter, size = 22 }: { letter: string; size?: number }) {
  return (
    <span
      className="rounded-md flex items-center justify-center flex-shrink-0 font-medium"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.4),
        backgroundColor: 'var(--color-surfaceHover)',
        color: 'var(--color-textSecondary)',
      }}
    >
      {letter}
    </span>
  );
}

function Bar({ value, color = 'var(--color-textSecondary)', delay = 0 }: { value: number; color?: string; delay?: number }) {
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  );
}

function Rise({ delay = 0, className, style, children }: { delay?: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Dashboard: mirrors /app/dashboard */
function SceneDashboard() {
  const matches = [
    { role: 'Brand Designer', company: 'Kestrel Studio', style: 'Hybrid', status: 'New match', score: 82 },
    { role: 'Founding Engineer', company: 'Brightline Labs', style: 'Remote', status: 'Request sent', score: 80 },
    { role: 'Developer Advocate', company: 'Brightline Labs', style: 'Remote', status: 'Request sent', score: 80 },
    { role: 'Robotics Software Engineer', company: 'Northwind Robotics', style: 'Hybrid', status: 'New match', score: 79 },
  ];

  return (
    <div className="h-full p-4 sm:p-5 flex flex-col gap-3 overflow-hidden">
      <Rise>
        <p className="text-[15px] font-semibold leading-tight" style={text}>
          Good evening, Alex
        </p>
        <p className="text-[10px] mt-0.5" style={secondary}>
          Sat, Apr 18
        </p>
      </Rise>

      <div className="grid grid-cols-3 gap-2">
        <Rise delay={0.08} className="rounded-lg p-2.5 min-w-0" style={card}>
          <p className="text-[9px]" style={secondary}>Your archetype</p>
          <p className="mt-1 flex items-center gap-1 text-[12px] sm:text-[13px] font-semibold truncate" style={text}>
            <Lightbulb className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
            <span className="truncate">The Innovator</span>
          </p>
          <p className="hidden sm:block mt-1 text-[9px] leading-snug" style={secondary}>
            Thrives on new ideas and unconventional solutions
          </p>
        </Rise>
        <Rise delay={0.14} className="rounded-lg p-2.5 min-w-0" style={card}>
          <p className="text-[9px]" style={secondary}>Average match</p>
          <p className="mt-1 text-[13px] font-semibold" style={text}>
            <CountUp value={79} suffix="%" delay={0.3} />
          </p>
          <p className="hidden sm:block mt-1 text-[9px] leading-snug" style={secondary}>
            Best 82% across 13 roles
          </p>
        </Rise>
        <Rise delay={0.2} className="rounded-lg p-2.5 min-w-0" style={card}>
          <p className="text-[9px]" style={secondary}>Coffee chats</p>
          <p className="mt-1 text-[13px] font-semibold" style={text}>
            <CountUp value={2} delay={0.36} />
          </p>
          <p className="hidden sm:block mt-1 text-[9px] leading-snug" style={secondary}>
            1 pending
          </p>
        </Rise>
      </div>

      <Rise delay={0.28} className="flex-1 min-h-0 flex flex-col">
        <p className="text-[11px] font-semibold mb-1.5" style={text}>
          Top matches
        </p>
        <div className="rounded-lg overflow-hidden" style={card}>
          {matches.map((m, i) => (
            <motion.div
              key={m.role}
              className="flex items-center gap-2 px-2.5 py-2"
              style={{ borderTop: i ? '1px solid var(--color-border)' : undefined }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.07 }}
            >
              <LetterTile letter={m.company[0]} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium leading-tight truncate" style={text}>{m.role}</p>
                <p className="text-[9px] truncate" style={secondary}>{m.company}</p>
              </div>
              <span className="hidden sm:inline text-[9px] w-14" style={secondary}>{m.style}</span>
              <span className="hidden sm:flex items-center gap-1 text-[9px] w-20" style={secondary}>
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: m.status === 'Request sent' ? 'var(--color-accent)' : 'var(--color-textMuted)' }}
                />
                {m.status}
              </span>
              <span className="text-[10px] font-semibold tabular-nums" style={text}>
                {m.score}%
              </span>
            </motion.div>
          ))}
        </div>
      </Rise>
    </div>
  );
}

/* Assessment: mirrors /app/personality */
function SceneAssessment({ hover, picked }: { hover: number; picked: number }) {
  const options = [
    { title: 'Take the leap', desc: 'The learning is worth the risk.' },
    { title: 'Stay the course', desc: 'Depth over breadth.' },
    { title: 'Negotiate a hybrid', desc: 'Try it part-time before committing.' },
    { title: 'Find out more first', desc: 'Too many unknowns to decide yet.' },
  ];

  return (
    <div className="h-full px-4 sm:px-10 py-4 sm:py-5 flex flex-col overflow-hidden">
      <p className="text-[12px] font-semibold" style={text}>
        Personality assessment
      </p>
      <div className="mt-2.5 flex items-center justify-between text-[9px]">
        <span style={secondary}>Question 11 of 16</span>
        <span style={muted}>Growth</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
        <div className="h-full rounded-full" style={{ width: '69%', backgroundColor: 'var(--color-accent)' }} />
      </div>

      <Rise delay={0.05} className="mt-4">
        <p className="text-[13px] sm:text-[14px] font-semibold leading-snug" style={text}>
          You're offered a role in a new field. More money, but you'd start from scratch. What do you do?
        </p>
      </Rise>

      <div className="mt-3 flex flex-col gap-1.5 flex-1 min-h-0">
        {options.map((o, i) => {
          const isPicked = i === picked;
          const isHover = i === hover && !isPicked;
          return (
            <Rise
              key={o.title}
              delay={0.12 + i * 0.05}
              className="rounded-lg px-2.5 py-2 flex items-start gap-2 transition-colors duration-200"
              style={{
                border: `1px solid ${isPicked ? 'var(--color-accent)' : isHover ? 'var(--color-borderHover)' : 'var(--color-border)'}`,
                backgroundColor: isPicked
                  ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))'
                  : 'var(--color-surface)',
              }}
            >
              <span
                className="mt-px w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                style={{
                  border: `1px solid ${isPicked ? 'var(--color-accent)' : 'var(--color-borderHover)'}`,
                  backgroundColor: isPicked ? 'var(--color-accent)' : 'transparent',
                }}
              >
                {isPicked && <Check className="w-2 h-2" strokeWidth={3} style={{ color: 'var(--color-accentText)' }} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-medium leading-tight" style={text}>{o.title}</span>
                <span className="block text-[9px] mt-0.5 truncate" style={secondary}>{o.desc}</span>
              </span>
            </Rise>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-medium" style={{ ...card, ...text }}>
          <ArrowLeft className="w-2.5 h-2.5" />
          Back
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[9px] font-medium transition-opacity duration-200"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accentText)',
            opacity: picked >= 0 ? 1 : 0.5,
          }}
        >
          Next
          <ArrowRight className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}

/* Deep dive: mirrors the Ember deep dive for one match */
function SceneDeepDive() {
  const scores = [
    { label: 'Trait match', value: 89 },
    { label: 'Culture fit', value: 69 },
    { label: 'Work style', value: 75 },
    { label: 'Communication', value: 94 },
  ];

  return (
    <div className="h-full p-4 sm:p-5 flex flex-col gap-3 overflow-hidden">
      <Rise className="flex items-center gap-2.5">
        <LetterTile letter="J" size={30} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-tight truncate" style={text}>Jonah Whitfield</p>
          <p className="text-[9px] mt-0.5 truncate" style={secondary}>
            Kestrel Studio · The Innovator · <span className="font-medium" style={text}>81% match</span>
          </p>
        </div>
        <span className="hidden sm:inline rounded-md px-2 py-1 text-[9px] font-medium" style={{ ...card, ...text }}>
          Connect
        </span>
      </Rise>

      <Rise delay={0.08}>
        <p className="text-[11px] font-semibold mb-1.5" style={text}>Score breakdown</p>
        <div className="rounded-lg p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2.5" style={card}>
          {scores.map((s, i) => (
            <div key={s.label} className="min-w-0">
              <p className="text-[9px] truncate" style={secondary}>{s.label}</p>
              <p className="text-[14px] font-semibold leading-tight mt-0.5 mb-1" style={text}>
                <CountUp value={s.value} suffix="%" delay={0.2 + i * 0.05} />
              </p>
              <Bar value={s.value} delay={0.25 + i * 0.05} />
            </div>
          ))}
        </div>
      </Rise>

      <Rise delay={0.16} className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold" style={text}>Flavor profile</p>
          <p className="text-[9px]" style={muted}>4 of 5 traits aligned</p>
        </div>
        <div className="rounded-lg px-2.5 py-2 flex-1 flex flex-col justify-evenly" style={card}>
          <div className="flex justify-end text-[8px]" style={muted}>You / employer</div>
          {TRAITS.map((t, i) => (
            <div key={t.name} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <span className="text-[10px] w-[92px] flex-shrink-0 truncate" style={text}>{t.name}</span>
              <div className="flex-1">
                <Bar value={t.you} color={t.color} delay={0.3 + i * 0.05} />
              </div>
              <span className="text-[10px] tabular-nums w-11 text-right flex-shrink-0" style={text}>
                {t.you}
                <span style={muted}> / {t.them}</span>
              </span>
            </div>
          ))}
        </div>
      </Rise>
    </div>
  );
}

/* Connect: mirrors the connection request modal with a coffee chat invite */
function SceneConnect({ stage }: { stage: number }) {
  const durations = ['15m', '30m', '45m', '60m'];
  const times = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'];
  const picked = { dates: [21, 23], time: 5 };
  const datesPicked = stage >= 1;
  const timePicked = stage >= 2;
  const sent = stage >= 3;

  // April 2026 starts on a Wednesday
  const cells = [
    ...[29, 30, 31].map((day) => ({ day, inMonth: false })),
    ...Array.from({ length: 30 }, (_, i) => ({ day: i + 1, inMonth: true })),
    ...[1, 2].map((day) => ({ day, inMonth: false })),
  ];

  return (
    <div
      className="h-full flex items-center justify-center p-3 sm:p-5 overflow-hidden"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-background) 70%, #000 30%)' }}
    >
      <Rise className="w-full max-w-[440px] rounded-xl p-3 sm:p-4 flex flex-col gap-2.5" style={{ ...card, backgroundColor: 'var(--color-backgroundSecondary)' }}>
        <div className="flex items-center gap-2">
          <LetterTile letter="K" size={26} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold leading-tight" style={text}>Kestrel Studio</p>
            <p className="text-[9px] truncate" style={secondary}>Design agency · The Innovator</p>
          </div>
          <span className="text-[11px] font-semibold tabular-nums" style={text}>81%</span>
          <X className="w-3 h-3 ml-1" style={muted} />
        </div>

        <div className="rounded-md px-2 py-1.5 text-[10px] leading-snug" style={{ ...card, ...text }}>
          I'd like to connect and discuss how our work styles align.
        </div>

        <div>
          <p className="text-[10px] font-medium mb-1" style={text}>Duration</p>
          <div className="grid grid-cols-4 gap-1">
            {durations.map((d) => (
              <span
                key={d}
                className="text-[9px] text-center rounded-md py-1"
                style={{
                  border: `1px solid ${d === '30m' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: d === '30m' ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <ChevronLeft className="w-2.5 h-2.5" style={muted} />
              <span className="text-[10px] font-medium" style={text}>April 2026</span>
              <ChevronRight className="w-2.5 h-2.5" style={muted} />
            </div>
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="text-[8px]" style={muted}>{d}</span>
              ))}
              {cells.map((c, i) => {
                const on = datesPicked && c.inMonth && picked.dates.includes(c.day);
                const available = c.inMonth && c.day >= 18;
                return (
                  <span
                    key={i}
                    className="text-[8.5px] leading-[15px] rounded transition-colors duration-200"
                    style={{
                      backgroundColor: on ? 'var(--color-accent)' : 'transparent',
                      color: on ? 'var(--color-accentText)' : available ? 'var(--color-text)' : 'var(--color-textMuted)',
                      fontWeight: on ? 600 : 400,
                      opacity: c.inMonth ? 1 : 0.5,
                    }}
                  >
                    {c.day}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-medium mb-1" style={text}>Preferred time</p>
            <div className="grid grid-cols-2 gap-1">
              {times.map((t, i) => {
                const on = timePicked && i === picked.time;
                return (
                  <span
                    key={t}
                    className="text-[9px] text-center rounded-md py-1 transition-colors duration-200"
                    style={{
                      backgroundColor: on ? 'var(--color-accent)' : 'transparent',
                      color: on ? 'var(--color-accentText)' : 'var(--color-textSecondary)',
                      border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    }}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-[10px]" style={text}>Cancel</span>
          <span
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accentText)' }}
          >
            {sent && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
            {sent ? 'Request sent' : 'Send request'}
          </span>
        </div>
      </Rise>
    </div>
  );
}

function ProductTour() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(-1);
  const [picked, setPicked] = useState(-1);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setHover(-1);
    setPicked(-1);
    setStage(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    if (active === 1) {
      at(700, () => setHover(3));
      at(1300, () => setHover(1));
      at(1900, () => setHover(0));
      at(2400, () => setPicked(0));
    }
    if (active === 3) {
      at(900, () => setStage(1));
      at(1800, () => setStage(2));
      at(2800, () => setStage(3));
    }
    at(STEP_DURATION, () => setActive((a) => (a + 1) % STEPS.length));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const step = STEPS[active];
  const scenes = [
    <SceneDashboard key="dashboard" />,
    <SceneAssessment key="assessment" hover={hover} picked={picked} />,
    <SceneDeepDive key="deep-dive" />,
    <SceneConnect key="connect" stage={stage} />,
  ];

  // Both screens stay mounted while they crossfade, so there is never an empty frame
  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduce ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] as const },
  };

  return (
    <div className="bento-card !p-4 sm:!p-6 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-8">
      {/* Wide screens: the steps and their captions sit beside the screen */}
      <ol className="hidden lg:flex flex-col gap-1" aria-label="Tour steps">
        {STEPS.map((s, i) => {
          const isActive = i === active;
          return (
            <li key={s.label}>
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                onClick={() => setActive(i)}
                className="relative w-full text-left rounded-md pl-4 pr-2 py-2.5 transition-colors hover:bg-[var(--color-surfaceHover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                  {isActive && <StepProgress vertical reduce={!!reduce} />}
                </span>
                <span className="block text-label" style={{ color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)' }}>
                  {s.label}
                </span>
                <span className="block mt-1 text-caption leading-snug" style={isActive ? secondary : muted}>
                  {s.caption}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="min-w-0">
        <div className="grid lg:hidden mb-4 min-h-[2.75rem]">
          <AnimatePresence initial={false}>
            <motion.p key={active} {...fade} className="[grid-area:1/1] text-sm leading-relaxed" style={secondary}>
              {step.caption}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }} aria-hidden="true">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-backgroundSecondary)' }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
              ))}
            </div>
            <span className="flex-1 text-center text-[9px] truncate" style={muted}>
              nakulpatel0306.github.io/amber/{step.path}
            </span>
          </div>

          {/* Fixed height: scenes are stacked absolutely so the outgoing and incoming screens overlap */}
          <div className="relative h-[400px] sm:h-[380px]" style={{ backgroundColor: 'var(--color-background)' }}>
            <AnimatePresence initial={false}>
              <motion.div key={active} {...fade} className="absolute inset-0">
                {scenes[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:hidden mt-4 grid grid-cols-4 gap-2" role="group" aria-label="Tour steps">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            return (
              <button
                key={s.label}
                type="button"
                aria-current={isActive ? 'step' : undefined}
                onClick={() => setActive(i)}
                className="text-left rounded-sm py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <span className="block h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                  {isActive && <StepProgress reduce={!!reduce} />}
                </span>
                <span
                  className="mt-2 block text-caption sm:text-label truncate"
                  style={{ color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)' }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepProgress({ vertical = false, reduce }: { vertical?: boolean; reduce: boolean }) {
  const prop = vertical ? 'height' : 'width';
  return (
    <motion.span
      className={vertical ? 'block w-full' : 'block h-full'}
      style={{ backgroundColor: 'var(--color-accent)' }}
      initial={{ [prop]: reduce ? '100%' : '0%' }}
      animate={{ [prop]: '100%' }}
      transition={{ duration: reduce ? 0 : STEP_DURATION / 1000, ease: 'linear' }}
    />
  );
}

export function FeatureBento() {
  return (
    <section id="tour" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <Eyebrow color={TRAIT.e}>The product</Eyebrow>
          <h2 className="text-headline" style={text}>
            What we built
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed" style={secondary}>
            Both sides of the product, from January to November 2026: assessments, matching, culture profiles,
            connections, scheduling, realtime chat and billing. Below are recreations of four screens a job seeker moves
            through; the demo runs the real app.
          </p>
        </div>
        <ProductTour />
      </div>
    </section>
  );
}
