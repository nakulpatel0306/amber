import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { employerCultureArchetype, type EmployerArchetype } from '../../data/employerArchetypes';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { GradientProgressBar } from '../ui/GradientProgressBar';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';

interface CultureScores {
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

export function EmployerAssessmentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<CultureScores | null>(null);
  const [archetype, setArchetype] = useState<EmployerArchetype | null>(null);
  const showLoader = useMinLoader(loading);

  useEffect(() => {
    async function fetchResults() {
      if (!user) {
        navigate('/app/employer/culture-assessment');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('employers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error || !data || !data.culture_quiz_completed) {
          navigate('/app/employer/culture-assessment');
          return;
        }

        setScores({
          openness: data.openness_preference || 50,
          conscientiousness: data.conscientiousness_preference || 50,
          extraversion: data.extraversion_preference || 50,
          agreeableness: data.agreeableness_preference || 50,
          neuroticism: 100 - (data.neuroticism_preference || 50), // Invert for "Stability"
        });
        setArchetype(employerCultureArchetype(data));
      } catch (err) {
        console.error('Error fetching results:', err);
        navigate('/app/employer/culture-assessment');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user, navigate]);

  if (showLoader) {
    return (
      <CoffeeBrewLoader variant="fullscreen" message="Loading assessment results..." />
    );
  }

  if (!scores || !archetype) {
    return null;
  }


  const dimensions = Object.entries(DIMENSION_CONFIG)
    .map(([key, config]) => ({ key, ...config, value: scores[key as keyof CultureScores] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title="Culture profile complete"
        subtitle="Your ideal candidate profile across the five OCEAN traits."
      />

      <section className="bento-card">
        <p className="text-label" style={{ color: 'var(--color-textSecondary)' }}>
          Your culture archetype
        </p>
        <h2 className="mt-2 text-title" style={{ color: 'var(--color-text)' }}>
          {archetype.name}
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          {archetype.description}
        </p>
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text)' }}>
          <span style={{ color: 'var(--color-textMuted)' }}>Ideal candidates </span>
          {archetype.idealCandidates.join(', ')}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
          Ideal candidate traits
        </h2>
        <div className="bento-card mt-3 space-y-4">
          {dimensions.map((dim) => (
            <GradientProgressBar key={dim.key} value={dim.value} label={dim.label} color={dim.color} size="sm" />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Ember now ranks candidates against this profile. Set trait ranges on each role to sharpen the ranking.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button onClick={() => navigate('/app/employer/top-candidates')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Browse candidates
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/employer/insights')}>
            View full insights
          </Button>
          <Button variant="ghost" onClick={() => navigate('/app/employer')}>
            Go to dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
