/**
 * Hero: Amber's whole idea as one picture. The dashed shape is what Kestrel
 * Studio's team hopes for; the filled shape is a candidate. It cycles through
 * the eight archetypes on its own, and visitors can pick one or shuffle. The
 * score is the real Ember engine, not an animation of a made-up number.
 */
import { useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import type { CandidateOCEAN, OceanTrait } from '../../lib/ember/compatibility';
import { ARCHETYPES } from '../../lib/archetypes';
import { ARCHETYPE_ICONS } from './archetypeIcons';
import { COMPANY, PRESETS, scoreAgainstKestrel } from './kestrel';
import { TRAIT, readable } from './Section';

const AXES: { key: OceanTrait; label: string; color: string }[] = [
  { key: 'openness', label: 'Openness', color: TRAIT.o },
  { key: 'conscientiousness', label: 'Conscientiousness', color: TRAIT.c },
  { key: 'extraversion', label: 'Extraversion', color: TRAIT.e },
  { key: 'agreeableness', label: 'Agreeableness', color: TRAIT.a },
  { key: 'neuroticism', label: 'Neuroticism', color: TRAIT.n },
];

// Wide enough that the two-line axis labels sit inside the drawing at phone width
const W = 460;
const H = 430;
const CX = W / 2;
const CY = 222;
const R = 130;
const CYCLE_MS = 3200;
const ease = [0.23, 1, 0.32, 1] as const;

function point(i: number, value: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const r = (value / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function shape(ocean: CandidateOCEAN): string {
  return AXES.map((a, i) => point(i, ocean[a.key]).map((n) => n.toFixed(1)).join(',')).join(' ');
}

const ring = (pct: number) => AXES.map((_, i) => point(i, pct).join(',')).join(' ');

function randomProfile(): CandidateOCEAN {
  const v = () => Math.round(10 + Math.random() * 85);
  return { openness: v(), conscientiousness: v(), extraversion: v(), agreeableness: v(), neuroticism: v() };
}

function Score({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (n) => Math.round(n).toString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease });
    return controls.stop;
  }, [mv, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

export function HeroRadar() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [custom, setCustom] = useState<CandidateOCEAN | null>(null);
  const [auto, setAuto] = useState(!reduce);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PRESETS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [auto]);

  const ocean = custom ?? PRESETS[index].ocean;
  const result = useMemo(() => scoreAgainstKestrel(ocean), [ocean]);
  const meta = ARCHETYPES[result.archetype.key];
  const Icon = ARCHETYPE_ICONS[meta?.emoji ?? ''] ?? ARCHETYPE_ICONS.lightbulb;

  const pick = (i: number) => {
    setAuto(false);
    setCustom(null);
    setIndex(i);
  };
  const shuffle = () => {
    setAuto(false);
    setCustom(randomProfile());
  };

  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${meta?.name} against ${COMPANY.name}: Ember score ${result.ember}`}>
        <defs>
          <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--color-trait-extraversion)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--color-trait-agreeableness)' }} />
          </linearGradient>
        </defs>

        {[25, 50, 75, 100].map((p) => (
          <polygon key={p} points={ring(p)} fill="none" strokeWidth="1" style={{ stroke: 'color-mix(in srgb, var(--color-textMuted) 30%, transparent)' }} />
        ))}
        {AXES.map((a, i) => {
          const [x, y] = point(i, 100);
          return <line key={a.key} x1={CX} y1={CY} x2={x} y2={y} strokeWidth="1" style={{ stroke: 'color-mix(in srgb, var(--color-textMuted) 30%, transparent)' }} />;
        })}

        {/* What the team hopes for */}
        <polygon
          points={shape(COMPANY.prefs)}
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          style={{ stroke: 'var(--color-textMuted)' }}
        />

        {/* The candidate */}
        <motion.polygon
          initial={false}
          animate={{ points: shape(ocean) }}
          transition={{ duration: reduce ? 0 : 0.9, ease }}
          fill="url(#radar-fill)"
          fillOpacity="0.28"
          stroke="url(#radar-fill)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {AXES.map((a, i) => {
          const [x, y] = point(i, ocean[a.key]);
          return (
            <motion.circle
              key={a.key}
              r="5"
              initial={false}
              animate={{ cx: x, cy: y }}
              transition={{ duration: reduce ? 0 : 0.9, ease }}
              strokeWidth="2"
              style={{ fill: a.color, stroke: 'var(--color-background)' }}
            />
          );
        })}

        {AXES.map((a, i) => {
          const [x, y] = point(i, 129);
          return (
            <text key={a.key} x={x} y={i === 0 ? y - 14 : y} textAnchor="middle" className="text-[13px]">
              <tspan x={x} style={{ fill: 'var(--color-textSecondary)' }}>{a.label}</tspan>
              <tspan x={x} dy="15" className="font-semibold tabular-nums" style={{ fill: readable(a.color, 55) }}>
                {ocean[a.key]}
              </tspan>
            </text>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-11 h-11 shrink-0 rounded-xl inline-flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-trait-extraversion) 16%, transparent)', color: TRAIT.e }}
          >
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0 text-left">
            <motion.p
              key={meta?.name}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="text-heading truncate"
              style={{ color: 'var(--color-text)' }}
            >
              {meta?.name}
            </motion.p>
            <p className="text-caption truncate" style={{ color: 'var(--color-textSecondary)' }}>
              vs {COMPANY.name} · {COMPANY.role.title}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-headline leading-none text-gradient-warm">
            <Score value={result.ember} />
          </p>
          <p className="text-caption mt-1" style={{ color: 'var(--color-textMuted)' }}>Ember score</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {PRESETS.map((p, i) => {
          const active = !custom && i === index;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={active}
              className="h-8 px-3 rounded-full text-caption font-medium border transition-colors"
              style={{
                borderColor: active ? 'transparent' : 'var(--color-border)',
                backgroundColor: active ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
                color: active ? 'var(--color-background)' : 'var(--color-textSecondary)',
              }}
            >
              {ARCHETYPES[p.key].name.replace('The ', '')}
            </button>
          );
        })}
        <button
          type="button"
          onClick={shuffle}
          className="h-8 px-3 rounded-full text-caption font-medium border inline-flex items-center gap-1.5 transition-colors hover:bg-[var(--color-surfaceHover)]"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <Shuffle className="w-3.5 h-3.5" />
          Shuffle
        </button>
      </div>
      <p className="mt-3 text-caption flex items-center gap-2" style={{ color: 'var(--color-textMuted)' }}>
        <span className="inline-block w-5 border-t-[1.5px] border-dashed" style={{ borderColor: 'var(--color-textMuted)' }} />
        What {COMPANY.name}'s team hopes for
      </p>
    </div>
  );
}
