import { useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '../../contexts/ConnectionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ScheduleModal } from '../coffee-chats/ScheduleModal';
import type { Connection } from '../../types/connections.types';
import { useDialogFocus } from '../../hooks/useDialogFocus';

interface InboxPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function InboxPanel({ isOpen, onClose }: InboxPanelProps) {
  const navigate = useNavigate();
  const { isEmployer } = useAuth();
  const { pendingReceived, acceptConnection, rejectConnection } = useConnections();
  const { success: showSuccess, error: showError } = useToast();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState<Record<string, number>>({});
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [connectionToSchedule, setConnectionToSchedule] = useState<Connection | null>(null);

  const handleAccept = async (conn: Connection, customScheduledAt?: string) => {
    setAcceptingId(conn.id);
    try {
      const hasMeetInvite = conn.meet_invite && conn.meet_invite.status === 'pending';
      const hasProposedTimes = hasMeetInvite && conn.meet_invite!.proposed_times.length > 0;
      const timeIdx = selectedTimeIdx[conn.id];

      // Determine the confirmed time
      let confirmedTime: string | undefined;
      if (customScheduledAt) {
        // Custom time from ScheduleModal
        confirmedTime = customScheduledAt;
      } else if (hasProposedTimes && timeIdx !== undefined) {
        // Selected from proposed times
        confirmedTime = conn.meet_invite!.proposed_times[timeIdx];
      }

      await acceptConnection(conn.id, {
        acceptMeetInvite: !!hasMeetInvite || !!customScheduledAt,
        confirmedTime,
      });
      showSuccess('Connected!', confirmedTime
        ? `Meeting scheduled with ${conn.sender_name || 'this user'}`
        : `You're now connected with ${conn.sender_name || 'this user'}`
      );
      // The new chat is on the page behind; a drawer left open would just be empty
      onClose();
    } catch {
      showError('Error', 'Failed to accept connection');
    } finally {
      setAcceptingId(null);
      setConnectionToSchedule(null);
    }
  };

  const handleAcceptWithSchedule = (conn: Connection) => {
    // Open schedule modal for the user to pick a time
    setConnectionToSchedule(conn);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = (scheduledAt: string, _meetingLink?: string) => {
    if (connectionToSchedule) {
      handleAccept(connectionToSchedule, scheduledAt);
    }
    setScheduleModalOpen(false);
  };

  const handleDecline = async (conn: Connection) => {
    try {
      await rejectConnection(conn.id);
      showSuccess('Declined', 'Connection request declined');
    } catch {
      showError('Error', 'Failed to decline connection');
    }
  };

  const handleViewProfile = (conn: Connection) => {
    const targetId = conn.sender_id;
    const basePath = isEmployer ? '/app/employer/ember' : '/app/ember';
    navigate(`${basePath}?deepdive=${targetId}`);
    onClose();
  };

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(panelRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Connection requests"
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm border-l animate-slide-in-right"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
            Connection requests
            {pendingReceived.length > 0 && (
              <span className="ml-2 text-sm font-normal tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                {pendingReceived.length}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {pendingReceived.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                No pending requests
              </p>
              <p className="text-label font-normal" style={{ color: 'var(--color-textMuted)' }}>
                When someone wants to connect, they'll appear here.
              </p>
            </div>
          ) : (
            <ul>
              {pendingReceived.map((conn, i) => {
                const senderName = conn.sender_name || 'Unknown';
                const hasMeetInvite = conn.meet_invite && conn.meet_invite.status === 'pending';
                const proposedTimes = hasMeetInvite ? conn.meet_invite!.proposed_times : [];
                const timePicked = selectedTimeIdx[conn.id] !== undefined;

                return (
                  <li
                    key={conn.id}
                    className="px-5 py-4 space-y-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar fallback={senderName} size="md" className="w-9 h-9 text-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                            {senderName}
                          </p>
                          <span className="text-caption flex-shrink-0" style={{ color: 'var(--color-textMuted)' }}>
                            {timeAgo(conn.created_at)}
                          </span>
                        </div>
                        {conn.sender_company && (
                          <p className="text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
                            {conn.sender_company}
                          </p>
                        )}
                      </div>
                    </div>

                    {conn.message && (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                        “{conn.message}”
                      </p>
                    )}

                    {proposedTimes.length > 0 && (
                      <div>
                        <p className="text-label mb-1.5" style={{ color: 'var(--color-text)' }}>
                          Proposed times
                          <span className="ml-1.5 font-normal tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                            {conn.meet_invite!.duration_minutes} min
                          </span>
                        </p>
                        <div className="space-y-1">
                          {proposedTimes.map((timeStr, idx) => {
                            const start = new Date(timeStr);
                            const durationMin = conn.meet_invite!.duration_minutes || 30;
                            const end = new Date(start.getTime() + durationMin * 60_000);
                            const dateLabel = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                            const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
                            const timeLabel = `${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
                            const isSelected = selectedTimeIdx[conn.id] === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedTimeIdx(prev => ({ ...prev, [conn.id]: idx }))}
                                aria-pressed={isSelected}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-label font-normal tabular-nums text-left transition-colors hover:border-[var(--color-borderHover)]"
                                style={{
                                  borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                                  color: 'var(--color-text)',
                                }}
                              >
                                {dateLabel} · {timeLabel}
                                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* One primary action; the alternatives are quiet */}
                    <div className="flex flex-wrap items-center gap-2">
                      {proposedTimes.length > 0 ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(conn)}
                            isLoading={acceptingId === conn.id}
                            disabled={!timePicked}
                            title={!timePicked ? 'Pick a time above' : undefined}
                          >
                            {timePicked ? 'Accept and schedule' : 'Pick a time'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAcceptWithSchedule(conn)}>
                            Other time
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptWithSchedule(conn)}
                            isLoading={acceptingId === conn.id}
                          >
                            Accept and schedule
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAccept(conn)}>
                            Just accept
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewProfile(conn)}>
                        View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDecline(conn)}>
                        Decline
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setConnectionToSchedule(null);
        }}
        onSchedule={handleScheduleSubmit}
      />
    </>
  );
}
