import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { GradientProgressBar } from '../ui/GradientProgressBar';
import { ArchetypeCard } from '../ui/ArchetypeCard';
import { PersonalitySnapshotCard } from '../ui/PersonalitySnapshotCard';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { getArchetypeByName } from '../../lib/archetypes';
import { calculateCombinedOCEAN, type OCEANScores } from '../../lib/personalityEngine';

interface PersonalityData {
  openness_score: number | null;
  conscientiousness_score: number | null;
  extraversion_score: number | null;
  agreeableness_score: number | null;
  neuroticism_score: number | null;
  top_traits: string[] | null;
  assessment_completed_at: string | null;
  visual_perception_data: Record<string, unknown> | null;
  work_values_data: Record<string, unknown> | null;
  situational_judgment_data: Record<string, unknown> | null;
  cognitive_patterns_data: Record<string, unknown> | null;
}

const OCEAN_INFO = {
  openness: {
    label: 'Openness',
    fullLabel: 'Openness to experience',
    shortDesc: 'Creativity and curiosity',
    description: 'Measures your intellectual curiosity, creativity, and preference for novelty and variety.',
    workplaceImpact: 'Influences how you approach problem-solving, adapt to change, and engage with innovative ideas.',
    highTraits: ['Creative and imaginative thinking', 'Intellectual curiosity and love of learning', 'Comfort with ambiguity', 'Willingness to try new approaches'],
    lowTraits: ['Practical and grounded decision-making', 'Preference for proven methods', 'Focus on concrete outcomes', 'Detail-oriented execution'],
    idealRoles: ['Product design', 'R&D', 'Marketing', 'Strategy', 'Content creation'],
    cultureMatch: ['Innovative startups', 'Creative agencies', 'Research institutions'],
    color: 'var(--color-trait-openness)',
  },
  conscientiousness: {
    label: 'Conscientiousness',
    fullLabel: 'Conscientiousness',
    shortDesc: 'Organization and discipline',
    description: 'Reflects your tendency to be organized, dependable, and goal-directed.',
    workplaceImpact: 'The strongest personality predictor of job performance across most occupations.',
    highTraits: ['Strong organizational skills', 'Reliable and meets deadlines', 'Attention to detail and quality', 'Self-disciplined and motivated'],
    lowTraits: ['Flexible and spontaneous', 'Comfortable with last-minute changes', 'Big-picture focus', 'Adaptable to shifting priorities'],
    idealRoles: ['Project management', 'Operations', 'Finance', 'QA', 'Data analysis'],
    cultureMatch: ['Structured enterprises', 'Regulated industries', 'Process-driven orgs'],
    color: 'var(--color-trait-conscientiousness)',
  },
  extraversion: {
    label: 'Extraversion',
    fullLabel: 'Extraversion',
    shortDesc: 'Social energy and assertiveness',
    description: 'Indicates how much you are energized by social interaction and external stimulation.',
    workplaceImpact: 'Influences your collaboration style, leadership approach, and professional relationships.',
    highTraits: ['Energized by teamwork', 'Natural communicator', 'Builds rapport easily', 'Thrives in fast-paced environments'],
    lowTraits: ['Deep, focused work', 'Thoughtful listener', 'Independent problem-solving', 'Reflective decision-making'],
    idealRoles: ['Sales', 'Leadership', 'Public relations', 'Client success', 'Team management'],
    cultureMatch: ['Collaborative teams', 'Client-facing roles', 'High-energy environments'],
    color: 'var(--color-trait-extraversion)',
  },
  agreeableness: {
    label: 'Agreeableness',
    fullLabel: 'Agreeableness',
    shortDesc: 'Cooperation and empathy',
    description: 'Measures your tendency toward cooperation, trust, and consideration for others.',
    workplaceImpact: 'Affects team dynamics, conflict resolution, and stakeholder management.',
    highTraits: ['Builds harmonious relationships', 'Empathetic and understanding', 'Skilled at conflict resolution', 'Customer and people-focused'],
    lowTraits: ['Objective and analytical thinking', 'Comfortable with difficult decisions', 'Direct and straightforward', 'Competitive drive'],
    idealRoles: ['Human resources', 'Customer service', 'Healthcare', 'Teaching', 'Counseling'],
    cultureMatch: ['People-first cultures', 'Service industries', 'Mission-driven orgs'],
    color: 'var(--color-trait-agreeableness)',
  },
  neuroticism: {
    label: 'Stability',
    fullLabel: 'Emotional stability',
    shortDesc: 'Resilience and composure',
    description: 'Reflects your emotional resilience and ability to remain calm under pressure.',
    workplaceImpact: 'Influences how you handle pressure, respond to criticism, and maintain performance.',
    highTraits: ['Calm under pressure', 'Resilient when facing setbacks', 'Consistent performance', 'Steady emotional presence'],
    lowTraits: ['Highly attuned to risks', 'Passionate and emotionally invested', 'Detail-conscious', 'Empathetic to concerns'],
    idealRoles: ['Crisis management', 'Executive leadership', 'High-stakes negotiations'],
    cultureMatch: ['Fast-paced startups', 'High-pressure industries'],
    color: 'var(--color-trait-stability)',
  },
};

const ADDITIONAL_ASSESSMENTS = [
  {
    id: 'visual-perception',
    name: 'Visual perception test',
    description: 'Discover your perceptual style through visual challenges.',
    duration: '~5 min',
    status: 'available' as const,
    dataField: 'visual_perception_data',
    traits: ['Perceptual style', 'Attention patterns', 'Cognitive flexibility'],
    weight: '10%',
  },
  {
    id: 'work-values',
    name: 'Drive and motivation',
    description: 'Explore what drives you at work — purpose, growth, recognition, and more.',
    duration: '~5 min',
    status: 'available' as const,
    dataField: 'work_values_data',
    traits: ['Values', 'Motivation', 'Career goals'],
    weight: '15%',
  },
  {
    id: 'situational-judgment',
    name: 'Social energy',
    description: 'How do you handle real workplace scenarios? Conflicts, pressure, and feedback.',
    duration: '~5 min',
    status: 'available' as const,
    dataField: 'situational_judgment_data',
    traits: ['Conflict styles', 'Emotions', 'Work behavior'],
    weight: '15%',
  },
  {
    id: 'cognitive-patterns',
    name: 'Cognitive style',
    description: 'Explore your problem-solving approach, decision-making, and learning preferences.',
    duration: '~5 min',
    status: 'available' as const,
    dataField: 'cognitive_patterns_data',
    traits: ['Problem-solving', 'Decisions', 'Learning style'],
    weight: '11%',
  },
];

export function PersonalityInsights() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [personalityData, setPersonalityData] = useState<PersonalityData | null>(null);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [assessmentCooldowns, setAssessmentCooldowns] = useState<Record<string, number | null>>({});
  const [showSnapshotCard, setShowSnapshotCard] = useState(false);
  const showLoader = useMinLoader(isLoading);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: candidate } = await supabase
        .from('candidates')
        .select('openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score, top_traits, assessment_completed_at')
        .eq('user_id', user.id)
        .single();

      if (candidate) {
        let supplementary: Record<string, unknown> = {
          visual_perception_data: null,
          work_values_data: null,
          situational_judgment_data: null,
          cognitive_patterns_data: null,
        };

        try {
          const { data: supData } = await supabase
            .from('candidates')
            .select('visual_perception_data, work_values_data, situational_judgment_data, cognitive_patterns_data')
            .eq('user_id', user.id)
            .single();
          if (supData) supplementary = supData as Record<string, unknown>;
        } catch { /* columns may not exist */ }

        setPersonalityData({
          ...candidate,
          visual_perception_data: (supplementary.visual_perception_data as Record<string, unknown>) ?? null,
          work_values_data: (supplementary.work_values_data as Record<string, unknown>) ?? null,
          situational_judgment_data: (supplementary.situational_judgment_data as Record<string, unknown>) ?? null,
          cognitive_patterns_data: (supplementary.cognitive_patterns_data as Record<string, unknown>) ?? null,
        } as PersonalityData);

        // Calculate cooldowns
        const cooldownMs = 7 * 24 * 60 * 60 * 1000;
        const cooldowns: Record<string, number | null> = {};
        const assessmentFields = [
          { id: 'visual-perception', data: supplementary.visual_perception_data },
          { id: 'work-values', data: supplementary.work_values_data },
          { id: 'situational-judgment', data: supplementary.situational_judgment_data },
          { id: 'cognitive-patterns', data: supplementary.cognitive_patterns_data },
        ];
        for (const { id, data } of assessmentFields) {
          const completedAt = (data as Record<string, unknown> | null)?.completed_at as string | undefined;
          if (completedAt) {
            const timeSince = Date.now() - new Date(completedAt).getTime();
            cooldowns[id] = timeSince < cooldownMs ? cooldownMs - timeSince : null;
          } else {
            cooldowns[id] = null;
          }
        }
        setAssessmentCooldowns(cooldowns);

        if (candidate.assessment_completed_at) {
          const timeSince = Date.now() - new Date(candidate.assessment_completed_at).getTime();
          if (timeSince < cooldownMs) setCooldownRemaining(cooldownMs - timeSince);
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // Cooldown timer
  useEffect(() => {
    const hasAnyCooldown = cooldownRemaining !== null || Object.values(assessmentCooldowns).some(v => v !== null && v > 0);
    if (!hasAnyCooldown) return;

    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev === null || prev <= 1000) return null;
        return prev - 1000;
      });
      setAssessmentCooldowns(prev => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          if (updated[key] !== null && updated[key]! > 0) {
            updated[key] = updated[key]! <= 1000 ? null : updated[key]! - 1000;
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownRemaining, assessmentCooldowns]);

  const hasCompletedAssessment = personalityData?.openness_score !== null && personalityData?.openness_score !== undefined;

  if (showLoader) {
    return (
      <CoffeeBrewLoader variant="fullscreen" message="Loading personality insights..." />
    );
  }

  if (!hasCompletedAssessment) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="text-center max-w-sm">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>Discover your personality</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Take the personality assessment to unlock your insights and find jobs that fit your style.
          </p>
          <Button className="mt-6" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/app/personality')}>
            Start assessment
          </Button>
        </div>
      </div>
    );
  }

  // Build combined OCEAN scores
  const coreScores: OCEANScores = {
    openness: personalityData?.openness_score || 0,
    conscientiousness: personalityData?.conscientiousness_score || 0,
    extraversion: personalityData?.extraversion_score || 0,
    agreeableness: personalityData?.agreeableness_score || 0,
    neuroticism: personalityData?.neuroticism_score || 0,
  };

  const vpData = personalityData?.visual_perception_data as Record<string, unknown> | null;
  const wvData = personalityData?.work_values_data as Record<string, unknown> | null;
  const sjData = personalityData?.situational_judgment_data as Record<string, unknown> | null;
  const cpData = personalityData?.cognitive_patterns_data as Record<string, unknown> | null;

  const supplementaryScores: {
    visualPerception?: Partial<Record<keyof OCEANScores, number>>;
    workValues?: OCEANScores;
    situationalJudgment?: OCEANScores;
    cognitivePatterns?: OCEANScores;
  } = {};

  if (vpData?.trait_modifiers) {
    const mods = vpData.trait_modifiers as Record<string, number>;
    supplementaryScores.visualPerception = {
      openness: mods.openness ?? 0,
      conscientiousness: mods.conscientiousness ?? 0,
      extraversion: mods.extraversion ?? 0,
      agreeableness: mods.agreeableness ?? 0,
      neuroticism: mods.neuroticism_inv ? -mods.neuroticism_inv : 0,
    };
  }
  if (wvData?.ocean_scores) supplementaryScores.workValues = wvData.ocean_scores as OCEANScores;
  if (sjData?.ocean_scores) supplementaryScores.situationalJudgment = sjData.ocean_scores as OCEANScores;
  if (cpData?.ocean_scores) supplementaryScores.cognitivePatterns = cpData.ocean_scores as OCEANScores;

  const combinedOcean = calculateCombinedOCEAN(
    coreScores,
    Object.keys(supplementaryScores).length > 0 ? supplementaryScores : undefined
  );

  const scores = {
    openness: combinedOcean.openness,
    conscientiousness: combinedOcean.conscientiousness,
    extraversion: combinedOcean.extraversion,
    agreeableness: combinedOcean.agreeableness,
    neuroticism: 100 - combinedOcean.neuroticism,
  };

  const formatCooldown = (ms: number) => {
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days} days`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    return `${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  const handleAssessmentClick = (assessmentId: string, isCompleted: boolean, cooldown: number | null | undefined) => {
    if (isCompleted && cooldown !== null && cooldown !== undefined && cooldown > 0) {
      showError('Cooldown active', `You can retake this in ${Math.ceil(cooldown / (1000 * 60 * 60 * 24))} days`);
      return;
    }
    navigate(`/app/assessments/${assessmentId}`);
  };

  // Completion tracking
  const completedAssessments = [true, !!vpData, !!wvData, !!sjData, !!cpData];
  const completionCount = completedAssessments.filter(Boolean).length;

  // Derived insights
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominantDimension = sortedScores[0][0] as keyof typeof OCEAN_INFO;
  // Decision-making style
  const decisionStyle = scores.conscientiousness > 65
    ? (scores.openness > 60 ? 'Strategic Analyzer' : 'Methodical Planner')
    : (scores.openness > 60 ? 'Intuitive Explorer' : 'Adaptive Pragmatist');

  const communicationStyle = scores.extraversion > 65
    ? (scores.agreeableness > 60 ? 'Warm Collaborator' : 'Direct Communicator')
    : (scores.agreeableness > 60 ? 'Thoughtful Listener' : 'Focused Contributor');

  const problemSolvingStyle = scores.openness > 65
    ? (scores.conscientiousness > 60 ? 'Creative Systematizer' : 'Divergent Thinker')
    : (scores.conscientiousness > 60 ? 'Structured Problem-Solver' : 'Practical Troubleshooter');

  // Energy map
  const energizers: string[] = [];
  const drainers: string[] = [];

  if (scores.openness > 60) { energizers.push('New challenges and ideas'); drainers.push('Repetitive routine tasks'); }
  else { energizers.push('Mastering proven methods'); drainers.push('Constant change and ambiguity'); }
  if (scores.extraversion > 60) { energizers.push('Team brainstorming'); drainers.push('Extended solo work'); }
  else { energizers.push('Deep focused work'); drainers.push('Back-to-back meetings'); }
  if (scores.agreeableness > 60) { energizers.push('Helping others succeed'); drainers.push('Competitive environments'); }
  else { energizers.push('Healthy competition'); drainers.push('Too much consensus-building'); }
  if (scores.conscientiousness > 60) { energizers.push('Clear goals and progress'); drainers.push('Unclear expectations'); }
  else { energizers.push('Flexible schedules'); drainers.push('Rigid processes'); }

  // Archetype name for header
  const primaryArchetype = personalityData?.top_traits?.[0] || 'The Explorer';
  // Same tagline the results page shows for this archetype
  const tagline = getArchetypeByName(primaryArchetype)?.description || 'A unique blend of traits that makes you distinctively you';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title={primaryArchetype}
        subtitle={tagline}
        belowSubtitle={
          <Facts
            items={[
              { label: 'Strongest trait', value: OCEAN_INFO[dominantDimension]?.label || 'Openness' },
              { label: 'Decision style', value: decisionStyle },
              { label: 'Top score', value: sortedScores[0]?.[1] || 0 },
            ]}
          />
        }
        rightContent={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSnapshotCard(!showSnapshotCard)}>
              {showSnapshotCard ? 'Hide snapshot' : 'Share profile'}
            </Button>
            {cooldownRemaining && cooldownRemaining > 0 ? (
              <span className="text-label" style={{ color: 'var(--color-textMuted)' }}>
                Retake in {formatCooldown(cooldownRemaining)}
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => navigate('/app/personality')}
              >
                Retake
              </Button>
            )}
          </>
        }
      />

      <AnimatePresence>
        {showSnapshotCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-10">
              <PersonalitySnapshotCard
                archetypeName={primaryArchetype}
                topTraits={personalityData?.top_traits?.slice(0, 3) || []}
                scores={scores}
                tagline={tagline}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Section
        title="Trait scores"
        aside={completionCount > 1 && (
          <span className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
            Includes {completionCount - 1} supplementary assessment{completionCount > 2 ? 's' : ''}
          </span>
        )}
        first
      >
        <ul className="bento-card !p-0 overflow-hidden">
          {(Object.entries(OCEAN_INFO) as [keyof typeof OCEAN_INFO, typeof OCEAN_INFO[keyof typeof OCEAN_INFO]][]).map(([key, info], i) => (
            <TraitRow
              key={key}
              info={info}
              score={scores[key]}
              divided={i > 0}
              expanded={expandedDimension === key}
              onToggle={() => setExpandedDimension(expandedDimension === key ? null : key)}
            />
          ))}
        </ul>
      </Section>

      {personalityData?.top_traits && personalityData.top_traits.length > 0 && (
        <Section title="Your archetypes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personalityData.top_traits.slice(0, 3).map((trait, index) => {
              const arch = getArchetypeByName(trait);
              const variants: ('primary' | 'secondary' | 'tertiary')[] = ['primary', 'secondary', 'tertiary'];
              return (
                <ArchetypeCard
                  key={trait}
                  name={trait}
                  description={arch?.description || ''}
                  strengths={arch?.strengths || []}
                  idealEnvironments={arch?.idealEnvironments || []}
                  variant={variants[index]}
                />
              );
            })}
          </div>
        </Section>
      )}

      <Section title="How you work">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bento-card">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Thinking and operating style</h3>
            <dl className="mt-4 space-y-3">
              <Detail label="Decision-making">{decisionStyle}</Detail>
              <Detail label="Communication">{communicationStyle}</Detail>
              <Detail label="Problem-solving">{problemSolvingStyle}</Detail>
            </dl>
          </div>
          <div className="bento-card">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Energy</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DotList title="What energizes you" items={energizers} dot="var(--color-success)" />
              <DotList title="What drains you" items={drainers} dot="var(--color-error)" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Where you fit">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bento-card">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Work settings you thrive in</h3>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Detail label={scores.openness > 60 ? 'Innovation-driven' : 'Proven methods'}>
                {scores.openness > 60 ? 'Values creativity' : 'Values stability'}
              </Detail>
              <Detail label={scores.conscientiousness > 60 ? 'Goal-oriented' : 'Flexible goals'}>
                {scores.conscientiousness > 60 ? 'Clear metrics' : 'Adaptive objectives'}
              </Detail>
              <Detail label={scores.extraversion > 60 ? 'Collaborative' : 'Focused work'}>
                {scores.extraversion > 60 ? 'Team-based' : 'Independent'}
              </Detail>
              <Detail label={scores.agreeableness > 60 ? 'People-first' : 'Results-first'}>
                {scores.agreeableness > 60 ? 'Relationships' : 'Outcomes'}
              </Detail>
            </dl>
          </div>
          <div className="bento-card flex flex-col">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Team and culture fit</h3>
            <dl className="mt-4 space-y-3">
              <Detail label="Company size">
                {scores.conscientiousness > 65 ? 'Mid-size to enterprise' : scores.openness > 65 ? 'Startups to mid-size' : 'Flexible across sizes'}
              </Detail>
              <Detail label="Team dynamic">
                {scores.extraversion > 65 ? 'Collaborative and social' : scores.extraversion < 35 ? 'Small and focused' : 'Balanced teams'}
              </Detail>
              <Detail label="Management style">
                {scores.conscientiousness > 65 ? 'Structured and clear' : scores.openness > 65 ? 'Autonomous and trust-based' : 'Supportive and flexible'}
              </Detail>
            </dl>
            <Link
              to="/app/ember"
              className="group mt-auto pt-5 inline-flex items-center gap-1.5 self-start text-label"
              style={{ color: 'var(--color-accent)' }}
            >
              View your matches
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Section>

      <Section title="Growth edges">
        <div className="bento-card grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {sortedScores.slice(-2).map(([key, value]) => {
            const info = OCEAN_INFO[key as keyof typeof OCEAN_INFO];
            return (
              <div key={key}>
                <GradientProgressBar value={value} label={info.fullLabel} color={info.color} size="sm" />
                <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                  {GROWTH_TIPS[key]}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Enhance your profile"
        aside={
          <span className="text-caption tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
            {completionCount} of {completedAssessments.length} complete
          </span>
        }
      >
        <p className="-mt-1 mb-3 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Each extra assessment sharpens your trait scores and your matches.
        </p>
        <ul className="bento-card !p-0 overflow-hidden">
          {ADDITIONAL_ASSESSMENTS.map((assessment, i) => {
            const isAvailable = assessment.status === 'available';
            const isCompleted = personalityData
              ? !!(personalityData as unknown as Record<string, unknown>)[assessment.dataField]
              : false;
            const cooldown = assessmentCooldowns[assessment.id];
            const isOnCooldown = isCompleted && cooldown !== null && cooldown !== undefined && cooldown > 0;

            return (
              <li
                key={assessment.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4"
                style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{assessment.name}</h3>
                    {isCompleted && <StatusDot label="Done" />}
                  </div>
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>{assessment.description}</p>
                  <p className="mt-1 text-caption" style={{ color: 'var(--color-textMuted)' }}>
                    {assessment.duration} · {assessment.traits.join(', ')}
                  </p>
                </div>
                {isAvailable ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start sm:self-auto flex-shrink-0"
                    onClick={() => handleAssessmentClick(assessment.id, isCompleted, cooldown)}
                  >
                    {isOnCooldown ? `Retake in ${formatCooldown(cooldown!)}` : isCompleted ? 'Retake' : 'Start'}
                  </Button>
                ) : (
                  <span className="text-label flex-shrink-0" style={{ color: 'var(--color-textMuted)' }}>Coming soon</span>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <section className="mt-10 bento-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Ready to find your match?</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            See companies whose culture lines up with your profile.
          </p>
        </div>
        <Button
          className="self-start sm:self-auto flex-shrink-0"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/app/ember')}
        >
          View matches
        </Button>
      </section>
    </div>
  );
}

const GROWTH_TIPS: Record<string, string> = {
  openness: 'Try experimenting with one new approach per week in your work.',
  conscientiousness: 'Start with small planning habits — even a daily 5-minute review helps.',
  extraversion: 'Practice sharing one idea per meeting, even informally.',
  agreeableness: 'Try active listening exercises to deepen team connections.',
  neuroticism: 'Build a stress toolkit — breathing exercises, journaling, or physical activity.',
};

function Section({
  title,
  aside,
  first = false,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={first ? undefined : 'mt-10'}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption" style={{ color: 'var(--color-textMuted)' }}>{label}</dt>
      <dd className="mt-0.5 text-sm" style={{ color: 'var(--color-text)' }}>{children}</dd>
    </div>
  );
}

function DotList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <p className="text-caption" style={{ color: 'var(--color-textMuted)' }}>{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-text)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-caption" style={{ color: 'var(--color-textSecondary)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
      {label}
    </span>
  );
}

// One trait: the score bar is always visible and the explanation opens in place
function TraitRow({
  info,
  score,
  divided,
  expanded,
  onToggle,
}: {
  info: typeof OCEAN_INFO[keyof typeof OCEAN_INFO];
  score: number;
  divided: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const traits = score >= 50 ? info.highTraits : info.lowTraits;

  return (
    <li style={{ borderTop: divided ? '1px solid var(--color-border)' : undefined }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full px-4 sm:px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-surfaceHover)]"
      >
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="min-w-0 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {info.fullLabel}
            <span className="hidden sm:inline font-normal" style={{ color: 'var(--color-textMuted)' }}> · {info.shortDesc}</span>
          </span>
          <span className="flex items-center gap-2 text-sm tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
            {score}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--color-textMuted)' }}
            />
          </span>
        </div>
        <GradientProgressBar value={score} showValue={false} size="sm" color={info.color} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-4 sm:px-5 pb-5 pt-1">
              <div className="space-y-2 text-sm">
                <p style={{ color: 'var(--color-text)' }}>{info.description}</p>
                <p style={{ color: 'var(--color-textSecondary)' }}>{info.workplaceImpact}</p>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
                    {score >= 50 ? 'Your strengths' : 'Your approach'}
                  </dt>
                  <dd className="mt-1">
                    <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
                      {traits.map((trait) => <li key={trait}>{trait}</li>)}
                    </ul>
                  </dd>
                </div>
                <Detail label="Ideal roles">{info.idealRoles.join(', ')}</Detail>
                <Detail label="Culture match">{info.cultureMatch.join(', ')}</Detail>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default PersonalityInsights;
