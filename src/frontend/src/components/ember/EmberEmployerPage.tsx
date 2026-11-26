import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useConnections } from '../../contexts/ConnectionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useEmployerMatchData } from '../../hooks/useMatchData';
import { useSavedMatches } from '../../hooks/useSavedMatches';
import { EmberFirefly } from './EmberFirefly';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { PlayerCardGrid } from './gallery/PlayerCardGrid';
import { GalleryFilterBar } from './gallery/GalleryFilterBar';
import { DeepDive } from './gallery/DeepDive';
import { CompareView } from './gallery/CompareView';
import { CoffeeBrewModal } from './gallery/CoffeeBrewModal';
import { ConnectModal } from '../connections/ConnectModal';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { TopMatchCard } from './TopMatchCard';
import type { CandidateResult, PageView, SortOption } from '../../types/matching.types';
import type { OCEANScores } from '../../lib/compatibilityScoring';

type EmployerView = PageView | 'compare';

export function EmberEmployerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success: showSuccess, error: showError } = useToast();
  const { profile } = useAuth();
  const { getConnectionStatus, sendConnectionRequest } = useConnections();

  // Data hooks
  const {
    employer, candidates, roles, archetype, isLoading,
    selectedRoleId, handleRoleChange, setPendingChats,
  } = useEmployerMatchData();
  const { isSaved, save, unsave, getSavedMatch } = useSavedMatches();
  const showLoader = useMinLoader(isLoading, 2500);

  // View state
  const deepdiveParam = searchParams.get('deepdive');
  const [view, setView] = useState<EmployerView>(deepdiveParam ? 'deepdive' : 'gallery');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [brewTarget, setBrewTarget] = useState<CandidateResult | null>(null);
  const [connectTarget, setConnectTarget] = useState<CandidateResult | null>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [chatCandidateIds, setChatCandidateIds] = useState<Set<string>>(new Set());

  // An existing coffee chat means you're already talking, so the deep dive offers Message, not Connect
  useEffect(() => {
    if (!employer) return;
    supabase
      .from('coffee_chats')
      .select('candidate_id, status')
      .eq('employer_id', employer.id)
      .then(({ data }) => {
        setChatCandidateIds(new Set((data ?? []).filter(c => c.status !== 'cancelled').map(c => c.candidate_id as string)));
      });
  }, [employer]);

  // Handle deepdive URL param once candidates load
  useEffect(() => {
    if (deepdiveParam && candidates.length > 0 && !selectedCandidate) {
      const candidate = candidates.find(c => c.candidateId === deepdiveParam);
      if (candidate) {
        setSelectedCandidate(candidate);
        setView('deepdive');
      }
    }
  }, [deepdiveParam, candidates, selectedCandidate]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [quickFilter, setQuickFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArchetypes, setSelectedArchetypes] = useState<Set<string>>(new Set());
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);

  // Derived filter data
  const archetypes = useMemo(() => {
    const set = new Set(candidates.map(c => c.archetype.name));
    return Array.from(set).sort();
  }, [candidates]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedArchetypes.size > 0) count++;
    if (minScore > 0) count++;
    if (maxScore < 100) count++;
    return count;
  }, [selectedArchetypes, minScore, maxScore]);

  // Filtered + sorted candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Search — when active, skip quick-filter slicing
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q)
      );
    } else {
      if (quickFilter === 'top5') result = result.slice(0, 5);
      else if (quickFilter === 'top10') result = result.slice(0, 10);
    }

    // Filters
    if (selectedArchetypes.size > 0) {
      result = result.filter(c => selectedArchetypes.has(c.archetype.name));
    }
    if (minScore > 0) result = result.filter(c => c.overallScore >= minScore);
    if (maxScore < 100) result = result.filter(c => c.overallScore <= maxScore);

    // Sort
    switch (sortBy) {
      case 'culture': result.sort((a, b) => b.cultureScore - a.cultureScore); break;
      case 'workstyle': result.sort((a, b) => b.workStyleFit - a.workStyleFit); break;
      case 'score':
      default: result.sort((a, b) => b.overallScore - a.overallScore);
    }

    return result;
  }, [candidates, quickFilter, searchQuery, selectedArchetypes, minScore, maxScore, sortBy]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedArchetypes(new Set());
    setMinScore(0);
    setMaxScore(100);
    setQuickFilter('all');
  }, []);

  // Saved match IDs
  const savedIds = useMemo(() => {
    return new Set(candidates.filter(c => isSaved('candidate', c.candidateId)).map(c => c.candidateId));
  }, [candidates, isSaved]);

  // Shortlisted candidates — full objects for sidebar
  const shortlistedCandidates = useMemo(() => {
    return candidates.filter(c => savedIds.has(c.candidateId));
  }, [candidates, savedIds]);

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    if (candidates.length === 0) return null;
    const scores = candidates.map(c => c.overallScore);
    const strongCandidates = candidates.filter(c => c.overallScore >= 80).length;
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { totalCandidates: candidates.length, strongCandidates, avgScore };
  }, [candidates]);

  // Featured match (top candidate)
  const featuredMatch = useMemo(() => {
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => b.overallScore - a.overallScore)[0];
  }, [candidates]);

  // Handlers
  const handleDeepDive = useCallback((c: CandidateResult) => {
    setSelectedCandidate(c);
    setView('deepdive');
    requestAnimationFrame(() => {
      const el = document.getElementById('main-scroll-container');
      if (el) el.scrollTop = 0;
      window.scrollTo({ top: 0 });
    });
  }, []);

  const handleBackToGallery = useCallback(() => {
    setSelectedCandidate(null);
    setCompareIds(new Set());
    setView('gallery');
    // Clear deepdive param so the useEffect doesn't re-open it
    if (searchParams.has('deepdive')) {
      searchParams.delete('deepdive');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleToggleSave = useCallback(async (c: CandidateResult) => {
    try {
      const existing = getSavedMatch('candidate', c.candidateId);
      if (existing) {
        await unsave(existing.id);
        showSuccess('Removed', 'Candidate removed from shortlist');
      } else {
        await save({
          target_type: 'candidate',
          role_id: selectedRoleId || null,
          employer_id: employer?.id || null,
          candidate_id: c.candidateId,
          candidate_name: c.name,
          match_score: c.overallScore,
          notes: null,
          status: 'saved',
        });
        showSuccess('Shortlisted!', 'Candidate added to shortlist');
      }
    } catch {
      showError('Error', 'Failed to update shortlist');
    }
  }, [employer, selectedRoleId, getSavedMatch, save, unsave, showSuccess, showError]);

  const handleToggleSelect = useCallback((c: CandidateResult) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(c.candidateId)) next.delete(c.candidateId);
      else if (next.size < 3) next.add(c.candidateId);
      return next;
    });
  }, []);

  const handleBrew = useCallback(async (note: string, preferredDates: Date[]) => {
    if (!employer || !brewTarget) return;
    try {
      const insertData: any = {
        candidate_id: brewTarget.candidateId,
        employer_id: employer.id,
        initiated_by: 'employer',
        status: 'pending',
        match_score: brewTarget.overallScore,
        message: note || undefined,
        candidate_name: brewTarget.name,
        company_name: employer.company_name,
        preferred_dates: preferredDates.length > 0
          ? preferredDates.map(d => d.toISOString())
          : undefined,
      };
      if (selectedRoleId) {
        const role = roles.find(r => r.id === selectedRoleId);
        if (role) {
          insertData.role_id = selectedRoleId;
          insertData.role_title = role.title;
        }
      }
      await supabase.from('coffee_chats').insert(insertData);
      showSuccess('Sent!', 'Coffee chat invitation sent — view it in your Chats');
      setPendingChats(prev => prev + 1);

      const existing = getSavedMatch('candidate', brewTarget.candidateId);
      if (existing) {
        await supabase.from('saved_matches').update({ status: 'pending' }).eq('id', existing.id);
      }
    } catch {
      showError('Error', 'Failed to send invitation');
      throw new Error('Failed to send');
    }
  }, [employer, brewTarget, selectedRoleId, roles, getSavedMatch, showSuccess, showError, setPendingChats]);

  const handleConnect = useCallback(async (message: string, meetInvite?: { proposed_times: string[]; duration_minutes: number }) => {
    if (!employer || !connectTarget) return;
    try {
      // Get selected role info for the coffee chat
      const selectedRole = selectedRoleId ? roles.find(r => r.id === selectedRoleId) : undefined;

      await sendConnectionRequest({
        receiverId: connectTarget.userId,
        senderRole: 'employer',
        message,
        senderName: profile?.full_name || undefined,
        senderCompany: employer.company_name,
        receiverName: connectTarget.name,
        meetInvite,
        matchScore: connectTarget.overallScore,
        roleId: selectedRole?.id,
        roleTitle: selectedRole?.title,
      });
      showSuccess('Sent!', `Connection request sent to ${connectTarget.name}`);
    } catch {
      showError('Error', 'Failed to send connection request');
      throw new Error('Failed');
    }
  }, [employer, connectTarget, profile, selectedRoleId, roles, sendConnectionRequest, showSuccess, showError]);

  // Deep dive dimension data
  const deepDiveDimensions = useMemo(() => {
    if (!selectedCandidate || !employer) return [];
    return [
      { name: 'Openness', candidateScore: selectedCandidate.candidateOcean.openness, employerPreference: employer.openness_preference || 50, fitScore: selectedCandidate.breakdown.opennessFit },
      { name: 'Conscientiousness', candidateScore: selectedCandidate.candidateOcean.conscientiousness, employerPreference: employer.conscientiousness_preference || 50, fitScore: selectedCandidate.breakdown.conscientiousnessFit },
      { name: 'Extraversion', candidateScore: selectedCandidate.candidateOcean.extraversion, employerPreference: employer.extraversion_preference || 50, fitScore: selectedCandidate.breakdown.extraversionFit },
      { name: 'Agreeableness', candidateScore: selectedCandidate.candidateOcean.agreeableness, employerPreference: employer.agreeableness_preference || 50, fitScore: selectedCandidate.breakdown.agreeablenessFit },
      { name: 'Stability', candidateScore: 100 - selectedCandidate.candidateOcean.neuroticism, employerPreference: 100 - (employer.neuroticism_preference || 50), fitScore: selectedCandidate.breakdown.neuroticismFit },
    ];
  }, [selectedCandidate, employer]);

  // Compare candidates
  const compareCandidates = useMemo(() => {
    return candidates.filter(c => compareIds.has(c.candidateId));
  }, [candidates, compareIds]);

  // Loading
  if (showLoader) {
    return <CoffeeBrewLoader variant="fullscreen" />;
  }

  // No employer setup
  if (!employer) {
    return (
      <div className="ember-page min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center max-w-md">
          <EmberFirefly size="xl" mood="neutral" />
          <h2 className="text-title mt-6 mb-3" style={{ color: 'var(--color-text)' }}>
            Complete your setup
          </h2>
          <p className="mb-6" style={{ color: 'var(--color-textMuted)' }}>
            Set up your employer profile and take the culture quiz to unlock Ember insights.
          </p>
          <Button onClick={() => navigate('/app/employer/culture')}>Take culture quiz</Button>
        </div>
      </div>
    );
  }

  const employerOcean: OCEANScores = {
    openness: employer.openness_preference || 50,
    conscientiousness: employer.conscientiousness_preference || 50,
    extraversion: employer.extraversion_preference || 50,
    agreeableness: employer.agreeableness_preference || 50,
    neuroticism: employer.neuroticism_preference || 50,
  };

  return (
    <div className="ember-page min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'deepdive' && selectedCandidate ? (
            <DeepDive
              key="deepdive"
              mode="employer"
              name={selectedCandidate.name}
              subtitle={selectedCandidate.headline}
              archetype={selectedCandidate.archetype}
              overallScore={selectedCandidate.overallScore}
              traitScore={selectedCandidate.traitScore}
              cultureScore={selectedCandidate.cultureScore}
              workStyleScore={selectedCandidate.workStyleFit}
              communicationScore={Math.round((selectedCandidate.breakdown.extraversionFit + selectedCandidate.breakdown.agreeablenessFit) / 2)}
              dimensions={deepDiveDimensions}
              candidateOcean={selectedCandidate.candidateOcean}
              candidateWorkStyle={selectedCandidate.workStyle || null}
              employerOcean={employerOcean}
              cultureValues={employer.culture_values || []}
              employerArchetypeName={employer.archetype_name ?? null}
              candidateId={selectedCandidate.candidateId}
              employerId={employer.id}
              roleId={selectedRoleId || undefined}
              isSaved={savedIds.has(selectedCandidate.candidateId)}
              connectionStatus={getConnectionStatus(selectedCandidate.userId)}
              onMessage={chatCandidateIds.has(selectedCandidate.candidateId) ? () => navigate('/app/employer/chats') : undefined}
              onBack={handleBackToGallery}
              onBrew={() => setBrewTarget(selectedCandidate)}
              onToggleSave={() => handleToggleSave(selectedCandidate)}
              onConnect={() => setConnectTarget(selectedCandidate)}
              onCompare={() => {
                setCompareIds(prev => {
                  const next = new Set(prev);
                  next.add(selectedCandidate.candidateId);
                  return next;
                });
                setView('gallery');
              }}
            />
          ) : view === 'compare' && compareCandidates.length >= 2 ? (
            <CompareView
              key="compare"
              candidates={compareCandidates}
              employerOcean={employerOcean as unknown as Record<string, number>}
              onBack={handleBackToGallery}
            />
          ) : view === 'gallery' ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
            >
              <PageBanner
                title="Ember"
                subtitle={[
                  archetype ? `${archetype.name} culture` : 'Your personalized candidate gallery',
                  candidates.length > 0 ? `${candidates.length} ${candidates.length === 1 ? 'candidate' : 'candidates'} ranked for you` : '',
                ].filter(Boolean).join(' · ')}
                belowSubtitle={dashboardStats && (
                  <Facts
                    items={[
                      { label: 'Strong matches (80+)', value: dashboardStats.strongCandidates },
                      { label: 'Average', value: `${dashboardStats.avgScore}%` },
                    ]}
                  />
                )}
                rightContent={compareIds.size > 0 && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setCompareIds(new Set())}>
                      Clear selection
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setView('compare')}
                      disabled={compareIds.size < 2}
                      title={compareIds.size < 2 ? 'Select at least 2 candidates' : undefined}
                    >
                      Compare ({compareIds.size})
                    </Button>
                  </>
                )}
              />

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
                <main className="min-w-0 space-y-4">
                  <GalleryFilterBar
                    mode="employer"
                    matchCount={filteredCandidates.length}
                    searchQuery={searchQuery}
                    onSearchChange={(q) => {
                      setSearchQuery(q);
                      if (q) setQuickFilter('all');
                    }}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    quickFilter={quickFilter}
                    onQuickFilterChange={setQuickFilter}
                    activeFilterCount={activeFilterCount}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    showFilters={showFilters}
                    archetypes={archetypes}
                    selectedArchetypes={selectedArchetypes}
                    onToggleArchetype={(arch) => {
                      setSelectedArchetypes(prev => {
                        const next = new Set(prev);
                        if (next.has(arch)) next.delete(arch);
                        else next.add(arch);
                        return next;
                      });
                    }}
                    roles={roles}
                    selectedRoleId={selectedRoleId}
                    onRoleChange={handleRoleChange}
                    minScore={minScore}
                    maxScore={maxScore}
                    onMinScoreChange={setMinScore}
                    onMaxScoreChange={setMaxScore}
                    onClearFilters={clearFilters}
                  />

                  <PlayerCardGrid
                    mode="employer"
                    candidates={filteredCandidates}
                    savedIds={savedIds}
                    selectedIds={compareIds}
                    showSelect
                    getConnectionStatus={getConnectionStatus}
                    onDeepDive={handleDeepDive}
                    onBrew={(c) => setBrewTarget(c)}
                    onToggleSave={handleToggleSave}
                    onToggleSelect={handleToggleSelect}
                    onConnect={(c) => setConnectTarget(c)}
                  />
                </main>

                <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
                  {featuredMatch && (
                    <TopMatchCard
                      name={featuredMatch.name}
                      subtitle={featuredMatch.headline}
                      score={featuredMatch.overallScore}
                      onDeepDive={() => handleDeepDive(featuredMatch)}
                    />
                  )}

                  <section>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Shortlist
                    </h2>
                    {shortlistedCandidates.length === 0 ? (
                      <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                        Bookmark a candidate to keep them here.
                      </p>
                    ) : (
                      <ul className="mt-2">
                        {shortlistedCandidates.map((c, i) => (
                          <li
                            key={c.candidateId}
                            className="group flex items-center gap-2 py-2.5"
                            style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => handleDeepDive(c)}
                            >
                              <span className="block truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {c.name}
                              </span>
                              <span className="block truncate text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                                {c.archetype.name} · {c.overallScore}%
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSave(c)}
                              className="rounded-lg p-1.5 transition-opacity hover:bg-[var(--color-surfaceHover)] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                              style={{ color: 'var(--color-textMuted)' }}
                              aria-label={`Remove ${c.name} from shortlist`}
                              title="Remove from shortlist"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </aside>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Coffee Brew Modal */}
      {brewTarget && (
        <CoffeeBrewModal
          isOpen={!!brewTarget}
          onClose={() => setBrewTarget(null)}
          name={brewTarget.name}
          subtitle={brewTarget.headline}
          archetype={brewTarget.archetype}
          overallScore={brewTarget.overallScore}
          onBrew={handleBrew}
        />
      )}

      {/* Connect Modal */}
      {connectTarget && (
        <ConnectModal
          isOpen={!!connectTarget}
          onClose={() => setConnectTarget(null)}
          name={connectTarget.name}
          subtitle={connectTarget.headline}
          archetype={connectTarget.archetype}
          overallScore={connectTarget.overallScore}
          onConnect={handleConnect}
        />
      )}
    </div>
  );
}
