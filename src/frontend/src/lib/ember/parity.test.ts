/**
 * Runs the TypeScript Ember port against tests/fixtures/ember-parity.json, the
 * same file src/backend/tests/test_parity.py checks the Python engine against.
 * Regenerate it with src/backend/scripts/generate_parity_fixture.py.
 */
import { describe, expect, it } from 'vitest';
import fixture from '../../../../../tests/fixtures/ember-parity.json';
import {
  calculateCompatibility,
  type CandidateOCEAN,
  type EmployerPreferences,
  type RoleRequirements,
} from './compatibility';
import {
  determineArchetype,
  runEmberAnalysis,
  runEmberEmployerAnalysis,
  type CandidateRow,
  type EmployerRow,
  type RoleRow,
} from './agent';

type Row = Record<string, unknown>;

const TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;

function ocean(row: Row): CandidateOCEAN {
  return Object.fromEntries(TRAITS.map((t) => [t, row[`${t}_score`]])) as unknown as CandidateOCEAN;
}

function prefs(row: Row): EmployerPreferences {
  return {
    ...(Object.fromEntries(TRAITS.map((t) => [`${t}_preference`, row[`${t}_preference`]])) as object),
    culture_values: row.culture_values as string[],
  } as EmployerPreferences;
}

// JSON round-trip drops undefined keys the same way Python's json.dumps never had them
const json = (value: unknown) => JSON.parse(JSON.stringify(value));

describe('Ember parity with the Python backend', () => {
  it.each(fixture.cases.map((c) => [c.candidate.id, c] as const))('compatibility %s', (_id, c) => {
    const result = calculateCompatibility(
      ocean(c.candidate),
      prefs(c.employer),
      c.candidate.preferred_work_style,
      c.role as RoleRequirements | null,
    );
    expect(json(result)).toEqual(c.compatibility);
  });

  it.each(fixture.cases.map((c) => [c.candidate.id, c] as const))('ember analysis %s', (_id, c) => {
    const analysis = runEmberAnalysis(
      c.candidate as unknown as CandidateRow,
      c.employer as unknown as EmployerRow,
      c.role as RoleRow | null,
    );
    expect(json(analysis)).toEqual(c.analysis);
  });

  it('archetype classification', () => {
    for (const entry of fixture.archetypes) {
      expect(json(determineArchetype(entry.ocean))).toEqual(entry.archetype);
    }
  });

  it('employer rankings', () => {
    for (const entry of fixture.rankings) {
      const ranking = runEmberEmployerAnalysis(
        entry.employer as unknown as EmployerRow,
        entry.candidates as unknown as CandidateRow[],
        entry.role as RoleRow | null,
      );
      expect(json(ranking)).toEqual(entry.ranking);
    }
  });
});
