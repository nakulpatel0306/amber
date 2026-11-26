import {
  Lightbulb,
  Layers,
  Heart,
  Zap,
  Target,
  Compass,
  Brain,
  Shield,
} from 'lucide-react';
import type { EmployerArchetype } from '../../data/employerArchetypes';
import { SummaryCard } from './SummaryCard';

interface EmployerArchetypeStripProps {
  archetype: EmployerArchetype;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'The Innovator': Lightbulb,
  'The Optimizer': Layers,
  'The Collaborator': Heart,
  'The Driver': Zap,
  'The Stabilizer': Shield,
  'The Visionary': Compass,
  'The Nurturer': Brain,
  'The Challenger': Target,
};

export function EmployerArchetypeStrip({ archetype }: EmployerArchetypeStripProps) {
  const ArchetypeIcon = ICON_MAP[archetype.name] || Lightbulb;

  return (
    <SummaryCard
      label="Culture archetype"
      value={
        <span className="flex items-center gap-2">
          <ArchetypeIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
          {archetype.name}
        </span>
      }
      detail={archetype.description}
      action="View culture insights"
      to="/app/employer/insights"
    />
  );
}
