import { motion } from 'framer-motion';

interface OceanMindMapProps {
  scores: Record<string, number>;
  colors?: Record<string, string>;
  labels?: Record<string, string>;
  centerLabel?: string;
  centerSubLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  onDimensionClick?: (dimension: string) => void;
  selectedDimension?: string | null;
}

const DEFAULT_COLORS: Record<string, string> = {
  openness: 'var(--color-trait-openness)',
  conscientiousness: 'var(--color-trait-conscientiousness)',
  extraversion: 'var(--color-trait-extraversion)',
  agreeableness: 'var(--color-trait-agreeableness)',
  neuroticism: 'var(--color-trait-stability)',
};

const DEFAULT_LABELS: Record<string, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};

// Label sizes are in viewBox units; the box is wide enough that "Conscientiousness" fits beside its bubble,
// which keeps labels at >= 12px when the map renders at its usual widths
const SIZE_CONFIG = {
  sm: { vbW: 680, vbH: 420, orbitR: 115, minR: 30, maxR: 50, centerR: 32, scoreFontSize: 17, centerFontSize: 13, labelFontSize: 16, labelGap: 10 },
  md: { vbW: 780, vbH: 500, orbitR: 140, minR: 36, maxR: 60, centerR: 38, scoreFontSize: 20, centerFontSize: 14, labelFontSize: 17, labelGap: 12 },
  lg: { vbW: 900, vbH: 580, orbitR: 165, minR: 45, maxR: 75, centerR: 48, scoreFontSize: 24, centerFontSize: 15, labelFontSize: 19, labelGap: 14 },
};


export function OceanMindMap({
  scores,
  colors = DEFAULT_COLORS,
  labels = DEFAULT_LABELS,
  centerLabel,
  centerSubLabel,
  size = 'md',
  animated = true,
  onDimensionClick,
  selectedDimension,
}: OceanMindMapProps) {
  const config = SIZE_CONFIG[size];
  const cx = config.vbW / 2;
  const cy = config.vbH / 2;
  const dimensions = Object.keys(scores);
  const numDimensions = dimensions.length;

  const getPosition = (index: number) => {
    const angle = (Math.PI * 2 * index) / numDimensions - Math.PI / 2;
    return {
      x: cx + config.orbitR * Math.cos(angle),
      y: cy + config.orbitR * Math.sin(angle),
      nx: Math.cos(angle),
      ny: Math.sin(angle),
    };
  };

  const getCircleRadius = (score: number) => {
    const normalized = Math.max(0, Math.min(100, score)) / 100;
    return config.minR + (config.maxR - config.minR) * normalized;
  };

  return (
    <svg
      viewBox={`0 0 ${config.vbW} ${config.vbH}`}
      style={{ display: 'block', margin: '0 auto', width: '100%', height: 'auto' }}
    >
      {/* Connecting lines — from edge of center circle to edge of outer circle */}
      {dimensions.map((dim, i) => {
        const { x, y, nx, ny } = getPosition(i);
        const score = scores[dim] || 0;
        const outerR = getCircleRadius(score);

        const x1 = cx + config.centerR * nx;
        const y1 = cy + config.centerR * ny;
        const x2 = x - outerR * nx;
        const y2 = y - outerR * ny;

        return (
          <motion.line
            key={`line-${dim}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colors[dim] || 'var(--color-border)'}
            strokeWidth="1.5"
            strokeDasharray="4,4"
            initial={animated ? { opacity: 0 } : { opacity: 0.3 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          />
        );
      })}

      {/* Outer dimension circles */}
      {dimensions.map((dim, i) => {
        const { x, y, nx, ny } = getPosition(i);
        const score = scores[dim] || 0;
        const r = getCircleRadius(score);
        const color = colors[dim] || 'var(--color-accent)';
        const label = labels[dim] || dim;
        const isSelected = selectedDimension === dim;

        // Label positioned radially outward from circle edge
        const labelX = x + (r + config.labelGap) * nx;
        const labelY = y + (r + config.labelGap) * ny;
        const textAnchor = nx > 0.3 ? 'start' : nx < -0.3 ? 'end' : 'middle';

        return (
          <motion.g
            key={dim}
            initial={animated ? { opacity: 0 } : undefined}
            animate={animated ? { opacity: 1 } : undefined}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{ cursor: onDimensionClick ? 'pointer' : 'default' }}
            onClick={() => onDimensionClick?.(dim)}
          >
            {/* Circle background + border */}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={color}
              fillOpacity={isSelected ? 0.35 : 0.2}
              stroke={color}
              strokeWidth={isSelected ? 3 : 2}
            />

            {/* Score value — centered inside circle */}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontSize={config.scoreFontSize}
              fontWeight="600"
              style={{ pointerEvents: 'none' }}
            >
              {Math.round(score)}
            </text>

            {/* Label — outside circle, radially outward */}
            <text
              x={labelX}
              y={labelY}
              textAnchor={textAnchor}
              dominantBaseline="central"
              fill="var(--color-textSecondary)"
              fontSize={config.labelFontSize}
              fontWeight="500"
              style={{ pointerEvents: 'none' }}
            >
              {label}
            </text>
          </motion.g>
        );
      })}

      {/* Center circle — always visible */}
      <motion.g
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ duration: 0.4 }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={config.centerR}
          fill="var(--color-surface)"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        {centerLabel ? (
          <>
            <text
              x={cx}
              y={centerSubLabel ? cy - config.centerFontSize * 0.45 : cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-text)"
              fontSize={config.centerFontSize}
              fontWeight="600"
            >
              {centerLabel}
            </text>
            {centerSubLabel && (
              <text
                x={cx}
                y={cy + config.centerFontSize * 0.65}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--color-textMuted)"
                fontSize={config.centerFontSize - 2}
              >
                {centerSubLabel}
              </text>
            )}
          </>
        ) : (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-textMuted)"
            fontSize={config.centerFontSize}
            fontWeight="600"
          >
            OCEAN
          </text>
        )}
      </motion.g>
    </svg>
  );
}
