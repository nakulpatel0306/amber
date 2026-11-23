/**
 * In-browser stand-in for the FastAPI backend (src/backend/main.py).
 *
 * utils/api.ts routes every backend request here in demo builds. Each handler
 * follows the matching FastAPI route: same paths, same request and response
 * shapes, the same queries (through the service-role query builder), and the
 * same Ember analysis via the TypeScript port in lib/ember.
 */
import {
  determineArchetype,
  runEmberAnalysis,
  runEmberEmployerAnalysis,
  candidateOceanFromRow,
  type CandidateRow,
  type EmployerRow,
  type RoleRow,
} from '../lib/ember/agent';
import { DemoQuery } from './query';
import { resetDemo, sessionUserId, type Row } from './store';

type Json = Record<string, unknown>;

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(detail);
  }
}

const db = (name: string) => new DemoQuery(name, true);

async function rows(query: PromiseLike<{ data: unknown }>): Promise<Row[]> {
  return (((await query).data as Row[] | null) ?? []);
}

async function first(query: PromiseLike<{ data: unknown }>): Promise<Row | null> {
  return (await rows(query))[0] ?? null;
}

const getCandidate = (id: unknown) => first(db('candidates').select('*, profiles!inner(full_name, email)').eq('id', id).limit(1));
const getCandidateByUser = (userId: unknown) => first(db('candidates').select('*, profiles!inner(full_name, email)').eq('user_id', userId).limit(1));
const getEmployer = (id: unknown) => first(db('employers').select('*').eq('id', id).limit(1));
const getEmployerByUser = (userId: unknown) => first(db('employers').select('*').eq('user_id', userId).limit(1));
const getRole = (id: unknown) => first(db('roles').select('*, employers!inner(*)').eq('id', id).limit(1));
const getConnection = (id: unknown) => first(db('connections').select('*').eq('id', id).limit(1));
const getMeetInvite = (connectionId: unknown) => first(db('connection_meet_invites').select('*').eq('connection_id', connectionId).limit(1));
const getChatByConnection = (connectionId: unknown) =>
  first(db('coffee_chats').select('*').eq('connection_id', connectionId).order('created_at', { ascending: false }).limit(1));

async function insert(name: string, values: Json): Promise<Row> {
  return (await db(name).insert(values).select('*').single()).data as Row;
}

async function update(name: string, id: unknown, values: Json): Promise<Row | null> {
  return ((await db(name).update(values).eq('id', id).select('*').single()).data as Row | null) ?? null;
}

function requireUser(): string {
  const uid = sessionUserId();
  if (!uid) throw new HttpError(401, 'Authentication required');
  return uid;
}

// ---- connections (main.py: /api/connections) ----

export async function createConnection(senderId: string, body: Json): Promise<Row> {
  const receiverId = body.receiver_id as string;
  const existing = (await rows(db('connections').select('*'))).find(
    (c) =>
      (c.sender_id === senderId && c.receiver_id === receiverId) ||
      (c.sender_id === receiverId && c.receiver_id === senderId),
  );
  if (existing) throw new HttpError(409, 'Connection already exists');

  const conn = await insert('connections', {
    sender_id: senderId,
    receiver_id: receiverId,
    sender_role: body.sender_role,
    status: 'pending',
    message: body.message ?? null,
    sender_name: body.sender_name ?? null,
    receiver_name: body.receiver_name ?? null,
    sender_company: body.sender_company ?? null,
    receiver_company: body.receiver_company ?? null,
  });

  const invite = body.meet_invite as { proposed_times: string[]; duration_minutes?: number } | null;
  if (invite) {
    await insert('connection_meet_invites', {
      connection_id: conn.id,
      proposed_times: invite.proposed_times,
      duration_minutes: invite.duration_minutes ?? 30,
      status: 'pending',
    });
    const candidateSender = body.sender_role === 'candidate';
    const candidate = await getCandidateByUser(candidateSender ? senderId : receiverId);
    const employer = await getEmployerByUser(candidateSender ? receiverId : senderId);
    if (candidate && employer) {
      await insert('coffee_chats', {
        candidate_id: candidate.id,
        employer_id: employer.id,
        connection_id: conn.id,
        initiated_by: body.sender_role,
        status: 'pending',
        message: body.message ?? null,
        preferred_dates: invite.proposed_times,
        duration_minutes: invite.duration_minutes ?? 30,
        candidate_name: candidateSender ? body.sender_name : body.receiver_name,
        company_name: candidateSender ? body.receiver_company : body.sender_company,
        match_score: body.match_score != null ? Math.trunc(Number(body.match_score)) : null,
        role_id: body.role_id ?? null,
        role_title: body.role_title ?? null,
      });
    }
  }
  return conn;
}

export async function acceptConnection(userId: string, connectionId: string, body: Json): Promise<Row> {
  const conn = await getConnection(connectionId);
  if (!conn) throw new HttpError(404, 'Connection not found');
  if (conn.receiver_id !== userId) throw new HttpError(403, 'Only the receiver can accept');
  if (conn.status !== 'pending') throw new HttpError(400, 'Connection is not pending');

  const result = (await update('connections', connectionId, { status: 'accepted' })) as Row;
  const confirmedTime = (body.confirmed_time as string | null) ?? null;

  if (body.accept_meet_invite) {
    const invite = await getMeetInvite(connectionId);
    if (invite) await update('connection_meet_invites', invite.id, { status: 'accepted', confirmed_time: confirmedTime });

    const chat = await getChatByConnection(connectionId);
    if (chat) {
      await update('coffee_chats', chat.id, confirmedTime ? { status: 'scheduled', scheduled_at: confirmedTime } : { status: 'accepted' });
    } else {
      const candidateSender = conn.sender_role === 'candidate';
      const candidate = await getCandidateByUser(candidateSender ? conn.sender_id : conn.receiver_id);
      const employer = await getEmployerByUser(candidateSender ? conn.receiver_id : conn.sender_id);
      if (candidate && employer) {
        await insert('coffee_chats', {
          candidate_id: candidate.id,
          employer_id: employer.id,
          connection_id: connectionId,
          initiated_by: conn.sender_role,
          status: confirmedTime ? 'scheduled' : 'accepted',
          message: conn.message,
          candidate_name: candidateSender ? conn.sender_name : conn.receiver_name,
          company_name: candidateSender ? conn.receiver_company : conn.sender_company,
          ...(confirmedTime ? { scheduled_at: confirmedTime } : {}),
        });
      }
    }
  }
  return result;
}

async function rejectConnection(userId: string, connectionId: string): Promise<Row> {
  const conn = await getConnection(connectionId);
  if (!conn) throw new HttpError(404, 'Connection not found');
  if (conn.receiver_id !== userId) throw new HttpError(403, 'Only the receiver can reject');
  const result = (await update('connections', connectionId, { status: 'rejected' })) as Row;
  const invite = await getMeetInvite(connectionId);
  if (invite && invite.status === 'pending') await update('connection_meet_invites', invite.id, { status: 'declined' });
  const chat = await getChatByConnection(connectionId);
  if (chat && !['completed', 'cancelled'].includes(chat.status as string)) {
    await update('coffee_chats', chat.id, { status: 'cancelled' });
  }
  return result;
}

async function myConnections(userId: string): Promise<Json> {
  const all = [
    ...(await rows(db('connections').select('*').eq('sender_id', userId))),
    ...(await rows(db('connections').select('*').eq('receiver_id', userId))),
  ];
  for (const conn of all) conn.meet_invite = await getMeetInvite(conn.id);
  return {
    pending_sent: all.filter((c) => c.status === 'pending' && c.sender_id === userId),
    pending_received: all.filter((c) => c.status === 'pending' && c.receiver_id === userId),
    accepted: all.filter((c) => c.status === 'accepted'),
    rejected: all.filter((c) => c.status === 'rejected'),
  };
}

// ---- Ember (main.py: /api/ember/*) ----

async function emberCandidateMatches(candidateId: string): Promise<Json> {
  const candidate = await getCandidate(candidateId);
  if (!candidate) throw new HttpError(404, 'Candidate not found');
  if (!candidate.openness_score) throw new HttpError(400, 'Candidate has not completed personality assessment');

  const archetype = determineArchetype(candidateOceanFromRow(candidate as CandidateRow));
  const roles = await rows(db('roles').select('*, employers!inner(*)').eq('status', 'active'));
  if (!roles.length) {
    return { candidate_id: candidateId, archetype, matches: [], ember_message: 'No active roles available yet. Check back soon!' };
  }

  const matches = roles.map((role) => {
    const employer = (role.employers ?? {}) as EmployerRow;
    return {
      role_id: role.id,
      role_title: role.title ?? 'Unknown Role',
      company_name: employer.company_name ?? 'Unknown Company',
      company_industry: employer.industry ?? '',
      company_size: employer.company_size ?? '',
      company_location: employer.location ?? '',
      role_location: role.location ?? '',
      work_style: role.work_style ?? '',
      salary_min: role.salary_min,
      salary_max: role.salary_max,
      employment_type: role.employment_type ?? '',
      ...runEmberAnalysis(candidate as CandidateRow, employer, role as RoleRow),
    };
  });
  matches.sort((a, b) => b.overall_score - a.overall_score);

  const top = matches[0]?.overall_score ?? 0;
  const message =
    top >= 85
      ? `Great news! I found ${matches.length} roles, and your top match is exceptional at ${top}%!`
      : top >= 70
        ? `I analyzed ${matches.length} roles for your personality. Your best match is a solid ${top}%.`
        : `I checked ${matches.length} roles. The matches aren't perfect, but there could be good growth opportunities.`;

  return { candidate_id: candidateId, archetype, matches, total_matches: matches.length, ember_message: message };
}

async function emberEmployerMatches(employerId: string, roleId: string | null): Promise<Json> {
  const employer = await getEmployer(employerId);
  if (!employer) throw new HttpError(404, 'Employer not found');
  const role = roleId ? await getRole(roleId) : null;
  if (roleId && !role) throw new HttpError(404, 'Role not found');

  const candidates = await rows(db('candidates').select('*, profiles!inner(full_name, email)').not('openness_score', 'is', null));
  if (!candidates.length) {
    return { employer_id: employerId, role_id: roleId, candidates: [], ember_message: 'No candidates with completed assessments yet.' };
  }

  const results = runEmberEmployerAnalysis(employer as EmployerRow, candidates as CandidateRow[], role as RoleRow | null);
  const company = (employer.company_name as string) || 'your company';
  const top = results[0]?.overall_score ?? 0;
  const message =
    top >= 80
      ? `Found ${results.length} candidates for ${company}. Top personality match: ${top}%!`
      : `Analyzed ${results.length} candidates for ${company}. Here are the best personality fits.`;
  return { employer_id: employerId, role_id: roleId, candidates: results, total_candidates: results.length, ember_message: message };
}

async function emberAnalysis(params: URLSearchParams): Promise<Json> {
  const candidate = await getCandidate(params.get('candidate_id'));
  if (!candidate) throw new HttpError(404, 'Candidate not found');
  if (!candidate.openness_score) throw new HttpError(400, 'Candidate has not completed personality assessment');
  const employer = await getEmployer(params.get('employer_id'));
  if (!employer) throw new HttpError(404, 'Employer not found');
  const roleId = params.get('role_id');
  const role = roleId ? await getRole(roleId) : null;

  const profile = (candidate.profiles ?? {}) as { full_name?: string };
  return {
    candidate_id: candidate.id,
    candidate_name: profile.full_name ?? 'Unknown',
    employer_id: employer.id,
    company_name: employer.company_name ?? 'Unknown',
    role_id: roleId,
    role_title: role?.title ?? null,
    ...runEmberAnalysis(candidate as CandidateRow, employer as EmployerRow, role as RoleRow | null),
  };
}

async function coffeeChatPrep(chatId: string): Promise<Json> {
  const chat = await first(db('coffee_chats').select('*').eq('id', chatId).limit(1));
  if (!chat) throw new HttpError(404, 'Coffee chat not found');
  const candidate = await getCandidate(chat.candidate_id);
  const employer = await getEmployer(chat.employer_id);
  if (!candidate || !employer) throw new HttpError(404, 'Participant data not found');
  const role = chat.role_id ? await getRole(chat.role_id) : null;
  const analysis = runEmberAnalysis(candidate as CandidateRow, employer as EmployerRow, role as RoleRow | null);

  const archetype = analysis.candidate_archetype;
  const overall = analysis.overall_score;
  const company = (employer.company_name as string) ?? 'the company';
  const fit = overall >= 75 ? 'strong' : overall >= 55 ? 'moderate' : 'developing';
  const of = (category: string) => analysis.insights.filter((i) => i.category === category).map((i) => i.message);
  const cautions = of('caution');
  const tips = of('tip');

  return {
    chat_id: chatId,
    match_score: overall,
    archetype,
    prep: {
      personality_summary:
        `As ${archetype.name}, you bring ${archetype.description} to this conversation. ` +
        `Your ${fit} compatibility score of ${overall}% with ${company} suggests ` +
        `${overall >= 75 ? 'excellent alignment' : 'interesting complementary dynamics'}.`,
      conversation_starters: [
        `What does a typical day look like on your team at ${company}?`,
        "How would you describe the team's communication style?",
        "What's one thing about your culture that might surprise people?",
        'How does the team handle disagreements or different perspectives?',
        "What's the most rewarding project you've worked on recently?",
      ],
      topics_to_explore: [
        'Team dynamics and collaboration style',
        'Growth opportunities and learning culture',
        'Work-life balance and flexibility',
        'Decision-making processes',
      ],
      things_to_be_mindful_of: cautions.length
        ? cautions.slice(0, 3)
        : [
            `Your ${archetype.name} tendency may differ from their expected style - be authentic but adaptable`,
            'Listen actively and ask follow-up questions to show genuine interest',
            'Share specific examples from your experience that demonstrate culture alignment',
          ],
      archetype_tips: tips.length
        ? tips.slice(0, 2)
        : [`As ${archetype.name}, lead with your natural strengths in the conversation`, 'Balance sharing your perspective with curiosity about theirs'],
      strengths: of('strength').slice(0, 3),
    },
  };
}

// ---- routing ----

type Handler = (match: RegExpMatchArray, body: Json, params: URLSearchParams) => Promise<unknown>;

const STRIPE_DISABLED =
  'Payments are turned off in this demo. The real product billed through Stripe subscriptions (Checkout, Customer Portal and webhooks).';

const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/health$/, async () => ({ status: 'operational', timestamp: new Date().toISOString(), services: {} })],
  ['POST', /^\/api\/auth\/check-email$/, async (_m, body) => {
    const email = String(body.email ?? '').trim().toLowerCase();
    const exists = (await rows(db('profiles').select('email'))).some((p) => p.email === email);
    return { exists, message: exists ? 'An account with this email already exists.' : 'No account found with this email.' };
  }],
  ['DELETE', /^\/api\/auth\/delete-account$/, async () => {
    requireUser();
    resetDemo();
    return { message: 'Account successfully deleted' };
  }],
  ['GET', /^\/api\/connections\/me$/, async () => myConnections(requireUser())],
  ['POST', /^\/api\/connections$/, async (_m, body) => createConnection(requireUser(), body)],
  ['PATCH', /^\/api\/connections\/([^/]+)\/accept$/, async (m, body) => acceptConnection(requireUser(), m[1], body)],
  ['PATCH', /^\/api\/connections\/([^/]+)\/reject$/, async (m) => rejectConnection(requireUser(), m[1])],
  ['GET', /^\/api\/ember\/candidate-matches\/([^/]+)$/, async (m) => emberCandidateMatches(m[1])],
  ['GET', /^\/api\/ember\/employer-matches\/([^/]+)$/, async (m, _b, params) => emberEmployerMatches(m[1], params.get('role_id'))],
  ['GET', /^\/api\/ember\/analysis$/, async (_m, _b, params) => emberAnalysis(params)],
  ['POST', /^\/api\/coffee-chats\/([^/]+)\/prep$/, async (m) => coffeeChatPrep(m[1])],
  ['PATCH', /^\/api\/coffee-chats\/([^/]+)\/status$/, async (m, _b, params) => {
    const status = params.get('status') ?? '';
    if (!['accepted', 'cancelled', 'completed'].includes(status)) throw new HttpError(400, 'Invalid status');
    return update('coffee_chats', m[1], { status });
  }],
  ['PATCH', /^\/api\/coffee-chats\/([^/]+)\/schedule$/, async (m, body) =>
    update('coffee_chats', m[1], { scheduled_at: body.scheduled_at, meeting_link: body.meeting_link ?? null, status: 'scheduled' })],
  ['PATCH', /^\/api\/coffee-chats\/([^/]+)\/feedback$/, async (m, body) =>
    update('coffee_chats', m[1], { rating: body.rating, feedback: body.feedback ?? null, status: 'completed' })],
  ['POST', /^\/api\/feedback$/, async (_m, body) => {
    await insert('feedback', { user_id: sessionUserId(), feedback_type: 'general', message: body.message, page: body.page ?? null });
    return { success: true, message: 'Thanks! Feedback stays in your browser in the demo.' };
  }],
  ['POST', /^\/api\/stripe\/create-checkout-session$/, async () => { throw new HttpError(400, STRIPE_DISABLED); }],
  ['POST', /^\/api\/stripe\/create-portal-session$/, async () => { throw new HttpError(400, STRIPE_DISABLED); }],
  ['GET', /^\/api\/stripe\/subscription$/, async () => ({ plan: 'free', status: 'inactive', interval: null, has_stripe_customer: false })],
];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** fetch()-compatible entry point for backend paths like "/api/ember/analysis?...". */
export async function demoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(path, 'http://demo.local');
  const method = (init.method ?? 'GET').toUpperCase();
  const route = routes.find(([m, pattern]) => m === method && pattern.test(url.pathname));
  if (!route) return json(404, { detail: `${method} ${url.pathname} is not available in the demo` });

  const body = typeof init.body === 'string' && init.body ? (JSON.parse(init.body) as Json) : {};
  try {
    const result = await route[2](url.pathname.match(route[1]) as RegExpMatchArray, body, url.searchParams);
    return json(200, result);
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { detail: err.detail });
    return json(500, { detail: err instanceof Error ? err.message : 'Demo backend error' });
  }
}
