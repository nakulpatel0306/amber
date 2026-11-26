/**
 * The one score the app shows for a candidate-employer pair.
 *
 * It is the Ember score: the compatibility engine's overall match plus the
 * archetype-pair bonus, clamped to 0-100, exactly as lib/ember's
 * runEmberAnalysis (and the backend) computes it. Every screen that prints a
 * match percentage goes through here, so the dashboard, Ember and the deep
 * dive can't drift apart.
 */
import { calculateCompatibility, type CompatibilityResult, type OCEANScores, type RoleRequirements } from './compatibilityScoring';
import { determineArchetype } from './archetypes';
import { getArchetypeCompatibility } from './archetypeCompatibility';

export interface MatchInput {
  candidate: OCEANScores;
  candidateWorkStyle?: string | null;
  employer: OCEANScores;
  cultureValues?: string[] | null;
  /** The stored employer archetype; the backend applies no bonus without one. */
  employerArchetypeName?: string | null;
  /** Omit for the company-level match; pass a role for that role's fit. */
  role?: RoleRequirements | null;
}

export interface MatchScore extends CompatibilityResult {
  /** Compatibility before the archetype bonus. */
  baseScore: number;
  archetypeBonus: number;
}

export function scoreMatch(input: MatchInput): MatchScore {
  const result = calculateCompatibility({
    candidateOCEAN: input.candidate,
    employerPreferences: { ...input.employer, cultureValues: input.cultureValues ?? [] },
    candidateWorkStyle: input.candidateWorkStyle ?? undefined,
    roleRequirements: input.role ?? undefined,
  });
  const archetypeBonus = getArchetypeCompatibility(
    determineArchetype(input.candidate).key,
    input.employerArchetypeName || '',
  ).bonus;

  return {
    ...result,
    baseScore: result.overallMatchScore,
    archetypeBonus,
    overallMatchScore: Math.max(0, Math.min(100, result.overallMatchScore + archetypeBonus)),
  };
}

// Any row shape: typed records (CandidateData, EmployerData, RoleOption) and raw query rows alike
type ScoreRow = object;
const field = (row: ScoreRow, key: string) => (row as Record<string, unknown>)[key];

// Same `|| 50` fallback as lib/ember's row readers, so a missing score scores identically
const num = (value: unknown) => (value as number) || 50;

const TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;

function oceanFromRow(row: ScoreRow, suffix: '_score' | '_preference'): OCEANScores {
  return Object.fromEntries(TRAITS.map((t) => [t, num(field(row, t + suffix))])) as unknown as OCEANScores;
}

export function candidateOceanFromRow(row: ScoreRow): OCEANScores {
  return oceanFromRow(row, '_score');
}

export function employerOceanFromRow(row: ScoreRow): OCEANScores {
  return oceanFromRow(row, '_preference');
}

export function roleRequirementsFromRow(row: ScoreRow): RoleRequirements {
  const value = (key: string) => (field(row, key) as number | null | undefined) ?? null;
  return {
    required_openness_min: value('required_openness_min'),
    required_openness_max: value('required_openness_max'),
    required_conscientiousness_min: value('required_conscientiousness_min'),
    required_conscientiousness_max: value('required_conscientiousness_max'),
    required_extraversion_min: value('required_extraversion_min'),
    required_extraversion_max: value('required_extraversion_max'),
    required_agreeableness_min: value('required_agreeableness_min'),
    required_agreeableness_max: value('required_agreeableness_max'),
    required_neuroticism_min: value('required_neuroticism_min'),
    required_neuroticism_max: value('required_neuroticism_max'),
    work_style: (field(row, 'work_style') as string | null | undefined) ?? null,
  };
}

/** Score straight from database rows (candidates, employers, roles). */
export function scoreMatchFromRows(candidate: ScoreRow, employer: ScoreRow, role?: ScoreRow | null): MatchScore {
  return scoreMatch({
    candidate: candidateOceanFromRow(candidate),
    candidateWorkStyle: field(candidate, 'preferred_work_style') as string | null | undefined,
    employer: employerOceanFromRow(employer),
    cultureValues: field(employer, 'culture_values') as string[] | null | undefined,
    employerArchetypeName: field(employer, 'archetype_name') as string | null | undefined,
    role: role ? roleRequirementsFromRow(role) : null,
  });
}
