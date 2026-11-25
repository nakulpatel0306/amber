import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, Star, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { calculateCompatibility, OCEANScores } from '../../lib/compatibilityScoring';
import { determineArchetype } from '../../lib/archetypes';
import { MatchDetailModal, type MatchDetailData } from '../matches/MatchDetailModal';
import { MatchPipeline } from '../matches/MatchPipeline';
import { useSavedMatches } from '../../hooks/useSavedMatches';
import type { PipelineTab } from '../../types/matching.types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmployerData {
  id: string;
  user_id: string;
  company_name: string;
  openness_preference: number;
  conscientiousness_preference: number;
  extraversion_preference: number;
  agreeableness_preference: number;
  neuroticism_preference: number;
  culture_values: string[];
  work_style?: string;
}

interface RoleOption {
  id: string;
  title: string;
  work_style: string | null;
  required_openness_min: number | null;
  required_openness_max: number | null;
  required_conscientiousness_min: number | null;
  required_conscientiousness_max: number | null;
  required_extraversion_min: number | null;
  required_extraversion_max: number | null;
  required_agreeableness_min: number | null;
  required_agreeableness_max: number | null;
  required_neuroticism_min: number | null;
  required_neuroticism_max: number | null;
}

interface CandidateResult {
  candidateId: string;
  name: string;
  headline: string;
  location: string;
  workStyle: string;
  archetype: { name: string; key: string; description?: string; strengths: string[] };
  overallScore: number;
  traitScore: number;
  cultureScore: number;
  workStyleFit: number;
  valuesFit: number;
  breakdown: {
    opennessFit: number;
    conscientiousnessFit: number;
    extraversionFit: number;
    agreeablenessFit: number;
    neuroticismFit: number;
  };
  candidateOcean: OCEANScores;
}

type SortOption = 'overall' | 'culture' | 'trait' | 'archetype';

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function TopCandidates() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [employer, setEmployer] = useState<EmployerData | null>(null);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);

  // Roles
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [selectedArchetypes, setSelectedArchetypes] = useState<Set<string>>(new Set());
  const [selectedWorkStyleFilter, setSelectedWorkStyleFilter] = useState<string | null>(null);

  // Sort
  const [sortBy, setSortBy] = useState<SortOption>('overall');

  // Modal
  const [modalCandidate, setModalCandidate] = useState<CandidateResult | null>(null);

  // Shortlist (now backed by Supabase)

  // Pipeline
  const [activeView, setActiveView] = useState<'browse' | 'pipeline'>('browse');
  const [pipelineTab, setPipelineTab] = useState<PipelineTab>('saved');
  const { savedMatches, save: saveMatch, unsave: unsaveMatch, isSaved, getSavedMatch, counts: pipelineCounts } = useSavedMatches();
  const showLoader = useMinLoader(isLoading);

  // Raw candidates data (before scoring — allows re-scoring when role changes)
  const [rawCandidates, setRawCandidates] = useState<any[]>([]);

  /* ---- Derived data ---- */

  const uniqueArchetypes = useMemo(
    () => [...new Set(candidates.map(c => c.archetype.name))].sort(),
    [candidates]
  );

  const activeFilterCount =
    (minScore > 0 ? 1 : 0) +
    (maxScore < 100 ? 1 : 0) +
    (selectedArchetypes.size > 0 ? 1 : 0) +
    (selectedWorkStyleFilter ? 1 : 0);

  const filteredCandidates = useMemo(() => {
    const result = candidates.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.headline.toLowerCase().includes(q) &&
          !c.archetype.name.toLowerCase().includes(q) &&
          !(c.location || '').toLowerCase().includes(q)
        ) return false;
      }
      if (c.overallScore < minScore || c.overallScore > maxScore) return false;
      if (selectedArchetypes.size > 0 && !selectedArchetypes.has(c.archetype.name)) return false;
      if (selectedWorkStyleFilter && c.workStyle !== selectedWorkStyleFilter) return false;
      return true;
    });

    switch (sortBy) {
      case 'overall':
        result.sort((a, b) => b.overallScore - a.overallScore);
        break;
      case 'culture':
        result.sort((a, b) => b.cultureScore - a.cultureScore);
        break;
      case 'trait':
        result.sort((a, b) => b.traitScore - a.traitScore);
        break;
      case 'archetype':
        result.sort((a, b) => a.archetype.name.localeCompare(b.archetype.name));
        break;
    }

    return result;
  }, [candidates, searchQuery, minScore, maxScore, selectedArchetypes, selectedWorkStyleFilter, sortBy]);

  /* ---- Data Loading ---- */

  useEffect(() => {
    if (!user) return;
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch employer
      const { data: emp } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!emp) {
        setIsLoading(false);
        return;
      }
      setEmployer(emp);

      // Fetch roles for this employer
      const { data: rolesData } = await supabase
        .from('roles')
        .select('id, title, work_style, required_openness_min, required_openness_max, required_conscientiousness_min, required_conscientiousness_max, required_extraversion_min, required_extraversion_max, required_agreeableness_min, required_agreeableness_max, required_neuroticism_min, required_neuroticism_max')
        .eq('employer_id', emp.id);

      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
      }

      // Fetch all candidates with completed assessments
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*, profiles!inner(full_name, email)')
        .not('openness_score', 'is', null);

      if (!candidatesData || candidatesData.length === 0) {
        setCandidates([]);
        setIsLoading(false);
        return;
      }

      setRawCandidates(candidatesData);
      scoreCandidates(candidatesData, emp, null);
    } catch (err) {
      console.error('Error loading top candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scoreCandidates = useCallback((
    candidatesData: any[],
    emp: EmployerData,
    role: RoleOption | null,
  ) => {
    const employerOcean: OCEANScores = {
      openness: emp.openness_preference || 50,
      conscientiousness: emp.conscientiousness_preference || 50,
      extraversion: emp.extraversion_preference || 50,
      agreeableness: emp.agreeableness_preference || 50,
      neuroticism: emp.neuroticism_preference || 50,
    };

    const results: CandidateResult[] = candidatesData.map((c: any) => {
      const candidateOcean: OCEANScores = {
        openness: c.openness_score || 50,
        conscientiousness: c.conscientiousness_score || 50,
        extraversion: c.extraversion_score || 50,
        agreeableness: c.agreeableness_score || 50,
        neuroticism: c.neuroticism_score || 50,
      };

      const compatInput: any = {
        candidateOCEAN: candidateOcean,
        employerPreferences: {
          ...employerOcean,
          cultureValues: emp.culture_values || [],
        },
        candidateWorkStyle: c.work_style || undefined,
      };

      // If a role is selected, include role requirements
      if (role) {
        compatInput.roleWorkStyle = role.work_style || undefined;
        compatInput.roleRequirements = {
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
        };
      }

      const result = calculateCompatibility(compatInput);
      const arch = determineArchetype(candidateOcean);

      return {
        candidateId: c.id,
        name: c.profiles?.full_name || 'Unknown',
        headline: c.headline || arch.name,
        location: c.location || '',
        workStyle: c.work_style || '',
        archetype: { name: arch.name, key: arch.key, description: arch.description, strengths: arch.strengths },
        overallScore: result.overallMatchScore,
        traitScore: result.traitMatchScore,
        cultureScore: result.cultureMatchScore,
        workStyleFit: result.breakdown.workStyleFit,
        valuesFit: result.breakdown.valuesFit,
        breakdown: {
          opennessFit: result.breakdown.opennessFit,
          conscientiousnessFit: result.breakdown.conscientiousnessFit,
          extraversionFit: result.breakdown.extraversionFit,
          agreeablenessFit: result.breakdown.agreeablenessFit,
          neuroticismFit: result.breakdown.neuroticismFit,
        },
        candidateOcean,
      };
    });

    results.sort((a, b) => b.overallScore - a.overallScore);
    setCandidates(results);
  }, []);

  /* ---- Role change handler ---- */

  const handleRoleChange = useCallback((roleId: string | null) => {
    setSelectedRoleId(roleId);
    if (!employer || rawCandidates.length === 0) return;

    const role = roleId ? roles.find(r => r.id === roleId) || null : null;
    scoreCandidates(rawCandidates, employer, role);
  }, [employer, rawCandidates, roles, scoreCandidates]);

  /* ---- Modal data ---- */

  const buildModalData = useCallback((c: CandidateResult): MatchDetailData => {
    if (!employer) {
      return {
        id: c.candidateId,
        name: c.name,
        subtitle: c.headline,
        archetype: c.archetype,
        overallScore: c.overallScore,
        traitScore: c.traitScore,
        cultureScore: c.cultureScore,
        workStyleScore: c.workStyleFit,
        communicationScore: Math.round((c.breakdown.extraversionFit + c.breakdown.agreeablenessFit) / 2),
      };
    }

    return {
      id: c.candidateId,
      name: c.name,
      subtitle: c.headline,
      archetype: c.archetype,
      overallScore: c.overallScore,
      traitScore: c.traitScore,
      cultureScore: c.cultureScore,
      workStyleScore: c.workStyleFit,
      communicationScore: Math.round((c.breakdown.extraversionFit + c.breakdown.agreeablenessFit) / 2),
      dimensionAnalysis: [
        {
          name: 'Openness',
          candidate_score: c.candidateOcean.openness,
          employer_preference: employer.openness_preference || 50,
          fit_score: c.breakdown.opennessFit,
          gap: Math.abs(c.candidateOcean.openness - (employer.openness_preference || 50)),
          direction: c.candidateOcean.openness > (employer.openness_preference || 50) ? 'above' : c.candidateOcean.openness < (employer.openness_preference || 50) ? 'below' : 'aligned',
        },
        {
          name: 'Conscientiousness',
          candidate_score: c.candidateOcean.conscientiousness,
          employer_preference: employer.conscientiousness_preference || 50,
          fit_score: c.breakdown.conscientiousnessFit,
          gap: Math.abs(c.candidateOcean.conscientiousness - (employer.conscientiousness_preference || 50)),
          direction: c.candidateOcean.conscientiousness > (employer.conscientiousness_preference || 50) ? 'above' : c.candidateOcean.conscientiousness < (employer.conscientiousness_preference || 50) ? 'below' : 'aligned',
        },
        {
          name: 'Extraversion',
          candidate_score: c.candidateOcean.extraversion,
          employer_preference: employer.extraversion_preference || 50,
          fit_score: c.breakdown.extraversionFit,
          gap: Math.abs(c.candidateOcean.extraversion - (employer.extraversion_preference || 50)),
          direction: c.candidateOcean.extraversion > (employer.extraversion_preference || 50) ? 'above' : c.candidateOcean.extraversion < (employer.extraversion_preference || 50) ? 'below' : 'aligned',
        },
        {
          name: 'Agreeableness',
          candidate_score: c.candidateOcean.agreeableness,
          employer_preference: employer.agreeableness_preference || 50,
          fit_score: c.breakdown.agreeablenessFit,
          gap: Math.abs(c.candidateOcean.agreeableness - (employer.agreeableness_preference || 50)),
          direction: c.candidateOcean.agreeableness > (employer.agreeableness_preference || 50) ? 'above' : c.candidateOcean.agreeableness < (employer.agreeableness_preference || 50) ? 'below' : 'aligned',
        },
        {
          name: 'Stability',
          candidate_score: 100 - c.candidateOcean.neuroticism,
          employer_preference: 100 - (employer.neuroticism_preference || 50),
          fit_score: c.breakdown.neuroticismFit,
          gap: Math.abs(c.candidateOcean.neuroticism - (employer.neuroticism_preference || 50)),
          direction: c.candidateOcean.neuroticism < (employer.neuroticism_preference || 50) ? 'above' : c.candidateOcean.neuroticism > (employer.neuroticism_preference || 50) ? 'below' : 'aligned',
        },
      ],
    };
  }, [employer]);

  /* ---- Chat handler ---- */

  const handleInviteChat = useCallback(async (candidate: CandidateResult) => {
    if (!employer) return;
    try {
      const insertData: any = {
        candidate_id: candidate.candidateId,
        employer_id: employer.id,
        initiated_by: 'employer',
        status: 'pending',
        match_score: candidate.overallScore,
        // Stored on the chat so both sides can label it without cross-table reads under RLS
        candidate_name: candidate.name,
        company_name: employer.company_name,
      };
      if (selectedRoleId) {
        const role = roles.find(r => r.id === selectedRoleId);
        if (role) {
          insertData.role_id = selectedRoleId;
          insertData.role_title = role.title;
        }
      }
      await supabase.from('coffee_chats').insert(insertData);
      showSuccess('Sent!', 'Coffee chat invitation sent');
    } catch {
      showError('Error', 'Failed to send invitation');
    }
  }, [employer, selectedRoleId, roles, showSuccess, showError]);

  /* ---- Shortlist toggle ---- */

  // The star saves to the same pipeline as Ember's bookmark, so the two views always agree
  const toggleShortlist = async (candidate: CandidateResult) => {
    const existing = getSavedMatch('candidate', candidate.candidateId);
    try {
      if (existing) {
        await unsaveMatch(existing.id);
      } else {
        await saveMatch({
          target_type: 'candidate',
          role_id: selectedRoleId || null,
          employer_id: employer?.id || null,
          candidate_id: candidate.candidateId,
          candidate_name: candidate.name,
          match_score: candidate.overallScore,
          notes: null,
          status: 'saved',
        });
      }
    } catch {
      showError('Error', 'Failed to update your shortlist');
    }
  };

  /* ---- Archetype filter toggle ---- */

  const toggleArchetypeFilter = (name: string) => {
    setSelectedArchetypes(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setMinScore(0);
    setMaxScore(100);
    setSelectedArchetypes(new Set());
    setSelectedWorkStyleFilter(null);
    setSearchQuery('');
  };

  /* ---- Loading ---- */

  if (showLoader) {
    return (
      <CoffeeBrewLoader variant="fullscreen" message="Ranking candidates by culture fit…" />
    );
  }

  if (!employer || candidates.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-heading mb-2" style={{ color: 'var(--color-text)' }}>
            {!employer ? 'Complete your setup' : 'No candidates yet'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {!employer
              ? 'Set up your employer profile to start finding candidates.'
              : 'No candidates have completed their assessments yet. Check back soon.'}
          </p>
        </div>
      </div>
    );
  }

  /* ---- Main Render ---- */

  const pipelineTotal = pipelineCounts.saved + pipelineCounts.pending + pipelineCounts.connected;
  const controlClass = 'appearance-none w-full pl-3 pr-8 py-2 rounded-lg text-sm cursor-pointer border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]';
  const controlStyle = { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title={activeView === 'browse' ? 'Top candidates' : 'Your pipeline'}
        subtitle={activeView === 'browse'
          ? 'Every candidate with a finished assessment, ranked by fit'
          : 'Track your shortlisted and pending candidates'}
        belowSubtitle={
          <Facts
            items={[
              { label: 'Found', value: filteredCandidates.length },
              { label: 'Shortlisted', value: pipelineCounts.saved },
              { label: 'In pipeline', value: pipelineTotal },
            ]}
          />
        }
        rightContent={
          <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            {(['browse', 'pipeline'] as const).map(view => {
              const isActive = activeView === view;
              return (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  aria-pressed={isActive}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--color-surfaceHover)' : 'transparent',
                    color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)',
                  }}
                >
                  {view === 'browse' ? 'Browse all' : 'Pipeline'}
                </button>
              );
            })}
          </div>
        }
      />

      {activeView === 'pipeline' && (
        <MatchPipeline
          savedMatches={savedMatches}
          activeTab={pipelineTab}
          onTabChange={setPipelineTab}
          counts={pipelineCounts}
          mode="employer"
          onViewInEmber={(matchId) => navigate(`/app/employer/ember?deepdive=${matchId}`)}
          onRemove={async (id) => {
            try {
              await unsaveMatch(id);
              showSuccess('Removed', 'Candidate removed');
            } catch {
              showError('Error', 'Failed to remove');
            }
          }}
          onCoffeeChat={(match) => {
            const candidate = candidates.find((c) => c.candidateId === match.candidate_id);
            if (candidate) handleInviteChat(candidate);
            else showError('Not available', 'This candidate is no longer in your results');
          }}
        />
      )}

      {activeView === 'browse' && (
        <>
          {/* Toolbar: search, role, sort, filters */}
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
              <input
                type="text"
                placeholder="Search by name, headline, archetype, or location…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-lg text-sm border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
                style={controlStyle}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {roles.length > 0 && (
                <div className="relative basis-full sm:basis-auto sm:w-56 min-w-0">
                  <select
                    value={selectedRoleId || ''}
                    onChange={e => handleRoleChange(e.target.value || null)}
                    aria-label="Rank for role"
                    className={`${controlClass} truncate`}
                    style={controlStyle}
                  >
                    <option value="">All roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--color-textMuted)' }} />
                </div>
              )}

              <div className="relative flex-1 sm:flex-none sm:w-44">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort by"
                  className={controlClass}
                  style={controlStyle}
                >
                  <option value="overall">Overall match</option>
                  <option value="culture">Culture fit</option>
                  <option value="trait">Trait match</option>
                  <option value="archetype">Archetype</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--color-textMuted)' }} />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                className="!min-h-9 !py-1.5"
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="tabular-nums" style={{ color: 'var(--color-accent)' }}>{activeFilterCount}</span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="bento-card mt-3 grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] gap-5 animate-fade-in">
              <div>
                <label className="text-label mb-1.5 block" style={{ color: 'var(--color-text)' }}>Match score</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={minScore}
                    onChange={e => setMinScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    aria-label="Minimum match score"
                    className="w-20 px-3 py-2 rounded-lg text-sm text-center tabular-nums border border-[var(--color-border)]"
                    style={controlStyle}
                    placeholder="0"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-textMuted)' }}>to</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={maxScore}
                    onChange={e => setMaxScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 100)))}
                    aria-label="Maximum match score"
                    className="w-20 px-3 py-2 rounded-lg text-sm text-center tabular-nums border border-[var(--color-border)]"
                    style={controlStyle}
                    placeholder="100"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-textMuted)' }}>%</span>
                </div>
              </div>

              {uniqueArchetypes.length > 0 && (
                <div className="min-w-0">
                  <label className="text-label mb-1.5 block" style={{ color: 'var(--color-text)' }}>Archetype</label>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueArchetypes.map(arch => {
                      const on = selectedArchetypes.has(arch);
                      return (
                        <button
                          key={arch}
                          onClick={() => toggleArchetypeFilter(arch)}
                          aria-pressed={on}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-medium transition-colors"
                          style={{
                            color: on ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                            border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          }}
                        >
                          {on && <Check className="w-3 h-3" />}
                          {arch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-label mb-1.5 block" style={{ color: 'var(--color-text)' }}>Work style</label>
                <div className="relative w-full md:w-40">
                  <select
                    value={selectedWorkStyleFilter || ''}
                    onChange={e => setSelectedWorkStyleFilter(e.target.value || null)}
                    className={controlClass}
                    style={controlStyle}
                  >
                    <option value="">All</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--color-textMuted)' }} />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="md:col-span-3 -mt-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Ranked list: one card, divided rows, score on the right */}
          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
                {selectedRoleId ? `Ranked for ${roles.find(r => r.id === selectedRoleId)?.title ?? 'this role'}` : 'Ranked for your company'}
              </h2>
              <span className="hidden lg:block text-caption" style={{ color: 'var(--color-textMuted)' }}>
                Traits · culture · work style
              </span>
            </div>

            <div className="bento-card !p-0 overflow-hidden">
              {filteredCandidates.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>No candidates match your filters</p>
                  <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    Try adjusting your filters or search query.
                  </p>
                  {activeFilterCount > 0 && (
                    <Button variant="link" className="mt-4 text-sm" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <ul>
                  {filteredCandidates.map((c, i) => {
                    const isShortlisted = isSaved('candidate', c.candidateId);
                    const place = [c.location, c.workStyle && c.workStyle.charAt(0).toUpperCase() + c.workStyle.slice(1)].filter(Boolean).join(' · ');
                    return (
                      <li
                        key={c.candidateId}
                        className="flex flex-col sm:flex-row sm:items-center"
                        style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                      >
                        <button
                          type="button"
                          onClick={() => setModalCandidate(c)}
                          className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_11rem_3.5rem] lg:grid-cols-[minmax(0,1fr)_11rem_10rem_3.5rem] items-center gap-4 pl-4 sm:pl-5 pr-4 py-3.5 text-left transition-colors hover:bg-[var(--color-surfaceHover)]"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="w-5 flex-shrink-0 text-right text-caption tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                              {i + 1}
                            </span>
                            <span
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
                              style={{ backgroundColor: 'var(--color-surfaceHover)', color: 'var(--color-textSecondary)' }}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {c.name}
                              </span>
                              <span className="block truncate text-label font-normal" style={{ color: 'var(--color-textSecondary)' }}>
                                {c.headline}
                                <span className="sm:hidden"> · {c.archetype.name}</span>
                              </span>
                            </span>
                          </span>
                          <span className="hidden sm:block min-w-0">
                            <span className="block truncate text-sm" style={{ color: 'var(--color-textSecondary)' }}>{c.archetype.name}</span>
                            {place && (
                              <span className="block truncate text-caption" style={{ color: 'var(--color-textMuted)' }}>{place}</span>
                            )}
                          </span>
                          <span
                            className="hidden lg:block text-label font-normal tabular-nums"
                            style={{ color: 'var(--color-textSecondary)' }}
                            title={`Trait match ${c.traitScore}%, culture fit ${c.cultureScore}%, work style ${c.workStyleFit}%`}
                          >
                            {c.traitScore} · {c.cultureScore} · {c.workStyleFit}
                          </span>
                          <span className="text-right text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>
                            {c.overallScore}%
                          </span>
                        </button>

                        <div className="flex items-center gap-1 pl-12 pr-4 pb-3 sm:p-0 sm:pr-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInviteChat(c)}
                          >
                            Invite to chat
                          </Button>
                          <button
                            onClick={() => toggleShortlist(c)}
                            aria-pressed={isShortlisted}
                            aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
                          >
                            <Star
                              className="w-4 h-4"
                              style={{
                                color: isShortlisted ? 'var(--color-accent)' : 'var(--color-textMuted)',
                                fill: isShortlisted ? 'var(--color-accent)' : 'none',
                              }}
                            />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      {/* Match Detail Modal */}
      {modalCandidate && (
        <MatchDetailModal
          isOpen={!!modalCandidate}
          onClose={() => setModalCandidate(null)}
          role="employer"
          matchData={buildModalData(modalCandidate)}
          candidateId={modalCandidate.candidateId}
          employerId={employer.id}
          roleId={selectedRoleId || undefined}
          onRequestChat={() => handleInviteChat(modalCandidate)}
          onAskEmber={() => {
            navigate('/app/employer/ember');
          }}
        />
      )}
    </div>
  );
}
