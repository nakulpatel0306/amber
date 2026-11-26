import { Brain, Compass, Heart, Layers, Lightbulb, Music, Target, Zap, type LucideIcon } from 'lucide-react';

// Archetype metadata names its icon as a string; the landing resolves it here
export const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  layers: Layers,
  heart: Heart,
  zap: Zap,
  target: Target,
  music: Music,
  compass: Compass,
  brain: Brain,
};
