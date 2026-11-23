import { describe, expect, it } from 'vitest';
import { candidateQuestions } from '../data/assessmentQuestions';
import { PersonalityEngine, type AssessmentResponse } from './personalityEngine';
import { ARCHETYPES, determineArchetype, getArchetypeByName } from './archetypes';
import { calculateCompatibility } from './compatibilityScoring';
import { calculateCompatibility as engineCompatibility, pyRound } from './ember/compatibility';

function answerAll(pick: (optionCount: number) => number, slider: number): PersonalityEngine {
  const engine = new PersonalityEngine();
  for (const q of candidateQuestions) {
    const response: AssessmentResponse = { questionId: q.id, timestamp: 0 };
    const options = q.options ?? [];
    if (q.type === 'slider') response.sliderValue = slider;
    else if (q.type === 'ranking') response.rankingOrder = options.map((o) => o.id);
    else if (q.type === 'reflection') response.reflectionText = 'a considered answer';
    else response.answerId = options[pick(options.length)]?.id;
    engine.processResponse(response, { type: q.type, options: q.options, sliderConfig: q.sliderConfig });
  }
  return engine;
}

describe('personality scoring', () => {
  it('keeps every OCEAN score within 0-100', () => {
    const profile = answerAll(() => 0, 100).generateCandidateProfile('u1');
    for (const value of Object.values(profile.ocean)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('is deterministic for the same answers', () => {
    const a = answerAll((n) => n - 1, 30).calculateOCEAN();
    const b = answerAll((n) => n - 1, 30).calculateOCEAN();
    expect(a).toEqual(b);
  });

  it('starts at the midpoint with no answers and resets cleanly', () => {
    const engine = answerAll(() => 0, 90);
    engine.reset();
    expect(engine.calculateOCEAN()).toEqual({
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    });
  });

  it('moves scores when answers change', () => {
    const first = answerAll(() => 0, 95).calculateOCEAN();
    const last = answerAll((n) => n - 1, 5).calculateOCEAN();
    expect(first).not.toEqual(last);
  });
});

describe('archetypes', () => {
  it('defines all eight with display metadata', () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(8);
    for (const a of Object.values(ARCHETYPES)) {
      expect(a.strengths.length).toBeGreaterThan(0);
      expect(getArchetypeByName(a.name)?.key).toBe(a.key);
    }
  });

  it('classifies with the backend algorithm', () => {
    expect(determineArchetype({ openness: 90, conscientiousness: 30, extraversion: 50, agreeableness: 50, neuroticism: 50 }).key).toBe('the_innovator');
    expect(determineArchetype({ openness: 50, conscientiousness: 50, extraversion: 90, agreeableness: 90, neuroticism: 50 }).key).toBe('the_connector');
    expect(determineArchetype({ openness: 90, conscientiousness: 90, extraversion: 10, agreeableness: 50, neuroticism: 50 }).key).toBe('the_craftsperson');
  });

  it('returns null for unknown names', () => {
    expect(getArchetypeByName('The Wizard')).toBeNull();
  });
});

describe('compatibility adapter', () => {
  const candidate = { openness: 80, conscientiousness: 45, extraversion: 60, agreeableness: 72, neuroticism: 30 };
  const employer = { openness: 90, conscientiousness: 55, extraversion: 70, agreeableness: 70, neuroticism: 40, cultureValues: ['innovation', 'collaboration'] };

  it('matches the ported engine number for number', () => {
    const adapted = calculateCompatibility({
      candidateOCEAN: candidate,
      employerPreferences: employer,
      candidateWorkStyle: 'hybrid',
      roleRequirements: { required_openness_min: 75, required_openness_max: 100, work_style: 'remote' },
    });
    const raw = engineCompatibility(
      candidate,
      {
        openness_preference: 90,
        conscientiousness_preference: 55,
        extraversion_preference: 70,
        agreeableness_preference: 70,
        neuroticism_preference: 40,
        culture_values: ['innovation', 'collaboration'],
      },
      'hybrid',
      { required_openness_min: 75, required_openness_max: 100, work_style: 'remote' },
    );
    expect(adapted.overallMatchScore).toBe(raw.overall_match_score);
    expect(adapted.traitMatchScore).toBe(raw.trait_match_score);
    expect(adapted.cultureMatchScore).toBe(raw.culture_match_score);
    expect(adapted.breakdown.workStyleFit).toBe(65);
  });

  it('treats a bare role work style as a role without ranges', () => {
    const result = calculateCompatibility({ candidateOCEAN: candidate, employerPreferences: employer, candidateWorkStyle: 'remote', roleWorkStyle: 'remote' });
    expect(result.breakdown.workStyleFit).toBe(100);
    expect(result.breakdown.roleFit).toBe(100);
  });

  it('falls back to 75 for values when none are known', () => {
    const result = calculateCompatibility({ candidateOCEAN: candidate, employerPreferences: { ...employer, cultureValues: [] } });
    expect(result.breakdown.valuesFit).toBe(75);
  });
});

describe('pyRound', () => {
  it('rounds halves to even like Python', () => {
    expect([0.5, 1.5, 2.5, 3.5, -0.5, -1.5, 2.4, 2.6].map(pyRound)).toEqual([0, 2, 2, 4, 0, -2, 2, 3]);
  });
});
