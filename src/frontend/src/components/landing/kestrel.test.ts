import { describe, expect, it } from 'vitest';
import { determineArchetype } from '../../lib/ember/agent';
import { PRESETS, scoreAgainstKestrel } from './kestrel';

describe('hero presets', () => {
  it('cover all eight archetypes, each classifying as labelled', () => {
    expect(new Set(PRESETS.map((p) => p.key)).size).toBe(8);
    PRESETS.forEach((p) => expect(determineArchetype(p.ocean).key).toBe(p.key));
  });

  it('keeps the explainer default at the 97 the landing quotes', () => {
    expect(scoreAgainstKestrel(PRESETS[0].ocean).ember).toBe(97);
  });
});
