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
import { determineEmployerArchetype } from '../../data/employerArchetypes';
import { SummaryCard } from './SummaryCard';

interface EmployerArchetypeStripProps {
  culturePreferences: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
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

export function EmployerArchetypeStrip({ culturePreferences }: EmployerArchetypeStripProps) {
  const preferences = {
    openness: culturePreferences.openness,
    conscientiousness: culturePreferences.conscientiousness,
    extraversion: culturePreferences.extraversion,
    agreeableness: culturePreferences.agreeableness,
    neuroticism: 100 - culturePreferences.neuroticism,
  };

  const archetypeScores = {
    innovation: preferences.openness,
    collaboration: (preferences.extraversion + preferences.agreeableness) / 2,
    results: preferences.conscientiousness,
    warmth: preferences.agreeableness,
    growth: (preferences.openness + preferences.conscientiousness) / 2,
    excellence: preferences.conscientiousness,
  };

  const archetypes = determineEmployerArchetype(archetypeScores);
  const primaryArchetype = archetypes.primary;


  const ArchetypeIcon = ICON_MAP[primaryArchetype.name] || Lightbulb;

  return (
    <SummaryCard
      label="Culture archetype"
      value={
        <span className="flex items-center gap-2">
          <ArchetypeIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
          {primaryArchetype.name}
        </span>
      }
      detail={primaryArchetype.description}
      action="View culture insights"
      to="/app/employer/insights"
    />
  );
}
