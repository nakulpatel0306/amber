import { useMemo, useState, type CSSProperties } from 'react';
import type { CandidateOCEAN, OceanTrait } from '../../lib/ember/compatibility';
import { COMPANY, PRESETS, scoreAgainstKestrel } from './kestrel';
import { WEIGHT_SHADES } from './Section';

const TRAITS: { key: OceanTrait; label: string; color: string }[] = [
  { key: 'openness', label: 'Openness', color: 'var(--color-trait-openness)' },
  { key: 'conscientiousness', label: 'Conscientiousness', color: 'var(--color-trait-conscientiousness)' },
  { key: 'extraversion', label: 'Extraversion', color: 'var(--color-trait-extraversion)' },
  { key: 'agreeableness', label: 'Agreeableness', color: 'var(--color-trait-agreeableness)' },
  { key: 'neuroticism', label: 'Neuroticism', color: 'var(--color-trait-stability)' },
];

const WEIGHTS = [
  { key: 'trait', label: 'Trait distance', weight: 40, color: WEIGHT_SHADES[0] },
  { key: 'culture', label: 'Culture and role fit', weight: 30, color: WEIGHT_SHADES[1] },
  { key: 'work', label: 'Work style', weight: 20, color: WEIGHT_SHADES[2] },
  { key: 'comm', label: 'Communication', weight: 10, color: WEIGHT_SHADES[3] },
] as const;

export function MatchingExplainer() {
  const [ocean, setOcean] = useState<CandidateOCEAN>(PRESETS[0].ocean);

  const result = useMemo(() => scoreAgainstKestrel(ocean), [ocean]);

  const parts = {
    trait: result.compat.trait_match_score,
    culture: result.compat.culture_match_score,
    work: result.compat.work_style_score,
    comm: result.compat.communication_score,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Candidate
        </p>
        <p className="text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
          Drag the sliders to change the profile
        </p>
        <div className="mt-4 space-y-4">
          {TRAITS.map((trait) => {
            const target = COMPANY.prefs[trait.key];
            return (
              <label key={trait.key} className="block">
                <span className="flex items-baseline justify-between text-sm">
                  <span style={{ color: 'var(--color-text)' }}>{trait.label}</span>
                  <span className="tabular-nums text-xs" style={{ color: 'var(--color-textSecondary)' }}>
                    {ocean[trait.key]} <span style={{ color: 'var(--color-textMuted)' }}>/ team wants {target}</span>
                  </span>
                </span>
                <span className="relative mt-2 block">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ocean[trait.key]}
                    onChange={(e) => setOcean((prev) => ({ ...prev, [trait.key]: Number(e.target.value) }))}
                    className="trait-range"
                    style={{ '--range-color': trait.color, '--range-frac': ocean[trait.key] / 100 } as CSSProperties}
                    aria-label={`${trait.label} score`}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-1.5 h-2 w-0.5 rounded"
                    style={{ left: `calc(${target / 100} * (100% - 16px) + 7px)`, backgroundColor: 'var(--color-textMuted)' }}
                  />
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-pretty" style={{ color: 'var(--color-textMuted)' }}>
          Against {COMPANY.name}'s {COMPANY.role.title} role: hybrid, openness 75 to 100, extraversion 50 to 90,
          values {COMPANY.values.join(', ')}.
        </p>
      </div>

      <div className="rounded-xl border p-5 sm:p-6 flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-label" style={{ color: 'var(--color-textMuted)' }}>
              Archetype
            </p>
            <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {result.archetype.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-label" style={{ color: 'var(--color-textMuted)' }}>
              Ember score
            </p>
            <p className="text-title tabular-nums" style={{ color: 'var(--color-accent)' }}>
              {result.ember}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {WEIGHTS.map((w) => (
            <div key={w.key}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--color-textSecondary)' }}>
                  {w.label} <span style={{ color: 'var(--color-textMuted)' }}>× {w.weight}%</span>
                </span>
                <span className="tabular-nums" style={{ color: 'var(--color-text)' }}>
                  {parts[w.key]}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${parts[w.key]}%`, backgroundColor: w.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Each term stays whole so the equation only breaks between terms, never before the result */}
        <div className="mt-5 pt-4 border-t text-sm tabular-nums leading-7" style={{ borderColor: 'var(--color-border)', color: 'var(--color-textSecondary)' }}>
          <div>
            <span className="whitespace-nowrap">0.4 × {parts.trait} +</span>{' '}
            <span className="whitespace-nowrap">0.3 × {parts.culture} +</span>{' '}
            <span className="whitespace-nowrap">0.2 × {parts.work} +</span>{' '}
            <span className="whitespace-nowrap">
              0.1 × {parts.comm} = <span style={{ color: 'var(--color-text)' }}>{result.compat.overall_match_score}</span>
            </span>
          </div>
          <div>
            <span className="whitespace-nowrap">{result.compat.overall_match_score}</span>{' '}
            <span className="whitespace-nowrap">
              {result.bonus >= 0 ? '+' : '−'} {Math.abs(result.bonus)} archetype bonus
            </span>{' '}
            <span className="whitespace-nowrap">
              = <span style={{ color: 'var(--color-accent)' }}>{result.ember}</span>
            </span>
          </div>
        </div>

        <p
          className="mt-auto pt-5 text-xs leading-relaxed text-pretty"
          style={{ color: 'var(--color-textMuted)' }}
        >
          <span style={{ color: 'var(--color-textSecondary)' }}>
            {COMPANY.name}'s culture archetype: {COMPANY.archetype}.
          </span>{' '}
          Employers have eight culture archetypes of their own, and each pairing with a candidate archetype adds between
          -8 and +10 points. {result.archetype.name} with {COMPANY.archetype} adds {result.bonus >= 0 ? '+' : ''}
          {result.bonus}.
        </p>
      </div>
    </div>
  );
}
