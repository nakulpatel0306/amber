import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GripVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// Shared pieces for every one-question-at-a-time flow, so the candidate, employer and
// extra assessments all look and behave the same.

export function QuestionProgress({ current, total, label }: { current: number; total: number; label?: string }) {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-label">
        <span className="tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
          Question {current} of {total}
        </span>
        {label && (
          <span className="truncate" style={{ color: 'var(--color-textMuted)' }}>
            {label}
          </span>
        )}
      </div>
      <div
        className="mt-2 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%`, backgroundColor: 'var(--color-accent)' }}
        />
      </div>
    </div>
  );
}

export function AssessmentShell({
  title,
  onExit,
  current,
  total,
  category,
  children,
}: {
  title: string;
  onExit?: () => void;
  current: number;
  total: number;
  category?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-heading truncate" style={{ color: 'var(--color-text)' }}>
            {title}
          </h1>
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              Exit
            </Button>
          )}
        </div>
        <QuestionProgress current={current} total={total} label={category} />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function QuestionHeading({ question, description }: { question: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
        {question}
      </h2>
      {description && (
        <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          {description}
        </p>
      )}
    </div>
  );
}

export const optionClass = (selected: boolean) =>
  cn(
    'w-full text-left rounded-xl border p-4 transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
    selected
      ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-borderHover)]'
  );

export function OptionCard({
  selected,
  onSelect,
  text,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  text: string;
  description?: string;
}) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={optionClass(selected)}>
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
          style={{
            borderColor: selected ? 'var(--color-accent)' : 'var(--color-borderHover)',
            backgroundColor: selected ? 'var(--color-accent)' : 'transparent',
          }}
        >
          {selected && <Check className="w-3 h-3" style={{ color: 'var(--color-accentText)' }} />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {text}
          </span>
          {description && (
            <span className="mt-0.5 block text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {description}
            </span>
          )}
        </span>
      </div>
    </button>
  );
}

export function OptionList({
  options,
  selected,
  onSelect,
}: {
  options: { id: string; text: string; description?: string }[];
  selected: string | null | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((option) => (
        <OptionCard
          key={option.id}
          selected={selected === option.id}
          onSelect={() => onSelect(option.id)}
          text={option.text}
          description={option.description}
        />
      ))}
    </div>
  );
}

export function ScaleSlider({
  min,
  max,
  value,
  onChange,
  minLabel,
  maxLabel,
  step,
  showValue = true,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
  step?: number;
  showValue?: boolean;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="bento-card">
      {showValue && (
        <p className="mb-4 text-center text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${minLabel} to ${maxLabel}`}
        className="w-full slider-thumb"
        style={{
          background: `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-border) ${percent}%)`,
        }}
      />
      <div className="mt-3 flex justify-between gap-6 text-sm">
        <span className="max-w-[45%]" style={{ color: 'var(--color-textSecondary)' }}>
          {minLabel}
        </span>
        <span className="max-w-[45%] text-right" style={{ color: 'var(--color-textSecondary)' }}>
          {maxLabel}
        </span>
      </div>
    </div>
  );
}

export function QuestionNav({
  onBack,
  backDisabled,
  onNext,
  nextDisabled,
  isLast,
  isLoading,
  nextLabel = 'Next',
  backLabel = 'Back',
}: {
  onBack: () => void;
  backDisabled?: boolean;
  onNext: () => void;
  nextDisabled?: boolean;
  isLast: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <Button variant="outline" onClick={onBack} disabled={backDisabled} leftIcon={<ArrowLeft className="w-4 h-4" />}>
        {backLabel}
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        isLoading={isLoading}
        rightIcon={isLast ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      >
        {isLast ? 'Complete' : nextLabel}
      </Button>
    </div>
  );
}

export function RankingQuestion({
  options,
  order,
  onReorder,
}: {
  options: { id: string; text: string; description?: string }[];
  order: string[];
  onReorder: (order: string[]) => void;
}) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      const newOrder = [...order];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(targetId);
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);
      onReorder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div>
      <p className="mb-3 text-label" style={{ color: 'var(--color-textMuted)' }}>
        Drag to reorder, most important first
      </p>
      <div className="space-y-2">
        {order.map((id, index) => {
          const option = options.find(o => o.id === id);
          if (!option) return null;

          return (
            <div
              key={id}
              draggable
              onDragStart={() => handleDragStart(id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragEnd={handleDragEnd}
              className={cn(optionClass(false), 'flex items-center gap-3 cursor-grab', draggedItem === id && 'opacity-50')}
            >
              <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-textMuted)' }} />
              <span className="w-5 text-sm font-medium tabular-nums flex-shrink-0" style={{ color: 'var(--color-textSecondary)' }}>
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {option.text}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    {option.description}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReflectionQuestion({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Share your thoughts..."
        rows={5}
        className="w-full px-4 py-3 rounded-xl border text-sm resize-none bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] placeholder:text-[var(--color-textMuted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
      />
      <p className="mt-2 text-right text-caption tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
        {value.length} characters
      </p>
    </div>
  );
}
