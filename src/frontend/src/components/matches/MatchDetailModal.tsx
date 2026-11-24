import { useState, useEffect, useCallback, useRef } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useNavigate } from 'react-router-dom';
import { X, Bookmark, BookmarkCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../ui/Button';
import { apiFetch } from '../../utils/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DimensionAnalysis {
  name: string;
  candidate_score: number;
  employer_preference: number;
  fit_score: number;
  gap: number;
  direction: string;
}

interface Insight {
  category: string;
  message: string;
  trait_related?: string;
  score_impact?: string;
}

export interface MatchDetailData {
  id: string;
  name: string;
  subtitle?: string;
  archetype?: { name: string; key: string; description?: string; strengths?: string[] };
  overallScore: number;
  traitScore: number;
  cultureScore: number;
  workStyleScore: number;
  communicationScore: number;
  dimensionAnalysis?: DimensionAnalysis[];
  insights?: Insight[];
  emberSummary?: string;
  emberRecommendation?: string;
}

export interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'candidate' | 'employer';
  matchData: MatchDetailData;
  candidateId?: string;
  employerId?: string;
  roleId?: string;
  onRequestChat?: () => void;
  onAskEmber?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function directionIcon(direction: string) {
  const style = { color: 'var(--color-textMuted)' };
  if (direction === 'above') return <TrendingUp className="w-3.5 h-3.5" style={style} aria-label="Above" />;
  if (direction === 'below') return <TrendingDown className="w-3.5 h-3.5" style={style} aria-label="Below" />;
  return <Minus className="w-3.5 h-3.5" style={style} aria-label="Aligned" />;
}

/* ------------------------------------------------------------------ */
/*  Composite score bar                                                */
/* ------------------------------------------------------------------ */

function CompositeBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>{label}</span>
        <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: 'var(--color-accent)' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  OCEAN comparison bar                                               */
/* ------------------------------------------------------------------ */

function OceanComparisonBar({
  label,
  candidateScore,
  employerPreference,
}: {
  label: string;
  candidateScore: number;
  employerPreference: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>{label}</span>
        <span className="text-label font-normal tabular-nums">
          <span style={{ color: 'var(--color-text)' }}>{candidateScore}</span>
          <span style={{ color: 'var(--color-textMuted)' }}> vs {employerPreference}</span>
        </span>
      </div>
      {/* Candidate as the filled bar, the preference as a tick on the same track */}
      <div className="relative h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${candidateScore}%`, backgroundColor: 'var(--color-accent)' }}
        />
        <div
          className="absolute -top-1 w-0.5 h-3.5 rounded-full"
          style={{ left: `calc(${employerPreference}% - 1px)`, backgroundColor: 'var(--color-text)' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function MatchDetailModal({
  isOpen,
  onClose,
  role,
  matchData,
  candidateId,
  employerId,
  roleId,
  onRequestChat,
  onAskEmber,
}: MatchDetailModalProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [emberNarrative, setEmberNarrative] = useState<{
    summary?: string;
    recommendation?: string;
    insights?: Insight[];
  } | null>(null);
  const [emberLoading, setEmberLoading] = useState(false);

  /* Fetch Ember narrative on open */
  const fetchEmberAnalysis = useCallback(async () => {
    if (!candidateId || !employerId) return;
    setEmberLoading(true);
    try {
      const params = new URLSearchParams({ candidate_id: candidateId, employer_id: employerId });
      if (roleId) params.set('role_id', roleId);
      const res = await apiFetch(`/api/ember/analysis?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmberNarrative({
          summary: data.ember_summary || data.summary,
          recommendation: data.ember_recommendation || data.recommendation,
          insights: data.insights,
        });
      }
    } catch {
      // Silently fail — show static data instead
    } finally {
      setEmberLoading(false);
    }
  }, [candidateId, employerId, roleId]);

  useEffect(() => {
    if (isOpen) {
      fetchEmberAnalysis();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fetchEmberAnalysis]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  const summary = emberNarrative?.summary || matchData.emberSummary;
  const recommendation = emberNarrative?.recommendation || matchData.emberRecommendation;
  const allInsights = emberNarrative?.insights || matchData.insights || [];
  const strengths = matchData.archetype?.strengths?.slice(0, 3) ?? [];

  const handleAskEmber = () => {
    if (onAskEmber) {
      onAskEmber();
    } else {
      const basePath = role === 'candidate' ? '/app/ember' : '/app/employer/ember';
      navigate(`${basePath}?deepdive=${matchData.id}`);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={matchData.name}
        className="relative w-full max-w-2xl rounded-xl shadow-2xl animate-fade-in"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* ---- Header ---- */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex-1 min-w-0">
            <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
              {matchData.name}
            </h2>
            {matchData.subtitle && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-textSecondary)' }}>
                {matchData.subtitle}
              </p>
            )}
            {matchData.archetype && (
              <p className="text-label font-normal mt-2" style={{ color: 'var(--color-textMuted)' }}>
                <span style={{ color: 'var(--color-text)' }}>{matchData.archetype.name}</span>
                {strengths.length > 0 && <> · {strengths.join(', ')}</>}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
              {matchData.overallScore}%
            </p>
            <p className="text-caption" style={{ color: 'var(--color-textMuted)' }}>match</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)] flex-shrink-0"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---- OCEAN comparison ---- */}
        {matchData.dimensionAnalysis && matchData.dimensionAnalysis.length > 0 && (
          <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Personality comparison
              </h3>
              <div className="flex items-center gap-4 text-caption" style={{ color: 'var(--color-textMuted)' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                  {role === 'candidate' ? 'You' : 'Candidate'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: 'var(--color-text)' }} />
                  {role === 'candidate' ? 'Ideal' : 'Your preference'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {matchData.dimensionAnalysis.map((dim) => (
                <div key={dim.name} className="flex items-center gap-2">
                  <div className="flex-1">
                    <OceanComparisonBar
                      label={dim.name}
                      candidateScore={dim.candidate_score}
                      employerPreference={dim.employer_preference}
                    />
                  </div>
                  <div className="flex-shrink-0 w-5 pt-4">
                    {directionIcon(dim.direction)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Composite scores ---- */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Compatibility breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <CompositeBar label="Trait match" score={matchData.traitScore} />
            <CompositeBar label="Culture fit" score={matchData.cultureScore} />
            <CompositeBar label="Work style" score={matchData.workStyleScore} />
            <CompositeBar label="Communication" score={matchData.communicationScore} />
          </div>
        </div>

        {/* ---- Ember narrative ---- */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            Ember's analysis
          </h3>

          {emberLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="h-3 w-4/5 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
          ) : (
            <div className="space-y-4">
              {summary && (
                <div>
                  <h4 className="text-label mb-1" style={{ color: 'var(--color-text)' }}>
                    Why this could work
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                    {summary}
                  </p>
                </div>
              )}

              {recommendation && (
                <div>
                  <h4 className="text-label mb-1" style={{ color: 'var(--color-text)' }}>
                    Recommendation
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                    {recommendation}
                  </p>
                </div>
              )}

              {allInsights.length > 0 && (
                <ul>
                  {allInsights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="py-2.5"
                      style={{ borderTop: idx > 0 ? '1px solid var(--color-border)' : undefined }}
                    >
                      <p className="text-label" style={{ color: 'var(--color-text)' }}>
                        {insight.category}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--color-textSecondary)' }}>
                        {insight.message}
                      </p>
                      {insight.trait_related && (
                        <p className="text-caption mt-1" style={{ color: 'var(--color-textMuted)' }}>
                          Related: {insight.trait_related}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {!summary && !recommendation && allInsights.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                  Ember analysis is not available for this match yet. Use "Ask Ember" below for detailed insights.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ---- Actions: one primary ---- */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              if (onRequestChat) onRequestChat();
            }}
          >
            {role === 'candidate' ? 'Request coffee chat' : 'Invite to coffee chat'}
          </Button>

          <Button variant="outline" onClick={handleAskEmber}>
            Ask Ember
          </Button>

          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => setSaved(!saved)}
            aria-pressed={saved}
            leftIcon={saved
              ? <BookmarkCheck className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              : <Bookmark className="w-4 h-4" />}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
