import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  subtitle?: string;
  archetype?: { name: string; key: string };
  overallScore: number;
  avatarUrl?: string | null;
  onConnect: (message: string, meetInvite?: { proposed_times: string[]; duration_minutes: number }) => Promise<void>;
}

const DURATION_OPTIONS = [15, 30, 45, 60];
const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM',
];

export function ConnectModal({
  isOpen,
  onClose,
  name,
  subtitle,
  archetype,
  overallScore,
  avatarUrl,
  onConnect,
}: ConnectModalProps) {
  const [message, setMessage] = useState(
    `I'd like to connect and discuss how our work styles align.`
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [duration, setDuration] = useState(30);
  const [preferredDates, setPreferredDates] = useState<Date[]>([]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  minDate.setHours(0, 0, 0, 0);

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const meetInvite = showCalendar && preferredDates.length > 0
        ? {
            proposed_times: preferredDates.map(d => {
              const [timePart, ampm] = preferredTime.split(' ');
              const [hStr, mStr] = timePart.split(':');
              let h = parseInt(hStr);
              if (ampm === 'PM' && h !== 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              const dt = new Date(d);
              dt.setHours(h, parseInt(mStr), 0, 0);
              return dt.toISOString();
            }),
            duration_minutes: duration,
          }
        : undefined;
      await onConnect(message, meetInvite);
      setMessage('');
      setPreferredDates([]);
      setShowCalendar(false);
      onClose();
    } catch {
      // Error handled by parent via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={showCalendar ? '700px' : '384px'}
      dialogClassName="transition-[max-width] duration-300 ease-out"
    >
      {/* Side by side from sm up; on phones the scheduling panel stacks under the message */}
      <div className="flex flex-col sm:flex-row gap-0">
        <div className={`flex-1 min-w-0 ${showCalendar ? 'sm:pr-5' : ''}`}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: avatarUrl ? undefined : 'var(--color-surfaceHover)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium" style={{ color: 'var(--color-textSecondary)' }}>{initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{name}</h3>
                <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--color-text)' }}>
                  {overallScore}%
                </span>
              </div>
              {(subtitle || archetype) && (
                <p className="text-caption truncate" style={{ color: 'var(--color-textMuted)' }}>
                  {[subtitle, archetype?.name].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* Message field */}
          <div className="mb-3">
            <label className="block text-label mb-1.5" style={{ color: 'var(--color-text)' }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={e => {
                const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                if (words.length <= 100) setMessage(e.target.value);
              }}
              rows={3}
              aria-label="Message"
              className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                border: `1px solid ${message.trim().length === 0 ? 'var(--color-warning)' : 'var(--color-border)'}`,
              }}
            />
            <p className="text-right text-caption tabular-nums mt-1" style={{ color: wordCount >= 90 ? 'var(--color-warning)' : 'var(--color-textMuted)' }}>
              {wordCount}/100 words
            </p>
          </div>

          {/* Coffee chat toggle */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            aria-expanded={showCalendar}
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border transition-colors hover:border-[var(--color-borderHover)]"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-label flex-1 text-left" style={{ color: 'var(--color-textSecondary)' }}>
              Include a coffee chat invite
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform sm:-rotate-90 ${showCalendar ? 'rotate-180 sm:rotate-90' : ''}`}
              style={{ color: 'var(--color-textMuted)' }}
            />
          </button>
        </div>

        {/* Right side — calendar panel, expands outward */}
        {showCalendar && (
          <div
            className="w-full sm:w-[292px] flex-shrink-0 mt-4 pt-4 border-t sm:mt-0 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-5 animate-fade-in"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div>
              {/* Duration picker */}
              <div className="mb-4">
                <label className="block text-label mb-2" style={{ color: 'var(--color-text)' }}>
                  Duration
                </label>
                <div className="flex gap-1.5">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      aria-pressed={duration === d}
                      className="flex-1 py-1.5 rounded-lg text-caption font-medium tabular-nums transition-colors"
                      style={{
                        color: duration === d ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                        border: `1px solid ${duration === d ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      }}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              <div className="mb-4">
                <label className="block text-label mb-2" style={{ color: 'var(--color-text)' }}>
                  Preferred dates
                </label>
                <DatePicker
                  selectedDates={preferredDates}
                  onChange={setPreferredDates}
                  minDate={minDate}
                  maxSelections={5}
                />
              </div>

              {/* Time picker */}
              <div>
                <label className="block text-label mb-2" style={{ color: 'var(--color-text)' }}>
                  Preferred time
                </label>
                <div
                  className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto p-1.5 rounded-lg"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  {TIME_SLOTS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPreferredTime(t)}
                      aria-pressed={preferredTime === t}
                      className="py-1 px-1 rounded-md text-caption tabular-nums transition-colors"
                      style={{
                        backgroundColor: preferredTime === t ? 'var(--color-accent)' : 'transparent',
                        color: preferredTime === t ? 'var(--color-accentText)' : 'var(--color-textSecondary)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={message.trim().length === 0}>
          Send request
        </Button>
      </ModalFooter>
    </Modal>
  );
}
