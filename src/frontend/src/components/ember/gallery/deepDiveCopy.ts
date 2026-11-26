/**
 * Copy for the Ember deep dive. The same screen serves both sides of a match:
 * a candidate reads about themselves in the second person, an employer reads
 * about the candidate in the third person ("Kwame scores higher than your
 * preference...").
 *
 * Dimensions arrive on the display scale, where the fifth trait is Stability
 * (100 - neuroticism). Anything that reasons about neuroticism converts first.
 */

export type Viewer = 'candidate' | 'employer';
export type TraitLevel = 'high' | 'mid' | 'low';

export interface DeepDiveDimension {
  name: string;
  candidateScore: number;
  employerPreference: number;
  fitScore: number;
}

type Trait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'stability';

export function getTraitLevel(score: number): TraitLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

export function getTraitLevelLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

// `you` is the candidate's own view; `them` takes any third-person subject
// ("Kwame", "Your ideal candidate"), so the employer reads it about someone else.
const TRAIT_COPY: Record<Trait, Record<TraitLevel, { you: string; them: (s: string) => string }>> = {
  openness: {
    high: {
      you: 'Highly creative and intellectually curious. You actively seek novel experiences, unconventional ideas, and abstract thinking.',
      them: (s) => `${s} is highly creative and intellectually curious, drawn to novel experiences, unconventional ideas and abstract thinking.`,
    },
    mid: {
      you: 'Balanced between innovation and pragmatism. You appreciate new ideas when they serve a clear purpose.',
      them: (s) => `${s} balances innovation and pragmatism, and values new ideas when they serve a clear purpose.`,
    },
    low: {
      you: 'Grounded and practical. You prefer proven methods, concrete plans, and steady incremental improvement.',
      them: (s) => `${s} is grounded and practical, preferring proven methods, concrete plans and steady incremental improvement.`,
    },
  },
  conscientiousness: {
    high: {
      you: 'Highly organized, disciplined, and goal-oriented. You set high standards and follow through systematically on commitments.',
      them: (s) => `${s} is highly organized, disciplined and goal-oriented, setting high standards and following through on commitments.`,
    },
    mid: {
      you: 'Moderately structured in your approach. You can plan ahead but also adapt when circumstances change unexpectedly.',
      them: (s) => `${s} is moderately structured: able to plan ahead, and to adapt when circumstances change.`,
    },
    low: {
      you: 'Flexible and spontaneous. You prefer to stay adaptable rather than follow rigid plans or strict schedules.',
      them: (s) => `${s} is flexible and spontaneous, preferring to stay adaptable rather than follow rigid plans or strict schedules.`,
    },
  },
  extraversion: {
    high: {
      you: 'Energetic, sociable, and assertive. You draw energy from interactions and naturally take initiative in group settings.',
      them: (s) => `${s} is energetic, sociable and assertive, draws energy from interaction and takes initiative in groups.`,
    },
    mid: {
      you: 'Comfortably social but also values independent work. You adjust your energy based on the situation.',
      them: (s) => `${s} is comfortably social but also values independent work, adjusting their energy to the situation.`,
    },
    low: {
      you: 'Reflective and independent. You do your best thinking alone and prefer deep one-on-one connections over large groups.',
      them: (s) => `${s} is reflective and independent, does their best thinking alone and prefers deep one-on-one connections to large groups.`,
    },
  },
  agreeableness: {
    high: {
      you: 'Empathetic, cooperative, and harmony-seeking. You prioritize team cohesion and naturally build trust.',
      them: (s) => `${s} is empathetic, cooperative and harmony-seeking, prioritizing team cohesion and building trust naturally.`,
    },
    mid: {
      you: 'Diplomatic but principled. You cooperate when possible but can push back when it matters.',
      them: (s) => `${s} is diplomatic but principled: cooperative where possible, willing to push back when it matters.`,
    },
    low: {
      you: "Direct, competitive, and results-focused. You prioritize outcomes and aren't afraid to challenge assumptions.",
      them: (s) => `${s} is direct, competitive and results-focused, prioritizing outcomes and willing to challenge assumptions.`,
    },
  },
  stability: {
    high: {
      you: 'Emotionally stable and resilient. You stay calm under pressure and recover quickly from setbacks.',
      them: (s) => `${s} is emotionally stable and resilient, staying calm under pressure and recovering quickly from setbacks.`,
    },
    mid: {
      you: 'Emotionally balanced. You handle typical workplace pressures well while staying attuned to your feelings.',
      them: (s) => `${s} is emotionally balanced, handling typical workplace pressure well while staying attuned to their feelings.`,
    },
    low: {
      you: 'Emotionally sensitive and deeply self-aware. You experience feelings intensely, fueling empathy but also stress.',
      them: (s) => `${s} is emotionally sensitive and self-aware, feeling things intensely, which fuels empathy but also stress.`,
    },
  },
};

const WORK_COPY: Record<Trait, Record<TraitLevel, string[]>> = {
  openness: {
    high: ['Thrives in creative and R&D environments', 'Generates novel solutions to complex problems', 'May need structure to channel creative energy'],
    mid: ['Adapts to both structured and creative work', 'Evaluates which ideas are worth pursuing', 'Bridges innovative and operational teams well'],
    low: ['Excels with established processes and SOPs', 'Strong attention to proven methodologies', 'Brings stability and consistency to teams'],
  },
  conscientiousness: {
    high: ['Excellent project management and follow-through', 'Consistently meets deadlines and quality standards', 'May find ambiguity or rapid pivots challenging'],
    mid: ['Balanced approach to planning vs. flexibility', 'Effective in both startup and corporate environments', 'Can lead structured projects or adapt to change'],
    low: ['Thrives in dynamic, fast-paced environments', 'Comfortable navigating ambiguity', 'May benefit from external accountability structures'],
  },
  extraversion: {
    high: ['Natural in client-facing and team leadership roles', 'Energizes team meetings and brainstorms', 'May need to practice active listening and patience'],
    mid: ['Versatile across collaborative and solo work', 'Adjusts communication style to context naturally', 'Effective in both presentations and written formats'],
    low: ['Excels in focused, deep analytical work', 'Strong written and async communicator', 'Thrives with remote-first or small-team setups'],
  },
  agreeableness: {
    high: ['Excellent mediator and team builder', 'Creates psychologically safe environments', 'May avoid necessary conflicts or tough feedback'],
    mid: ['Balances collaboration with assertiveness', 'Navigates office dynamics effectively', 'Gives and receives feedback constructively'],
    low: ['Strong negotiator and critical thinker', 'Comfortable making tough, unpopular decisions', 'Drives accountability and high performance standards'],
  },
  stability: {
    high: ['Thrives in high-pressure, fast-paced environments', 'Provides calm leadership during crises', 'May need to actively check in with team emotions'],
    mid: ['Handles normal workplace stress well', 'Appropriately responsive to challenges', 'Good emotional self-regulation in most situations'],
    low: ['Highly attuned to team dynamics and morale', 'May need robust stress management support', 'Brings emotional depth to decision-making'],
  },
};

const FLIP: Record<TraitLevel, TraitLevel> = { high: 'low', mid: 'mid', low: 'high' };

// A "Neuroticism" dimension reads as Stability at the mirrored level
function resolveTrait(dimName: string, level: TraitLevel): [Trait, TraitLevel] | null {
  const key = dimName.toLowerCase();
  if (key === 'neuroticism') return ['stability', FLIP[level]];
  return key in TRAIT_COPY ? [key as Trait, level] : null;
}

/**
 * How someone at this level of the trait comes across. `subject` is null for
 * the candidate's own view, otherwise the third-person subject to describe.
 */
export function describeTrait(dimName: string, score: number, subject: string | null): string | null {
  const resolved = resolveTrait(dimName, getTraitLevel(score));
  if (!resolved) return null;
  const copy = TRAIT_COPY[resolved[0]][resolved[1]];
  return subject === null ? copy.you : copy.them(subject);
}

export function workplaceNotes(dimName: string, score: number): string[] {
  const resolved = resolveTrait(dimName, getTraitLevel(score));
  return resolved ? WORK_COPY[resolved[0]][resolved[1]] : [];
}

/** How the candidate's score sits against the employer's preference. */
export function gapAnalysis(dim: DeepDiveDimension, viewer: Viewer, candidateName: string): string {
  const trait = dim.name.toLowerCase();
  const diff = dim.candidateScore - dim.employerPreference;
  const absDiff = Math.abs(diff);

  if (viewer === 'candidate') {
    if (absDiff <= 10) return `Your ${trait} level closely matches what's expected here. This is a natural fit area requiring minimal adjustment, so you can show up authentically.`;
    if (diff > 25) return `You score significantly higher in ${trait} than the role typically calls for. While this intensity can be an asset in the right context, it may feel misaligned with the team's baseline.`;
    if (diff > 10) return `You score somewhat higher in ${trait} than what's typically expected. This can be a strength since you bring more energy here, but be mindful of calibrating to team norms.`;
    if (absDiff <= 25) return `The role expects slightly more ${trait} than your natural level. With awareness and intentional effort, this gap is easily bridgeable.`;
    return `There's a notable gap where the role demands more ${trait} than your natural tendency. Consider whether this stretch energizes or drains you long-term.`;
  }

  const name = firstName(candidateName);
  if (absDiff <= 10) return `${name}'s ${trait} closely matches your preference. This is a natural fit area that should need little adjustment.`;
  if (diff > 25) return `${name} scores well above your preference on ${trait}. That can be an asset in the right context, but may feel out of step with the team's baseline.`;
  if (diff > 10) return `${name} scores higher than your preference on ${trait}. That can bring extra energy here; check how it fits your team's norms.`;
  if (absDiff <= 25) return `${name} scores a little below your preference on ${trait}. A gap this size is usually easy to bridge with clear expectations.`;
  return `${name} scores well below your preference on ${trait}. Consider whether the role really needs this much, or whether it would be a long-term stretch for ${name}.`;
}

export interface TraitInsight {
  title: string;
  description: string;
}

/**
 * Notable trait combinations, read from the candidate's scores. The fifth
 * dimension may be named Stability or Neuroticism; both are converted to
 * neuroticism here, so a calm candidate never reads as "emotionally sensitive".
 */
export function traitCombinations(dimensions: DeepDiveDimension[], viewer: Viewer, candidateName: string): TraitInsight[] {
  const score = (name: string) => dimensions.find((d) => d.name.toLowerCase() === name)?.candidateScore;
  const o = score('openness');
  const c = score('conscientiousness');
  const e = score('extraversion');
  const a = score('agreeableness');
  const stability = score('stability');
  const n = score('neuroticism') ?? (stability === undefined ? undefined : 100 - stability);

  const name = firstName(candidateName);
  const pick = (you: string, them: string) => (viewer === 'candidate' ? you : them);
  const insights: TraitInsight[] = [];
  const add = (when: boolean, title: string, you: string, them: string) => {
    if (when) insights.push({ title, description: pick(you, them) });
  };

  const has = (...values: (number | undefined)[]) => values.every((v) => v !== undefined);
  const [O, C, E, A, N] = [o ?? 0, c ?? 0, e ?? 0, a ?? 0, n ?? 0];

  add(has(o, c) && O >= 70 && C >= 70, 'Creative discipline',
    'You combine creativity with discipline, allowing you to both generate innovative ideas and execute on them reliably. This is a rare and valuable combination.',
    `${name} combines creativity with discipline, so can both generate new ideas and execute on them reliably. It's a rare and valuable combination.`);
  add(has(o, c) && O >= 70 && C < 40, 'Unstructured creativity',
    'Your creative energy is strong, but you may start many projects without finishing them. Pairing with structured teammates or using project management tools can help.',
    `${name} has strong creative energy but may start more projects than they finish. Structured teammates or clear milestones help.`);
  add(has(e, a) && E >= 70 && A >= 70, 'Natural team builder',
    "You're a natural team player and relationship builder. People trust you and enjoy working with you. Be mindful of saying yes too often.",
    `${name} is a natural team player and relationship builder who earns trust quickly. Watch for a tendency to say yes too often.`);
  add(has(e, a) && E >= 70 && A < 40, 'Assertive driver',
    "You're assertive and outspoken. You're effective at driving decisions but may need to watch how you deliver critical feedback.",
    `${name} is assertive and outspoken: effective at driving decisions, though critical feedback may land harder than intended.`);
  add(has(c, n) && C >= 70 && N >= 70, 'Perfectionist tendencies',
    'Your high standards combined with emotional sensitivity can lead to perfectionism and self-criticism. Build in breaks and celebrate small wins.',
    `${name}'s high standards combined with emotional sensitivity can tip into perfectionism and self-criticism. Regular check-ins and recognizing small wins help.`);
  add(has(e, n) && E < 40 && N < 40, 'Calm independent',
    "You're a calm, independent thinker. You excel in deep-focus roles and bring stability to teams, but make sure to stay visible and communicate your contributions.",
    `${name} is a calm, independent thinker who excels in deep-focus work and steadies a team. Make sure their contributions stay visible.`);
  add(has(o, a) && O >= 70 && A >= 70, 'Empathetic innovator',
    "You're empathetic and imaginative, great at understanding diverse perspectives and creating inclusive solutions.",
    `${name} is empathetic and imaginative, good at understanding diverse perspectives and creating inclusive solutions.`);
  add(has(c, e) && C >= 70 && E >= 70, 'Organized leader',
    "You're a driven, organized communicator, natural for leadership roles where you need to rally teams around structured goals.",
    `${name} is a driven, organized communicator, suited to leading teams around structured goals.`);

  if (insights.length === 0) {
    insights.push({
      title: 'Balanced profile',
      description: pick(
        'Your personality traits create a balanced profile without extreme combinations. This gives you flexibility to adapt to various work environments and team dynamics.',
        `${name}'s traits form a balanced profile without extreme combinations, which makes it easier to adapt to different environments and teams.`,
      ),
    });
  }
  return insights;
}

/**
 * The employer's summary and recommendation for a candidate. The Ember API
 * writes these to the candidate ("As The Architect, you..."), so the employer
 * view builds its own from the same score bands.
 */
export function employerMatchSummary(candidateName: string, archetypeName: string | undefined, score: number): [string, string] {
  const name = firstName(candidateName);
  const who = archetypeName ? `${name} (${archetypeName})` : name;
  if (score >= 85) {
    return [
      `${who} is an excellent fit for your team. ${name}'s personality lines up naturally with the culture you described.`,
      'Highly recommended: a natural match for your environment.',
    ];
  }
  if (score >= 70) {
    return [
      `${who} is a strong match for your team. Most traits align with your preferences, with a few areas where ${name} would bring a different perspective.`,
      'Recommended: likely to fit well with some natural adaptation.',
    ];
  }
  if (score >= 55) {
    return [
      `${who} is a reasonable match for your team. There are some gaps against your preferences, which could also add diversity of thought.`,
      'Worth a conversation: the differences could work either way.',
    ];
  }
  return [
    `${who} differs noticeably from the culture you described. That doesn't rule ${name} out, but expect more adjustment on both sides.`,
    'Proceed thoughtfully: this match needs more adaptation than usual.',
  ];
}
