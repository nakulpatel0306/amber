import { format } from 'date-fns';

export interface UpcomingChat {
  id?: string;
  company: string;
  person: string;
  role: string;
  time: string;
  scheduledAt: string | null;
  meetingLink?: string | null;
  status: string;
  type?: 'coffee_chat' | 'connection_meet';
  preferredDates?: string[] | null;
}

// The one line under the dashboard's coffee chat count: the next booked chat, else what is waiting
export interface ChatCounts {
  pending: number;
  accepted: number;
  scheduled: number;
  completed: number;
}

// Every chat that hasn't been cancelled, so the count matches the statuses shown in the match lists
export function totalChats(counts: ChatCounts): number {
  return counts.pending + counts.accepted + counts.scheduled + counts.completed;
}

export function chatSummary(chats: UpcomingChat[], { pending, accepted, scheduled, completed }: ChatCounts): string {
  const now = Date.now();
  const next = chats
    .filter((c) => c.scheduledAt && new Date(c.scheduledAt).getTime() > now)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];
  if (next) return `Next with ${next.person}, ${format(new Date(next.scheduledAt!), 'EEE MMM d, h:mm a')}`;

  // With nothing ahead, any scheduled chat has already happened and is only waiting for feedback
  const parts = [
    pending > 0 && `${pending} pending`,
    accepted > 0 && `${accepted} to schedule`,
    scheduled > 0 && `${scheduled} awaiting feedback`,
    completed > 0 && `${completed} completed`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'No chats yet';
}
