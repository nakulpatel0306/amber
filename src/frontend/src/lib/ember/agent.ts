/**
 * Ember agent, ported from src/backend/agent/ember_agent.py.
 *
 * Classifies a profile into one of 8 archetypes, runs the compatibility engine,
 * applies the archetype-pair bonus and writes the insight copy. Output keys are
 * the same snake_case keys the FastAPI endpoints return, so a demo build can
 * serve these objects in place of the backend and the UI cannot tell.
 */
import { getArchetypeCompatibility, type CompatibilityEntry } from '../archetypeCompatibility';
import {
  calculateCompatibility,
  calculateConfidence,
  calculateReverseCompatibility,
  pyRound,
  type CandidateOCEAN,
  type CompatibilityResult,
  type EmployerPreferences,
  type OceanTrait,
  type RoleRequirements,
} from './compatibility';

type Level = 'low' | 'low-mid' | 'mid' | 'mid-high' | 'high';

export interface EmberArchetype {
  key: string;
  name: string;
  emoji: string;
  description: string;
  ocean_signature: Partial<Record<OceanTrait, Level>>;
  ideal_cultures: string[];
  confidence: number;
}

type ArchetypeDefinition = Omit<EmberArchetype, 'key' | 'confidence'>;

export const PERSONALITY_ARCHETYPES: Record<string, ArchetypeDefinition> = {
  the_innovator: {
    name: 'The Innovator',
    emoji: 'lightbulb',
    description: 'Creative thinker who thrives on new ideas and unconventional approaches',
    ocean_signature: { openness: 'high', conscientiousness: 'low-mid' },
    ideal_cultures: ['innovation', 'creativity', 'risk', 'agility'],
  },
  the_architect: {
    name: 'The Architect',
    emoji: 'layers',
    description: 'Systematic builder who creates order and reliable structures',
    ocean_signature: { conscientiousness: 'high', openness: 'mid' },
    ideal_cultures: ['excellence', 'quality', 'stability', 'integrity'],
  },
  the_connector: {
    name: 'The Connector',
    emoji: 'heart',
    description: 'Natural relationship builder who brings people together',
    ocean_signature: { extraversion: 'high', agreeableness: 'high' },
    ideal_cultures: ['collaboration', 'empathy', 'trust', 'diversity'],
  },
  the_catalyst: {
    name: 'The Catalyst',
    emoji: 'zap',
    description: 'Bold leader who drives change and pushes boundaries',
    ocean_signature: { extraversion: 'high', openness: 'high', agreeableness: 'low' },
    ideal_cultures: ['speed', 'autonomy', 'growth', 'impact'],
  },
  the_craftsperson: {
    name: 'The Craftsperson',
    emoji: 'target',
    description: 'Detail-oriented perfectionist who delivers exceptional quality',
    ocean_signature: { conscientiousness: 'high', extraversion: 'low' },
    ideal_cultures: ['quality', 'excellence', 'stability', 'integrity'],
  },
  the_harmonizer: {
    name: 'The Harmonizer',
    emoji: 'music',
    description: 'Empathetic mediator who creates balance and team cohesion',
    ocean_signature: { agreeableness: 'high', neuroticism: 'low' },
    ideal_cultures: ['collaboration', 'empathy', 'balance', 'mission'],
  },
  the_explorer: {
    name: 'The Explorer',
    emoji: 'compass',
    description: 'Curious adventurer who adapts quickly and embraces change',
    ocean_signature: { openness: 'high', neuroticism: 'low' },
    ideal_cultures: ['innovation', 'autonomy', 'risk', 'growth'],
  },
  the_strategist: {
    name: 'The Strategist',
    emoji: 'brain',
    description: 'Analytical thinker who sees the big picture and plans ahead',
    ocean_signature: { conscientiousness: 'high', openness: 'mid-high' },
    ideal_cultures: ['excellence', 'growth', 'impact', 'quality'],
  },
};

const LEVEL_ORDER: Level[] = ['low', 'low-mid', 'mid', 'mid-high', 'high'];

export function classifyLevel(score: number): Level {
  if (score >= 80) return 'high';
  if (score >= 60) return 'mid-high';
  if (score >= 40) return 'mid';
  if (score >= 20) return 'low-mid';
  return 'low';
}

export function determineArchetype(ocean: CandidateOCEAN): EmberArchetype {
  let best: EmberArchetype | null = null;
  let bestScore = -1;

  for (const [key, archetype] of Object.entries(PERSONALITY_ARCHETYPES)) {
    let matchScore = 0;
    let count = 0;

    for (const [trait, expected] of Object.entries(archetype.ocean_signature) as [OceanTrait, Level][]) {
      const actual = classifyLevel(ocean[trait]);
      count += 1;
      // "low-mid" accepts either half, mirroring Python's expected_level.split('-')
      const expectedParts = expected.includes('-') ? expected.split('-') : [expected];

      if (expectedParts.includes(actual) || actual === expected) {
        matchScore += 10;
      } else {
        const actualIdx = LEVEL_ORDER.indexOf(actual);
        const distances = expectedParts
          .filter((e): e is Level => LEVEL_ORDER.includes(e as Level))
          .map((e) => Math.abs(actualIdx - LEVEL_ORDER.indexOf(e)));
        const bestExpectedIdx = distances.length ? Math.min(...distances) : 2;
        matchScore += Math.max(0, 10 - bestExpectedIdx * 3);
      }
    }

    const normalized = matchScore / Math.max(count, 1);
    if (normalized > bestScore) {
      bestScore = normalized;
      best = { ...archetype, key, confidence: pyRound(normalized * 10) };
    }
  }

  return best as EmberArchetype;
}

export interface EmberInsight {
  category: 'strength' | 'caution' | 'tip' | 'highlight';
  message: string;
  trait_related: OceanTrait | null;
  score_impact: 'positive' | 'negative' | 'neutral' | null;
}

export interface DimensionAnalysis {
  name: string;
  candidate_score: number;
  employer_preference: number;
  fit_score: number;
  gap: number;
  direction: 'above' | 'below';
  in_role_range: boolean;
  role_range: [number, number] | null;
}

export function generateDimensionAnalysis(
  candidate: CandidateOCEAN,
  employer: EmployerPreferences,
  role?: RoleRequirements | null,
): DimensionAnalysis[] {
  const dims: { name: string; candidate_score: number; employer_preference: number; trait: OceanTrait }[] = [
    { name: 'Openness', candidate_score: candidate.openness, employer_preference: employer.openness_preference, trait: 'openness' },
    { name: 'Conscientiousness', candidate_score: candidate.conscientiousness, employer_preference: employer.conscientiousness_preference, trait: 'conscientiousness' },
    { name: 'Extraversion', candidate_score: candidate.extraversion, employer_preference: employer.extraversion_preference, trait: 'extraversion' },
    { name: 'Agreeableness', candidate_score: candidate.agreeableness, employer_preference: employer.agreeableness_preference, trait: 'agreeableness' },
    // Shown inverted as "Emotional Stability" because that reads better than low neuroticism
    { name: 'Emotional Stability', candidate_score: 100 - candidate.neuroticism, employer_preference: 100 - employer.neuroticism_preference, trait: 'neuroticism' },
  ];

  return dims.map((dim) => {
    const diff = Math.abs(dim.candidate_score - dim.employer_preference);
    let inRoleRange = true;
    let roleRange: [number, number] | null = null;

    if (role) {
      const minVal = role[`required_${dim.trait}_min` as const] ?? null;
      const maxVal = role[`required_${dim.trait}_max` as const] ?? null;
      if (minVal !== null || maxVal !== null) {
        const actual = candidate[dim.trait];
        const effectiveMin = minVal ?? 0;
        const effectiveMax = maxVal ?? 100;
        inRoleRange = effectiveMin <= actual && actual <= effectiveMax;
        roleRange = [effectiveMin, effectiveMax];
      }
    }

    return {
      name: dim.name,
      candidate_score: dim.candidate_score,
      employer_preference: dim.employer_preference,
      fit_score: Math.max(0, 100 - diff),
      gap: diff,
      direction: dim.candidate_score > dim.employer_preference ? 'above' : 'below',
      in_role_range: inRoleRange,
      role_range: roleRange,
    };
  });
}

function insight(
  category: EmberInsight['category'],
  message: string,
  trait_related: OceanTrait | null = null,
  score_impact: EmberInsight['score_impact'] = null,
): EmberInsight {
  return { category, message, trait_related, score_impact };
}

export function generateInsights(
  candidate: CandidateOCEAN,
  employer: EmployerPreferences,
  archetype: EmberArchetype,
  cultureValues: string[],
  compatibility?: CompatibilityResult,
): EmberInsight[] {
  const insights: EmberInsight[] = [];
  const values = cultureValues.map((v) => v.toLowerCase());

  if (candidate.openness >= 75 && values.includes('innovation')) {
    insights.push(insight('strength', "Your creative thinking aligns perfectly with this company's innovation focus", 'openness', 'positive'));
  }
  if (candidate.conscientiousness >= 80 && values.includes('excellence')) {
    insights.push(insight('strength', 'Your attention to detail and reliability match their pursuit of excellence', 'conscientiousness', 'positive'));
  }
  if (candidate.extraversion >= 75 && values.includes('collaboration')) {
    insights.push(insight('strength', 'Your collaborative energy fits their team-oriented culture', 'extraversion', 'positive'));
  }
  if (candidate.agreeableness >= 80 && values.includes('empathy')) {
    insights.push(insight('strength', 'Your empathetic nature resonates with their people-first values', 'agreeableness', 'positive'));
  }
  if (candidate.neuroticism <= 30) {
    insights.push(insight('strength', 'Your emotional stability is a strong asset for high-pressure environments', 'neuroticism', 'positive'));
  }

  const oDiff = Math.abs(candidate.openness - employer.openness_preference);
  if (oDiff > 25) {
    const direction = candidate.openness > employer.openness_preference ? 'more creative' : 'more structured';
    insights.push(insight('caution', `You tend to be ${direction} than what this role typically calls for - be ready to adapt`, 'openness', 'negative'));
  }

  const cDiff = Math.abs(candidate.conscientiousness - employer.conscientiousness_preference);
  if (cDiff > 25) {
    const direction = candidate.conscientiousness > employer.conscientiousness_preference ? 'more detail-oriented' : 'more flexible';
    insights.push(insight('caution', `You're ${direction} than typical for this team - this could be complementary or challenging`, 'conscientiousness', 'negative'));
  }

  const eDiff = Math.abs(candidate.extraversion - employer.extraversion_preference);
  if (eDiff > 30) {
    const direction = candidate.extraversion > employer.extraversion_preference ? 'more social' : 'more introverted';
    insights.push(insight('caution', `You're ${direction} than the team norm - consider how this affects daily collaboration`, 'extraversion', 'negative'));
  }

  const employerCulture = new Set(values);
  const shared = [...new Set(archetype.ideal_cultures)].filter((c) => employerCulture.has(c)).sort();
  if (shared.length >= 2) {
    insights.push(insight('highlight', `Your "${archetype.name}" personality naturally aligns with their values: ${shared.join(', ')}`, null, 'positive'));
  }

  if (archetype.key === 'the_innovator' && employerCulture.has('stability')) {
    insights.push(insight('tip', 'As an Innovator in a stability-focused company, frame your ideas as building on existing foundations', null, 'neutral'));
  } else if (archetype.key === 'the_craftsperson' && employerCulture.has('speed')) {
    insights.push(insight('tip', 'Your quality focus is valuable, but this team moves fast - find the balance between polish and pace', null, 'neutral'));
  } else if (archetype.key === 'the_connector' && employerCulture.has('autonomy')) {
    insights.push(insight('tip', 'Your collaborative style is great, but this culture values independence - lead by connecting, not directing', null, 'neutral'));
  }

  if (compatibility) {
    const overall = compatibility.overall_match_score;
    if (overall >= 85) {
      insights.push(insight('highlight', 'This is an exceptional personality match - your natural traits align strongly with this culture', null, 'positive'));
    } else if (overall >= 70) {
      insights.push(insight('highlight', "Solid compatibility - you'd likely feel comfortable and contribute effectively here", null, 'positive'));
    } else if (overall < 50) {
      insights.push(insight('tip', "This match has some personality gaps - but diversity of thought can be valuable if you're adaptable", null, 'neutral'));
    }
  }

  return insights.slice(0, 8);
}

export function generateSummary(
  archetype: EmberArchetype,
  compatibility: CompatibilityResult,
  companyName: string,
  roleTitle?: string | null,
): [string, string] {
  const score = compatibility.overall_match_score;
  const name = archetype.name;
  const context = roleTitle ? `the ${roleTitle} role at ${companyName}` : companyName;

  if (score >= 85) {
    return [
      `As ${name}, you're an excellent fit for ${context}. Your personality naturally aligns with their culture, and you'd likely thrive there.`,
      'Highly recommended - your personality is a natural match for this environment.',
    ];
  }
  if (score >= 70) {
    return [
      `As ${name}, you have strong compatibility with ${context}. Most of your traits align well, with a few areas where you'd bring complementary perspectives.`,
      "Recommended - you'd fit well here with some natural adaptation.",
    ];
  }
  if (score >= 55) {
    return [
      `As ${name}, you have decent alignment with ${context}. There are some personality gaps, but they could bring valuable diversity of thought.`,
      'Worth exploring - some personality differences could be growth opportunities.',
    ];
  }
  return [
    `As ${name}, ${context} may require significant personality adaptation. This doesn't mean it's wrong for you, but be prepared for some cultural adjustments.`,
    'Proceed thoughtfully - this match requires more adaptation than usual.',
  ];
}

/** Loose row shapes: the same dicts the backend reads from Supabase. */
export type CandidateRow = Record<string, unknown> & {
  id?: string;
  openness_score?: number | null;
  conscientiousness_score?: number | null;
  extraversion_score?: number | null;
  agreeableness_score?: number | null;
  neuroticism_score?: number | null;
  preferred_work_style?: string | null;
  preferred_company_size?: string | null;
  headline?: string | null;
  location?: string | null;
  profiles?: { full_name?: string | null; email?: string | null } | null;
};

export type EmployerRow = Record<string, unknown> & {
  company_name?: string;
  company_size?: string | null;
  culture_values?: string[] | null;
  archetype_name?: string | null;
  openness_preference?: number | null;
  conscientiousness_preference?: number | null;
  extraversion_preference?: number | null;
  agreeableness_preference?: number | null;
  neuroticism_preference?: number | null;
};

export type RoleRow = RoleRequirements & Record<string, unknown> & { title?: string };

export interface EmberAnalysis {
  overall_score: number;
  trait_match_score: number;
  culture_match_score: number;
  work_style_score: number;
  communication_score: number;
  confidence_score: number;
  reverse_score: number;
  archetype_compatibility: CompatibilityEntry;
  candidate_archetype: EmberArchetype;
  breakdown: Record<string, number>;
  insights: EmberInsight[];
  ember_summary: string;
  ember_recommendation: string;
  dimension_analysis: DimensionAnalysis[];
}

export function candidateOceanFromRow(row: CandidateRow): CandidateOCEAN {
  return {
    openness: row.openness_score || 50,
    conscientiousness: row.conscientiousness_score || 50,
    extraversion: row.extraversion_score || 50,
    agreeableness: row.agreeableness_score || 50,
    neuroticism: row.neuroticism_score || 50,
  };
}

export function employerPreferencesFromRow(row: EmployerRow): EmployerPreferences {
  return {
    openness_preference: row.openness_preference || 50,
    conscientiousness_preference: row.conscientiousness_preference || 50,
    extraversion_preference: row.extraversion_preference || 50,
    agreeableness_preference: row.agreeableness_preference || 50,
    neuroticism_preference: row.neuroticism_preference || 50,
    culture_values: row.culture_values || [],
  };
}

function roleRequirementsFromRow(row: RoleRow): RoleRequirements {
  return {
    required_openness_min: row.required_openness_min ?? null,
    required_openness_max: row.required_openness_max ?? null,
    required_conscientiousness_min: row.required_conscientiousness_min ?? null,
    required_conscientiousness_max: row.required_conscientiousness_max ?? null,
    required_extraversion_min: row.required_extraversion_min ?? null,
    required_extraversion_max: row.required_extraversion_max ?? null,
    required_agreeableness_min: row.required_agreeableness_min ?? null,
    required_agreeableness_max: row.required_agreeableness_max ?? null,
    required_neuroticism_min: row.required_neuroticism_min ?? null,
    required_neuroticism_max: row.required_neuroticism_max ?? null,
    work_style: row.work_style ?? null,
  };
}

export function runEmberAnalysis(
  candidateData: CandidateRow,
  employerData: EmployerRow,
  roleData?: RoleRow | null,
): EmberAnalysis {
  const candidate = candidateOceanFromRow(candidateData);
  const employer = employerPreferencesFromRow(employerData);
  const role = roleData ? roleRequirementsFromRow(roleData) : null;

  const compatibility = calculateCompatibility(candidate, employer, candidateData.preferred_work_style, role);
  const archetype = determineArchetype(candidate);
  const archCompat = getArchetypeCompatibility(archetype.key, employerData.archetype_name || '');
  const confidence = calculateConfidence(candidateData);

  const reverseScore = calculateReverseCompatibility(employer, {
    preferred_work_style: candidateData.preferred_work_style,
    preferred_company_size: candidateData.preferred_company_size,
    _employer_work_style: roleData ? (roleData.work_style ?? null) : null,
    _employer_company_size: employerData.company_size ?? null,
    _ideal_cultures: archetype.ideal_cultures,
  });

  const dimensions = generateDimensionAnalysis(candidate, employer, role);
  const insights = generateInsights(candidate, employer, archetype, employerData.culture_values || [], compatibility);
  const [summary, recommendation] = generateSummary(
    archetype,
    compatibility,
    employerData.company_name ?? 'this company',
    roleData?.title ?? null,
  );

  return {
    overall_score: Math.max(0, Math.min(100, compatibility.overall_match_score + archCompat.bonus)),
    trait_match_score: compatibility.trait_match_score,
    culture_match_score: compatibility.culture_match_score,
    work_style_score: compatibility.work_style_score,
    communication_score: compatibility.communication_score,
    confidence_score: confidence,
    reverse_score: reverseScore,
    archetype_compatibility: archCompat,
    candidate_archetype: archetype,
    breakdown: compatibility.breakdown,
    insights,
    ember_summary: summary,
    ember_recommendation: recommendation,
    dimension_analysis: dimensions,
  };
}

export interface EmberCandidateRanking {
  candidate_id: string | undefined;
  candidate_name: string;
  candidate_email: string;
  candidate_headline: string;
  candidate_location: string;
  candidate_archetype: EmberArchetype;
  overall_score: number;
  trait_match_score: number;
  culture_match_score: number;
  breakdown: Record<string, number>;
  top_insights: EmberInsight[];
  ember_summary: string;
}

export function runEmberEmployerAnalysis(
  employerData: EmployerRow,
  candidates: CandidateRow[],
  roleData?: RoleRow | null,
): EmberCandidateRanking[] {
  const results = candidates.map((candidateData) => {
    const profile = candidateData.profiles ?? {};
    const analysis = runEmberAnalysis(candidateData, employerData, roleData);
    return {
      candidate_id: candidateData.id,
      candidate_name: profile.full_name || 'Unknown',
      candidate_email: profile.email || '',
      candidate_headline: candidateData.headline || '',
      candidate_location: candidateData.location || '',
      candidate_archetype: analysis.candidate_archetype,
      overall_score: analysis.overall_score,
      trait_match_score: analysis.trait_match_score,
      culture_match_score: analysis.culture_match_score,
      breakdown: analysis.breakdown,
      top_insights: analysis.insights.slice(0, 3),
      ember_summary: analysis.ember_summary,
    };
  });

  // Array.prototype.sort is stable, like Python's list.sort
  results.sort((a, b) => b.overall_score - a.overall_score);
  return results;
}
