import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Brain,
  Calendar,
  Check,
  Coffee,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  } from 'lucide-react';

/* ─────────────────────────────────────────────
   1. BIG CARD: 4-Step Process (real app flow)
   ───────────────────────────────────────────── */

const PROCESS_STEPS = [
  {
    number: '1',
    label: 'Dashboard',
    caption: 'Home base: your archetype, your matches and your chats.',
    icon: Target,
  },
  {
    number: '2',
    label: 'Assessment',
    caption: 'A 15-minute Big Five assessment built from workplace scenarios.',
    icon: Sparkles,
  },
  {
    number: '3',
    label: 'Insights',
    caption: 'Your archetype and a trait-by-trait breakdown of each match.',
    icon: Brain,
  },
  {
    number: '4',
    label: 'Connect',
    caption: 'Pick a match and propose times for a 15-minute coffee chat.',
    icon: Coffee,
  },
];

const STEP_DURATION = 4000;

/* ── Scene 1: Dashboard — mirrors /app/dashboard ── */
function AnimatedScoreNumber({ value, suffix = '', delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const startTime = performance.now() + delay * 1000;
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  return (
    <span className="tabular-nums">
      {display}
      {suffix && <span className="text-[10px]">{suffix}</span>}
    </span>
  );
}

// Letter tiles: the companies in these scenes are invented, so there are no logos to show
function CompanyLogoTile({ fallback, size = 20 }: { domain?: string; fallback: string; size?: number }) {
  return (
    <div
      className="rounded flex items-center justify-center flex-shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.42),
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 14%, var(--color-surface))',
        color: 'var(--color-accent)',
        border: '1px solid var(--color-border)',
      }}
    >
      {fallback}
    </div>
  );
}

function SceneDashboard() {
  const stats = [
    { label: 'Match index', value: 83, suffix: '%', chip: 'Best 87%' },
    { label: 'Available', value: 230, suffix: '', chip: '110 Co' },
    { label: 'Chats', value: 4, suffix: '', chip: '3 Pending' },
  ];

  const topMatches = [
    { company: 'Kestrel Studio', domain: 'kestrel', role: 'Brand Designer', score: 94, fallback: 'K' },
    { company: 'Brightline Labs', domain: 'brightline', role: 'Founding Engineer', score: 91, fallback: 'B' },
    { company: 'Fernleaf Health', domain: 'fernleaf', role: 'Product Designer', score: 87, fallback: 'F' },
    { company: 'Northwind Robotics', domain: 'northwind', role: 'Robotics Engineer', score: 83, fallback: 'N' },
  ];

  return (
    <div className="w-full h-full p-3 flex flex-col gap-2.5 overflow-hidden">
      {/* Hero greeting — consistent header pattern */}
      <motion.div
        className="rounded-lg border p-2 flex items-center gap-2"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 40%, transparent), color-mix(in srgb, var(--color-accent) 80%, transparent))',
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] leading-none"
            style={{ color: 'var(--color-text)' }}
          >
            Good evening,{' '}
            <span style={{ color: 'var(--color-accent)' }}>
              Alex
            </span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            <motion.div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: 'var(--color-accent)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="text-[8.5px] leading-none" style={{ color: 'var(--color-textMuted)' }}>
              2 New Matches · Sat, Apr 18
            </p>
          </div>
        </div>
        {/* Archetype chip — standardized */}
        <motion.div
          className="flex items-center gap-1 px-2 py-0.5 rounded flex-shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
          }}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Brain className="w-2.5 h-2.5" style={{ color: 'var(--color-accent)' }} />
          <span className="text-[9px]" style={{ color: 'var(--color-accent)' }}>
            The Strategist
          </span>
        </motion.div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map((m, i) => (
          <motion.div
            key={m.label}
            className="rounded-lg border p-2 relative overflow-hidden flex flex-col"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
              }}
            />
            <div className="flex items-start justify-between">
              <p
                className="text-[8px]"
                style={{ color: 'var(--color-textMuted)' }}
              >
                {m.label}
              </p>
              <ArrowUpRight
                className="w-2.5 h-2.5"
                style={{ color: 'var(--color-textMuted)' }}
              />
            </div>
            <p
              className="text-[20px] leading-none mt-1"
              style={{ color: 'var(--color-text)' }}
            >
              <AnimatedScoreNumber value={m.value} suffix={m.suffix} delay={0.3 + i * 0.08} />
            </p>
            <span
              className="text-[8px] font-semibold px-1 py-0.5 rounded mt-1 self-start"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              {m.chip}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Top matches — fills remaining space with 4 rows */}
      <motion.div
        className="rounded-lg border p-2 flex-1 flex flex-col min-h-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: 'var(--color-success)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text)' }}>
              Top personality matches
            </p>
          </div>
          <span
            className="text-[8px]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            This week
          </span>
        </div>
        <div className="space-y-1 flex-1 flex flex-col justify-evenly">
          {topMatches.map((m, i) => (
            <motion.div
              key={m.company}
              className="flex items-center gap-2 px-2 py-1.5 rounded border"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-border) 60%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--color-background) 40%, transparent)',
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
            >
              <CompanyLogoTile domain={m.domain} fallback={m.fallback} size={22} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-semibold leading-tight truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {m.company}
                </p>
                <p
                  className="text-[8px] truncate"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  {m.role}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className="h-1 rounded-full w-8 overflow-hidden"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.score}%` }}
                    transition={{ duration: 0.8, delay: 0.8 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: 'var(--color-accent)' }}
                >
                  <AnimatedScoreNumber value={m.score} suffix="%" delay={0.8 + i * 0.08} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Scene 2: Assessment — mirrors /app/personality ── */
function TypedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const startTime = performance.now() + delay * 1000;
    const perChar = 18;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const count = Math.min(Math.floor(elapsed / perChar), text.length);
      setShown(count);
      if (count < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);
  return <>{text.slice(0, shown)}</>;
}

function SceneAssessmentScene({ pickedIndex, hoverIndex }: { pickedIndex: number; hoverIndex: number }) {
  const options = [
    {
      title: 'Take the leap',
      desc: 'Growth happens outside comfort zones. The learning opportunity is worth the risk.',
    },
    {
      title: 'Stay the course',
      desc: 'Building mastery in your field is underrated. Depth over breadth.',
    },
    {
      title: 'Negotiate a hybrid',
      desc: 'Can you try it part-time first? Test before fully committing.',
    },
    {
      title: 'Need more information',
      desc: 'Too many unknowns. Research thoroughly before deciding.',
    },
  ];

  return (
    <div className="w-full h-full p-3 flex flex-col overflow-hidden">
      {/* Amber progress bar at the very top edge */}
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}
      >
        <div
          className="h-full"
          style={{
            width: '69%',
            background: 'linear-gradient(90deg, #16A34A, #F59E0B, var(--color-accent))',
          }}
        />
      </div>

      {/* Header row — bordered container matching other scenes */}
      <motion.div
        className="rounded-lg border p-2 flex items-center gap-2 mb-2 mt-1"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 40%, transparent), color-mix(in srgb, var(--color-accent) 80%, transparent))',
          }}
        >
          <Brain className="w-4 h-4" style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold leading-none"
            style={{ color: 'var(--color-text)' }}
          >
            Personality assessment
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <p
              className="text-[8.5px] leading-none"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Question 11 of 16
            </p>
            <span
              className="w-[3px] h-[3px] rounded-full"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
            <p
              className="text-[8.5px] leading-none"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Scenario
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Auto-save indicator — live pulse (label hidden on narrow widths) */}
          <motion.div
            className="flex items-center gap-1 text-[8px]"
            style={{ color: 'var(--color-success)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-success)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="hidden sm:inline">Auto-saved</span>
          </motion.div>
          <span
            className="text-[9px] font-semibold px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            Growth
          </span>
        </div>
      </motion.div>

      {/* Scenario question — tighter with less empty space */}
      <motion.div
        className="text-[19px] leading-[1.25] tracking-tight mb-2"
        style={{ color: 'var(--color-text)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <TypedText
          text="You're offered a role in a completely new field. More money, but you'd be starting from scratch. Your current role has a "
          delay={0.2}
        />
        <span style={{ color: 'var(--color-accent)' }}>
          <TypedText text="clear promotion path." delay={2.4} />
        </span>
      </motion.div>

      {/* 2×2 option cards — matches real /app/personality (radio + title + description) */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {options.map((opt, i) => {
          const isPicked = i === pickedIndex;
          const isHovered = i === hoverIndex && !isPicked;
          return (
            <motion.div
              key={opt.title}
              className="rounded-lg border p-3 flex items-start gap-2 transition-colors"
              style={{
                borderColor: isPicked
                  ? 'var(--color-accent)'
                  : isHovered
                  ? 'color-mix(in srgb, var(--color-accent) 50%, var(--color-border))'
                  : 'var(--color-border)',
                backgroundColor: isPicked
                  ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                  : isHovered
                  ? 'color-mix(in srgb, var(--color-accent) 4%, transparent)'
                  : 'var(--color-surface)',
                boxShadow: isPicked
                  ? '0 0 0 1px var(--color-accent), 0 0 14px color-mix(in srgb, var(--color-accent) 25%, transparent)'
                  : 'none',
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isPicked ? [1, 1.03, 1] : 1,
              }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
            >
              {/* Radio */}
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  border: `1.5px solid ${
                    isPicked || isHovered ? 'var(--color-accent)' : 'var(--color-border)'
                  }`,
                  backgroundColor: isPicked ? 'var(--color-accent)' : 'transparent',
                }}
              >
                {isPicked && (
                  <Check
                    className="w-1.5 h-1.5"
                    style={{ color: 'var(--color-accentText)' }}
                    strokeWidth={3}
                  />
                )}
              </div>
              {/* Title + description */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-[13px] font-semibold leading-tight mb-1.5"
                  style={{ color: 'var(--color-text)' }}
                >
                  {opt.title}
                </p>
                <p
                  className="text-[11px] leading-snug"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  {opt.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer: keyboard hint + progress dots + Back/Continue */}
      <div className="flex items-center justify-between mt-2.5">
        {/* Keyboard shortcut hint */}
        <div className="flex items-center gap-1">
          <span
            className="text-[7.5px] px-1 py-0.5 rounded border flex items-center gap-0.5"
            style={{
              color: 'var(--color-textMuted)',
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <kbd className="">1</kbd>
            –
            <kbd className="">4</kbd>
          </span>
          <span className="text-[7.5px]" style={{ color: 'var(--color-textMuted)' }}>
            Pick
          </span>
          <span
            className="w-[3px] h-[3px] rounded-full ml-1"
            style={{ backgroundColor: 'var(--color-border)' }}
          />
          <span
            className="text-[7.5px]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            ~2 Min Left
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => {
            const completed = i < 10;
            const current = i === 10;
            return (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: current ? 12 : 3,
                  height: 3,
                  backgroundColor: completed || current
                    ? 'var(--color-accent)'
                    : 'color-mix(in srgb, var(--color-border) 60%, transparent)',
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px]" style={{ color: 'var(--color-textMuted)' }}>
            ← Back
          </span>
          <span
            className="text-[9px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-0.5"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accentText)',
            }}
          >
            Continue →
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Scene 3: Insights — mirrors Ember deep-dive with full capability showcase ── */
function SceneInsights() {
  const scores = [
    { label: 'Trait', value: 93, color: '#A855F7', icon: 'T' },
    { label: 'Culture', value: 76, color: '#10B981', icon: 'C' },
    { label: 'Style', value: 75, color: '#F59E0B', icon: 'S' },
    { label: 'Comms', value: 92, color: '#EC4899', icon: '✦' },
  ];

  const dimensions = [
    { letter: 'O', label: 'Openness', you: 75, team: 80, color: '#A855F7', status: 'growth' },
    { letter: 'C', label: 'Conscientious', you: 85, team: 82, color: '#10B981', status: 'aligned' },
    { letter: 'E', label: 'Extraversion', you: 68, team: 72, color: '#F59E0B', status: 'near' },
    { letter: 'A', label: 'Agreeableness', you: 72, team: 85, color: '#EC4899', status: 'growth' },
    { letter: 'S', label: 'Stability', you: 72, team: 72, color: '#3B82F6', status: 'match' },
  ];

  return (
    <div className="w-full h-full p-3 flex flex-col gap-2 overflow-hidden">
      {/* Profile header — consistent header pattern */}
      <motion.div
        className="rounded-lg border p-2 flex items-center gap-2"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CompanyLogoTile fallback="K" size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="text-[11px] font-semibold leading-none truncate"
              style={{ color: 'var(--color-text)' }}
            >
              Jordan Park
            </p>
            <span
              className="text-[9px] leading-none"
              style={{ color: 'var(--color-textMuted)' }}
            >
              · Kestrel Studio
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <p
              className="text-[8.5px] leading-none"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Ember › deep dive
            </p>
            <span
              className="w-[3px] h-[3px] rounded-full"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
            <span
              className="text-[9px] font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              The Strategist
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <p
            className="text-[18px] leading-none tabular-nums"
            style={{ color: 'var(--color-text)' }}
          >
            <AnimatedScoreNumber value={85} suffix="%" delay={0.3} />
          </p>
          <motion.div
            className="text-[9px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5"
            style={{
              color: 'var(--color-success)',
              backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <TrendingUp className="w-2.5 h-2.5" />
            Strong fit
          </motion.div>
        </div>
      </motion.div>

      {/* Score breakdown — 4 bigger colored tiles in a row */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p
            className="text-[8px]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            Score breakdown
          </p>
          <p
            className="text-[8px]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            4 Dimensions
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {scores.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-lg p-3 relative overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid color-mix(in srgb, ${s.color} 35%, var(--color-border))`,
                boxShadow: `0 1px 0 color-mix(in srgb, ${s.color} 20%, transparent), 0 0 16px color-mix(in srgb, ${s.color} 10%, transparent)`,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.06 }}
            >
              <div
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ backgroundColor: s.color }}
              />
              <p
                className="text-[8.5px] pl-1.5 mb-1"
                style={{ color: 'var(--color-textMuted)' }}
              >
                {s.label}
              </p>
              <p
                className="text-[24px] leading-none tabular-nums pl-1.5 mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                <AnimatedScoreNumber value={s.value} suffix="%" delay={0.4 + i * 0.06} />
              </p>
              <div
                className="h-1 rounded-full overflow-hidden ml-1.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)',
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.value}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Flavor Profile — OCEAN bars with letter icons + delta chips */}
      <motion.div
        className="rounded-md border p-2 flex-1 flex flex-col min-h-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p
            className="text-[7.5px]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            Flavor profile
          </p>
          <div className="flex items-center gap-2 text-[7px]" style={{ color: 'var(--color-textMuted)' }}>
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
              You
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-textMuted) 40%, transparent)' }} />
              Team
            </span>
          </div>
        </div>
        <div className="space-y-1 flex-1 flex flex-col justify-between">
          {dimensions.map((dim, i) => {
            const delta = dim.you - dim.team;
            const statusColor =
              dim.status === 'match'
                ? 'var(--color-success)'
                : dim.status === 'aligned'
                ? 'var(--color-success)'
                : dim.status === 'near'
                ? '#F59E0B'
                : '#EC4899';
            const statusLabel =
              dim.status === 'match' ? 'Match' : dim.status === 'aligned' ? 'Aligned' : dim.status === 'near' ? 'Near' : 'Growth';
            return (
              <motion.div
                key={dim.label}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${dim.color} 15%, transparent)`,
                    color: dim.color,
                  }}
                >
                  {dim.letter}
                </div>
                <span
                  className="text-[8.5px] w-[72px] flex-shrink-0 truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {dim.label}
                </span>
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden relative"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-textMuted) 35%, transparent)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.team}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: dim.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.you}%` }}
                    transition={{ duration: 0.9, delay: 0.6 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
                <span
                  className="text-[8px] tabular-nums flex-shrink-0 w-[28px] text-right"
                  style={{ color: dim.color }}
                >
                  {dim.you}
                  <span className="opacity-40">/{dim.team}</span>
                </span>
                <span
                  className="text-[7px] font-semibold px-1 py-0.5 rounded flex-shrink-0 w-[44px] text-center"
                  style={{
                    color: statusColor,
                    backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                  }}
                >
                  {delta >= 0 ? '+' : ''}
                  {delta} {statusLabel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Ember's Take — AI-generated insight with strengths & discussion point */}
      <motion.div
        className="rounded-md border p-2 flex items-start gap-2"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
          borderColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), #F59E0B)',
          }}
        >
          <Sparkles className="w-2.5 h-2.5" style={{ color: '#fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p
              className="text-[7.5px]"
              style={{ color: 'var(--color-accent)' }}
            >
              Ember's take
            </p>
            <div className="flex items-center gap-1">
              <span
                className="text-[7px] font-semibold px-1 py-px rounded"
                style={{
                  color: 'var(--color-success)',
                  backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                }}
              >
                2 Strengths
              </span>
              <span
                className="text-[7px] font-semibold px-1 py-px rounded"
                style={{
                  color: '#F59E0B',
                  backgroundColor: 'color-mix(in srgb, #F59E0B 12%, transparent)',
                }}
              >
                1 to discuss
              </span>
            </div>
          </div>
          <p
            className="text-[9px] leading-snug"
            style={{ color: 'var(--color-text)' }}
          >
            Strong conscientiousness alignment means compatible work ethics.{' '}
            <span style={{ color: 'var(--color-textMuted)' }}>
              Discuss how your openness complements their structured approach.
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Scene 4: Connect — mirrors connection-request modal ── */
function SceneConnect({ stage }: { stage: number }) {
  const times = ['10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM'];
  const pickedTime = 4; // 12:30 PM
  const durations = ['15m', '30m', '45m', '60m'];
  const pickedDuration = '30m';

  const durationPicked = stage >= 1;
  const timePicked = stage >= 2;
  const sendHovered = stage >= 3;
  const sent = stage >= 3;

  const message =
    "I'd love to chat about how our work styles align at Kestrel Studio.";

  return (
    <div className="w-full h-full p-3 flex flex-col gap-2 overflow-hidden">
      {/* Target person+company card — consistent header pattern */}
      <motion.div
        className="rounded-lg border p-2 flex items-center gap-2"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CompanyLogoTile fallback="K" size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="text-[11px] font-semibold leading-none truncate"
              style={{ color: 'var(--color-text)' }}
            >
              Jordan Park
            </p>
            <span
              className="text-[9px] leading-none"
              style={{ color: 'var(--color-textMuted)' }}
            >
              · Kestrel Studio
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <p
              className="text-[8.5px] leading-none"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Senior product designer
            </p>
            <span
              className="w-[3px] h-[3px] rounded-full"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
            <span
              className="text-[9px] font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              The Strategist
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <p
            className="text-[18px] leading-none tabular-nums"
            style={{ color: 'var(--color-text)' }}
          >
            85%
          </p>
          <span
            className="text-[9px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5"
            style={{
              color: 'var(--color-success)',
              backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
            }}
          >
            <TrendingUp className="w-2.5 h-2.5" />
            Strong fit
          </span>
        </div>
      </motion.div>

      {/* Duration pills row */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div
          className="flex items-center gap-1 text-[8px] mb-1"
          style={{ color: 'var(--color-textMuted)' }}
        >
          <Coffee className="w-2.5 h-2.5" />
          Duration
        </div>
        <div className="grid grid-cols-4 gap-1">
          {durations.map((d) => {
            const picked = durationPicked && d === pickedDuration;
            return (
              <motion.span
                key={d}
                className="text-[10px] font-semibold py-1.5 rounded-md text-center"
                style={{
                  backgroundColor: picked ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: picked ? 'var(--color-accentText)' : 'var(--color-textSecondary)',
                  border: `1px solid ${picked ? 'var(--color-accent)' : 'var(--color-border)'}`,
                }}
                animate={picked ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {d}
              </motion.span>
            );
          })}
        </div>
      </motion.div>

      {/* Mini calendar — full width, takes most vertical space */}
      <motion.div
        className="rounded-md border p-2 flex-1 flex flex-col min-h-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            ◀ April 2026 ▶
          </span>
          <span
            className="text-[8px]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            2/5 Dates Selected
          </span>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div
              key={i}
              className="text-[8px] text-center"
              style={{ color: 'var(--color-textMuted)' }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Calendar cells — April 2026: starts Wed Apr 1 */}
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {(() => {
            type Cell = { day: number; inMonth: boolean; selected?: boolean; today?: boolean };
            const cells: Cell[] = [];
            cells.push({ day: 29, inMonth: false });
            cells.push({ day: 30, inMonth: false });
            cells.push({ day: 31, inMonth: false });
            for (let d = 1; d <= 30; d++) {
              cells.push({
                day: d,
                inMonth: true,
                selected: d === 21 || d === 23,
                today: d === 18,
              });
            }
            cells.push({ day: 1, inMonth: false });
            cells.push({ day: 2, inMonth: false });
            return cells.map((c, i) => {
              const isPicked = c.inMonth && c.selected && timePicked;
              return (
                <motion.div
                  key={i}
                  className="text-[9px] rounded flex items-center justify-center"
                  style={{
                    color: !c.inMonth
                      ? 'color-mix(in srgb, var(--color-textMuted) 50%, transparent)'
                      : isPicked
                      ? 'var(--color-accentText)'
                      : c.today
                      ? 'var(--color-accent)'
                      : 'var(--color-text)',
                    backgroundColor: isPicked
                      ? 'var(--color-accent)'
                      : c.today
                      ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                      : 'transparent',
                    border: c.today
                      ? '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)'
                      : 'none',
                    fontWeight: isPicked || c.today ? 600 : 400,
                  }}
                  animate={isPicked ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {c.day}
                </motion.div>
              );
            });
          })()}
        </div>
      </motion.div>

      {/* Time slots row — single horizontal row below calendar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="flex items-center gap-1 text-[8px] mb-1"
          style={{ color: 'var(--color-textMuted)' }}
        >
          <Calendar className="w-2.5 h-2.5" />
          Preferred time · Thu Apr 23
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {times.map((t, i) => {
            const isPicked = timePicked && i === pickedTime;
            return (
              <motion.div
                key={t}
                className="text-center text-[8.5px] font-medium rounded-md border py-1 flex items-center justify-center"
                style={{
                  borderColor: isPicked ? 'var(--color-accent)' : 'var(--color-border)',
                  backgroundColor: isPicked ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: isPicked ? 'var(--color-accentText)' : 'var(--color-text)',
                }}
                animate={isPicked ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {t}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Message preview — single compact row under the times */}
      <motion.div
        className="rounded-md border px-2 py-1.5 flex items-center gap-1.5"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <span
          className="text-[7.5px] flex-shrink-0"
          style={{ color: 'var(--color-textMuted)' }}
        >
          Message
        </span>
        <p
          className="text-[9px] leading-none flex-1 min-w-0 truncate"
          style={{ color: 'var(--color-text)' }}
        >
          <TypedText text={message} delay={0.5} />
          <motion.span
            className="inline-block w-0.5 h-2 ml-px align-middle"
            style={{ backgroundColor: 'var(--color-accent)' }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        </p>
        <span
          className="text-[7.5px] flex-shrink-0"
          style={{ color: 'var(--color-textMuted)' }}
        >
          11/100
        </span>
      </motion.div>

      {/* Footer row: cancel + send request */}
      <motion.div
        className="flex items-center justify-end gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <span className="text-[9px]" style={{ color: 'var(--color-textMuted)' }}>
          Cancel
        </span>
        <motion.div
          className="text-[9.5px] font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accentText)',
            boxShadow: sendHovered
              ? '0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent)'
              : 'none',
          }}
          animate={sent ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {sent ? (
            <>
              <Check className="w-3 h-3" strokeWidth={3} />
              Sent
            </>
          ) : (
            <>
              <Send className="w-3 h-3" />
              Send request
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProcessCard() {
  const [active, setActive] = useState(0);
  const [_clicked, setClicked] = useState(false);
  const [pickedIndex, setPickedIndex] = useState(-1);
  const [hoverIndex, setHoverIndex] = useState(-1); // Scene 2: hover drift
  const [connectStage, setConnectStage] = useState(0); // Scene 4: 0=idle, 1=duration picked, 2=time picked, 3=sent

  useEffect(() => {
    setClicked(false);
    setPickedIndex(-1);
    setHoverIndex(-1);
    setConnectStage(0);

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (active === 1) {
      // Assessment: cursor drifts across 2–3 options, then picks top-left
      timers.push(setTimeout(() => setHoverIndex(3), 600));
      timers.push(setTimeout(() => setHoverIndex(1), 1200));
      timers.push(setTimeout(() => setHoverIndex(0), 1800));
      timers.push(setTimeout(() => setPickedIndex(0), 2300));
    }
    if (active === 3) {
      // Connect: duration → time → send (3 stages)
      timers.push(setTimeout(() => setConnectStage(1), 700));
      timers.push(setTimeout(() => setConnectStage(2), 1500));
      timers.push(setTimeout(() => setConnectStage(3), 2400));
      timers.push(setTimeout(() => setClicked(true), 2600));
    }

    timers.push(
      setTimeout(() => {
        setActive((a) => (a + 1) % PROCESS_STEPS.length);
      }, STEP_DURATION)
    );

    return () => timers.forEach(clearTimeout);
  }, [active]);

  const step = PROCESS_STEPS[active];

  const scenes = [
    <SceneDashboard />,
    <SceneAssessmentScene pickedIndex={pickedIndex} hoverIndex={hoverIndex} />,
    <SceneInsights />,
    <SceneConnect stage={connectStage} />,
  ];

  return (
    <div
      className="relative rounded-xl p-5 sm:p-7 h-full overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >

      <div className="relative flex flex-col h-full">

        <AnimatePresence mode="wait">
          <motion.p
            key={step.number}
            className="text-sm leading-relaxed mb-5 max-w-md"
            style={{ color: 'var(--color-textSecondary)' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {step.caption}
          </motion.p>
        </AnimatePresence>

        <div
          className="relative flex-1 rounded-lg overflow-hidden border mb-5"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-background) 60%, transparent)',
            minHeight: 280,
          }}
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 border-b"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-backgroundSecondary)',
            }}
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#28C840' }} />
            </div>
            <div className="flex-1 flex justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={step.label}
                  className="text-[8px] tracking-wider"
                  style={{ color: 'var(--color-textMuted)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  amber.app/{step.label.toLowerCase()}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="relative w-full" style={{ height: 'calc(100% - 26px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {scenes[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {PROCESS_STEPS.map((s, i) => {
            const isActive = i === active;
            const isDone = i < active;
            return (
              <div key={s.number} className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold tabular-nums transition-all"
                  style={{
                    backgroundColor:
                      isActive || isDone ? 'var(--color-accent)' : 'transparent',
                    border: `1px solid ${
                      isActive || isDone ? 'var(--color-accent)' : 'var(--color-border)'
                    }`,
                    color:
                      isActive || isDone
                        ? 'var(--color-accentText)'
                        : 'var(--color-textMuted)',
                  }}
                >
                  {isDone ? <Check className="w-2.5 h-2.5" /> : s.number}
                </div>
                <span
                  className="text-label truncate hidden sm:inline"
                  style={{
                    color: isActive ? 'var(--color-text)' : 'var(--color-textMuted)',
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  {s.label}
                </span>
                {i < PROCESS_STEPS.length - 1 && (
                  <div
                    className="w-2 h-px flex-shrink-0 hidden sm:block"
                    style={{ backgroundColor: 'var(--color-border)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FeatureBento() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="max-w-2xl mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <h2 className="text-headline" style={{ color: 'var(--color-text)' }}>
            A tour of the product
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
            Recreations of the four screens a job seeker moves through, from the dashboard to booking a coffee chat.
          </p>
        </motion.div>
        <div className="min-h-[600px] sm:min-h-[560px]">
          <ProcessCard />
        </div>
      </div>
    </section>
  );
}
