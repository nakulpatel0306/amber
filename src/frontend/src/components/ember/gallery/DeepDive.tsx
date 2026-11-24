import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Coffee, Bookmark, BookmarkCheck, GitCompareArrows,
  Check, ChevronRight, X,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { CoffeeBrewLoader } from '../../ui/CoffeeBrewLoader';
import { ConnectButton } from '../../connections/ConnectButton';
import { supabase } from '../../../lib/supabase';
import { calculateCompatibility, type OCEANScores } from '../../../lib/compatibilityScoring';
import type { ConnectionStatus } from '../../../types/connections.types';
import { apiFetch } from '../../../utils/api';

/* ── Enum labels: full_time -> Full time ── */
function enumLabel(str: string): string {
  const s = str.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Brew helpers ── */
function getBrewLabel(score: number): string {
  if (score >= 90) return "Barista's choice";
  if (score >= 80) return 'Perfect brew';
  if (score >= 70) return 'Strong pour';
  if (score >= 60) return 'Warming up';
  if (score >= 40) return 'Lukewarm';
  return 'Cold brew';
}

/* ── Trait palette: only where a mark encodes one of the five traits ── */
const INSIGHT_COLORS = ['var(--color-trait-openness)', 'var(--color-trait-conscientiousness)', 'var(--color-trait-extraversion)', 'var(--color-trait-agreeableness)', 'var(--color-trait-stability)'];

/* ── Composite meta ── */
const COMPOSITE_META: Record<string, { description: string; bullets: string[] }> = {
  'Trait match': {
    description: 'Measures how closely your personality traits align with what this role demands. High scores indicate a natural fit between who you are and what the position requires.',
    bullets: ['Based on Big Five personality assessment', 'Compares your OCEAN scores against role benchmarks', 'Higher alignment means less adaptation needed', 'Considers both trait level and trait importance'],
  },
  'Culture fit': {
    description: "Evaluates how well your values, work preferences, and interpersonal style match the company's culture and team dynamics.",
    bullets: ['Assesses shared values and priorities', 'Considers team collaboration preferences', 'Factors in communication norms', 'Accounts for organizational structure fit'],
  },
  'Work style': {
    description: 'Compares your preferred way of working (pace, structure, autonomy) with the environment this role offers.',
    bullets: ['Evaluates pace and deadline preferences', 'Considers autonomy vs. guidance needs', 'Factors in decision-making style', 'Assesses adaptability to role structure'],
  },
  Communication: {
    description: "Analyzes how your communication patterns and preferences align with the team's norms and the role's requirements.",
    bullets: ['Compares directness vs. diplomacy preferences', 'Considers feedback style compatibility', 'Evaluates meeting and async preferences', 'Factors in conflict resolution approach'],
  },
};

/* ── Detailed trait interpretation data ── */
const TRAIT_INSIGHTS: Record<string, {
  high: string; mid: string; low: string;
  highWork: string[]; midWork: string[]; lowWork: string[];
}> = {
  openness: {
    high: 'Highly creative and intellectually curious. You actively seek novel experiences, unconventional ideas, and abstract thinking.',
    mid: 'Balanced between innovation and pragmatism. You appreciate new ideas when they serve a clear purpose.',
    low: 'Grounded and practical. You prefer proven methods, concrete plans, and steady incremental improvement.',
    highWork: ['Thrives in creative and R&D environments', 'Generates novel solutions to complex problems', 'May need structure to channel creative energy'],
    midWork: ['Adapts to both structured and creative work', 'Evaluates which ideas are worth pursuing', 'Bridges innovative and operational teams well'],
    lowWork: ['Excels with established processes and SOPs', 'Strong attention to proven methodologies', 'Brings stability and consistency to teams'],
  },
  conscientiousness: {
    high: 'Highly organized, disciplined, and goal-oriented. You set high standards and follow through systematically on commitments.',
    mid: 'Moderately structured in your approach. You can plan ahead but also adapt when circumstances change unexpectedly.',
    low: 'Flexible and spontaneous. You prefer to stay adaptable rather than follow rigid plans or strict schedules.',
    highWork: ['Excellent project management and follow-through', 'Consistently meets deadlines and quality standards', 'May find ambiguity or rapid pivots challenging'],
    midWork: ['Balanced approach to planning vs. flexibility', 'Effective in both startup and corporate environments', 'Can lead structured projects or adapt to change'],
    lowWork: ['Thrives in dynamic, fast-paced environments', 'Comfortable navigating ambiguity', 'May benefit from external accountability structures'],
  },
  extraversion: {
    high: 'Energetic, sociable, and assertive. You draw energy from interactions and naturally take initiative in group settings.',
    mid: 'Comfortably social but also values independent work. You adjust your energy based on the situation.',
    low: 'Reflective and independent. You do your best thinking alone and prefer deep one-on-one connections over large groups.',
    highWork: ['Natural in client-facing and team leadership roles', 'Energizes team meetings and brainstorms', 'May need to practice active listening and patience'],
    midWork: ['Versatile across collaborative and solo work', 'Adjusts communication style to context naturally', 'Effective in both presentations and written formats'],
    lowWork: ['Excels in focused, deep analytical work', 'Strong written and async communicator', 'Thrives with remote-first or small-team setups'],
  },
  agreeableness: {
    high: 'Empathetic, cooperative, and harmony-seeking. You prioritize team cohesion and naturally build trust.',
    mid: 'Diplomatic but principled. You cooperate when possible but can push back when it matters.',
    low: "Direct, competitive, and results-focused. You prioritize outcomes and aren't afraid to challenge assumptions.",
    highWork: ['Excellent mediator and team builder', 'Creates psychologically safe environments', 'May avoid necessary conflicts or tough feedback'],
    midWork: ['Balances collaboration with assertiveness', 'Navigates office dynamics effectively', 'Gives and receives feedback constructively'],
    lowWork: ['Strong negotiator and critical thinker', 'Comfortable making tough, unpopular decisions', 'Drives accountability and high performance standards'],
  },
  neuroticism: {
    high: 'Emotionally sensitive and deeply self-aware. You experience feelings intensely, fueling empathy but also stress.',
    mid: 'Emotionally balanced. You handle typical workplace pressures well while staying attuned to your feelings.',
    low: 'Emotionally stable and resilient. You stay calm under pressure and recover quickly from setbacks.',
    highWork: ['Highly attuned to team dynamics and morale', 'May need robust stress management support', 'Brings emotional depth to decision-making'],
    midWork: ['Handles normal workplace stress well', 'Appropriately responsive to challenges', 'Good emotional self-regulation in most situations'],
    lowWork: ['Thrives in high-pressure, fast-paced environments', 'Provides calm leadership during crises', 'May need to actively check in with team emotions'],
  },
  stability: {
    high: 'Emotionally stable and resilient. You stay calm under pressure and recover quickly from setbacks.',
    mid: 'Emotionally balanced. You handle typical workplace pressures well while staying attuned to your feelings.',
    low: 'Emotionally sensitive and deeply self-aware. You experience feelings intensely, fueling empathy but also stress.',
    highWork: ['Thrives in high-pressure, fast-paced environments', 'Provides calm leadership during crises', 'May need to actively check in with team emotions'],
    midWork: ['Handles normal workplace stress well', 'Appropriately responsive to challenges', 'Good emotional self-regulation in most situations'],
    lowWork: ['Highly attuned to team dynamics and morale', 'May need robust stress management support', 'Brings emotional depth to decision-making'],
  },
};

function getTraitLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

function getTraitLevelLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

function getGapAnalysis(candidateScore: number, employerPref: number, dimName: string): string {
  const diff = candidateScore - employerPref;
  const absDiff = Math.abs(diff);
  if (absDiff <= 10) return `Your ${dimName.toLowerCase()} level closely matches what's expected here. This is a natural fit area requiring minimal adjustment, so you can show up authentically.`;
  if (diff > 10 && absDiff <= 25) return `You score somewhat higher in ${dimName.toLowerCase()} than what's typically expected. This can be a strength since you bring more energy here, but be mindful of calibrating to team norms.`;
  if (diff > 25) return `You score significantly higher in ${dimName.toLowerCase()} than the role typically calls for. While this intensity can be an asset in the right context, it may feel misaligned with the team's baseline.`;
  if (absDiff <= 25) return `The role expects slightly more ${dimName.toLowerCase()} than your natural level. With awareness and intentional effort, this gap is easily bridgeable.`;
  return `There's a notable gap where the role demands more ${dimName.toLowerCase()} than your natural tendency. Consider whether this stretch energizes or drains you long-term.`;
}

/* ── SVG arc helpers ── */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle < 0.5) return '';
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/* ── Alignment helpers ── */
function getAlignmentLabel(fitScore: number) {
  if (fitScore >= 80) return 'Aligned';
  if (fitScore >= 60) return 'Close';
  return 'Gap';
}

function getAlignmentColor(fitScore: number) {
  if (fitScore >= 80) return 'var(--color-success)';
  if (fitScore >= 60) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/* ── Types ── */
interface DimensionData {
  name: string;
  candidateScore: number;
  employerPreference: number;
  fitScore: number;
}

interface DeepDiveProps {
  mode: 'candidate' | 'employer';
  name: string;
  subtitle?: string;
  archetype?: { name: string; key: string; description?: string };
  overallScore: number;
  traitScore: number;
  cultureScore: number;
  workStyleScore: number;
  communicationScore: number;
  dimensions: DimensionData[];
  candidateOcean: OCEANScores;
  employerOcean: OCEANScores;
  avatarUrl?: string | null;
  candidateId?: string;
  employerId?: string;
  roleId?: string;
  isSaved: boolean;
  connectionStatus?: ConnectionStatus;
  onBack: () => void;
  onBrew: () => void;
  onToggleSave: () => void;
  onCompare?: () => void;
  onConnect?: () => void;
  onAcceptConnection?: () => void;
  onDeclineConnection?: () => void;
}

interface EmberNarrative {
  ember_summary?: string;
  ember_recommendation?: string;
  ember_strengths?: string[];
  ember_friction?: string[];
  ember_success_tips?: string[];
  ember_questions?: string[];
}

export function DeepDive({
  mode,
  name,
  subtitle,
  archetype,
  overallScore,
  traitScore,
  cultureScore,
  workStyleScore,
  communicationScore,
  dimensions,
  candidateOcean: _candidateOcean,
  employerOcean: _employerOcean,
  avatarUrl,
  candidateId,
  employerId,
  roleId,
  isSaved,
  connectionStatus = 'accepted',
  onBack,
  onBrew,
  onToggleSave,
  onCompare,
  onConnect,
  onAcceptConnection,
  onDeclineConnection,
}: DeepDiveProps) {
  const [narrative, setNarrative] = useState<EmberNarrative | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [compositeModal, setCompositeModal] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [deepDiveTab, setDeepDiveTab] = useState(0);
  const [employerRoles, setEmployerRoles] = useState<{ id: string; title: string; score: number; description?: string; requirements?: string[]; nice_to_have?: string[]; location?: string; work_style?: string; salary_min?: number; salary_max?: number; employment_type?: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<typeof employerRoles[number] | null>(null);


  /* Fetch Ember analysis */
  useEffect(() => {
    if (!candidateId || !employerId) return;
    const fetchNarrative = async () => {
      setNarrativeLoading(true);
      try {
        const params = new URLSearchParams();
        if (candidateId) params.set('candidate_id', candidateId);
        if (employerId) params.set('employer_id', employerId);
        if (roleId) params.set('role_id', roleId);
        const res = await apiFetch(`/api/ember/analysis?${params}`);
        if (res.ok) {
          const data = await res.json();
          setNarrative({
            ember_summary: data.ember_summary || data.summary,
            ember_recommendation: data.ember_recommendation || data.recommendation,
            ember_strengths: data.strengths || data.what_they_bring || [],
            ember_friction: data.friction || data.potential_friction || [],
            ember_success_tips: data.success_tips || data.how_to_succeed || [],
            ember_questions: data.questions || data.questions_to_explore || [],
          });
        }
      } catch {
        /* backend unavailable */
      } finally {
        setNarrativeLoading(false);
      }
    };
    fetchNarrative();
  }, [candidateId, employerId, roleId]);

  /* Fetch employer roles with per-role compatibility */
  useEffect(() => {
    if (!employerId) return;
    const fetchRoles = async () => {
      const { data } = await supabase
        .from('roles')
        .select('id, title, description, requirements, nice_to_have, location, work_style, salary_min, salary_max, employment_type, required_openness_min, required_openness_max, required_conscientiousness_min, required_conscientiousness_max, required_extraversion_min, required_extraversion_max, required_agreeableness_min, required_agreeableness_max, required_neuroticism_min, required_neuroticism_max')
        .eq('employer_id', employerId);
      if (!data || data.length === 0) return;
      const scored = data.map(role => {
        const result = calculateCompatibility({
          candidateOCEAN: _candidateOcean,
          employerPreferences: { ..._employerOcean },
          roleWorkStyle: role.work_style || undefined,
          roleRequirements: {
            required_openness_min: role.required_openness_min,
            required_openness_max: role.required_openness_max,
            required_conscientiousness_min: role.required_conscientiousness_min,
            required_conscientiousness_max: role.required_conscientiousness_max,
            required_extraversion_min: role.required_extraversion_min,
            required_extraversion_max: role.required_extraversion_max,
            required_agreeableness_min: role.required_agreeableness_min,
            required_agreeableness_max: role.required_agreeableness_max,
            required_neuroticism_min: role.required_neuroticism_min,
            required_neuroticism_max: role.required_neuroticism_max,
            work_style: role.work_style,
          },
        });
        return { id: role.id, title: role.title, score: result.overallMatchScore, description: role.description, requirements: role.requirements, nice_to_have: role.nice_to_have, location: role.location, work_style: role.work_style, salary_min: role.salary_min, salary_max: role.salary_max, employment_type: role.employment_type };
      });
      scored.sort((a, b) => b.score - a.score);
      setEmployerRoles(scored);
    };
    fetchRoles();
  }, [employerId, mode, _candidateOcean, _employerOcean]);

  /* Composite scores */
  const compositeScores = [
    { label: 'Trait match', score: traitScore },
    { label: 'Culture fit', score: cultureScore },
    { label: 'Work style', score: workStyleScore },
    { label: 'Communication', score: communicationScore },
  ];

  /* Derived metrics */
  const alignedCount = dimensions.filter(d => d.fitScore >= 80).length;
  const sortedDims = [...dimensions].sort((a, b) => b.fitScore - a.fitScore);

  /* Modal */
  const activeComposite = compositeModal ? compositeScores.find(c => c.label === compositeModal) : null;
  const activeCompositeMeta = compositeModal ? COMPOSITE_META[compositeModal] : null;

  /* Selected dimension detail */
  const selectedDimData = selectedDimension
    ? dimensions.find(d => d.name.toLowerCase() === selectedDimension.toLowerCase())
    : null;

  /* Donut chart */
  const DONUT_SIZE = 280;
  const DONUT_CX = DONUT_SIZE / 2;
  const DONUT_CY = DONUT_SIZE / 2;
  const DONUT_R = 106;
  const DONUT_STROKE = 22;
  const SEG_DEG = 360 / Math.max(dimensions.length, 1);
  const GAP_DEG = 6;
  const ARC_DEG = SEG_DEG - GAP_DEG;

  const youLabel = mode === 'candidate' ? 'You' : 'Candidate';
  const themLabel = mode === 'candidate' ? 'Employer' : 'Your preference';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="max-w-5xl mx-auto"
    >
      {/* ═══ 1. Header ═══ */}
      <header>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-label transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ember
        </button>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
            ) : (
              <span
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-heading"
                style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-title break-words" style={{ color: 'var(--color-text)' }}>
                {name}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                {[subtitle, archetype?.name].filter(Boolean).join(' · ')}
                <span style={{ color: 'var(--color-textMuted)' }}> · </span>
                <span className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>{overallScore}% match</span>
              </p>

              {employerRoles.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>Roles</span>
                  {employerRoles.map(role => {
                    const on = selectedRole?.id === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(on ? null : role)}
                        aria-pressed={on}
                        className="rounded-full px-2.5 py-1 text-caption transition-colors hover:border-[var(--color-borderHover)]"
                        style={{
                          backgroundColor: on ? 'var(--color-surfaceHover)' : 'transparent',
                          border: `1px solid ${on ? 'var(--color-borderHover)' : 'var(--color-border)'}`,
                          color: on ? 'var(--color-text)' : 'var(--color-textSecondary)',
                        }}
                      >
                        {role.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {connectionStatus === 'accepted' ? (
              <Button size="sm" onClick={onBrew}>
                <Coffee className="w-3.5 h-3.5" />
                Let's brew
              </Button>
            ) : (
              <ConnectButton
                status={connectionStatus}
                onConnect={() => onConnect?.()}
                onAccept={() => onAcceptConnection?.()}
                onDecline={() => onDeclineConnection?.()}
                size="sm"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSave}
              aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}
              title={isSaved ? 'Remove bookmark' : 'Bookmark'}
            >
              {isSaved
                ? <BookmarkCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                : <Bookmark className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ Role detail (in-flow, pushes content down) ═══ */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            key={selectedRole.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bento-card relative mt-6">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                aria-label="Close role details"
                className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
                style={{ color: 'var(--color-textMuted)' }}
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="pr-8 text-heading" style={{ color: 'var(--color-text)' }}>
                {selectedRole.title}
              </h2>
              {(() => {
                const meta = [
                  selectedRole.employment_type && enumLabel(selectedRole.employment_type),
                  selectedRole.location,
                  selectedRole.work_style && enumLabel(selectedRole.work_style),
                  (selectedRole.salary_min || selectedRole.salary_max) && (
                    selectedRole.salary_min && selectedRole.salary_max
                      ? `${(selectedRole.salary_min / 1000).toFixed(0)}k – ${(selectedRole.salary_max / 1000).toFixed(0)}k`
                      : selectedRole.salary_min
                        ? `From ${(selectedRole.salary_min / 1000).toFixed(0)}k`
                        : `Up to ${(selectedRole.salary_max! / 1000).toFixed(0)}k`
                  ),
                ].filter(Boolean);
                return meta.length > 0 ? (
                  <p className="mt-1 text-sm tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                    {meta.join(' · ')}
                  </p>
                ) : null;
              })()}

              {selectedRole.description && (
                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                  {selectedRole.description}
                </p>
              )}

              {((selectedRole.requirements?.length ?? 0) > 0 || (selectedRole.nice_to_have?.length ?? 0) > 0) && (
                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {selectedRole.requirements && selectedRole.requirements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Requirements</h3>
                      <ul className="mt-2 space-y-1.5">
                        {selectedRole.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-textMuted)' }} />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedRole.nice_to_have && selectedRole.nice_to_have.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Nice to have</h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                        {selectedRole.nice_to_have.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 2. Score breakdown: one card, four columns, each opens its explanation ═══ */}
      <section className="mt-10">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Score breakdown</h2>
        <div className="bento-card mt-3 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {compositeScores.map(({ label, score }) => (
            <button
              key={label}
              type="button"
              className="group text-left"
              onClick={() => setCompositeModal(label)}
            >
              <span className="flex items-center gap-1 text-label font-normal transition-colors group-hover:text-[var(--color-text)]" style={{ color: 'var(--color-textSecondary)' }}>
                {label}
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </span>
              <span className="mt-1 block text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
                {score}%
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                <span className="block h-full rounded-full" style={{ width: `${score}%`, backgroundColor: 'var(--color-textMuted)' }} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Composite modal */}
      <Modal isOpen={!!compositeModal} onClose={() => setCompositeModal(null)} title={compositeModal ?? ''} size="sm">
        {activeComposite && activeCompositeMeta && (
          <div className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
                {activeComposite.score}%
              </span>
              <span className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                {getBrewLabel(activeComposite.score)}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
              <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--color-textMuted)' }} initial={{ width: 0 }} animate={{ width: `${activeComposite.score}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>{activeCompositeMeta.description}</p>
            <ul className="space-y-2">
              {activeCompositeMeta.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-textMuted)' }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* ═══ 3. Flavor profile (interactive donut with per-trait breakdown) ═══ */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Flavor profile</h2>
          <p className="text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
            {alignedCount} of {dimensions.length} traits aligned
          </p>
        </div>
        <div className="bento-card mt-3">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-full flex-shrink-0 aspect-square" style={{ maxWidth: DONUT_SIZE }}>
              <svg viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} className="w-full h-full" aria-hidden="true">
                {dimensions.map((dim, i) => {
                  const color = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
                  const startAngle = i * SEG_DEG + GAP_DEG / 2;
                  const bgEnd = startAngle + ARC_DEG;
                  const fillEnd = startAngle + (dim.candidateScore / 100) * ARC_DEG;
                  const bgPath = describeArc(DONUT_CX, DONUT_CY, DONUT_R, startAngle, bgEnd);
                  const fillPath = describeArc(DONUT_CX, DONUT_CY, DONUT_R, startAngle, fillEnd);

                  return (
                    <g key={dim.name}>
                      {bgPath && <path d={bgPath} fill="none" stroke={color} strokeWidth={DONUT_STROKE} opacity={0.12} />}
                      {fillPath && (
                        <motion.path
                          d={fillPath}
                          fill="none"
                          stroke={color}
                          strokeWidth={DONUT_STROKE}
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.85 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
                  {overallScore}%
                </span>
                <span className="text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
                  Match score
                </span>
              </div>
            </div>

            <div className="w-full flex-1">
              <div className="flex items-center justify-end gap-3 px-3 pb-1 text-caption" style={{ color: 'var(--color-textMuted)' }}>
                <span>{youLabel} / {themLabel.toLowerCase()}</span>
                <span className="w-3.5" />
              </div>
              {dimensions.map((dim, i) => {
                const color = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
                const isSelected = selectedDimension?.toLowerCase() === dim.name.toLowerCase();
                return (
                  <button
                    key={dim.name}
                    type="button"
                    aria-expanded={isSelected}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-surfaceHover)]"
                    style={{ backgroundColor: isSelected ? 'var(--color-surfaceHover)' : undefined }}
                    onClick={() => setSelectedDimension(prev => prev?.toLowerCase() === dim.name.toLowerCase() ? null : dim.name)}
                  >
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>
                      {dim.name}
                    </span>
                    <span className="text-sm tabular-nums" style={{ color: 'var(--color-text)' }}>
                      {dim.candidateScore}
                      <span style={{ color: 'var(--color-textMuted)' }}> / {dim.employerPreference}</span>
                    </span>
                    <ChevronRight
                      className="w-3.5 h-3.5 transition-transform"
                      style={{
                        color: 'var(--color-textMuted)',
                        transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {selectedDimData && (() => {
              const dimIdx = dimensions.findIndex(d => d.name.toLowerCase() === selectedDimension?.toLowerCase());
              const dimColor = INSIGHT_COLORS[dimIdx % INSIGHT_COLORS.length];
              return (
                <motion.div
                  key={selectedDimension}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{selectedDimData.name}</h3>
                      <AlignmentStatus fitScore={selectedDimData.fitScore} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        {[
                          { label: youLabel, value: selectedDimData.candidateScore, opacity: 1 },
                          { label: themLabel, value: selectedDimData.employerPreference, opacity: 0.4 },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="w-24 flex-shrink-0 truncate text-caption" style={{ color: 'var(--color-textSecondary)' }}>
                              {row.label}
                            </span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: dimColor, opacity: row.opacity }}
                                initial={{ width: 0 }}
                                animate={{ width: `${row.value}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="w-8 text-right text-sm tabular-nums" style={{ color: 'var(--color-text)' }}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                        {getGapAnalysis(selectedDimData.candidateScore, selectedDimData.employerPreference, selectedDimData.name)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ 4. Compatibility deep dive — tabbed per dimension ═══ */}
      {dimensions.length > 0 && (() => {
        const dim = dimensions[deepDiveTab] ?? dimensions[0];
        const color = INSIGHT_COLORS[deepDiveTab % INSIGHT_COLORS.length];
        const traitKey = dim.name.toLowerCase();
        const traitData = TRAIT_INSIGHTS[traitKey];
        const level = getTraitLevel(dim.candidateScore);
        const levelLabel = getTraitLevelLabel(dim.candidateScore);
        const empLevel = getTraitLevel(dim.employerPreference);
        const workItems = traitData ? (level === 'high' ? traitData.highWork : level === 'mid' ? traitData.midWork : traitData.lowWork) : [];

        return (
          <section className="mt-10">
            <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Compatibility by trait</h2>
            <div className="bento-card mt-3">
              <div className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
                {dimensions.map((d, i) => {
                  const active = i === deepDiveTab;
                  return (
                    <button
                      key={d.name}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setDeepDiveTab(i)}
                      className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-label transition-colors hover:text-[var(--color-text)]"
                      style={{
                        backgroundColor: active ? 'var(--color-surfaceHover)' : 'transparent',
                        color: active ? 'var(--color-text)' : 'var(--color-textSecondary)',
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INSIGHT_COLORS[i % INSIGHT_COLORS.length] }} />
                      {d.name}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={deepDiveTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {dim.name}
                        <span className="font-normal" style={{ color: 'var(--color-textSecondary)' }}> · {levelLabel}</span>
                      </h3>
                      {traitData && (
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                          {traitData[level]}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="block text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
                        {dim.fitScore}%
                      </span>
                      <AlignmentStatus fitScore={dim.fitScore} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-end justify-between gap-4 text-sm tabular-nums">
                      <span style={{ color: 'var(--color-textSecondary)' }}>
                        {youLabel} <span className="font-medium" style={{ color: 'var(--color-text)' }}>{dim.candidateScore}</span>
                      </span>
                      <span style={{ color: 'var(--color-textSecondary)' }}>
                        Gap <span className="font-medium" style={{ color: 'var(--color-text)' }}>{Math.abs(dim.candidateScore - dim.employerPreference)}</span>
                      </span>
                      <span className="text-right" style={{ color: 'var(--color-textSecondary)' }}>
                        {themLabel} <span className="font-medium" style={{ color: 'var(--color-text)' }}>{dim.employerPreference}</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full opacity-30" style={{ width: `${dim.employerPreference}%`, backgroundColor: color }} />
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${dim.candidateScore}%`, backgroundColor: color }} />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>In the workplace</h4>
                      <BulletList items={workItems} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Alignment</h4>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                        {getGapAnalysis(dim.candidateScore, dim.employerPreference, dim.name)}
                      </p>
                      {traitData && empLevel !== level && traitData[empLevel] && (
                        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                          <span className="font-medium" style={{ color: 'var(--color-text)' }}>What they expect: </span>
                          {traitData[empLevel]}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        );
      })()}

      {/* ═══ 5. Ember's analysis ═══ */}
      <section className="mt-10">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Ember's analysis</h2>
        <div className="bento-card mt-3">
          {narrativeLoading ? (
            <CoffeeBrewLoader variant="inline" size="sm" message="Ember is analyzing this match..." />
          ) : narrative ? (
            <div className="space-y-8">
              {narrative.ember_summary && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {narrative.ember_summary}
                </p>
              )}

              {((narrative.ember_strengths?.length ?? 0) > 0 || (narrative.ember_friction?.length ?? 0) > 0) && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {narrative.ember_strengths && narrative.ember_strengths.length > 0 && (
                    <InsightSection title={mode === 'candidate' ? 'Why this works' : 'What they bring'} items={narrative.ember_strengths} />
                  )}
                  {narrative.ember_friction && narrative.ember_friction.length > 0 && (
                    <InsightSection title={mode === 'candidate' ? 'Watch out for' : 'Potential friction'} items={narrative.ember_friction} />
                  )}
                </div>
              )}

              {((narrative.ember_success_tips?.length ?? 0) > 0 || (narrative.ember_questions?.length ?? 0) > 0) && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {narrative.ember_success_tips && narrative.ember_success_tips.length > 0 && (
                    <InsightSection title="Your playbook" items={narrative.ember_success_tips} />
                  )}
                  {narrative.ember_questions && narrative.ember_questions.length > 0 && (
                    <InsightSection title="Questions to explore" items={narrative.ember_questions} />
                  )}
                </div>
              )}

              {dimensions.length >= 5 && (() => {
                const traitInsights: { title: string; description: string }[] = [];
                const o = dimensions.find(d => d.name.toLowerCase() === 'openness');
                const c = dimensions.find(d => d.name.toLowerCase() === 'conscientiousness');
                const e = dimensions.find(d => d.name.toLowerCase() === 'extraversion');
                const a = dimensions.find(d => d.name.toLowerCase() === 'agreeableness');
                const n = dimensions.find(d => d.name.toLowerCase() === 'neuroticism') ?? dimensions.find(d => d.name.toLowerCase() === 'stability');

                if (o && c && o.candidateScore >= 70 && c.candidateScore >= 70)
                  traitInsights.push({ title: 'Creative discipline', description: 'You combine creativity with discipline, allowing you to both generate innovative ideas and execute on them reliably. This is a rare and valuable combination.' });
                if (o && c && o.candidateScore >= 70 && c.candidateScore < 40)
                  traitInsights.push({ title: 'Unstructured creativity', description: 'Your creative energy is strong, but you may start many projects without finishing them. Pairing with structured teammates or using project management tools can help.' });
                if (e && a && e.candidateScore >= 70 && a.candidateScore >= 70)
                  traitInsights.push({ title: 'Natural team builder', description: "You're a natural team player and relationship builder. People trust you and enjoy working with you. Be mindful of saying yes too often." });
                if (e && a && e.candidateScore >= 70 && a.candidateScore < 40)
                  traitInsights.push({ title: 'Assertive driver', description: "You're assertive and outspoken. You're effective at driving decisions but may need to watch how you deliver critical feedback." });
                if (c && n && c.candidateScore >= 70 && n?.candidateScore >= 70)
                  traitInsights.push({ title: 'Perfectionist tendencies', description: 'Your high standards combined with emotional sensitivity can lead to perfectionism and self-criticism. Build in breaks and celebrate small wins.' });
                if (e && n && e.candidateScore < 40 && n?.candidateScore < 40)
                  traitInsights.push({ title: 'Calm independent', description: "You're a calm, independent thinker. You excel in deep-focus roles and bring stability to teams, but make sure to stay visible and communicate your contributions." });
                if (o && a && o.candidateScore >= 70 && a.candidateScore >= 70)
                  traitInsights.push({ title: 'Empathetic innovator', description: "You're empathetic and imaginative, great at understanding diverse perspectives and creating inclusive solutions." });
                if (c && e && c.candidateScore >= 70 && e.candidateScore >= 70)
                  traitInsights.push({ title: 'Organized leader', description: "You're a driven, organized communicator, natural for leadership roles where you need to rally teams around structured goals." });

                if (traitInsights.length === 0)
                  traitInsights.push({ title: 'Balanced profile', description: 'Your personality traits create a balanced profile without extreme combinations. This gives you flexibility to adapt to various work environments and team dynamics.' });

                return (
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>How your traits align</h3>
                    <div className="mt-2 space-y-3">
                      {traitInsights.map((insight) => (
                        <p key={insight.title} className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                          <span className="font-medium" style={{ color: 'var(--color-text)' }}>{insight.title}. </span>
                          {insight.description}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {narrative.ember_recommendation && (
                <div className="pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Ember's recommendation</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{narrative.ember_recommendation}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              Ember analysis is unavailable. Connect to the backend for AI-powered insights.
            </p>
          )}
        </div>
      </section>

      {/* ═══ 6. Personality snapshot ═══ */}
      <section className="mt-10">
        <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>Personality snapshot</h2>
        <div className="bento-card mt-3">
          {archetype && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{archetype.name}</h3>
              {archetype.description && (
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>{archetype.description}</p>
              )}
            </div>
          )}

          {sortedDims.length >= 3 && (
            <dl className="mb-6 grid grid-cols-3 gap-4">
              {[
                { heading: 'Strongest fit', dim: sortedDims[0] },
                { heading: 'Notable', dim: sortedDims[1] },
                { heading: 'Growth edge', dim: sortedDims[sortedDims.length - 1] },
              ].map(({ heading, dim }) => (
                <div key={heading} className="min-w-0">
                  <dt className="text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>{heading}</dt>
                  <dd className="mt-1">
                    <span className="block text-heading tabular-nums" style={{ color: 'var(--color-text)' }}>{dim.fitScore}%</span>
                    <span className="block truncate text-sm" style={{ color: 'var(--color-textSecondary)' }}>{dim.name}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Trait profiles</h3>
          <div className="mt-1">
            {dimensions.map((dim, i) => {
              const color = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
              const traitKey = dim.name.toLowerCase();
              const traitData = TRAIT_INSIGHTS[traitKey];
              const level = getTraitLevel(dim.candidateScore);
              const levelLabel = getTraitLevelLabel(dim.candidateScore);

              return (
                <div
                  key={dim.name}
                  className="py-4"
                  style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                >
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{dim.name}</span>
                    <span className="text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                      {levelLabel} · {dim.candidateScore}
                    </span>
                    <span className="ml-auto text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                      Fit <span className="font-medium" style={{ color: 'var(--color-text)' }}>{dim.fitScore}%</span>
                    </span>
                  </div>

                  <div className="mb-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${dim.candidateScore}%`, backgroundColor: color }} />
                  </div>

                  {traitData && (
                    <>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                        {traitData[level]}
                      </p>
                      <p className="mt-1.5 text-label font-normal" style={{ color: 'var(--color-textMuted)' }}>
                        {(level === 'high' ? traitData.highWork : level === 'mid' ? traitData.midWork : traitData.lowWork).join(' · ')}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 7. Next steps ═══ */}
      <section className="bento-card mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Take this match further</h2>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {connectionStatus === 'accepted' ? 'You are connected. Set up a coffee chat.' : 'Connect first, then set up a coffee chat.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {connectionStatus === 'accepted' ? (
            <Button onClick={onBrew}>
              <Coffee className="w-4 h-4" />
              Let's brew
            </Button>
          ) : (
            <ConnectButton
              status={connectionStatus}
              onConnect={() => onConnect?.()}
              onAccept={() => onAcceptConnection?.()}
              onDecline={() => onDeclineConnection?.()}
              size="md"
            />
          )}
          <Button variant="outline" onClick={onToggleSave}>
            {isSaved ? <BookmarkCheck className="w-4 h-4" style={{ color: 'var(--color-accent)' }} /> : <Bookmark className="w-4 h-4" />}
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          {mode === 'employer' && onCompare && (
            <Button variant="ghost" onClick={onCompare}>
              <GitCompareArrows className="w-4 h-4" />
              Add to compare
            </Button>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function AlignmentStatus({ fitScore }: { fitScore: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getAlignmentColor(fitScore) }} />
      {getAlignmentLabel(fitScore)}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
          <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-textMuted)' }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function InsightSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
      <BulletList items={items} />
    </div>
  );
}
