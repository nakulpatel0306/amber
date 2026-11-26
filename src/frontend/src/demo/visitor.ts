/**
 * Visitor setup for the demo: fills in the new account's profile, gives it a
 * little history to explore (a past coffee chat to rate, one coming up, an incoming request
 * to answer), and provides the "skip with a sample profile" shortcuts.
 */
import { PRESETS } from '../components/landing/kestrel';
import { determineEmployerArchetype } from '../data/employerArchetypes';
import { determineArchetype } from '../lib/ember/agent';
import type { CandidateOCEAN } from '../lib/ember/compatibility';
import { cultureEngine, personalityEngine } from '../lib/personalityEngine';
import { createConnection } from './backend';
import { nextWeekdayMorning, sendAutoMessage, weekdayAt } from './autoReply';
import { SEED_IDS } from './seed';
import { findOne, insertRow, updateRow, type Row } from './store';

export type DemoRole = 'candidate' | 'employer';

export const VISITOR_NAME = 'Demo Visitor';

// Short enough to fit the sidebar; the random part keeps a second visitor in the same browser from colliding
export function visitorEmail(role: DemoRole): string {
  return `${role === 'candidate' ? 'seeker' : 'team'}.${Math.random().toString(36).slice(2, 6)}@example.com`;
}

function profileOf(key: string): Row {
  return findOne('profiles', (p) => p.id === SEED_IDS.profile(key)) as Row;
}

/**
 * A scheduled chat with one of the seeded people. One in the past is still
 * waiting for the visitor's feedback; one ahead shows up as upcoming.
 */
function seedChat(scheduledAt: string, values: Record<string, unknown>, partner: Row, partnerMessage: string): void {
  const chat = insertRow('coffee_chats', {
    status: 'scheduled',
    scheduled_at: scheduledAt,
    duration_minutes: 30,
    meeting_link: null,
    created_at: new Date(new Date(scheduledAt).getTime() - 4 * 24 * 3600_000).toISOString(),
    ...values,
  });
  sendAutoMessage(chat.id, partner, partnerMessage);
}

/** Fill in the new candidate account and give it something to explore. */
function prepareCandidate(userId: string): void {
  const candidate = findOne('candidates', (c) => c.user_id === userId) as Row;
  updateRow('candidates', candidate.id, {
    headline: 'Software Developer',
    bio: 'Trying out Amber. Everything here is stored in this browser only.',
    location: 'Toronto, ON',
    years_experience: 3,
    preferred_work_style: 'hybrid',
    preferred_company_size: 'small',
    hobbies: ['hiking', 'board games'],
    setup_step: 4,
    setup_completed_at: new Date().toISOString(),
  });

  seedChat(
    weekdayAt(-3, 14),
    {
      candidate_id: candidate.id,
      employer_id: SEED_IDS.employer('fernleaf'),
      initiated_by: 'employer',
      message: 'Loved your profile. Want to grab a virtual coffee?',
      company_name: 'Fernleaf Health',
      candidate_name: VISITOR_NAME,
      role_id: 'seed-role-fernleaf-1',
      role_title: 'Product Designer',
    },
    profileOf('fernleaf'),
    'Thanks again for our chat! If you have a minute, leave feedback on how it went.',
  );

  seedChat(
    weekdayAt(1, 14),
    {
      candidate_id: candidate.id,
      employer_id: SEED_IDS.employer('kestrel'),
      initiated_by: 'candidate',
      message: 'Your studio work is lovely. I would like to hear how designers and producers split the work.',
      company_name: 'Kestrel Studio',
      candidate_name: VISITOR_NAME,
      role_id: 'seed-role-kestrel-1',
      role_title: 'Brand Designer',
    },
    profileOf('kestrel'),
    'Booked! I will bring a couple of recent briefs so you can see how a project moves through the studio.',
  );

  void createConnection(SEED_IDS.profile('brightline'), {
    receiver_id: userId,
    sender_role: 'employer',
    message: 'We are a tiny team that ships daily. Your profile caught our eye. Coffee this week?',
    sender_name: 'Priya Nair',
    receiver_name: VISITOR_NAME,
    sender_company: 'Brightline Labs',
    meet_invite: { proposed_times: [nextWeekdayMorning(1), nextWeekdayMorning(2)], duration_minutes: 30 },
    role_id: 'seed-role-brightline-1',
    role_title: 'Founding Engineer',
  });
}

/** Fill in the new employer account with a company and two open roles. */
function prepareEmployer(userId: string): void {
  const employer = findOne('employers', (e) => e.user_id === userId) as Row;
  updateRow('employers', employer.id, {
    company_name: 'Lumen Works',
    description: 'A made-up company for trying the employer side of Amber. Edit anything you like.',
    industry: 'Software',
    company_size: '11-50',
    location: 'Toronto, ON',
    company_website: null,
    setup_step: 4,
    setup_completed_at: new Date().toISOString(),
  });

  const roles: [string, string, Record<string, number | null>][] = [
    ['Senior Frontend Engineer', 'hybrid', { required_openness_min: 60, required_openness_max: 95, required_conscientiousness_min: 65, required_conscientiousness_max: 95 }],
    ['Customer Success Lead', 'remote', { required_extraversion_min: 60, required_extraversion_max: 100, required_agreeableness_min: 70, required_agreeableness_max: 100 }],
  ];
  const [frontendRole] = roles.map(([title, workStyle, ranges], i) =>
    insertRow('roles', {
      employer_id: employer.id,
      title,
      description: `Sample role ${i + 1} for the demo company.`,
      requirements: [],
      nice_to_have: [],
      location: 'Toronto, ON',
      work_style: workStyle,
      salary_min: 95000 + i * 5000,
      salary_max: 130000 - i * 10000,
      employment_type: 'full_time',
      status: 'active',
      required_extraversion_min: null,
      required_extraversion_max: null,
      required_agreeableness_min: null,
      required_agreeableness_max: null,
      required_neuroticism_min: null,
      required_neuroticism_max: null,
      required_openness_min: null,
      required_openness_max: null,
      required_conscientiousness_min: null,
      required_conscientiousness_max: null,
      ...ranges,
    }),
  );

  const owen = profileOf('candidate-16');
  seedChat(
    weekdayAt(-3, 14),
    {
      candidate_id: SEED_IDS.candidate(15),
      employer_id: employer.id,
      initiated_by: 'candidate',
      message: 'Hi! I would love to hear how your team handles on-call.',
      company_name: 'Lumen Works',
      candidate_name: owen.full_name,
      role_id: frontendRole.id,
      role_title: frontendRole.title,
    },
    owen,
    'Thanks for the time the other day. Curious what you thought!',
  );

  const samir = profileOf('candidate-14');
  seedChat(
    weekdayAt(1, 14),
    {
      candidate_id: SEED_IDS.candidate(13),
      employer_id: employer.id,
      initiated_by: 'employer',
      message: 'Your one-pager habit caught our eye. Coffee to talk about how we plan?',
      company_name: 'Lumen Works',
      candidate_name: samir.full_name,
    },
    samir,
    'Sounds good, see you then. I will come with questions about how roadmaps get decided.',
  );

  void createConnection(SEED_IDS.profile('candidate-1'), {
    receiver_id: userId,
    sender_role: 'candidate',
    message: 'Your culture profile reads a lot like how I work. Open to a quick chat?',
    sender_name: 'Aisha Rahman',
    receiver_name: VISITOR_NAME,
    receiver_company: 'Lumen Works',
    meet_invite: { proposed_times: [nextWeekdayMorning(1), nextWeekdayMorning(3)], duration_minutes: 30 },
  });
}

export function prepareVisitor(userId: string, role: DemoRole): void {
  // The scoring engines are module singletons; a second visitor in the same tab starts clean
  personalityEngine.reset();
  cultureEngine.reset();
  if (role === 'candidate') prepareCandidate(userId);
  else prepareEmployer(userId);
}

const OCEAN_KEYS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;

/**
 * A sample persona: one of the landing's archetype profiles with a little
 * jitter. Random answers scored through the engine average out near 60 on
 * every trait, which makes every match look alike; a profile with clear peaks
 * shows the spread the matching is meant to produce.
 */
function samplePersona(keys: string[]): { key: string; ocean: CandidateOCEAN } {
  const pool = PRESETS.filter((p) => keys.includes(p.key));
  const preset = pool[Math.floor(Math.random() * pool.length)];
  const ocean = { ...preset.ocean };
  OCEAN_KEYS.forEach((k) => {
    ocean[k] = Math.max(0, Math.min(100, ocean[k] + Math.round(Math.random() * 6 - 3)));
  });
  return { key: preset.key, ocean };
}

// The other archetype profiles either top out below a strong (80+) match with every seeded company (Catalyst,
// Connector, Craftsperson) or score them all within a few points of each other (Explorer)
const CANDIDATE_PERSONAS = ['the_innovator', 'the_architect', 'the_harmonizer', 'the_strategist'];

/** Complete the assessment with a sample persona, saving the fields the assessment page saves on finish. */
export function completeSampleAssessment(userId: string): void {
  const { ocean } = samplePersona(CANDIDATE_PERSONAS);
  const now = new Date().toISOString();
  insertRow('assessments', {
    user_id: userId,
    assessment_type: 'candidate_personality',
    responses: {},
    started_at: now,
    completed_at: now,
  });
  const candidate = findOne('candidates', (c) => c.user_id === userId) as Row;
  updateRow('candidates', candidate.id, {
    openness_score: ocean.openness,
    conscientiousness_score: ocean.conscientiousness,
    extraversion_score: ocean.extraversion,
    agreeableness_score: ocean.agreeableness,
    neuroticism_score: ocean.neuroticism,
    top_traits: [determineArchetype(ocean).name],
    assessment_status: 'completed',
    assessment_completed_at: now,
  });
}

// The culture quiz ranks these six values; each persona keeps the three that fit it. A Catalyst culture is left
// out because no seeded candidate reaches a strong match with it
const CULTURE_VALUES: Record<string, string[]> = {
  the_innovator: ['innovation', 'growth', 'collaboration'],
  the_connector: ['collaboration', 'integrity', 'growth'],
  the_architect: ['excellence', 'integrity', 'results'],
  the_harmonizer: ['collaboration', 'integrity', 'excellence'],
  the_craftsperson: ['excellence', 'integrity', 'results'],
  the_explorer: ['innovation', 'growth', 'excellence'],
  the_strategist: ['excellence', 'growth', 'results'],
};

/** Give the employer a sample culture, saved to the fields CultureAssessment saves. */
export function applySampleCulture(userId: string): void {
  const { key, ocean } = samplePersona(Object.keys(CULTURE_VALUES));
  const now = new Date().toISOString();
  insertRow('assessments', {
    user_id: userId,
    assessment_type: 'employer_culture',
    responses: {},
    started_at: now,
    completed_at: now,
  });
  const employer = findOne('employers', (e) => e.user_id === userId) as Row;
  updateRow('employers', employer.id, {
    openness_preference: ocean.openness,
    conscientiousness_preference: ocean.conscientiousness,
    extraversion_preference: ocean.extraversion,
    agreeableness_preference: ocean.agreeableness,
    neuroticism_preference: ocean.neuroticism,
    culture_values: CULTURE_VALUES[key],
    // The Ember score adds the archetype-pair bonus only for employers with a stored archetype, as seeded ones have
    archetype_name: determineEmployerArchetype(ocean).primary.name,
    culture_quiz_completed: true,
  });
}

