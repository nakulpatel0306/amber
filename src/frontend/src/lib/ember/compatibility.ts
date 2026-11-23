/**
 * Compatibility scoring engine, ported line for line from
 * src/backend/engine/compatibility.py.
 *
 * The Python module is the source of truth. Function names, weights, key names
 * and the order of arithmetic all mirror it so both sides produce identical
 * numbers; tests/fixtures/ember-parity.json is checked by vitest and pytest.
 */

export interface CandidateOCEAN {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export type OceanTrait = keyof CandidateOCEAN;

export const OCEAN_TRAITS: OceanTrait[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

export interface EmployerPreferences {
  openness_preference: number;
  conscientiousness_preference: number;
  extraversion_preference: number;
  agreeableness_preference: number;
  neuroticism_preference: number;
  culture_values: string[];
}

export interface RoleRequirements {
  required_openness_min?: number | null;
  required_openness_max?: number | null;
  required_conscientiousness_min?: number | null;
  required_conscientiousness_max?: number | null;
  required_extraversion_min?: number | null;
  required_extraversion_max?: number | null;
  required_agreeableness_min?: number | null;
  required_agreeableness_max?: number | null;
  required_neuroticism_min?: number | null;
  required_neuroticism_max?: number | null;
  work_style?: string | null;
}

export interface CompatibilityResult {
  trait_match_score: number;
  culture_match_score: number;
  work_style_score: number;
  communication_score: number;
  overall_match_score: number;
  breakdown: Record<string, number>;
}

/**
 * Python's round(): ties go to the nearest even integer. Math.round sends
 * every .5 up, which would drift from the backend on exact halves.
 */
export function pyRound(x: number): number {
  const floor = Math.floor(x);
  if (x - floor === 0.5) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(x);
}

export const CULTURE_OCEAN_MAP: Record<string, Partial<Record<OceanTrait, number>>> = {
  innovation: { openness: 0.8, conscientiousness: -0.2 },
  transparency: { extraversion: 0.3, agreeableness: 0.4 },
  collaboration: { extraversion: 0.5, agreeableness: 0.7 },
  autonomy: { openness: 0.4, extraversion: -0.3 },
  growth: { openness: 0.6, conscientiousness: 0.4 },
  impact: { conscientiousness: 0.5, openness: 0.3 },
  balance: { neuroticism: -0.5, conscientiousness: 0.2 },
  diversity: { openness: 0.7, agreeableness: 0.5 },
  customer: { conscientiousness: 0.4, agreeableness: 0.3 },
  excellence: { conscientiousness: 0.8 },
  agility: { openness: 0.5, conscientiousness: -0.1 },
  integrity: { conscientiousness: 0.5, agreeableness: 0.4 },
  creativity: { openness: 0.9 },
  stability: { conscientiousness: 0.6, neuroticism: -0.4 },
  speed: { openness: 0.3, conscientiousness: -0.2 },
  quality: { conscientiousness: 0.8, openness: 0.2 },
  mission: { conscientiousness: 0.4, agreeableness: 0.5 },
  empathy: { agreeableness: 0.9 },
  risk: { openness: 0.6, neuroticism: -0.3 },
  trust: { agreeableness: 0.6, conscientiousness: 0.3 },
};

function preference(employer: EmployerPreferences, trait: OceanTrait): number {
  return employer[`${trait}_preference` as const];
}

function roleBound(role: RoleRequirements, trait: OceanTrait, side: 'min' | 'max'): number | null {
  return role[`required_${trait}_${side}` as const] ?? null;
}

export function calculateTraitMatch(
  candidate: CandidateOCEAN,
  employer: EmployerPreferences,
): [number, Record<string, number>] {
  const breakdown: Record<string, number> = {};
  let sumSqDiff = 0;

  for (const trait of OCEAN_TRAITS) {
    const diff = Math.abs(candidate[trait] - preference(employer, trait));
    const fit = Math.max(0, 100 - diff);
    breakdown[`${trait}_fit`] = pyRound(fit);
    sumSqDiff += diff ** 2;
  }

  const maxPossible = 5 * 100 ** 2;
  const distanceRatio = Math.sqrt(sumSqDiff) / Math.sqrt(maxPossible);
  const score = Math.max(0, Math.min(100, (1 - distanceRatio) * 100));
  return [pyRound(score), breakdown];
}

export function calculateRoleFit(
  candidate: CandidateOCEAN,
  role: RoleRequirements,
): [number, Record<string, number>] {
  const scores: number[] = [];
  const breakdown: Record<string, number> = {};

  for (const trait of OCEAN_TRAITS) {
    const minVal = roleBound(role, trait, 'min');
    const maxVal = roleBound(role, trait, 'max');
    const candidateVal = candidate[trait];

    if (minVal === null && maxVal === null) {
      scores.push(100);
      breakdown[`${trait}_role_fit`] = 100;
      continue;
    }

    const effectiveMin = minVal ?? 0;
    const effectiveMax = maxVal ?? 100;

    if (effectiveMin <= candidateVal && candidateVal <= effectiveMax) {
      scores.push(100);
      breakdown[`${trait}_role_fit`] = 100;
    } else {
      const distance = Math.min(
        Math.abs(candidateVal - effectiveMin),
        Math.abs(candidateVal - effectiveMax),
      );
      const penalty = Math.min(distance * 2, 100);
      const fit = Math.max(0, 100 - penalty);
      scores.push(fit);
      breakdown[`${trait}_role_fit`] = pyRound(fit);
    }
  }

  const overall = scores.length ? pyRound(sum(scores) / scores.length) : 50;
  return [overall, breakdown];
}

export function calculateWorkStyleScore(
  candidateWorkStyle: string | null | undefined,
  role?: RoleRequirements | null,
): number {
  if (!candidateWorkStyle || !role || !role.work_style) return 75;

  const roleStyle = role.work_style;
  if (candidateWorkStyle === roleStyle) return 100;
  if (candidateWorkStyle === 'flexible' || roleStyle === 'flexible') return 85;
  if (
    (candidateWorkStyle === 'hybrid' && (roleStyle === 'remote' || roleStyle === 'onsite')) ||
    (roleStyle === 'hybrid' && (candidateWorkStyle === 'remote' || candidateWorkStyle === 'onsite'))
  ) {
    return 65;
  }
  return 40;
}

export function calculateCommunicationFit(
  candidate: CandidateOCEAN,
  employer: EmployerPreferences,
): number {
  const eDiff = Math.abs(candidate.extraversion - employer.extraversion_preference);
  const aDiff = Math.abs(candidate.agreeableness - employer.agreeableness_preference);
  const score = 100 - (eDiff * 0.55 + aDiff * 0.45);
  return pyRound(Math.max(0, Math.min(100, score)));
}

export function calculateCultureMatch(
  candidate: CandidateOCEAN,
  candidateWorkStyle: string | null | undefined,
  employer: EmployerPreferences,
  role?: RoleRequirements | null,
): [number, Record<string, number>] {
  const scores: number[] = [];
  const weights: number[] = [];
  const breakdown: Record<string, number> = {};

  const workStyleScore = calculateWorkStyleScore(candidateWorkStyle, role);
  scores.push(workStyleScore);
  weights.push(0.3);
  breakdown.work_style_fit = pyRound(workStyleScore);

  if (employer.culture_values.length) {
    const valueScores: number[] = [];
    for (const value of employer.culture_values) {
      const correlations = CULTURE_OCEAN_MAP[value.toLowerCase()];
      if (!correlations) continue;
      let alignment = 0;
      let count = 0;
      for (const [dim, weight] of Object.entries(correlations) as [OceanTrait, number][]) {
        const candidateVal = candidate[dim] ?? 50;
        alignment += weight > 0 ? candidateVal * Math.abs(weight) : (100 - candidateVal) * Math.abs(weight);
        count += Math.abs(weight);
      }
      if (count > 0) valueScores.push(alignment / count);
    }

    if (valueScores.length) {
      const valuesAvg = sum(valueScores) / valueScores.length;
      scores.push(valuesAvg);
      weights.push(0.5);
      breakdown.values_alignment = pyRound(valuesAvg);
    }
  }

  if (role) {
    const [roleFit, roleBreakdown] = calculateRoleFit(candidate, role);
    scores.push(roleFit);
    weights.push(0.2);
    breakdown.role_fit = roleFit;
    Object.assign(breakdown, roleBreakdown);
  }

  const totalWeight = sum(weights);
  const weightedSum = sum(scores.map((s, i) => s * weights[i]));
  return [pyRound(weightedSum / totalWeight), breakdown];
}

export function calculateOverallMatch(
  traitMatch: number,
  cultureMatch: number,
  workStyle: number,
  communication: number,
): number {
  return pyRound(traitMatch * 0.4 + cultureMatch * 0.3 + workStyle * 0.2 + communication * 0.1);
}

export function calculateConfidence(candidateData: Record<string, unknown>): number {
  let score = 0;

  const oceanFields = OCEAN_TRAITS.map((t) => `${t}_score`);
  if (oceanFields.every((f) => candidateData[f] !== null && candidateData[f] !== undefined)) {
    score += 40;
  }

  const profileFields = ['headline', 'bio', 'location'];
  const filled = profileFields.filter((f) => Boolean(candidateData[f])).length;
  score += pyRound((30 * filled) / profileFields.length);

  const assessmentFields = [
    'work_style_assessment_completed',
    'communication_assessment_completed',
    'values_assessment_completed',
    'leadership_assessment_completed',
  ];
  for (const f of assessmentFields) {
    if (candidateData[f]) score += 7;
  }

  return Math.min(100, score);
}

export interface ReverseContext {
  preferred_work_style?: string | null;
  preferred_company_size?: string | null;
  _employer_work_style?: string | null;
  _employer_company_size?: string | null;
  _ideal_cultures?: string[];
}

export function calculateReverseCompatibility(
  employer: EmployerPreferences,
  candidateData: ReverseContext,
): number {
  const scores: number[] = [];

  const preferredWs = candidateData.preferred_work_style;
  const employerWs = candidateData._employer_work_style;
  if (preferredWs && employerWs) {
    if (preferredWs === employerWs) scores.push(100);
    else if (preferredWs === 'flexible' || employerWs === 'flexible') scores.push(85);
    else if (preferredWs === 'hybrid' || employerWs === 'hybrid') scores.push(65);
    else scores.push(40);
  }

  const idealCultures = candidateData._ideal_cultures ?? [];
  const employerValues = employer.culture_values.map((v) => v.toLowerCase());
  if (idealCultures.length && employerValues.length) {
    const employerSet = new Set(employerValues);
    const overlap = new Set(idealCultures.filter((c) => employerSet.has(c))).size;
    const total = Math.max(idealCultures.length, 1);
    scores.push(pyRound(Math.min(100, (overlap / total) * 100 + 20)));
  }

  const preferredSize = candidateData.preferred_company_size;
  const employerSize = candidateData._employer_company_size;
  if (preferredSize && employerSize) {
    scores.push(preferredSize === employerSize ? 100 : 60);
  }

  if (!scores.length) return 65;
  return pyRound(sum(scores) / scores.length);
}

export function calculateCompatibility(
  candidate: CandidateOCEAN,
  employer: EmployerPreferences,
  candidateWorkStyle?: string | null,
  role?: RoleRequirements | null,
): CompatibilityResult {
  const [traitMatch, traitBreakdown] = calculateTraitMatch(candidate, employer);
  const [cultureMatch, cultureBreakdown] = calculateCultureMatch(candidate, candidateWorkStyle, employer, role);
  const workStyle = calculateWorkStyleScore(candidateWorkStyle, role);
  const communication = calculateCommunicationFit(candidate, employer);
  const overall = calculateOverallMatch(traitMatch, cultureMatch, workStyle, communication);

  return {
    trait_match_score: traitMatch,
    culture_match_score: cultureMatch,
    work_style_score: workStyle,
    communication_score: communication,
    overall_match_score: overall,
    breakdown: {
      ...traitBreakdown,
      ...cultureBreakdown,
      trait_match: traitMatch,
      culture_match: cultureMatch,
      work_style_score: workStyle,
      communication_score: communication,
    },
  };
}

// Left-to-right like Python's sum(), so float results match bit for bit.
function sum(values: number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}
