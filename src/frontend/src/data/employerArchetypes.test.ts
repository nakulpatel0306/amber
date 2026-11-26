import { describe, expect, it } from 'vitest';
import { determineEmployerArchetype, employerCultureArchetype, employerCultureArchetypes } from './employerArchetypes';

const row = (o: number, c: number, e: number, a: number, n: number, archetype_name?: string) => ({
  openness_preference: o,
  conscientiousness_preference: c,
  extraversion_preference: e,
  agreeableness_preference: a,
  neuroticism_preference: n,
  archetype_name,
});

describe('employer culture archetypes', () => {
  it('names different archetypes for different culture profiles', () => {
    const names = [
      row(90, 50, 60, 55, 35), // open, exploratory
      row(40, 90, 45, 65, 35), // process and quality
      row(55, 65, 75, 90, 45), // people first
      row(55, 80, 85, 40, 30), // results driven
      row(30, 75, 45, 65, 20), // steady
    ].map((r) => employerCultureArchetype(r).name);

    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(['The Innovator', 'The Optimizer', 'The Collaborator', 'The Driver', 'The Stabilizer']);
  });

  it('reads neuroticism, not stability', () => {
    // Only neuroticism differs: a very calm preference tips Optimizer into Stabilizer
    const base = { openness: 40, conscientiousness: 78, extraversion: 45, agreeableness: 65 };
    expect(determineEmployerArchetype({ ...base, neuroticism: 12 }).primary.name).toBe('The Stabilizer');
    expect(determineEmployerArchetype({ ...base, neuroticism: 48 }).primary.name).toBe('The Optimizer');
  });

  it('prefers the stored archetype, which drives the Ember bonus', () => {
    const kestrel = row(90, 55, 70, 70, 40, 'The Collaborator');
    const ranked = employerCultureArchetypes(kestrel);
    expect(ranked.primary.name).toBe('The Collaborator');
    expect([ranked.secondary.name, ranked.tertiary.name]).not.toContain('The Collaborator');
    expect(employerCultureArchetype({ ...kestrel, archetype_name: null }).name).not.toBe('The Collaborator');
  });
});
