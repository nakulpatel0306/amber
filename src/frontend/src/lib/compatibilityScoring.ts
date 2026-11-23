/**
 * Compatibility Scoring for Project Amber (TypeScript)
 *
 * Camel-cased adapter over lib/ember, the line-for-line port of the backend's
 * engine/compatibility.py. Components score matches client-side through this
 * module, so their numbers are the same ones the FastAPI endpoints return.
 */
import { calculateCompatibility as scoreWithEngine } from './ember/compatibility';

export interface OCEANScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface EmployerPreferences extends OCEANScores {
  cultureValues?: string[];
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

export interface CompatibilityInput {
  candidateOCEAN: OCEANScores;
  employerPreferences: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    cultureValues?: string[];
  };
  candidateWorkStyle?: string;
  roleWorkStyle?: string;
  roleRequirements?: RoleRequirements;
}

export interface CompatibilityResult {
  traitMatchScore: number;
  cultureMatchScore: number;
  overallMatchScore: number;
  breakdown: {
    opennessFit: number;
    conscientiousnessFit: number;
    extraversionFit: number;
    agreeablenessFit: number;
    neuroticismFit: number;
    workStyleFit: number;
    valuesFit: number;
    roleFit?: number;
  };
}

/**
 * Calculate full compatibility between a candidate and employer/role.
 *
 * A bare roleWorkStyle is treated as a role with no trait ranges, which is how
 * the backend scores a role that only sets its work style.
 */
export function calculateCompatibility(input: CompatibilityInput): CompatibilityResult {
  const { candidateOCEAN, employerPreferences, candidateWorkStyle, roleRequirements, roleWorkStyle } = input;

  const role: RoleRequirements | null = roleRequirements
    ? { ...roleRequirements, work_style: roleRequirements.work_style ?? roleWorkStyle ?? null }
    : roleWorkStyle
      ? { work_style: roleWorkStyle }
      : null;

  const result = scoreWithEngine(
    candidateOCEAN,
    {
      openness_preference: employerPreferences.openness,
      conscientiousness_preference: employerPreferences.conscientiousness,
      extraversion_preference: employerPreferences.extraversion,
      agreeableness_preference: employerPreferences.agreeableness,
      neuroticism_preference: employerPreferences.neuroticism,
      culture_values: employerPreferences.cultureValues ?? [],
    },
    candidateWorkStyle,
    role,
  );
  const b = result.breakdown;

  return {
    traitMatchScore: result.trait_match_score,
    cultureMatchScore: result.culture_match_score,
    overallMatchScore: result.overall_match_score,
    breakdown: {
      opennessFit: b.openness_fit,
      conscientiousnessFit: b.conscientiousness_fit,
      extraversionFit: b.extraversion_fit,
      agreeablenessFit: b.agreeableness_fit,
      neuroticismFit: b.neuroticism_fit,
      workStyleFit: b.work_style_fit,
      // The engine omits values_alignment when no known culture values are set
      valuesFit: b.values_alignment ?? 75,
      roleFit: b.role_fit,
    },
  };
}
