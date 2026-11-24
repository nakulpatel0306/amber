import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { determineArchetype, getArchetypeByName, type Archetype } from '../../lib/archetypes';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { GradientProgressBar } from '../ui/GradientProgressBar';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';

interface AssessmentData {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

const DIMENSION_CONFIG = {
  openness: { label: 'Openness', color: 'var(--color-trait-openness)' },
  conscientiousness: { label: 'Conscientiousness', color: 'var(--color-trait-conscientiousness)' },
  extraversion: { label: 'Extraversion', color: 'var(--color-trait-extraversion)' },
  agreeableness: { label: 'Agreeableness', color: 'var(--color-trait-agreeableness)' },
  neuroticism: { label: 'Stability', color: 'var(--color-trait-stability)' },
};

export function AssessmentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<AssessmentData | null>(null);
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const showLoader = useMinLoader(loading);

  useEffect(() => {
    async function fetchResults() {
      if (!user) {
        navigate('/app/assessment');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score, top_traits')
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          navigate('/app/assessment');
          return;
        }

        const raw = {
          openness: data.openness_score || 50,
          conscientiousness: data.conscientiousness_score || 50,
          extraversion: data.extraversion_score || 50,
          agreeableness: data.agreeableness_score || 50,
          neuroticism: data.neuroticism_score || 50,
        };

        // The assessment stores the archetype name first in top_traits; classify only if it is missing
        const stored = data.top_traits?.[0] ? getArchetypeByName(data.top_traits[0]) : null;
        setArchetype(stored ?? determineArchetype(raw));

        setScores({
          ...raw,
          neuroticism: 100 - raw.neuroticism, // Invert for "Stability"
        });
      } catch (err) {
        console.error('Error fetching results:', err);
        navigate('/app/assessment');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user, navigate]);

  if (showLoader) {
    return (
      <CoffeeBrewLoader variant="fullscreen" message="Loading your results..." />
    );
  }

  if (!scores) {
    return null;
  }

  const dimensions = Object.entries(DIMENSION_CONFIG)
    .map(([key, config]) => ({ key, ...config, value: scores[key as keyof AssessmentData] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title="Assessment complete"
        subtitle="Here is how you scored on the five OCEAN traits."
      />

      {archetype && (
        <section className="bento-card">
          <p className="text-label" style={{ color: 'var(--color-textSecondary)' }}>
            Your archetype
          </p>
          <h2 className="mt-2 text-title" style={{ color: 'var(--color-text)' }}>
            {archetype.name}
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {archetype.description}
          </p>
          {archetype.strengths.length > 0 && (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-textMuted)' }}>Strengths </span>
              {archetype.strengths.join(', ')}
            </p>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
          Trait scores
        </h2>
        <div className="bento-card mt-3 space-y-4">
          {dimensions.map((dim) => (
            <GradientProgressBar key={dim.key} value={dim.value} label={dim.label} color={dim.color} size="sm" />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Ember now ranks every open role against these scores, and employers see you in their candidate lists.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={() => navigate('/app/ember')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            See your matches
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/insights')}>
            View full insights
          </Button>
          <Button variant="ghost" onClick={() => navigate('/app/dashboard')}>
            Go to dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
