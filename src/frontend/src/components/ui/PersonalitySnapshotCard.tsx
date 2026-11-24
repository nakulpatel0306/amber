import { Share2 } from 'lucide-react';
import { RadarChart } from './RadarChart';
import { Button } from './Button';

interface PersonalitySnapshotCardProps {
  archetypeName: string;
  topTraits: string[];
  scores: Record<string, number>;
  tagline?: string;
}

export function PersonalitySnapshotCard({
  archetypeName,
  topTraits,
  scores,
  tagline,
}: PersonalitySnapshotCardProps) {
  const handleShare = async () => {
    const text = `My personality archetype is "${archetypeName}" on Ember! Top traits: ${topTraits.join(', ')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Ember personality', text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="bento-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-heading" style={{ color: 'var(--color-text)' }}>
            {archetypeName}
          </h3>
          {tagline && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-textSecondary)' }}>
              {tagline}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          leftIcon={<Share2 className="w-4 h-4" />}
        >
          Share
        </Button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-44 flex-shrink-0">
          <RadarChart scores={scores} size={180} showLabels={false} animated={false} />
        </div>
        {topTraits.length > 0 && (
          <dl className="flex-1 self-stretch sm:self-center">
            <dt className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
              Top traits
            </dt>
            <dd className="mt-0.5 text-sm" style={{ color: 'var(--color-text)' }}>
              {topTraits.join(', ')}
            </dd>
          </dl>
        )}
      </div>
    </div>
  );
}
