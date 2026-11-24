/**
 * Plays the other side of the conversation in the demo. When the visitor
 * reaches out to one of the seeded people, that person accepts, proposes a
 * time and answers messages with canned lines that are labelled as automatic.
 * Only seeded accounts ever reply; nothing leaves the browser.
 */
import { isSeedUser } from './seed';
import { findOne, insertRow, sessionUserId, subscribe, updateRow, type Row } from './store';

export const AUTO_REPLY_LABEL = '(Demo auto-reply)';

const REPLY_DELAY_MS = 2200;

const OPENERS = [
  'Thanks for reaching out! I had a look at your profile and the match breakdown, and I would love to chat.',
  'Great to connect. Our team talks a lot about how people like to work, so this should be a fun one.',
];

const REPLIES = [
  'That sounds great. Anything specific you want me to come prepared to talk about?',
  'Good question! Honestly the best way to get a feel for the team is to ask about our last messy week, happy to share.',
  'Looking forward to it. I will send a calendar invite with a video link.',
  'Love that. We care a lot about that too, it came up in our culture quiz results.',
  'Thanks, see you then!',
];

let replyCount = 0;

function partyUserIds(chat: Row): { candidateUser: unknown; employerUser: unknown } {
  const candidate = findOne('candidates', (c) => c.id === chat.candidate_id);
  const employer = findOne('employers', (e) => e.id === chat.employer_id);
  return { candidateUser: candidate?.user_id, employerUser: employer?.user_id };
}

function seededPartner(chat: Row): Row | undefined {
  const { candidateUser, employerUser } = partyUserIds(chat);
  const visitor = sessionUserId();
  const partnerId = candidateUser === visitor ? employerUser : employerUser === visitor ? candidateUser : null;
  if (!isSeedUser(partnerId)) return undefined;
  return findOne('profiles', (p) => p.id === partnerId);
}

export function sendAutoMessage(chatId: string, partner: Row, text: string): void {
  insertRow('messages', {
    coffee_chat_id: chatId,
    sender_id: partner.id,
    sender_name: partner.full_name,
    sender_avatar_url: null,
    content: `${AUTO_REPLY_LABEL} ${text}`,
    read_at: null,
  });
}

/** Next weekday at 10:00 local time, so auto-scheduled chats land somewhere sensible. */
export function nextWeekdayMorning(daysAhead = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function onConnection(conn: Row): void {
  if (conn.status !== 'pending' || !isSeedUser(conn.receiver_id) || conn.sender_id !== sessionUserId()) return;
  setTimeout(async () => {
    // A reset inside the delay wipes the request; there's nothing left to accept.
    if (!findOne('connections', (c) => c.id === conn.id)) return;
    const invite = findOne('connection_meet_invites', (i) => i.connection_id === conn.id);
    const times = (invite?.proposed_times as string[] | undefined) ?? [];
    // Loaded on first use so the landing page doesn't download the demo backend
    const { acceptConnection } = await import('./backend');
    await acceptConnection(conn.receiver_id as string, conn.id, {
      accept_meet_invite: true,
      confirmed_time: times[0] ?? nextWeekdayMorning(2),
    });
    const chat = findOne('coffee_chats', (c) => c.connection_id === conn.id);
    const partner = findOne('profiles', (p) => p.id === conn.receiver_id);
    if (chat && partner) sendAutoMessage(chat.id, partner, OPENERS[replyCount++ % OPENERS.length]);
  }, REPLY_DELAY_MS);
}

function onCoffeeChat(chat: Row): void {
  if (chat.status !== 'pending' || chat.connection_id) return;
  const partner = seededPartner(chat);
  const initiatedByVisitor = partner && chat.initiated_by !== partner.role;
  if (!partner || !initiatedByVisitor) return;
  setTimeout(() => {
    if (!findOne('coffee_chats', (c) => c.id === chat.id)) return;
    const dates = (chat.preferred_dates as string[] | null) ?? [];
    updateRow('coffee_chats', chat.id, { status: 'scheduled', scheduled_at: dates[0] ?? nextWeekdayMorning(2) });
    sendAutoMessage(chat.id, partner, OPENERS[replyCount++ % OPENERS.length]);
  }, REPLY_DELAY_MS);
}

function onMessage(message: Row): void {
  if (message.sender_id !== sessionUserId()) return;
  const chat = findOne('coffee_chats', (c) => c.id === message.coffee_chat_id);
  const partner = chat && seededPartner(chat);
  if (!chat || !partner) return;
  setTimeout(() => sendAutoMessage(chat.id, partner, REPLIES[replyCount++ % REPLIES.length]), REPLY_DELAY_MS);
}

let started = false;

export function startAutoReplies(): void {
  if (started) return;
  started = true;
  subscribe((change) => {
    if (change.eventType !== 'INSERT') return;
    const row = change.new as Row;
    if (change.table === 'connections') onConnection(row);
    else if (change.table === 'coffee_chats') onCoffeeChat(row);
    else if (change.table === 'messages') onMessage(row);
  });
}
