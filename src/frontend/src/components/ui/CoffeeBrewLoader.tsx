import { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

const STEPS = [
  'Grinding fresh beans...',
  'Heating the water...',
  'Brewing your perfect cup...',
  'Almost ready...',
] as const;

const STEP_DURATION = 1800;
// Long enough to avoid a flash on fast loads, short enough not to stall the demo's instant data
const MIN_LOADER_MS = 400;

export interface CoffeeBrewLoaderProps {
  variant?: 'fullscreen' | 'section' | 'content' | 'inline';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showRotatingMessages?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { dot: 6, gap: 'gap-1', text: 'text-xs' },
  md: { dot: 8, gap: 'gap-1.5', text: 'text-sm' },
  lg: { dot: 10, gap: 'gap-2', text: 'text-base' },
};

const DOT_COLORS = [
  'var(--color-accent)',
  'var(--color-warning)',
  'var(--color-accent)',
  'var(--color-warning)',
];

/**
 * Hook that enforces a minimum display time for loading states.
 * Returns true for at least `minMs` after `loading` first becomes true.
 */
export function useMinLoader(loading: boolean, minMs = MIN_LOADER_MS): boolean {
  const [visible, setVisible] = useState(loading);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now();
      setVisible(true);
    } else if (visible) {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, minMs - elapsed);
      const timer = setTimeout(() => setVisible(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [loading, minMs]);

  return visible;
}

export function CoffeeBrewLoader({
  variant = 'section',
  message,
  size = 'md',
  showRotatingMessages: _showRotatingMessages = false,
  className,
}: CoffeeBrewLoaderProps) {
  const [step, setStep] = useState(0);

  const cycling = !message;
  useEffect(() => {
    if (!cycling) return;
    const id = setInterval(() => setStep(prev => (prev + 1) % STEPS.length), STEP_DURATION);
    return () => clearInterval(id);
  }, [cycling]);

  const { dot: dotSize, gap, text: textClass } = sizeConfig[size];
  const displayLabel = message || STEPS[step];

  const dots = (
    <div className={cn('flex items-center', gap)}>
      {DOT_COLORS.map((color, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            animation: 'dotPulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  const label = (
    <p
      key={displayLabel}
      className={cn(textClass, 'font-medium')}
      style={{
        color: 'var(--color-textMuted)',
        animation: 'slideInUp 0.3s ease-out',
      }}
    >
      {displayLabel}
    </p>
  );

  const wrapperClass = cn(
    'flex items-center justify-center',
    // In-flow so the app shell (sidebar, top bar) stays put while a page loads
    variant === 'fullscreen' && 'w-full min-h-[70vh]',
    variant === 'section' && 'py-12 w-full',
    variant === 'content' && 'w-full flex-1 min-h-[400px]',
    variant === 'inline' && 'gap-3',
    className,
  );

  if (variant === 'inline') {
    return (
      <div className={wrapperClass}>
        {dots}
        {label}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center gap-3">
        {dots}
        {label}
      </div>
    </div>
  );
}
