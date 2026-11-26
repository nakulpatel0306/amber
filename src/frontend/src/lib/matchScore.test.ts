import { describe, expect, it } from 'vitest';
import fixture from '../../../../tests/fixtures/ember-parity.json';
import { runEmberAnalysis, type CandidateRow, type EmployerRow, type RoleRow } from './ember/agent';
import { scoreMatchFromRows } from './matchScore';

describe('displayed match score', () => {
  it.each(fixture.cases.map((c) => [c.candidate.id, c] as const))('equals the Ember score for %s', (_id, c) => {
    const shown = scoreMatchFromRows(c.candidate, c.employer, c.role);
    const ember = runEmberAnalysis(c.candidate as unknown as CandidateRow, c.employer as unknown as EmployerRow, c.role as RoleRow | null);
    expect(shown.overallMatchScore).toBe(ember.overall_score);
    expect(shown.archetypeBonus).toBe(ember.archetype_compatibility.bonus);
  });

  it('applies no bonus without a stored employer archetype, like the backend', () => {
    const c = fixture.cases[0];
    const employer = { ...c.employer, archetype_name: null };
    const shown = scoreMatchFromRows(c.candidate, employer, null);
    expect(shown.archetypeBonus).toBe(0);
    expect(shown.overallMatchScore).toBe(shown.baseScore);
  });
});
