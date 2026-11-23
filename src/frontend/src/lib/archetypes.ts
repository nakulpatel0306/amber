/**
 * Personality Archetypes for Project Amber
 *
 * Display metadata (strengths, environments) for the 8 archetypes. The
 * classification itself comes from lib/ember, the port of the backend's
 * determine_archetype, so the archetype a user sees in the UI is the same one
 * the Ember API reports.
 */
import { determineArchetype as classify } from './ember/agent';

export interface Archetype {
  key: string;
  name: string;
  emoji: string;
  description: string;
  strengths: string[];
  idealEnvironments: string[];
  idealCultures: string[];
}

export const ARCHETYPES: Record<string, Archetype> = {
  the_innovator: {
    key: 'the_innovator',
    name: 'The Innovator',
    emoji: 'lightbulb',
    description: 'Creative thinker who thrives on new ideas and unconventional solutions',
    strengths: ['Creative problem-solving', 'Adaptability', 'Visionary thinking'],
    idealEnvironments: ['Startups', 'R&D teams', 'Creative agencies'],
    idealCultures: ['Innovation', 'Creativity', 'Risk', 'Agility'],
  },
  the_architect: {
    key: 'the_architect',
    name: 'The Architect',
    emoji: 'layers',
    description: 'Systematic builder who creates order from complexity',
    strengths: ['Organization', 'Process design', 'Quality assurance'],
    idealEnvironments: ['Engineering teams', 'Operations', 'Project management'],
    idealCultures: ['Excellence', 'Quality', 'Stability', 'Integrity'],
  },
  the_connector: {
    key: 'the_connector',
    name: 'The Connector',
    emoji: 'heart',
    description: 'Natural relationship builder who brings people together',
    strengths: ['Networking', 'Team building', 'Communication'],
    idealEnvironments: ['Sales', 'HR', 'Community management'],
    idealCultures: ['Collaboration', 'Empathy', 'Trust', 'Diversity'],
  },
  the_catalyst: {
    key: 'the_catalyst',
    name: 'The Catalyst',
    emoji: 'zap',
    description: 'Bold leader who drives change and inspires action',
    strengths: ['Leadership', 'Strategic thinking', 'Influence'],
    idealEnvironments: ['Management', 'Consulting', 'Entrepreneurship'],
    idealCultures: ['Speed', 'Autonomy', 'Growth', 'Impact'],
  },
  the_craftsperson: {
    key: 'the_craftsperson',
    name: 'The Craftsperson',
    emoji: 'target',
    description: 'Detail-oriented perfectionist who takes pride in quality work',
    strengths: ['Precision', 'Deep expertise', 'Reliability'],
    idealEnvironments: ['Specialized roles', 'Research', 'Technical writing'],
    idealCultures: ['Quality', 'Excellence', 'Stability', 'Integrity'],
  },
  the_harmonizer: {
    key: 'the_harmonizer',
    name: 'The Harmonizer',
    emoji: 'music',
    description: 'Empathetic mediator who creates balance and resolves conflict',
    strengths: ['Conflict resolution', 'Empathy', 'Team cohesion'],
    idealEnvironments: ['Support roles', 'Counseling', 'Team leads'],
    idealCultures: ['Collaboration', 'Empathy', 'Balance', 'Mission'],
  },
  the_explorer: {
    key: 'the_explorer',
    name: 'The Explorer',
    emoji: 'compass',
    description: 'Curious adventurer who adapts quickly and embraces the unknown',
    strengths: ['Adaptability', 'Curiosity', 'Resilience'],
    idealEnvironments: ['Travel', 'Consulting', 'Diverse teams'],
    idealCultures: ['Innovation', 'Autonomy', 'Risk', 'Growth'],
  },
  the_strategist: {
    key: 'the_strategist',
    name: 'The Strategist',
    emoji: 'brain',
    description: 'Analytical thinker who plans ahead and sees the big picture',
    strengths: ['Analysis', 'Planning', 'Decision-making'],
    idealEnvironments: ['Strategy', 'Analytics', 'Finance'],
    idealCultures: ['Excellence', 'Growth', 'Impact', 'Quality'],
  },
};

interface OCEANInput {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

/**
 * Classify a profile into an archetype. Confidence is how closely the scores
 * match the archetype's OCEAN signature (0-100).
 */
export function determineArchetype(ocean: OCEANInput): Archetype & { confidence: number } {
  const { key, confidence } = classify(ocean);
  return { ...ARCHETYPES[key], confidence };
}

/**
 * Look up an archetype by its display name (e.g., "The Innovator")
 */
export function getArchetypeByName(name: string): Archetype | null {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return ARCHETYPES[key] || null;
}
