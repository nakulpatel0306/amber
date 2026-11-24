import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { CandidateResult } from '../../../types/matching.types';

interface CompareViewProps {
  candidates: CandidateResult[];
  employerOcean: Record<string, number>;
  onBack: () => void;
}

// One series color per compared candidate (max 3); the swatch next to each name is the legend
const SERIES_COLORS = ['var(--color-accent)', 'var(--color-trait-openness)', 'var(--color-trait-stability)'];

export function CompareView({ candidates, employerOcean, onBack }: CompareViewProps) {
  if (candidates.length < 2) return null;

  const dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;
  const dimensionLabels: Record<string, string> = {
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Stability',
  };
  // Neuroticism is shown flipped as stability so higher always reads as better
  const display = (dim: typeof dimensions[number], value: number) => (dim === 'neuroticism' ? 100 - value : value);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-5xl mx-auto"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-label transition-opacity hover:opacity-80"
        style={{ color: 'var(--color-accent)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Ember
      </button>

      <h1 className="mt-4 text-title" style={{ color: 'var(--color-text)' }}>
        Compare candidates
      </h1>

      <div className={`mt-6 grid grid-cols-1 gap-4 ${candidates.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {candidates.map((c, idx) => (
          <div key={c.candidateId} className="bento-card min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: SERIES_COLORS[idx] }} />
              <h2 className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{c.name}</h2>
            </div>
            <p className="mt-0.5 truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
              {c.headline}
            </p>
            <p className="mt-0.5 truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
              {c.archetype.name}
            </p>
            <p className="mt-3 text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
              {c.overallScore}%
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Score comparison</h2>
        <div className="bento-card mt-3 space-y-5">
          {[
            { label: 'Overall', key: 'overallScore' as const },
            { label: 'Trait match', key: 'traitScore' as const },
            { label: 'Culture fit', key: 'cultureScore' as const },
            { label: 'Work style', key: 'workStyleFit' as const },
          ].map(({ label, key }) => (
            <div key={label}>
              <h3 className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</h3>
              <div className="space-y-1.5">
                {candidates.map((c, idx) => (
                  <CompareBar key={c.candidateId} label={c.name} value={c[key]} color={SERIES_COLORS[idx]} suffix="%" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 pb-8">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Personality profile</h2>
        <div className="bento-card mt-3 space-y-5">
          {dimensions.map(dim => (
            <div key={dim}>
              <h3 className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{dimensionLabels[dim]}</h3>
              <div className="space-y-1.5">
                <CompareBar label="Your preference" value={display(dim, employerOcean[dim])} color="var(--color-textMuted)" />
                {candidates.map((c, idx) => (
                  <CompareBar key={c.candidateId} label={c.name} value={display(dim, c.candidateOcean[dim])} color={SERIES_COLORS[idx]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function CompareBar({ label, value, color, suffix = '' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 flex-shrink-0 truncate text-caption sm:w-32" style={{ color: 'var(--color-textSecondary)' }}>
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-caption tabular-nums" style={{ color: 'var(--color-text)' }}>
        {value}{suffix}
      </span>
    </div>
  );
}
