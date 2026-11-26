import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useConnections } from '../../contexts/ConnectionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useCandidateMatchData } from '../../hooks/useMatchData';
import { useSavedMatches } from '../../hooks/useSavedMatches';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { PlayerCardGrid } from './gallery/PlayerCardGrid';
import { GalleryFilterBar } from './gallery/GalleryFilterBar';
import { DeepDive } from './gallery/DeepDive';
import { CoffeeBrewModal } from './gallery/CoffeeBrewModal';
import { ConnectModal } from '../connections/ConnectModal';
import { Button } from '../ui/Button';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { TopMatchCard } from './TopMatchCard';
import type { EmployerResult, PageView, SortOption } from '../../types/matching.types';
import type { OCEANScores } from '../../lib/compatibilityScoring';

export function EmberAgent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success: showSuccess, error: showError } = useToast();
  const { profile } = useAuth();
  const { getConnectionStatus, sendConnectionRequest } = useConnections();

  // Data hooks
  const {
    candidate, employers, archetype, isLoading, error: dataError, setPendingChats,
  } = useCandidateMatchData();
  const { savedMatches, save, unsave } = useSavedMatches();
  const showLoader = useMinLoader(isLoading, 2500);

  // View state
  const deepdiveParam = searchParams.get('deepdive');
  const [view, setView] = useState<PageView>(deepdiveParam ? 'deepdive' : 'gallery');
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerResult | null>(null);
  const [brewTarget, setBrewTarget] = useState<EmployerResult | null>(null);
  const [connectTarget, setConnectTarget] = useState<EmployerResult | null>(null);
  const [chatEmployerIds, setChatEmployerIds] = useState<Set<string>>(new Set());

  // An existing coffee chat means you're already talking, so the deep dive offers Message, not Connect
  useEffect(() => {
    if (!candidate) return;
    supabase
      .from('coffee_chats')
      .select('employer_id, status')
      .eq('candidate_id', candidate.id)
      .then(({ data }) => {
        setChatEmployerIds(new Set((data ?? []).filter(c => c.status !== 'cancelled').map(c => c.employer_id as string)));
      });
  }, [candidate]);

  // Handle deepdive URL param once employers load
  useEffect(() => {
    if (deepdiveParam && employers.length > 0 && !selectedEmployer) {
      const emp = employers.find(e => e.employerId === deepdiveParam);
      if (emp) {
        setSelectedEmployer(emp);
        setView('deepdive');
      }
    }
  }, [deepdiveParam, employers, selectedEmployer]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [quickFilter, setQuickFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedWorkStyle, setSelectedWorkStyle] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);

  // Derived filter data
  const industries = useMemo(() => {
    const set = new Set(employers.map(e => e.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [employers]);

  const locations = useMemo(() => {
    const set = new Set(employers.map(e => e.location).filter(Boolean));
    return Array.from(set).sort();
  }, [employers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedIndustry) count++;
    if (selectedWorkStyle) count++;
    if (selectedLocation) count++;
    if (minScore > 0) count++;
    if (maxScore < 100) count++;
    return count;
  }, [selectedIndustry, selectedWorkStyle, selectedLocation, minScore, maxScore]);

  // Filtered + sorted employers
  const filteredEmployers = useMemo(() => {
    let result = [...employers];

    // Search — when a search query is active, skip quick-filter slicing
    // so the user can search across ALL employers, not just the top N.
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.companyName.toLowerCase().includes(q) ||
        e.industry.toLowerCase().includes(q)
      );
    } else {
      // Quick filter (only when not searching)
      if (quickFilter === 'top5') result = result.slice(0, 5);
      else if (quickFilter === 'top10') result = result.slice(0, 10);
    }

    // Filters
    if (selectedIndustry) result = result.filter(e => e.industry === selectedIndustry);
    if (selectedLocation) result = result.filter(e => e.location === selectedLocation);
    if (minScore > 0) result = result.filter(e => e.overallScore >= minScore);
    if (maxScore < 100) result = result.filter(e => e.overallScore <= maxScore);

    // Sort
    switch (sortBy) {
      case 'culture': result.sort((a, b) => b.cultureScore - a.cultureScore); break;
      case 'workstyle': result.sort((a, b) => b.workStyleFit - a.workStyleFit); break;
      case 'recent': result.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }); break;
      case 'score':
      default: result.sort((a, b) => b.overallScore - a.overallScore);
    }

    return result;
  }, [employers, quickFilter, searchQuery, selectedIndustry, selectedLocation, minScore, maxScore, sortBy]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedIndustry('');
    setSelectedWorkStyle('');
    setSelectedLocation('');
    setMinScore(0);
    setMaxScore(100);
    setQuickFilter('all');
  }, []);

  // Saved match IDs — match on employer_id directly since isSaved checks candidate_id
  const savedIds = useMemo(() => {
    const savedEmployerIds = new Set(savedMatches.map(m => m.employer_id).filter(Boolean));
    return new Set(employers.filter(e => savedEmployerIds.has(e.employerId)).map(e => e.employerId));
  }, [employers, savedMatches]);

  // Bookmarked employers — full objects for the sidebar list
  const bookmarkedEmployers = useMemo(() => {
    return employers.filter(e => savedIds.has(e.employerId));
  }, [employers, savedIds]);

  // Handlers
  const handleDeepDive = useCallback((emp: EmployerResult) => {
    setSelectedEmployer(emp);
    setView('deepdive');
    requestAnimationFrame(() => {
      const el = document.getElementById('main-scroll-container');
      if (el) el.scrollTop = 0;
      window.scrollTo({ top: 0 });
    });
  }, []);

  const handleBackToGallery = useCallback(() => {
    setSelectedEmployer(null);
    setView('gallery');
    // Clear deepdive param so the useEffect doesn't re-open it
    if (searchParams.has('deepdive')) {
      searchParams.delete('deepdive');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleToggleSave = useCallback(async (emp: EmployerResult) => {
    try {
      // Look up by employer_id directly since getSavedMatch checks candidate_id
      const existing = savedMatches.find(m => m.employer_id === emp.employerId);
      if (existing) {
        await unsave(existing.id);
        showSuccess('Removed', 'Match removed from saved');
      } else {
        await save({
          target_type: 'candidate',
          role_id: null,
          employer_id: emp.employerId,
          candidate_id: candidate?.id || null,
          candidate_name: null,
          match_score: emp.overallScore,
          notes: null,
          status: 'saved',
        });
        showSuccess('Saved!', 'Match added to saved');
      }
    } catch {
      showError('Error', 'Failed to update saved matches');
    }
  }, [candidate, savedMatches, save, unsave, showSuccess, showError]);

  const handleBrew = useCallback(async (note: string, preferredDates: Date[]) => {
    if (!candidate || !brewTarget) return;
    try {
      await supabase.from('coffee_chats').insert({
        candidate_id: candidate.id,
        employer_id: brewTarget.employerId,
        role_id: null,
        initiated_by: 'candidate',
        status: 'pending',
        message: note || `Interested in learning about ${brewTarget.companyName}`,
        role_title: null,
        match_score: brewTarget.overallScore,
        company_name: brewTarget.companyName,
        preferred_dates: preferredDates.length > 0 ? preferredDates.map(d => d.toISOString()) : null,
      });
      showSuccess('Sent!', 'Coffee chat request sent — view it in your Chats');
      setPendingChats(prev => prev + 1);

      const existing = savedMatches.find(m => m.employer_id === brewTarget.employerId);
      if (existing) {
        await supabase.from('saved_matches').update({ status: 'pending' }).eq('id', existing.id);
      }
    } catch {
      showError('Error', 'Failed to send request');
      throw new Error('Failed to send');
    }
  }, [candidate, brewTarget, savedMatches, showSuccess, showError, setPendingChats]);

  const handleConnect = useCallback(async (message: string, meetInvite?: { proposed_times: string[]; duration_minutes: number }) => {
    if (!candidate || !connectTarget) return;
    try {
      await sendConnectionRequest({
        receiverId: connectTarget.userId,
        senderRole: 'candidate',
        message,
        senderName: profile?.full_name || undefined,
        receiverName: connectTarget.companyName,
        receiverCompany: connectTarget.companyName,
        meetInvite,
        matchScore: connectTarget.overallScore,
      });
      showSuccess('Sent!', `Connection request sent to ${connectTarget.companyName}`);
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to send connection request');
      throw err;
    }
  }, [candidate, connectTarget, profile, sendConnectionRequest, showSuccess, showError]);

  // Deep dive dimension data
  const deepDiveDimensions = useMemo(() => {
    if (!selectedEmployer || !candidate) return [];
    return [
      { name: 'Openness', candidateScore: candidate.openness_score, employerPreference: selectedEmployer.employerOcean.openness, fitScore: selectedEmployer.breakdown.opennessFit },
      { name: 'Conscientiousness', candidateScore: candidate.conscientiousness_score, employerPreference: selectedEmployer.employerOcean.conscientiousness, fitScore: selectedEmployer.breakdown.conscientiousnessFit },
      { name: 'Extraversion', candidateScore: candidate.extraversion_score, employerPreference: selectedEmployer.employerOcean.extraversion, fitScore: selectedEmployer.breakdown.extraversionFit },
      { name: 'Agreeableness', candidateScore: candidate.agreeableness_score, employerPreference: selectedEmployer.employerOcean.agreeableness, fitScore: selectedEmployer.breakdown.agreeablenessFit },
      { name: 'Stability', candidateScore: 100 - candidate.neuroticism_score, employerPreference: 100 - selectedEmployer.employerOcean.neuroticism, fitScore: selectedEmployer.breakdown.neuroticismFit },
    ];
  }, [selectedEmployer, candidate]);

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    if (employers.length === 0) return null;
    const scores = employers.map(e => e.overallScore);
    const strongMatches = employers.filter(e => e.overallScore >= 80).length;
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { totalMatches: employers.length, strongMatches, avgScore };
  }, [employers]);

  // Featured match (top employer)
  const featuredMatch = useMemo(() => {
    if (employers.length === 0) return null;
    return [...employers].sort((a, b) => b.overallScore - a.overallScore)[0];
  }, [employers]);

  // Loading
  if (showLoader) {
    return <CoffeeBrewLoader variant="fullscreen" />;
  }

  // Error state
  if (dataError) {
    return (
      <div className="ember-page min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center max-w-md">
          <h2 className="text-title mt-6 mb-3" style={{ color: 'var(--color-text)' }}>
            Something went wrong
          </h2>
          <p className="mb-6" style={{ color: 'var(--color-textMuted)' }}>
            {dataError}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // No assessment
  if (!candidate) {
    return (
      <div className="ember-page min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center max-w-md">
          <h2 className="text-title mt-6 mb-3" style={{ color: 'var(--color-text)' }}>
            Complete your assessment first
          </h2>
          <p className="mb-6" style={{ color: 'var(--color-textMuted)' }}>
            Take our personality assessment to unlock Ember insights, discover your archetype, and find your best matches.
          </p>
          <Button onClick={() => navigate('/app/personality')}>Start assessment</Button>
        </div>
      </div>
    );
  }

  const candidateOcean: OCEANScores = {
    openness: candidate.openness_score,
    conscientiousness: candidate.conscientiousness_score,
    extraversion: candidate.extraversion_score,
    agreeableness: candidate.agreeableness_score,
    neuroticism: candidate.neuroticism_score,
  };

  return (
    <div className="ember-page min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'deepdive' && selectedEmployer ? (
            <DeepDive
              key="deepdive"
              mode="candidate"
              name={selectedEmployer.profileName}
              subtitle={selectedEmployer.companyName}
              archetype={selectedEmployer.archetype}
              overallScore={selectedEmployer.overallScore}
              traitScore={selectedEmployer.traitScore}
              cultureScore={selectedEmployer.cultureScore}
              workStyleScore={selectedEmployer.workStyleFit}
              communicationScore={Math.round((selectedEmployer.breakdown.extraversionFit + selectedEmployer.breakdown.agreeablenessFit) / 2)}
              dimensions={deepDiveDimensions}
              candidateOcean={candidateOcean}
              candidateWorkStyle={candidate.preferred_work_style}
              employerOcean={selectedEmployer.employerOcean}
              cultureValues={selectedEmployer.cultureValues}
              employerArchetypeName={selectedEmployer.employerArchetypeName}
              candidateId={candidate.id}
              employerId={selectedEmployer.employerId}
              isSaved={savedIds.has(selectedEmployer.employerId)}
              avatarUrl={selectedEmployer.logoUrl}
              connectionStatus={getConnectionStatus(selectedEmployer.userId)}
              onMessage={chatEmployerIds.has(selectedEmployer.employerId) ? () => navigate('/app/chats') : undefined}
              onBack={handleBackToGallery}
              onBrew={() => setBrewTarget(selectedEmployer)}
              onToggleSave={() => handleToggleSave(selectedEmployer)}
              onConnect={() => setConnectTarget(selectedEmployer)}
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
                  archetype ? `${archetype.name} archetype` : 'Your personalized match gallery',
                  employers.length > 0 ? `${employers.length} ${employers.length === 1 ? 'company' : 'companies'} ranked for you` : '',
                ].filter(Boolean).join(' · ')}
                belowSubtitle={dashboardStats && (
                  <Facts
                    items={[
                      { label: 'Strong matches (80+)', value: dashboardStats.strongMatches },
                      { label: 'Average', value: `${dashboardStats.avgScore}%` },
                    ]}
                  />
                )}
              />

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
                <main className="min-w-0 space-y-4">
                  <GalleryFilterBar
                    mode="candidate"
                    matchCount={filteredEmployers.length}
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
                    industries={industries}
                    selectedIndustry={selectedIndustry}
                    onIndustryChange={setSelectedIndustry}
                    selectedWorkStyle={selectedWorkStyle}
                    onWorkStyleChange={setSelectedWorkStyle}
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationChange={setSelectedLocation}
                    minScore={minScore}
                    maxScore={maxScore}
                    onMinScoreChange={setMinScore}
                    onMaxScoreChange={setMaxScore}
                    onClearFilters={clearFilters}
                  />

                  <PlayerCardGrid
                    mode="candidate"
                    employers={filteredEmployers}
                    savedIds={savedIds}
                    getConnectionStatus={getConnectionStatus}
                    onDeepDive={handleDeepDive}
                    onBrew={(emp) => setBrewTarget(emp)}
                    onToggleSave={handleToggleSave}
                    onConnect={(emp) => setConnectTarget(emp)}
                  />
                </main>

                <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
                  {featuredMatch && (
                    <TopMatchCard
                      name={featuredMatch.companyName}
                      subtitle={featuredMatch.industry}
                      score={featuredMatch.overallScore}
                      avatarUrl={featuredMatch.logoUrl}
                      onDeepDive={() => handleDeepDive(featuredMatch)}
                    />
                  )}

                  <section>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      Saved jobs
                    </h2>
                    {bookmarkedEmployers.length === 0 ? (
                      <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                        Bookmark a match to keep it here.
                      </p>
                    ) : (
                      <ul className="mt-2">
                        {bookmarkedEmployers.map((emp, i) => (
                          <li
                            key={emp.employerId}
                            className="group flex items-center gap-2 py-2.5"
                            style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => handleDeepDive(emp)}
                            >
                              <span className="block truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {emp.profileName}
                              </span>
                              <span className="block truncate text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                                {emp.companyName} · {emp.overallScore}%
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSave(emp)}
                              className="rounded-lg p-1.5 transition-opacity hover:bg-[var(--color-surfaceHover)] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                              style={{ color: 'var(--color-textMuted)' }}
                              aria-label={`Remove ${emp.profileName} from saved`}
                              title="Remove bookmark"
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
          name={brewTarget.companyName}
          subtitle={brewTarget.industry}
          archetype={brewTarget.archetype}
          overallScore={brewTarget.overallScore}
          avatarUrl={brewTarget.logoUrl}
          onBrew={handleBrew}
        />
      )}

      {/* Connect Modal */}
      {connectTarget && (
        <ConnectModal
          isOpen={!!connectTarget}
          onClose={() => setConnectTarget(null)}
          name={connectTarget.companyName}
          subtitle={connectTarget.industry}
          archetype={connectTarget.archetype}
          overallScore={connectTarget.overallScore}
          onConnect={handleConnect}
        />
      )}
    </div>
  );
}

