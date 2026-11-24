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
export function chatSummary(chats: UpcomingChat[], pending: number, accepted: number, completed: number): string {
  const now = Date.now();
  const next = chats
    .filter((c) => c.scheduledAt && new Date(c.scheduledAt).getTime() > now)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];
  if (next) return `Next with ${next.person}, ${format(new Date(next.scheduledAt!), 'EEE MMM d, h:mm a')}`;

  const parts = [
    pending > 0 && `${pending} pending`,
    accepted > 0 && `${accepted} to schedule`,
    completed > 0 && `${completed} completed`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'No chats yet';
}
