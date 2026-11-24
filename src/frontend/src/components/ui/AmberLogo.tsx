import { useId } from 'react';
import { cn } from '../../utils/cn';

interface AmberLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'full';
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', svg: 32 },
  md: { container: 'w-10 h-10', svg: 40 },
  lg: { container: 'w-12 h-12', svg: 48 },
  xl: { container: 'w-14 h-14', svg: 56 },
  '2xl': { container: 'w-20 h-20', svg: 80 },
};

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

// Blade paths forming hexagonal aperture with six-pointed star negative space
const blades = [
  { id: 1, path: 'M 100 30 L 160.62 65 L 111 80.95 Z', color: '#FCD34D' },
  { id: 2, path: 'M 160.62 65 L 160.62 135 L 122 100 Z', color: '#FCD34D' },
  { id: 3, path: 'M 160.62 135 L 100 170 L 111 119.05 Z', color: '#FBBF24' },
  { id: 4, path: 'M 100 170 L 39.38 135 L 89 119.05 Z', color: '#F59E0B' },
  { id: 5, path: 'M 39.38 135 L 39.38 65 L 78 100 Z', color: '#F59E0B' },
  { id: 6, path: 'M 39.38 65 L 100 30 L 89 80.95 Z', color: '#FBBF24' },
];

/**
 * Amber aperture logo: six triangular blades forming a hexagon
 * with a six-pointed star negative space, over a soft bloom.
 */
function AmberMark({ size }: { size: number }) {
  const bloomId = `amber-bloom-${useId().replace(/:/g, '')}`;

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id={bloomId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
        </filter>
      </defs>

      {/* Bloom layer (blurred copies underneath) */}
      <g filter={`url(#${bloomId})`} opacity="0.85">
        {blades.map((blade) => (
          <path key={`bloom-${blade.id}`} d={blade.path} fill={blade.color} />
        ))}
      </g>

      {/* Crisp layer (sharp copies on top) */}
      <g>
        {blades.map((blade) => (
          <path key={`crisp-${blade.id}`} d={blade.path} fill={blade.color} />
        ))}
      </g>
    </svg>
  );
}

export function AmberLogo({
  size = 'md',
  variant = 'icon',
  className,
}: AmberLogoProps) {
  const config = sizeMap[size];

  const iconEl = (
    <div
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        config.container,
        className
      )}
    >
      <AmberMark size={config.svg} />
    </div>
  );

  if (variant === 'full') {
    return (
      <div className="flex items-center gap-3">
        <div style={{ transform: 'translateY(15%)' }}>
          {iconEl}
        </div>
        <span
          className={cn('font-semibold lowercase tracking-wide', textSizeMap[size])}
          style={{ color: 'var(--color-text)' }}
        >
          amber
        </span>
      </div>
    );
  }

  return iconEl;
}
