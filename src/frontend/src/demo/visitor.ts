/**
 * Visitor setup for the demo: fills in the new account's profile, gives it a
 * little history to explore (a past coffee chat to rate, an incoming request
 * to answer), and provides the "skip with sample answers" shortcuts.
 */
import {
  candidateQuestions,
  employerQuestions,
  type AssessmentQuestion,
} from '../data/assessmentQuestions';
import { cultureEngine, personalityEngine, type AssessmentResponse } from '../lib/personalityEngine';
import { createConnection } from './backend';
import { nextWeekdayMorning, sendAutoMessage } from './autoReply';
import { SEED_IDS } from './seed';
import { findOne, insertRow, updateRow, type Row } from './store';

export type DemoRole = 'candidate' | 'employer';

export const VISITOR_NAME = 'Demo Visitor';

// Short enough to fit the sidebar; the random part keeps a second visitor in the same browser from colliding
export function visitorEmail(role: DemoRole): string {
  return `${role === 'candidate' ? 'seeker' : 'team'}.${Math.random().toString(36).slice(2, 6)}@example.com`;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function profileOf(key: string): Row {
  return findOne('profiles', (p) => p.id === SEED_IDS.profile(key)) as Row;
}

function pastChat(values: Record<string, unknown>, partner: Row, lines: [string, string][]): void {
  const chat = insertRow('coffee_chats', {
    status: 'scheduled',
    scheduled_at: hoursAgo(26),
    duration_minutes: 30,
    meeting_link: null,
    created_at: hoursAgo(80),
    ...values,
  });
  lines.forEach(([who, text]) => {
    if (who === 'partner') sendAutoMessage(chat.id, partner, text);
  });
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

  const fernleaf = profileOf('fernleaf');
  pastChat(
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
    fernleaf,
    [['partner', 'Thanks again for the chat yesterday! If you have a minute, leave feedback on how it went.']],
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
  roles.forEach(([title, workStyle, ranges], i) => {
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
    });
  });

  const owen = profileOf('candidate-16');
  pastChat(
    {
      candidate_id: SEED_IDS.candidate(15),
      employer_id: employer.id,
      initiated_by: 'candidate',
      message: 'Hi! I would love to hear how your team handles on-call.',
      company_name: 'Lumen Works',
      candidate_name: owen.full_name,
    },
    owen,
    [['partner', 'Thanks for the time yesterday. Curious what you thought!']],
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

/**
 * A random persona: a set of facet traits it leans into. Picking answers that
 * favour those facets gives a distinct profile, where uniformly random answers
 * would average out near 50 on every trait.
 */
function makePersona(questions: AssessmentQuestion[], random: () => number): Set<string> {
  const facets = new Set<string>();
  questions.forEach((q) => {
    q.options?.forEach((o) => Object.keys(o.traitScores).forEach((t) => facets.add(t)));
    if (q.sliderConfig) facets.add(q.sliderConfig.trait);
  });
  return new Set([...facets].filter(() => random() < 0.4));
}

function sampleResponse(question: AssessmentQuestion, random: () => number, persona: Set<string>): AssessmentResponse {
  const response: AssessmentResponse = { questionId: question.id, timestamp: Date.now() };
  const options = question.options ?? [];
  const appeal = (o: (typeof options)[number]) =>
    Object.entries(o.traitScores).reduce((sum, [trait, score]) => sum + (persona.has(trait) ? score : 0), 0) + random() * 20;

  if (question.type === 'slider') {
    const leansIn = persona.has(question.sliderConfig?.trait ?? '');
    response.sliderValue = Math.round(leansIn ? 70 + random() * 25 : 10 + random() * 30);
  } else if (question.type === 'ranking') {
    response.rankingOrder = [...options].sort((a, b) => appeal(b) - appeal(a)).map((o) => o.id);
  } else if (question.type === 'reflection') {
    response.reflectionText = 'A sample answer written by the demo, standing in for your own words.';
  } else {
    response.answerId = [...options].sort((a, b) => appeal(b) - appeal(a))[0]?.id;
  }
  return response;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function toAnswer(response: AssessmentResponse): Record<string, unknown> {
  if (response.sliderValue !== undefined) return { value: response.sliderValue };
  if (response.rankingOrder) return { order: response.rankingOrder };
  if (response.reflectionText) return { text: response.reflectionText };
  return { selected: response.answerId };
}

/**
 * Pre-answer every question but the last with a random persona. The real
 * assessment page resumes in-progress sessions, so the visitor lands on the
 * final question and finishing it runs the normal scoring and save path.
 */
export function fillSampleAssessment(userId: string): void {
  const random = seededRandom(Date.now());
  const persona = makePersona(candidateQuestions, random);
  const assessment = insertRow('assessments', {
    user_id: userId,
    assessment_type: 'candidate_personality',
    started_at: new Date().toISOString(),
    completed_at: null,
  });
  candidateQuestions.slice(0, -1).forEach((question) => {
    insertRow('assessment_responses', {
      assessment_id: assessment.id,
      user_id: userId,
      question_code: question.id,
      answer: toAnswer(sampleResponse(question, random, persona)),
      answered_at: new Date().toISOString(),
    });
  });
}

/** Answer the culture quiz with a random persona and save it like CultureAssessment does. */
export function applySampleCulture(userId: string): void {
  const random = seededRandom(Date.now());
  const persona = makePersona(employerQuestions, random);
  cultureEngine.reset();
  const responses: Record<string, AssessmentResponse> = {};
  employerQuestions.forEach((question) => {
    const response = sampleResponse(question, random, persona);
    responses[question.id] = response;
    cultureEngine.processResponse(response, { type: question.type, options: question.options, sliderConfig: question.sliderConfig });
  });
  const profile = cultureEngine.generateCultureProfile(userId);

  insertRow('assessments', {
    user_id: userId,
    assessment_type: 'employer_culture',
    responses,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  const employer = findOne('employers', (e) => e.user_id === userId) as Row;
  updateRow('employers', employer.id, {
    openness_preference: profile.idealCandidateOCEAN.openness,
    conscientiousness_preference: profile.idealCandidateOCEAN.conscientiousness,
    extraversion_preference: profile.idealCandidateOCEAN.extraversion,
    agreeableness_preference: profile.idealCandidateOCEAN.agreeableness,
    neuroticism_preference: profile.idealCandidateOCEAN.neuroticism,
    culture_values: profile.valuesPriority,
    culture_quiz_completed: true,
  });
}
