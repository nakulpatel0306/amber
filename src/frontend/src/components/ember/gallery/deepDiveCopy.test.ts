import { describe, expect, it } from 'vitest';
import { describeTrait, employerMatchSummary, gapAnalysis, traitCombinations, type DeepDiveDimension } from './deepDiveCopy';

const dims = (o: number, c: number, e: number, a: number, stability: number): DeepDiveDimension[] =>
  [
    ['Openness', o],
    ['Conscientiousness', c],
    ['Extraversion', e],
    ['Agreeableness', a],
    ['Stability', stability],
  ].map(([name, score]) => ({ name: name as string, candidateScore: score as number, employerPreference: 50, fitScore: 80 }));

const titles = (d: DeepDiveDimension[]) => traitCombinations(d, 'candidate', 'Kwame Mensah').map((i) => i.title);

describe('trait combinations', () => {
  it('treats high stability as calm, not emotionally sensitive', () => {
    expect(titles(dims(50, 80, 50, 50, 74))).not.toContain('Perfectionist tendencies');
    expect(titles(dims(50, 50, 30, 50, 74))).toContain('Calm independent');
  });

  it('flags perfectionism only when stability is low', () => {
    expect(titles(dims(50, 80, 50, 50, 20))).toContain('Perfectionist tendencies');
    expect(titles(dims(50, 50, 30, 50, 20))).not.toContain('Calm independent');
  });

  it('accepts a raw neuroticism dimension too', () => {
    const neuro = dims(50, 80, 50, 50, 0).map((d) => (d.name === 'Stability' ? { ...d, name: 'Neuroticism', candidateScore: 80 } : d));
    expect(titles(neuro)).toContain('Perfectionist tendencies');
  });
});

describe('viewer-aware copy', () => {
  const openness: DeepDiveDimension = { name: 'Openness', candidateScore: 85, employerPreference: 65, fitScore: 70 };

  it('speaks to the candidate in the second person', () => {
    expect(gapAnalysis(openness, 'candidate', 'Kwame Mensah')).toMatch(/^You score/);
    expect(describeTrait('Openness', 55, null)).toMatch(/You appreciate new ideas/);
  });

  it('describes the candidate to the employer in the third person', () => {
    const gap = gapAnalysis(openness, 'employer', 'Kwame Mensah');
    expect(gap).toBe("Kwame scores higher than your preference on openness. That can bring extra energy here; check how it fits your team's norms.");
    expect(describeTrait('Openness', 55, 'Kwame')).toMatch(/^Kwame balances/);
    const combos = traitCombinations(dims(80, 80, 50, 50, 50), 'employer', 'Kwame Mensah');
    for (const text of [gap, ...combos.map((c) => c.description), ...employerMatchSummary('Kwame Mensah', 'The Architect', 82)]) {
      expect(text).not.toMatch(/\b(you're|you have|your personality)\b/i);
    }
  });

  it('reads a low stability score as emotional sensitivity', () => {
    expect(describeTrait('Stability', 20, null)).toMatch(/Emotionally sensitive/);
    expect(describeTrait('Stability', 80, null)).toMatch(/Emotionally stable/);
    expect(describeTrait('Neuroticism', 80, null)).toMatch(/Emotionally sensitive/);
  });
});
