/**
 * The product in one picture: a candidate profile, the match it produces and the
 * coffee chat it leads to. Values are the matching explainer's defaults, so the
 * 97 here is the same 97 the explainer computes further down.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { Coffee, Lightbulb, MapPin } from 'lucide-react';
import { TRAIT } from './Section';

const PROFILE = [
  { label: 'Openness', v: 82, c: TRAIT.o },
  { label: 'Conscientiousness', v: 48, c: TRAIT.c },
  { label: 'Extraversion', v: 64, c: TRAIT.e },
  { label: 'Agreeableness', v: 70, c: TRAIT.a },
  { label: 'Neuroticism', v: 35, c: TRAIT.n },
];

const SCORE = 97;
const ease = [0.23, 1, 0.32, 1] as const;

const card = 'rounded-2xl border p-4 sm:p-5 backdrop-blur-md';
const cardStyle = {
  borderColor: 'var(--color-border)',
  backgroundColor: 'color-mix(in srgb, var(--color-surface) 88%, transparent)',
  boxShadow: '0 24px 60px -24px rgba(0,0,0,0.35)',
};

function Float({ delay, children, className }: { delay: number; children: React.ReactNode; className: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: reduce ? 0 : [0, -6, 0] }}
      transition={{
        opacity: { duration: 0.7, delay, ease },
        y: reduce ? { duration: 0 } : { duration: 6, delay: delay + 0.7, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.div>
  );
}

function ScoreRing() {
  const r = 30;
  const len = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="w-16 h-16 -rotate-90" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" style={{ stroke: 'var(--color-border)' }} />
      <motion.circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        stroke="url(#ring)"
        strokeDasharray={len}
        initial={{ strokeDashoffset: len }}
        animate={{ strokeDashoffset: len * (1 - SCORE / 100) }}
        transition={{ duration: 1.4, delay: 0.9, ease }}
      />
      <defs>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--color-trait-extraversion)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--color-trait-agreeableness)' }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HeroVisual() {
  return (
    <div className="relative mx-auto mt-14 sm:mt-16 max-w-4xl h-[450px] sm:h-[360px]" aria-hidden>
      {/* Profile */}
      <Float delay={0.2} className="absolute left-0 right-8 top-0 sm:right-auto sm:w-[340px] sm:-rotate-2">
        <div className={card} style={cardStyle}>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-trait-openness) 18%, transparent)' }}
            >
              <Lightbulb className="w-5 h-5" style={{ color: TRAIT.o }} />
            </span>
            <div className="text-left">
              <p className="text-caption" style={{ color: 'var(--color-textMuted)' }}>Alex's archetype</p>
              <p className="text-heading" style={{ color: 'var(--color-text)' }}>The Innovator</p>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {PROFILE.map((t, i) => (
              <div key={t.label}>
                <div className="flex justify-between text-caption" style={{ color: 'var(--color-textSecondary)' }}>
                  <span>{t.label}</span>
                  <span className="tabular-nums">{t.v}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: t.c }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.v}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.08, ease }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Float>

      {/* Match */}
      <Float delay={0.45} className="absolute right-0 left-10 top-[250px] sm:left-auto sm:top-6 sm:w-[320px] sm:rotate-2">
        <div className={card} style={cardStyle}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ScoreRing />
              <span className="absolute inset-0 flex items-center justify-center text-heading tabular-nums" style={{ color: 'var(--color-text)' }}>
                {SCORE}
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="text-caption" style={{ color: 'var(--color-textMuted)' }}>Ember score</p>
              <p className="text-heading truncate" style={{ color: 'var(--color-text)' }}>Brand Designer</p>
              <p className="text-caption flex items-center gap-1" style={{ color: 'var(--color-textSecondary)' }}>
                <MapPin className="w-3 h-3" /> Kestrel Studio · Hybrid
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['Creativity', 'Collaboration', 'Innovation'].map((v) => (
              <span
                key={v}
                className="h-6 px-2.5 inline-flex items-center rounded-full text-caption"
                style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </Float>

      {/* Coffee chat */}
      <Float delay={0.7} className="absolute left-4 right-14 top-[378px] sm:left-auto sm:right-[300px] sm:top-[250px] sm:w-[290px] sm:-rotate-1">
        <div className={`${card} flex items-center gap-3`} style={cardStyle}>
          <span
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-trait-extraversion) 20%, transparent)' }}
          >
            <Coffee className="w-5 h-5" style={{ color: TRAIT.e }} />
          </span>
          <div className="text-left min-w-0">
            <p className="text-label truncate" style={{ color: 'var(--color-text)' }}>Coffee chat accepted</p>
            <p className="text-caption truncate" style={{ color: 'var(--color-textSecondary)' }}>Kestrel Studio · Thu, 10:30</p>
          </div>
        </div>
      </Float>
    </div>
  );
}
