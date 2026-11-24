import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { Modal, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { DatePicker } from '../../ui/DatePicker';

interface CoffeeBrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  subtitle?: string;
  archetype?: { name: string; key: string };
  overallScore: number;
  avatarUrl?: string | null;
  onBrew: (note: string, preferredDates: Date[]) => Promise<void>;
}

export function CoffeeBrewModal({
  isOpen,
  onClose,
  name,
  subtitle,
  archetype,
  overallScore,
  avatarUrl,
  onBrew,
}: CoffeeBrewModalProps) {
  const [note, setNote] = useState('');
  const [preferredDates, setPreferredDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  // Minimum date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  minDate.setHours(0, 0, 0, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onBrew(note, preferredDates);
      setNote('');
      setPreferredDates([]);
      onClose();
    } catch {
      // Error handled by parent via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div>
        <div className="mb-5 flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
          ) : (
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{name}</h3>
            <p className="truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
              {[subtitle, archetype?.name].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className="text-heading tabular-nums" style={{ color: 'var(--color-text)' }}>{overallScore}%</span>
        </div>

        {/* Note field */}
        <div className="mb-4">
          <label className="block text-label mb-1.5" style={{ color: 'var(--color-textSecondary)' }}>
            Message (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="I'd love to learn about your team culture!"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          />
          <p className="text-right text-caption tabular-nums mt-1" style={{ color: 'var(--color-textMuted)' }}>
            {note.length}/500
          </p>
        </div>

        {/* Preferred dates picker */}
        <div>
          <p className="text-label mb-2" style={{ color: 'var(--color-textSecondary)' }}>
            Preferred dates (optional)
          </p>
          <DatePicker
            selectedDates={preferredDates}
            onChange={setPreferredDates}
            minDate={minDate}
            maxSelections={5}
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Not yet
        </Button>
        <Button size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
          <Coffee className="w-3.5 h-3.5" />
          Brew it
        </Button>
      </ModalFooter>
    </Modal>
  );
}
