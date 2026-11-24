import { useMemo, useState } from 'react';
import { calculateCompatibility, type CandidateOCEAN, type OceanTrait } from '../../lib/ember/compatibility';
import { determineArchetype } from '../../lib/ember/agent';
import { getArchetypeCompatibility } from '../../lib/archetypeCompatibility';

const TRAITS: { key: OceanTrait; label: string; color: string }[] = [
  { key: 'openness', label: 'Openness', color: 'var(--color-trait-openness)' },
  { key: 'conscientiousness', label: 'Conscientiousness', color: 'var(--color-trait-conscientiousness)' },
  { key: 'extraversion', label: 'Extraversion', color: 'var(--color-trait-extraversion)' },
  { key: 'agreeableness', label: 'Agreeableness', color: 'var(--color-trait-agreeableness)' },
  { key: 'neuroticism', label: 'Neuroticism', color: 'var(--color-trait-stability)' },
];

// One of the invented demo companies, so the numbers match what the demo shows
const COMPANY = {
  name: 'Kestrel Studio',
  archetype: 'The Collaborator',
  values: ['creativity', 'collaboration', 'diversity', 'innovation'],
  prefs: { openness: 90, conscientiousness: 55, extraversion: 70, agreeableness: 70, neuroticism: 40 },
  role: { title: 'Brand Designer', work_style: 'hybrid', required_openness_min: 75, required_openness_max: 100, required_extraversion_min: 50, required_extraversion_max: 90 },
};

const WEIGHTS = [
  { key: 'trait', label: 'Trait distance', weight: 40 },
  { key: 'culture', label: 'Culture and role fit', weight: 30 },
  { key: 'work', label: 'Work style', weight: 20 },
  { key: 'comm', label: 'Communication', weight: 10 },
] as const;

export function MatchingExplainer() {
  const [ocean, setOcean] = useState<CandidateOCEAN>({
    openness: 82,
    conscientiousness: 48,
    extraversion: 64,
    agreeableness: 70,
    neuroticism: 35,
  });

  const result = useMemo(() => {
    const compat = calculateCompatibility(
      ocean,
      {
        openness_preference: COMPANY.prefs.openness,
        conscientiousness_preference: COMPANY.prefs.conscientiousness,
        extraversion_preference: COMPANY.prefs.extraversion,
        agreeableness_preference: COMPANY.prefs.agreeableness,
        neuroticism_preference: COMPANY.prefs.neuroticism,
        culture_values: COMPANY.values,
      },
      'hybrid',
      COMPANY.role,
    );
    const archetype = determineArchetype(ocean);
    const bonus = getArchetypeCompatibility(archetype.key, COMPANY.archetype).bonus;
    return { compat, archetype, bonus, ember: Math.max(0, Math.min(100, compat.overall_match_score + bonus)) };
  }, [ocean]);

  const parts = {
    trait: result.compat.trait_match_score,
    culture: result.compat.culture_match_score,
    work: result.compat.work_style_score,
    comm: result.compat.communication_score,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <p className="text-label" style={{ color: 'var(--color-textMuted)' }}>
          Candidate (drag the sliders)
        </p>
        <div className="mt-4 space-y-4">
          {TRAITS.map((trait) => {
            const target = COMPANY.prefs[trait.key];
            return (
              <label key={trait.key} className="block">
                <span className="flex items-baseline justify-between text-sm">
                  <span style={{ color: 'var(--color-text)' }}>{trait.label}</span>
                  <span className="font-mono tabular-nums text-xs" style={{ color: 'var(--color-textSecondary)' }}>
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
                    className="w-full"
                    style={{ accentColor: trait.color }}
                    aria-label={`${trait.label} score`}
                  />
                  <span
                    aria-hidden
                    className="absolute -top-1 h-2 w-0.5 rounded"
                    style={{ left: `calc(${target}% - 1px)`, backgroundColor: 'var(--color-textMuted)' }}
                  />
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-5 text-xs leading-relaxed" style={{ color: 'var(--color-textMuted)' }}>
          Against {COMPANY.name}'s {COMPANY.role.title} role: hybrid, openness 75 to 100, extraversion 50 to 90,
          values {COMPANY.values.join(', ')}.
        </p>
      </div>

      <div className="rounded-2xl border p-5 sm:p-6 flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
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
                  {w.label} <span style={{ color: 'var(--color-textMuted)' }}>x {w.weight}%</span>
                </span>
                <span className="font-mono tabular-nums" style={{ color: 'var(--color-text)' }}>
                  {parts[w.key]}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${parts[w.key]}%`, backgroundColor: 'var(--color-accent)' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6 font-mono text-xs leading-6" style={{ color: 'var(--color-textSecondary)' }}>
          <div>
            0.4 x {parts.trait} + 0.3 x {parts.culture} + 0.2 x {parts.work} + 0.1 x {parts.comm} ={' '}
            <span style={{ color: 'var(--color-text)' }}>{result.compat.overall_match_score}</span>
          </div>
          <div>
            {result.archetype.name} x {COMPANY.archetype}: {result.bonus >= 0 ? '+' : ''}
            {result.bonus} ={' '}
            <span style={{ color: 'var(--color-accent)' }}>{result.ember}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
