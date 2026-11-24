import {
  Lightbulb,
  Layers,
  Heart,
  Zap,
  Target,
  Music,
  Compass,
  Brain,
} from 'lucide-react';
import { getArchetypeByName } from '../../lib/archetypes';
import { SummaryCard } from './SummaryCard';

interface ArchetypeStripProps {
  topTraits: string[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  lightbulb: Lightbulb,
  layers: Layers,
  heart: Heart,
  zap: Zap,
  target: Target,
  music: Music,
  compass: Compass,
  brain: Brain,
};

export function ArchetypeStrip({ topTraits }: ArchetypeStripProps) {
  const primaryArchetype = topTraits[0] ? getArchetypeByName(topTraits[0]) : null;
  if (!primaryArchetype) return null;

  const ArchetypeIcon = ICON_MAP[primaryArchetype.emoji] || Lightbulb;

  return (
    <SummaryCard
      label="Your archetype"
      value={
        <span className="flex items-center gap-2">
          <ArchetypeIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
          {primaryArchetype.name}
        </span>
      }
      detail={primaryArchetype.description}
      action="View insights"
      to="/app/insights"
    />
  );
}
