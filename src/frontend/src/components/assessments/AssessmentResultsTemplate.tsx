import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { GradientProgressBar } from '../ui/GradientProgressBar';

interface DimensionScore {
  key: string;
  label: string;
  value: number;
}

interface AssessmentResultsTemplateProps {
  title: string;
  subtitle: string;
  dimensions: DimensionScore[];
  enhancedMessage: string;
  profileUrl?: string;
  matchesUrl?: string;
  profileLabel?: string;
  matchesLabel?: string;
}

// Bars encode a trait, so they take the trait color; neuroticism is shown as stability
const TRAIT_COLORS: Record<string, string> = {
  openness: 'var(--color-trait-openness)',
  conscientiousness: 'var(--color-trait-conscientiousness)',
  extraversion: 'var(--color-trait-extraversion)',
  agreeableness: 'var(--color-trait-agreeableness)',
  neuroticism: 'var(--color-trait-stability)',
};

export function AssessmentResultsTemplate({
  title,
  subtitle,
  dimensions,
  enhancedMessage,
  profileUrl = '/app/insights',
  matchesUrl = '/app/ember',
  profileLabel = 'View full profile',
  matchesLabel = 'Find matches',
}: AssessmentResultsTemplateProps) {
  const navigate = useNavigate();
  const sortedDimensions = [...dimensions].sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner title={title} subtitle={subtitle} />

      <section>
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
          Trait scores
        </h2>
        <div className="bento-card mt-3 space-y-4">
          {sortedDimensions.map((dim) => (
            <GradientProgressBar
              key={dim.key}
              value={dim.value}
              label={dim.label}
              color={TRAIT_COLORS[dim.key]}
              size="sm"
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          {enhancedMessage}
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={() => navigate(matchesUrl)} rightIcon={<ArrowRight className="w-4 h-4" />}>
            {matchesLabel}
          </Button>
          <Button variant="outline" onClick={() => navigate(profileUrl)}>
            {profileLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
