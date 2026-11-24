import { motion } from 'framer-motion';

interface GradientProgressBarProps {
  value: number;
  color?: string;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const SIZE_CONFIG = {
  sm: { height: 6, textSize: 'text-sm' },
  md: { height: 8, textSize: 'text-sm' },
  lg: { height: 10, textSize: 'text-base' },
};

// The color goes on the bar only; label and value stay in text colors so a list of bars reads as one list
export function GradientProgressBar({
  value,
  color = 'var(--color-accent)',
  label,
  showValue = true,
  size = 'md',
  animated = true,
}: GradientProgressBarProps) {
  const config = SIZE_CONFIG[size];
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className={`flex justify-between items-baseline gap-3 mb-1.5 ${config.textSize}`}>
          {label && (
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>
              {label}
            </span>
          )}
          {showValue && (
            <span className="tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
              {Math.round(clampedValue)}
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: config.height,
          backgroundColor: 'var(--color-border)',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: animated ? 0.2 : 0 }}
        />
      </div>
    </div>
  );
}
