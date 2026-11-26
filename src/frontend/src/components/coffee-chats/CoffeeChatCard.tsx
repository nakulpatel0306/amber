import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';

export type ChatStatus = 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';

export interface CoffeeChatData {
  id: string;
  candidate_id: string;
  employer_id: string;
  role_id?: string | null;
  connection_id?: string | null;
  status: ChatStatus;
  message?: string | null;
  initiated_by: 'candidate' | 'employer';
  scheduled_at?: string | null;
  meeting_link?: string | null;
  rating?: number | null;
  feedback?: string | null;
  created_at: string;
  // Joined data
  partner_name: string;
  partner_company?: string;
  partner_contact?: string;
  partner_location?: string;
  match_score?: number;
  role_title?: string;
  // Preferred dates for scheduling
  preferred_dates?: string[] | null;
  duration_minutes?: number | null;
}

interface CoffeeChatCardProps {
  chat: CoffeeChatData;
  userRole: 'candidate' | 'employer';
  onAccept?: (chatId: string) => void;
  onDecline?: (chatId: string) => void;
  onSchedule?: (chatId: string) => void;
  onComplete?: (chatId: string) => void;
  onFeedback?: (chatId: string) => void;
  onViewMatch?: (chatId: string) => void;
  onMessage?: (chatId: string, partnerName: string) => void;
  onViewDetails?: (chat: CoffeeChatData) => void;
  onReschedule?: (chatId: string) => void;
  // Extra sections (prep brief, follow-up) that live inside the same card
  children?: React.ReactNode;
}

// Status is a dot and a word; only the dot carries color
const statusConfig: Record<ChatStatus, { label: string; dot: string }> = {
  pending: { label: 'Pending', dot: 'var(--color-warning)' },
  accepted: { label: 'Accepted', dot: 'var(--color-success)' },
  scheduled: { label: 'Scheduled', dot: 'var(--color-accent)' },
  completed: { label: 'Completed', dot: 'var(--color-textMuted)' },
  cancelled: { label: 'Cancelled', dot: 'var(--color-error)' },
};

function formatSlot(dateStr: string, durationMin: number) {
  const start = new Date(dateStr);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const dateLabel = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${dateLabel} · ${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
}

export function CoffeeChatCard({
  chat,
  userRole,
  onAccept,
  onDecline,
  onSchedule,
  onComplete,
  onFeedback,
  onViewMatch,
  onMessage,
  onViewDetails,
  onReschedule,
  children,
}: CoffeeChatCardProps) {
  const status = statusConfig[chat.status];
  const isIncoming = chat.initiated_by !== userRole;
  const statusLabel = chat.status === 'pending'
    ? (isIncoming ? 'Awaiting your reply' : 'Waiting for a reply')
    : status.label;

  const scheduledDate = chat.scheduled_at ? new Date(chat.scheduled_at) : null;
  const meta = [
    chat.partner_company,
    chat.role_title ? `Re: ${chat.role_title}` : null,
    chat.partner_location,
  ].filter(Boolean).join(' · ');

  const canCancel = chat.status !== 'completed' && chat.status !== 'cancelled' && !(chat.status === 'pending' && isIncoming);

  return (
    <div className="bento-card">
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => onViewDetails?.(chat)}
          aria-label={`View ${chat.partner_name}`}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
        >
          {chat.partner_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => onViewDetails?.(chat)}
            className="text-heading hover:underline underline-offset-4 text-left"
            style={{ color: 'var(--color-text)' }}
          >
            {chat.partner_name}
          </button>
          {meta && (
            <p className="text-label font-normal mt-0.5" style={{ color: 'var(--color-textSecondary)' }}>
              {meta}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: status.dot }} />
              {statusLabel}
            </span>
            {scheduledDate && (
              <span className="tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                {scheduledDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                {scheduledDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        {chat.match_score != null && chat.match_score > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-heading tabular-nums" style={{ color: 'var(--color-text)' }}>
              {chat.match_score}%
            </p>
            <p className="text-caption" style={{ color: 'var(--color-textMuted)' }}>match</p>
          </div>
        )}
      </div>

      {chat.message && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
          “{chat.message}”
        </p>
      )}

      {chat.preferred_dates && chat.preferred_dates.length > 0 && chat.status === 'pending' && (
        <div className="mt-4">
          <p className="text-label" style={{ color: 'var(--color-text)' }}>
            {userRole === 'employer' ? 'Requested times' : 'Preferred times'}
          </p>
          <ul className="mt-1 space-y-0.5">
            {chat.preferred_dates.map(dateStr => (
              <li key={dateStr} className="text-sm tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                {formatSlot(dateStr, chat.duration_minutes ?? 30)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {chat.rating != null && chat.rating > 0 && (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          <span className="tabular-nums" style={{ color: 'var(--color-text)' }}>Rated {chat.rating}/5</span>
          {chat.feedback && <> · “{chat.feedback}”</>}
        </p>
      )}

      {/* Actions: one primary per state, everything else quiet */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {chat.status === 'pending' && isIncoming && (
          <>
            <Button size="sm" onClick={() => onAccept?.(chat.id)}>
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDecline?.(chat.id)}>
              Decline
            </Button>
          </>
        )}

        {chat.status === 'accepted' && (
          <Button size="sm" onClick={() => onSchedule?.(chat.id)}>
            Schedule
          </Button>
        )}

        {chat.status === 'scheduled' && (
          <>
            {chat.meeting_link && (
              <a
                href={chat.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2 rounded-lg px-3 py-1 text-label transition-colors bg-[var(--color-accent)] text-[var(--color-accentText)] hover:bg-[var(--color-accentHover)]"
              >
                Join meeting
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Button size="sm" variant={chat.meeting_link ? 'outline' : 'primary'} onClick={() => onComplete?.(chat.id)}>
              Mark complete
            </Button>
            {onReschedule && (
              <Button size="sm" variant="outline" onClick={() => onReschedule(chat.id)}>
                Reschedule
              </Button>
            )}
          </>
        )}

        {chat.status === 'completed' && !chat.rating && (
          <Button size="sm" onClick={() => onFeedback?.(chat.id)}>
            Leave feedback
          </Button>
        )}

        {onMessage && chat.status !== 'cancelled' && (
          <Button size="sm" variant="outline" onClick={() => onMessage(chat.id, chat.partner_name)}>
            Message
          </Button>
        )}

        {onViewDetails && (
          <Button size="sm" variant="ghost" onClick={() => onViewDetails(chat)}>
            View profile
          </Button>
        )}

        {onViewMatch && (
          <Button size="sm" variant="ghost" onClick={() => onViewMatch(chat.id)}>
            View match
          </Button>
        )}

        {canCancel && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onDecline?.(chat.id)}>
            Cancel chat
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
