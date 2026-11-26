/**
 * The landing's worked example: one of the invented demo companies, scored with
 * the real Ember engine, so the hero and the explainer show the same numbers the
 * demo does.
 */
import { calculateCompatibility, type CandidateOCEAN } from '../../lib/ember/compatibility';
import { determineArchetype } from '../../lib/ember/agent';
import { getArchetypeCompatibility } from '../../lib/archetypeCompatibility';

export const COMPANY = {
  name: 'Kestrel Studio',
  archetype: 'The Collaborator',
  values: ['creativity', 'collaboration', 'diversity', 'innovation'],
  prefs: { openness: 90, conscientiousness: 55, extraversion: 70, agreeableness: 70, neuroticism: 40 },
  role: { title: 'Brand Designer', work_style: 'hybrid', required_openness_min: 75, required_openness_max: 100, required_extraversion_min: 50, required_extraversion_max: 90 },
};

export function scoreAgainstKestrel(ocean: CandidateOCEAN) {
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
}

// One profile per archetype for the hero radar; kestrel.test.ts checks each classifies as labelled
export const PRESETS: { key: string; ocean: CandidateOCEAN }[] = [
  { key: 'the_innovator', ocean: { openness: 82, conscientiousness: 48, extraversion: 64, agreeableness: 70, neuroticism: 35 } },
  { key: 'the_connector', ocean: { openness: 60, conscientiousness: 50, extraversion: 88, agreeableness: 86, neuroticism: 40 } },
  { key: 'the_architect', ocean: { openness: 50, conscientiousness: 88, extraversion: 45, agreeableness: 55, neuroticism: 40 } },
  { key: 'the_catalyst', ocean: { openness: 86, conscientiousness: 70, extraversion: 88, agreeableness: 15, neuroticism: 45 } },
  { key: 'the_harmonizer', ocean: { openness: 55, conscientiousness: 55, extraversion: 50, agreeableness: 88, neuroticism: 12 } },
  { key: 'the_craftsperson', ocean: { openness: 30, conscientiousness: 88, extraversion: 12, agreeableness: 55, neuroticism: 40 } },
  { key: 'the_explorer', ocean: { openness: 88, conscientiousness: 65, extraversion: 55, agreeableness: 55, neuroticism: 10 } },
  { key: 'the_strategist', ocean: { openness: 68, conscientiousness: 88, extraversion: 45, agreeableness: 50, neuroticism: 40 } },
];
