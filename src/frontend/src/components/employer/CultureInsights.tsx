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
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { employerCultureArchetypes } from '../../data/employerArchetypes';
import { calculateCombinedEmployerOCEAN, type OCEANScores } from '../../lib/personalityEngine';

interface CultureData {
  company_name: string | null;
  openness_preference: number | null;
  conscientiousness_preference: number | null;
  extraversion_preference: number | null;
  agreeableness_preference: number | null;
  neuroticism_preference: number | null;
  culture_values: string[] | null;
  archetype_name?: string | null;
  culture_quiz_completed: boolean;
  updated_at: string | null;
  team_dynamics_data: Record<string, unknown> | null;
  leadership_style_data: Record<string, unknown> | null;
  growth_philosophy_data: Record<string, unknown> | null;
  work_environment_data: Record<string, unknown> | null;
}

const EMPLOYER_ADDITIONAL_ASSESSMENTS = [
  {
    id: 'team-dynamics',
    name: 'Team dynamics',
    description: 'Collaboration, communication, and conflict handling style.',
    duration: '~5 min',
    dataField: 'team_dynamics_data',
    traits: ['Collaboration', 'Communication', 'Conflict'],
    weight: '12%',
  },
  {
    id: 'leadership-style',
    name: 'Leadership and management',
    description: 'Management philosophy, feedback culture, and decision authority.',
    duration: '~5 min',
    dataField: 'leadership_style_data',
    traits: ['Management', 'Feedback', 'Authority'],
    weight: '12%',
  },
  {
    id: 'growth-philosophy',
    name: 'Growth and development',
    description: 'Learning culture, mentorship, and career path philosophy.',
    duration: '~5 min',
    dataField: 'growth_philosophy_data',
    traits: ['Learning', 'Mentorship', 'Career paths'],
    weight: '11%',
  },
  {
    id: 'work-environment',
    name: 'Work environment and pace',
    description: 'Remote/hybrid preferences, work-life balance, and urgency culture.',
    duration: '~5 min',
    dataField: 'work_environment_data',
    traits: ['Environment', 'Pace', 'Balance'],
    weight: '10%',
  },
];

const DIMENSION_INFO: Record<string, {
  label: string;
  fullLabel: string;
  shortDesc: string;
  description: string;
  workplaceImpact: string;
  highCandidates: string[];
  lowCandidates: string[];
  idealFor: string[];
  candidateTypes: string[];
  color: string;
}> = {
  openness: {
    label: 'Openness',
    fullLabel: 'Openness to experience',
    shortDesc: 'Creativity and curiosity',
    description: 'Your preference for candidates who are intellectually curious, creative, and open to new ideas. High scores attract innovative thinkers who thrive with ambiguity.',
    workplaceImpact: 'Candidates strong in openness excel in roles requiring creative problem-solving, innovation, and adapting to change.',
    highCandidates: [
      'Embrace unconventional approaches',
      'Generate innovative solutions',
      'Adapt quickly to pivots and changes',
      'Bring diverse perspectives',
    ],
    lowCandidates: [
      'Provide stability and consistency',
      'Excel at refining existing processes',
      'Reliable execution of proven methods',
      'Detail-oriented implementation',
    ],
    idealFor: ['Product innovation', 'R&D teams', 'Creative departments', 'Strategy roles', 'Design teams'],
    candidateTypes: ['Innovators', 'Creative thinkers', 'Early adopters'],
    color: 'var(--color-trait-openness)',
  },
  conscientiousness: {
    label: 'Conscientiousness',
    fullLabel: 'Conscientiousness',
    shortDesc: 'Organization and discipline',
    description: 'Your preference for organized, dependable, and goal-directed candidates. High scores attract disciplined achievers who deliver consistent results.',
    workplaceImpact: 'Conscientiousness is the strongest predictor of job performance in most roles, especially those requiring reliability and attention to detail.',
    highCandidates: [
      'Meet deadlines consistently',
      'Maintain high quality standards',
      'Plan and organize effectively',
      'Take ownership of responsibilities',
    ],
    lowCandidates: [
      'Flexible with changing priorities',
      'Comfortable with ambiguity',
      'Big-picture thinking',
      'Adaptable to shifting goals',
    ],
    idealFor: ['Operations', 'Project management', 'Finance', 'Quality assurance', 'Compliance'],
    candidateTypes: ['Achievers', 'Organizers', 'Detail-oriented pros'],
    color: 'var(--color-trait-conscientiousness)',
  },
  extraversion: {
    label: 'Extraversion',
    fullLabel: 'Extraversion',
    shortDesc: 'Social energy and assertiveness',
    description: 'Your preference for socially energetic and outgoing candidates. High scores attract dynamic team players who thrive in collaborative environments.',
    workplaceImpact: 'Extraversion influences team dynamics, communication style, and how candidates engage with colleagues and clients.',
    highCandidates: [
      'Energize team discussions',
      'Build relationships naturally',
      'Present ideas confidently',
      'Thrive in collaborative settings',
    ],
    lowCandidates: [
      'Deep, focused work',
      'Thoughtful analysis before speaking',
      'Independent contribution',
      'Written communication strength',
    ],
    idealFor: ['Sales', 'Client success', 'Team leadership', 'Public relations', 'Recruiting'],
    candidateTypes: ['Communicators', 'Collaborators', 'Relationship builders'],
    color: 'var(--color-trait-extraversion)',
  },
  agreeableness: {
    label: 'Agreeableness',
    fullLabel: 'Agreeableness',
    shortDesc: 'Cooperation and empathy',
    description: 'Your preference for cooperative, empathetic candidates. High scores attract team players who prioritize harmony and support colleagues.',
    workplaceImpact: 'Agreeableness affects team cohesion, conflict resolution, and how candidates handle stakeholder relationships.',
    highCandidates: [
      'Foster team harmony',
      'Skilled at conflict resolution',
      'Supportive of colleagues',
      'Empathetic communicators',
    ],
    lowCandidates: [
      'Objective decision-makers',
      'Comfortable with tough calls',
      'Direct feedback style',
      'Competitive drive',
    ],
    idealFor: ['Customer service', 'HR', 'Team support', 'Healthcare', 'Counseling'],
    candidateTypes: ['Team players', 'Supporters', 'Mediators'],
    color: 'var(--color-trait-agreeableness)',
  },
  neuroticism: {
    label: 'Stability',
    fullLabel: 'Emotional stability',
    shortDesc: 'Resilience and composure',
    description: 'Your preference for emotionally stable, resilient candidates. High stability scores attract calm performers who handle pressure well.',
    workplaceImpact: 'Emotional stability influences how candidates handle stress, criticism, and high-pressure situations.',
    highCandidates: [
      'Calm under pressure',
      'Resilient through setbacks',
      'Consistent performance',
      'Steady team presence',
    ],
    lowCandidates: [
      'Highly attuned to risks',
      'Passionate about work',
      'Thorough due diligence',
      'Motivated by urgency',
    ],
    idealFor: ['Crisis management', 'Executive roles', 'High-stakes negotiations', 'Emergency response'],
    candidateTypes: ['Steady performers', 'Crisis handlers', 'Reliable anchors'],
    color: 'var(--color-trait-stability)',
  },
};

export function CultureInsights() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cultureData, setCultureData] = useState<CultureData | null>(null);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [assessmentCooldowns, setAssessmentCooldowns] = useState<Record<string, number | null>>({});

  const showLoader = useMinLoader(isLoading);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (employer) {
        let supplementary: Record<string, unknown> = {
          team_dynamics_data: null,
          leadership_style_data: null,
          growth_philosophy_data: null,
          work_environment_data: null,
        };

        try {
          const { data: supData } = await supabase
            .from('employers')
            .select('team_dynamics_data, leadership_style_data, growth_philosophy_data, work_environment_data')
            .eq('user_id', user.id)
            .single();
          if (supData) supplementary = supData as Record<string, unknown>;
        } catch { /* columns may not exist yet */ }

        setCultureData({
          ...employer,
          team_dynamics_data: (supplementary.team_dynamics_data as Record<string, unknown>) ?? null,
          leadership_style_data: (supplementary.leadership_style_data as Record<string, unknown>) ?? null,
          growth_philosophy_data: (supplementary.growth_philosophy_data as Record<string, unknown>) ?? null,
          work_environment_data: (supplementary.work_environment_data as Record<string, unknown>) ?? null,
        } as CultureData);

        // Calculate assessment cooldowns (7-day cooldown)
        const cooldownMs = 7 * 24 * 60 * 60 * 1000;
        const cooldowns: Record<string, number | null> = {};
        const assessmentFields = [
          { id: 'team-dynamics', data: supplementary.team_dynamics_data },
          { id: 'leadership-style', data: supplementary.leadership_style_data },
          { id: 'growth-philosophy', data: supplementary.growth_philosophy_data },
          { id: 'work-environment', data: supplementary.work_environment_data },
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

        if (employer.updated_at) {
          const lastUpdated = new Date(employer.updated_at);
          const timeSince = Date.now() - lastUpdated.getTime();
          const coreCooldownMs = 24 * 60 * 60 * 1000;

          if (timeSince < coreCooldownMs) {
            setCooldownRemaining(coreCooldownMs - timeSince);
          }
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

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

  if (showLoader) {
    return (
      <CoffeeBrewLoader variant="fullscreen" message="Loading culture insights..." />
    );
  }

  if (!cultureData?.culture_quiz_completed) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="text-center max-w-sm">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>Define your culture</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Take the culture assessment to define your ideal candidate profile and start matching with compatible talent.
          </p>
          <Button
            className="mt-6"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/app/employer/culture-assessment')}
          >
            Start assessment
          </Button>
        </div>
      </div>
    );
  }

  // Build combined OCEAN scores from core + supplementary assessments
  const coreScores: OCEANScores = {
    openness: cultureData?.openness_preference || 0,
    conscientiousness: cultureData?.conscientiousness_preference || 0,
    extraversion: cultureData?.extraversion_preference || 0,
    agreeableness: cultureData?.agreeableness_preference || 0,
    neuroticism: cultureData?.neuroticism_preference || 0,
  };

  const tdData = cultureData?.team_dynamics_data as Record<string, unknown> | null;
  const lsData = cultureData?.leadership_style_data as Record<string, unknown> | null;
  const gpData = cultureData?.growth_philosophy_data as Record<string, unknown> | null;
  const weData = cultureData?.work_environment_data as Record<string, unknown> | null;

  const supplementaryScores: {
    teamDynamics?: OCEANScores;
    leadershipStyle?: OCEANScores;
    growthPhilosophy?: OCEANScores;
    workEnvironment?: OCEANScores;
  } = {};

  if (tdData?.ocean_scores) supplementaryScores.teamDynamics = tdData.ocean_scores as OCEANScores;
  if (lsData?.ocean_scores) supplementaryScores.leadershipStyle = lsData.ocean_scores as OCEANScores;
  if (gpData?.ocean_scores) supplementaryScores.growthPhilosophy = gpData.ocean_scores as OCEANScores;
  if (weData?.ocean_scores) supplementaryScores.workEnvironment = weData.ocean_scores as OCEANScores;

  const combinedOcean = calculateCombinedEmployerOCEAN(
    coreScores,
    Object.keys(supplementaryScores).length > 0 ? supplementaryScores : undefined
  );

  const completedAssessments = [true, !!tdData, !!lsData, !!gpData, !!weData];
  const completionCount = completedAssessments.filter(Boolean).length;

  const preferences = {
    openness: combinedOcean.openness,
    conscientiousness: combinedOcean.conscientiousness,
    extraversion: combinedOcean.extraversion,
    agreeableness: combinedOcean.agreeableness,
    neuroticism: 100 - combinedOcean.neuroticism,
  };

  const handleAssessmentClick = (assessmentId: string, isCompleted: boolean, cooldown: number | null | undefined) => {
    if (isCompleted && cooldown !== null && cooldown !== undefined && cooldown > 0) {
      showError('Cooldown active', `You can retake this in ${Math.ceil(cooldown / (1000 * 60 * 60 * 24))} days`);
      return;
    }
    navigate(`/app/employer/assessments/${assessmentId}`);
  };

  // The stored profile, not the combined one, so this matches the dashboard and Ember
  const archetypes = employerCultureArchetypes(cultureData ?? {});

  const formatCooldown = (ms: number) => {
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days} days`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    return `${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  const sortedPrefs = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
  // Derive operating style
  const decisionStyle = preferences.openness > 60 && preferences.conscientiousness > 60
    ? 'Data-informed innovation'
    : preferences.openness > 60
    ? 'Intuition-led'
    : preferences.conscientiousness > 60
    ? 'Data-driven'
    : 'Balanced analysis';

  const communicationStyle = preferences.extraversion > 60 && preferences.agreeableness > 60
    ? 'Open and supportive'
    : preferences.extraversion > 60
    ? 'Direct and energetic'
    : preferences.agreeableness > 60
    ? 'Thoughtful and caring'
    : 'Balanced dialogue';

  const teamDynamic = preferences.extraversion > 60
    ? 'Collaborative-first'
    : preferences.conscientiousness > 60
    ? 'Structured and focused'
    : 'Flexible hybrid';

  // Energy map: what attracts vs repels talent
  const attractors: string[] = [];
  const repellers: string[] = [];

  if (preferences.openness > 60) { attractors.push('Creative freedom and innovation time'); repellers.push('Rigid, top-down processes'); }
  else { attractors.push('Clear, proven methodologies'); repellers.push('Constant experimentation and pivots'); }
  if (preferences.extraversion > 60) { attractors.push('Collaborative team culture'); repellers.push('Isolated, siloed workflows'); }
  else { attractors.push('Deep work and focused time'); repellers.push('Constant meetings and interruptions'); }
  if (preferences.agreeableness > 60) { attractors.push('Supportive, people-first values'); repellers.push('Cutthroat competitive dynamics'); }
  else { attractors.push('Healthy competition and meritocracy'); repellers.push('Excessive consensus-seeking'); }
  if (preferences.conscientiousness > 60) { attractors.push('Clear goals and accountability'); repellers.push('Ambiguous expectations'); }
  else { attractors.push('Flexible deadlines and autonomy'); repellers.push('Micromanagement and rigid timelines'); }

  // Top 2 preferences are culture strengths, bottom 2 are growth areas
  const dimensionMeta = [
    { key: 'openness', strengthLabel: 'Innovation-first', strengthDesc: 'Your culture prizes creative thinking and new approaches', gapDesc: 'Creating more space for creative experimentation could attract diverse thinkers' },
    { key: 'conscientiousness', strengthLabel: 'Results-driven', strengthDesc: 'Clear accountability and high performance standards', gapDesc: 'Adding clearer goals and processes could boost team performance' },
    { key: 'extraversion', strengthLabel: 'Highly collaborative', strengthDesc: 'Strong team dynamics and open communication', gapDesc: 'More team interaction and social touchpoints could enhance outcomes' },
    { key: 'agreeableness', strengthLabel: 'People-first', strengthDesc: 'Empathy and support are core to your culture', gapDesc: 'More emphasis on interpersonal warmth could improve retention' },
    { key: 'neuroticism', strengthLabel: 'Resilient and steady', strengthDesc: 'Calm under pressure with consistent performance', gapDesc: 'Building stress-management practices could strengthen your team' },
  ];
  const rankedDimensions = [...dimensionMeta].sort((a, b) => (preferences[b.key as keyof typeof preferences] || 0) - (preferences[a.key as keyof typeof preferences] || 0));
  const strongest = rankedDimensions.slice(0, 2);
  const weakest = rankedDimensions.slice(-2);

  // Compatibility signals
  const hiringPace = preferences.extraversion > 60 && preferences.conscientiousness > 60
    ? 'Rapid and structured'
    : preferences.extraversion > 60
    ? 'Fast and dynamic'
    : preferences.conscientiousness > 60
    ? 'Methodical and steady'
    : 'Flexible and adaptive';

  const idealCandidateType = sortedPrefs[0][0] === 'openness'
    ? 'Creative visionaries and problem-solvers'
    : sortedPrefs[0][0] === 'conscientiousness'
    ? 'Disciplined achievers and organizers'
    : sortedPrefs[0][0] === 'extraversion'
    ? 'Energetic collaborators and communicators'
    : sortedPrefs[0][0] === 'agreeableness'
    ? 'Empathetic team players and mediators'
    : 'Steady performers and resilient anchors';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title={archetypes.primary.name}
        subtitle={archetypes.primary.description}
        belowSubtitle={
          <Facts
            items={[
              { label: 'Strongest trait', value: DIMENSION_INFO[sortedPrefs[0]?.[0]]?.label || 'Openness' },
              { label: 'Decision style', value: decisionStyle },
              { label: 'Top score', value: sortedPrefs[0]?.[1] || 0 },
            ]}
          />
        }
        rightContent={
          cooldownRemaining && cooldownRemaining > 0 ? (
            <span className="text-label" style={{ color: 'var(--color-textMuted)' }}>
              Retake in {formatCooldown(cooldownRemaining)}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => navigate('/app/employer/culture-assessment')}
            >
              Retake
            </Button>
          )
        }
      />

      <Section
        title="Ideal candidate profile"
        aside={completionCount > 1 && (
          <span className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
            Includes {completionCount - 1} supplementary assessment{completionCount > 2 ? 's' : ''}
          </span>
        )}
        first
      >
        <ul className="bento-card !p-0 overflow-hidden">
          {Object.entries(DIMENSION_INFO).map(([key, info], i) => (
            <PreferenceRow
              key={key}
              info={info}
              score={preferences[key as keyof typeof preferences]}
              divided={i > 0}
              expanded={expandedDimension === key}
              onToggle={() => setExpandedDimension(expandedDimension === key ? null : key)}
            />
          ))}
        </ul>
      </Section>

      <Section title="Your culture archetypes">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['primary', 'secondary', 'tertiary'] as const).map((rank) => (
            <ArchetypeCard
              key={rank}
              name={archetypes[rank].name}
              description={archetypes[rank].description}
              strengths={archetypes[rank].strengths}
              idealCandidates={archetypes[rank].idealCandidates}
              blindspots={archetypes[rank].blindspots}
              variant={rank}
            />
          ))}
        </div>
      </Section>

      <Section title="How your team works">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bento-card">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Operating style</h3>
            <dl className="mt-4 space-y-3">
              <Detail label="Decision-making">{decisionStyle}</Detail>
              <Detail label="Communication">{communicationStyle}</Detail>
              <Detail label="Team dynamic">{teamDynamic}</Detail>
            </dl>
          </div>
          <div className="bento-card">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>The environment you create</h3>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Detail label={preferences.openness > 60 ? 'Innovation-driven' : 'Stability-focused'}>
                {preferences.openness > 60 ? 'Encourages creativity' : 'Values consistency'}
              </Detail>
              <Detail label={preferences.conscientiousness > 60 ? 'Goal-oriented' : 'Flexible goals'}>
                {preferences.conscientiousness > 60 ? 'Clear metrics' : 'Adaptive objectives'}
              </Detail>
              <Detail label={preferences.extraversion > 60 ? 'Team-centric' : 'Focus-centric'}>
                {preferences.extraversion > 60 ? 'Collaborative work' : 'Independent work'}
              </Detail>
              <Detail label={preferences.agreeableness > 60 ? 'People-first' : 'Results-first'}>
                {preferences.agreeableness > 60 ? 'Relationships matter' : 'Outcomes matter'}
              </Detail>
            </dl>
          </div>
        </div>
      </Section>

      <Section title="Hiring fit">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bento-card">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>What attracts and repels talent</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <DotList title="Attracts" items={attractors} dot="var(--color-success)" />
              <DotList title="May repel" items={repellers} dot="var(--color-error)" />
            </div>
          </div>
          <div className="bento-card flex flex-col">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Candidate and culture fit</h3>
            <dl className="mt-4 space-y-3">
              <Detail label="Ideal candidates">{idealCandidateType}</Detail>
              <Detail label="Hiring pace">{hiringPace}</Detail>
              <Detail label="Work pace">
                {(preferences.extraversion + preferences.openness) / 2 > 60
                  ? 'Fast-paced and dynamic'
                  : (preferences.extraversion + preferences.openness) / 2 < 40
                  ? 'Measured and thoughtful'
                  : 'Balanced rhythm'}
              </Detail>
            </dl>
            <Link
              to="/app/employer/top-candidates"
              className="group mt-auto pt-5 inline-flex items-center gap-1.5 self-start text-label"
              style={{ color: 'var(--color-accent)' }}
            >
              Browse candidates
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Section>

      <Section title="Strengths and growth areas">
        <div className="bento-card grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Strengths</h3>
            <ul className="mt-3 space-y-4">
              {strongest.map((d) => (
                <li key={d.key}>
                  <GradientProgressBar
                    value={preferences[d.key as keyof typeof preferences]}
                    label={d.strengthLabel}
                    color={DIMENSION_INFO[d.key].color}
                    size="sm"
                  />
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>{d.strengthDesc}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Growth areas</h3>
            <ul className="mt-3 space-y-4">
              {weakest.map((d) => (
                <li key={d.key}>
                  <GradientProgressBar
                    value={preferences[d.key as keyof typeof preferences]}
                    label={DIMENSION_INFO[d.key].fullLabel}
                    color={DIMENSION_INFO[d.key].color}
                    size="sm"
                  />
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>{d.gapDesc}</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>{GROWTH_TIPS[d.key]}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {cultureData?.culture_values && cultureData.culture_values.length > 0 && (
        <Section title="Your culture values">
          <div className="flex flex-wrap gap-2">
            {cultureData.culture_values.map((value) => (
              <span
                key={value}
                className="px-3 py-1 rounded-full text-label capitalize"
                style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-text)' }}
              >
                {value}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section
        title="Enhance your culture profile"
        aside={
          <span className="text-caption tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
            {completionCount} of {completedAssessments.length} complete
          </span>
        }
      >
        <p className="-mt-1 mb-3 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Each extra assessment sharpens your ideal candidate profile and your rankings.
        </p>
        <ul className="bento-card !p-0 overflow-hidden">
          {EMPLOYER_ADDITIONAL_ASSESSMENTS.map((assessment, i) => {
            const isCompleted = cultureData
              ? !!(cultureData as unknown as Record<string, unknown>)[assessment.dataField]
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
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start sm:self-auto flex-shrink-0"
                  onClick={() => handleAssessmentClick(assessment.id, isCompleted, cooldown)}
                >
                  {isOnCooldown ? `Retake in ${formatCooldown(cooldown!)}` : isCompleted ? 'Retake' : 'Start'}
                </Button>
              </li>
            );
          })}
        </ul>
      </Section>

      <section className="mt-10 bento-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Ready to find your matches?</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            See candidates whose personality lines up with your culture.
          </p>
        </div>
        <Button
          className="self-start sm:self-auto flex-shrink-0"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/app/employer/top-candidates')}
        >
          Browse candidates
        </Button>
      </section>

      <p className="mt-6 text-caption" style={{ color: 'var(--color-textMuted)' }}>
        This profile is based on the Big Five (OCEAN) model. Ember uses these preferences alongside skills and
        experience to suggest compatible candidates, never as the sole deciding factor.
      </p>
    </div>
  );
}

const GROWTH_TIPS: Record<string, string> = {
  openness: 'Host innovation days or hackathons to encourage creative thinking in your teams.',
  conscientiousness: 'Introduce light project management rituals to bring clarity without rigidity.',
  extraversion: 'Create more cross-team touchpoints — standups, social events, or collaboration channels.',
  agreeableness: 'Invest in conflict resolution training and psychological safety workshops.',
  neuroticism: 'Build resilience programs — mindfulness resources, wellness days, or manager training.',
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

// One preference: the score bar is always visible and the hiring detail opens in place
function PreferenceRow({
  info,
  score,
  divided,
  expanded,
  onToggle,
}: {
  info: typeof DIMENSION_INFO[string];
  score: number;
  divided: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
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
                  <dt className="text-caption" style={{ color: 'var(--color-textMuted)' }}>Candidates you attract</dt>
                  <dd className="mt-1">
                    <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
                      {(score >= 50 ? info.highCandidates : info.lowCandidates).map((trait) => <li key={trait}>{trait}</li>)}
                    </ul>
                  </dd>
                </div>
                <Detail label="Ideal roles">{info.idealFor.join(', ')}</Detail>
                <Detail label="Candidate types">{info.candidateTypes.join(', ')}</Detail>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default CultureInsights;
