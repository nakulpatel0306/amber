interface PersonalityFact {
  title: string;
  description: string;
  source: string;
  relevantTraits: string[];
}

const ALL_FACTS: PersonalityFact[] = [
  {
    title: 'Conscientiousness travels well',
    description: 'In a meta-analysis of 117 studies, conscientiousness predicted job performance in every occupational group examined.',
    source: 'Barrick & Mount, Personnel Psychology, 1991',
    relevantTraits: ['conscientiousness'],
  },
  {
    title: 'Openness helps people learn',
    description: 'The same meta-analysis found openness to experience was a useful predictor of training proficiency.',
    source: 'Barrick & Mount, Personnel Psychology, 1991',
    relevantTraits: ['openness'],
  },
  {
    title: 'Openness and creative work',
    description: 'Across studies of scientists and artists, creative people scored higher on openness to experience.',
    source: 'Feist, Personality and Social Psychology Review, 1998',
    relevantTraits: ['openness'],
  },
  {
    title: 'Extraversion and leadership',
    description: 'Of the Big Five, extraversion was the most consistent correlate of leadership emergence and effectiveness.',
    source: 'Judge, Bono, Ilies & Gerhardt, Journal of Applied Psychology, 2002',
    relevantTraits: ['extraversion'],
  },
  {
    title: 'Extraversion in people-facing roles',
    description: 'Extraversion predicted performance for managers and salespeople, jobs built on frequent interaction.',
    source: 'Barrick & Mount, Personnel Psychology, 1991',
    relevantTraits: ['extraversion'],
  },
  {
    title: 'Agreeableness and teamwork',
    description: 'Agreeableness mattered more for performance in jobs that depend on teamwork than in jobs that do not.',
    source: 'Mount, Barrick & Stewart, Human Performance, 1998',
    relevantTraits: ['agreeableness'],
  },
  {
    title: 'Stability under pressure',
    description: 'Emotional stability predicted job performance across occupations in European samples.',
    source: 'Salgado, Journal of Applied Psychology, 1997',
    relevantTraits: ['neuroticism'],
  },
  {
    title: 'Fit shows up in commitment',
    description: 'Person-organization fit correlated .51 with organizational commitment and -.35 with intent to quit.',
    source: 'Kristof-Brown, Zimmerman & Johnson, Personnel Psychology, 2005',
    relevantTraits: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'],
  },
];

export function getFactsForProfile(
  scores: Record<string, number>,
  count: number = 3
): PersonalityFact[] {
  // Find the dominant traits (top 2)
  const sortedTraits = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait.toLowerCase());

  // Filter facts relevant to dominant traits
  const relevantFacts = ALL_FACTS.filter(fact =>
    fact.relevantTraits.some(trait => sortedTraits.includes(trait))
  );

  // Shuffle and return requested count
  const shuffled = [...relevantFacts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAllFacts(): PersonalityFact[] {
  return ALL_FACTS;
}
