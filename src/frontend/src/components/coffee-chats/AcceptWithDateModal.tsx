import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ScheduleModal } from './ScheduleModal';

interface AcceptWithDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (scheduledAt: string) => void;
  partnerName: string;
  preferredDates: string[];
  customDates: string[];
  onAddCustomDate: (scheduledAt: string) => void;
}

export function AcceptWithDateModal({
  isOpen,
  onClose,
  onAccept,
  partnerName,
  preferredDates,
  customDates,
  onAddCustomDate,
}: AcceptWithDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(null);
      setIsSubmitting(false);
      setScheduleOpen(false);
    }
  }, [isOpen]);

  const handleAccept = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      await onAccept(selectedDate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedulePicked = (scheduledAt: string) => {
    onAddCustomDate(scheduledAt);
    setSelectedDate(scheduledAt);
    setScheduleOpen(false);
  };

  const allDates = [...preferredDates, ...customDates];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Accept and schedule" size="sm">
        <div className="py-2">
          <p className="text-sm mb-4" style={{ color: 'var(--color-textSecondary)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{partnerName}</span> proposed these times. Pick one to schedule the chat.
          </p>

          <div className="space-y-2 mb-6 max-h-[280px] overflow-y-auto pr-1">
            {allDates.map((dateStr, idx) => {
              const date = new Date(dateStr);
              const isSelected = selectedDate === dateStr;
              const isCustom = idx >= preferredDates.length;
              return (
                <button
                  key={`${dateStr}-${idx}`}
                  onClick={() => setSelectedDate(dateStr)}
                  aria-pressed={isSelected}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:border-[var(--color-borderHover)]"
                  style={{
                    borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <span className="flex-1 text-left text-sm font-medium">
                    {date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-sm tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                    {date.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                  {isCustom && !isSelected && (
                    <span className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
                      New
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="outline" onClick={() => setScheduleOpen(true)}>
              Propose another time
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!selectedDate}
              isLoading={isSubmitting}
            >
              Accept and schedule
            </Button>
          </div>
        </div>
      </Modal>

      <ScheduleModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSchedule={handleReschedulePicked}
      />
    </>
  );
}
