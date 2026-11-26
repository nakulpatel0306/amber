import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { EmployerSetupModal } from '../employer/EmployerSetupModal';
import { supabase } from '../../lib/supabase';
import { scoreMatchFromRows } from '../../lib/matchScore';
import { employerCultureArchetype, type EmployerArchetype } from '../../data/employerArchetypes';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';

import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { EmployerArchetypeStrip } from './EmployerArchetypeStrip';
import { EmployerCandidateTable } from './EmployerCandidateTable';

import { chatSummary, totalChats, type UpcomingChat } from './chatSummary';
import { greetingFirstName, timeOfDayGreeting } from './greeting';

interface CandidateRow {
  candidateId: string;
  name: string;
  headline: string;
  location: string;
  matchScore: number;
  topTrait: string;
  chatStatus: 'none' | 'pending' | 'accepted' | 'completed';
}

interface EmployerData {
  company_name: string | null;
  description: string | null;
  culture_quiz_completed: boolean;
  openness_preference: number | null;
  conscientiousness_preference: number | null;
  extraversion_preference: number | null;
  agreeableness_preference: number | null;
  neuroticism_preference: number | null;
  culture_values: string[] | null;
  archetype_name?: string | null;
  updated_at: string | null;
  setup_completed_at: string | null;
}

export function EmployerDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const greeting = timeOfDayGreeting(new Date().getHours());
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [hasCompletedCultureQuiz, setHasCompletedCultureQuiz] = useState<boolean | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [cultureArchetype, setCultureArchetype] = useState<EmployerArchetype | null>(null);

  // Stats
  const [activeRolesCount, setActiveRolesCount] = useState(0);
  const [pendingChats, setPendingChats] = useState(0);
  const [acceptedChats, setAcceptedChats] = useState(0);
  const [scheduledChats, setScheduledChats] = useState(0);
  const [completedChats, setCompletedChats] = useState(0);
  const [avgMatchScore, setAvgMatchScore] = useState(0);
  const [uniqueCandidates, setUniqueCandidates] = useState(0);

  // Loading states
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [_candidatesLoaded, setCandidatesLoaded] = useState(false);

  // Data
  const [allCandidates, setAllCandidates] = useState<CandidateRow[]>([]);
  const [topCandidates, setTopCandidates] = useState<CandidateRow[]>([]);
  const [candidatePage, setCandidatePage] = useState(0);
  const [upcomingChats, setUpcomingChats] = useState<UpcomingChat[]>([]);

  // Check profile and culture assessment completion status
  useEffect(() => {
    if (!user) return;

    const checkCompletionStatus = async () => {
      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const typedEmployer = employer as EmployerData | null;

      // Profile is complete if setup wizard was completed (not just default values)
      // Check: setup_completed_at is set, OR company_name is not the default "My Company" with actual description
      const hasCompletedSetup = !!(
        typedEmployer?.setup_completed_at ||
        (typedEmployer?.company_name &&
         typedEmployer.company_name !== 'My Company' &&
         typedEmployer?.description)
      );
      setHasCompletedProfile(hasCompletedSetup);

      const hasSkippedThisSession = sessionStorage.getItem('employer_setup_skipped');
      if (!hasCompletedSetup && !hasSkippedThisSession) {
        setShowSetupModal(true);
      }

      const cultureComplete = !!typedEmployer?.culture_quiz_completed;
      setHasCompletedCultureQuiz(cultureComplete);

      if (cultureComplete && typedEmployer) {
        setCultureArchetype(employerCultureArchetype(typedEmployer));
      }
    };

    checkCompletionStatus();
  }, [user]);

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    setHasCompletedProfile(true);
    sessionStorage.removeItem('employer_setup_skipped');
  };

  const handleSetupSkip = () => {
    setShowSetupModal(false);
    sessionStorage.setItem('employer_setup_skipped', 'true');
  };

  const firstName = greetingFirstName(profile?.full_name);

  // Load chats (independent of culture quiz)
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const { data: employer } = await supabase
          .from('employers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!employer) return;

        const { data: pendingChatData } = await supabase
          .from('coffee_chats')
          .select('id')
          .eq('employer_id', employer.id)
          .eq('status', 'pending');

        setPendingChats(pendingChatData?.length || 0);

        const { data: connectionData } = await supabase
          .from('coffee_chats')
          .select('id, status')
          .eq('employer_id', employer.id)
          .in('status', ['accepted', 'scheduled', 'completed']);

        setAcceptedChats(connectionData?.filter(c => c.status === 'accepted').length || 0);
        setScheduledChats(connectionData?.filter(c => c.status === 'scheduled').length || 0);
        setCompletedChats(connectionData?.filter(c => c.status === 'completed').length || 0);

        // Get ALL non-cancelled coffee chats for schedule widget
        const { data: chats } = await supabase
          .from('coffee_chats')
          .select('*')
          .eq('employer_id', employer.id)
          .order('created_at', { ascending: false });

        if (chats) {
          setUpcomingChats(
            chats
              .filter((c: any) => c.status !== 'cancelled')
              .map((c: any) => ({
                id: c.id,
                company: '',
                person: c.candidate_name || 'Unknown candidate',
                role: c.role_title || 'Coffee chat',
                time: c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : 'TBD',
                scheduledAt: c.scheduled_at || null,
                meetingLink: c.meeting_link || null,
                status: c.status || 'pending',
                preferredDates: c.preferred_dates || null,
              }))
          );
        }
      } catch (err) {
        console.error('Error loading chats:', err);
      }
    };

    loadChats();
  }, [user]);

  // Load dashboard stats + candidates
  useEffect(() => {
    if (!user) return;
    if (!hasCompletedCultureQuiz || !cultureArchetype) {
      // If culture quiz not done, we know the final values already
      if (hasCompletedCultureQuiz === false) {
        setStatsLoaded(true);
        setCandidatesLoaded(true);
      }
      return;
    }

    const loadDashboardData = async () => {
      try {
        const { data: employer } = await supabase
          .from('employers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!employer) return;

        // Get roles for active roles count
        const { data: roles } = await supabase
          .from('roles')
          .select('id, status')
          .eq('employer_id', employer.id);

        const activeRolesList = (roles || []).filter(r => r.status === 'active');
        setActiveRolesCount(activeRolesList.length);

        // Fetch ALL candidates via RPC (bypasses RLS)
        const { data: candidatesRaw, error: candidatesErr } = await supabase
          .rpc('get_candidates_for_employer', { employer_user_id: user.id });

        if (candidatesErr) {
          console.error('Candidates fetch error:', candidatesErr.message);
        }

        const candidatesData = (candidatesRaw as Record<string, unknown>[] | null) || [];

        if (candidatesData.length === 0) {
          setStatsLoaded(true);
          setCandidatesLoaded(true);
          return;
        }

        // Fetch profile names via RPC
        const candidateUserIds = candidatesData.map((c) => c.user_id as string).filter(Boolean);
        const profileMap = new Map<string, string>();
        if (candidateUserIds.length > 0) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase
              .rpc('get_profiles_by_ids', { user_ids: candidateUserIds });
            const profiles = rpcErr ? [] : (rpcData || []);
            for (const p of profiles) {
              profileMap.set(p.id, p.full_name || '');
            }
          } catch {
            // Profile lookup failed — names will fall back to 'Unknown'
          }
        }

        // Build candidate_id → chat status map
        const chatStatusMap = new Map<string, string>();
        const { data: chatData } = await supabase
          .from('coffee_chats')
          .select('candidate_id, status')
          .eq('employer_id', employer.id);

        if (chatData) {
          const priority: Record<string, number> = { completed: 3, accepted: 2, pending: 1 };
          for (const c of chatData) {
            const existing = chatStatusMap.get(c.candidate_id);
            const existingPri = existing ? (priority[existing] || 0) : 0;
            const newPri = priority[c.status] || 0;
            if (newPri > existingPri) chatStatusMap.set(c.candidate_id, c.status);
          }
        }

        // Calculate compatibility for each candidate
        const candidateRows: CandidateRow[] = candidatesData
          .filter((c) => c.openness_score !== null && c.openness_score !== undefined)
          .map((c) => {
            // Company-level score, the same one Ember shows with no role selected
            const result = scoreMatchFromRows(c, employer);

            const candidateId = (c.id as string) || '';
            const rawChatStatus = chatStatusMap.get(candidateId) || 'none';

            return {
              candidateId,
              name: profileMap.get(c.user_id as string) || 'Unknown',
              headline: (c.headline as string) || '',
              location: (c.location as string) || 'Remote',
              matchScore: result.overallMatchScore,
              topTrait: ((c.top_traits as string[]) || ['--'])[0],
              chatStatus: rawChatStatus as CandidateRow['chatStatus'],
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore);

        setAllCandidates(candidateRows);
        setCandidatePage(0);
        setTopCandidates(candidateRows.slice(0, 5));
        setUniqueCandidates(candidateRows.length);

        if (candidateRows.length > 0) {
          setAvgMatchScore(Math.round(
            candidateRows.reduce((s, c) => s + c.matchScore, 0) / candidateRows.length
          ));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setStatsLoaded(true);
        setCandidatesLoaded(true);
      }
    };

    loadDashboardData();
  }, [user, hasCompletedCultureQuiz, cultureArchetype]);

  const handleRefreshCandidates = () => {
    if (allCandidates.length <= 5) return;
    const nextPage = candidatePage + 1;
    const start = (nextPage * 5) % allCandidates.length;
    const page = allCandidates.slice(start, start + 5);
    if (page.length < 5) {
      page.push(...allCandidates.slice(0, 5 - page.length));
    }
    setCandidatePage(nextPage);
    setTopCandidates(page);
  };

  const bestMatchScore = topCandidates.length > 0 ? topCandidates[0].matchScore : 0;

  const showLoader = useMinLoader(!statsLoaded, 1500);

  if (showLoader) {
    return <CoffeeBrewLoader variant="fullscreen" />;
  }

  const chatCounts = { pending: pendingChats, accepted: acceptedChats, scheduled: scheduledChats, completed: completedChats };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <DashboardHeader
        greeting={hasCompletedCultureQuiz ? greeting : firstName ? `${firstName}, ready to define your culture?` : 'Ready to define your culture?'}
        firstName={hasCompletedCultureQuiz ? firstName : ''}
      />

      {(!hasCompletedProfile || hasCompletedCultureQuiz === false) && (
        <div className="bento-card mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
              Get started with hiring
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {!hasCompletedProfile
                ? 'Set up your company profile, then define your culture to match with candidates.'
                : 'Define your company culture to start matching with candidates who fit your team.'}
            </p>
          </div>
          {hasCompletedProfile ? (
            <Link to="/app/employer/culture-assessment" className="flex-shrink-0">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>Define your culture</Button>
            </Link>
          ) : (
            <Button className="flex-shrink-0" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => setShowSetupModal(true)}>
              Set up company
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasCompletedCultureQuiz && cultureArchetype && (
          <EmployerArchetypeStrip archetype={cultureArchetype} />
        )}
        <SummaryCard
          label="Average culture match"
          loading={!statsLoaded}
          value={avgMatchScore > 0 ? `${avgMatchScore}%` : '–'}
          detail={
            avgMatchScore > 0
              ? `Best ${bestMatchScore}% across ${uniqueCandidates} ${uniqueCandidates === 1 ? 'candidate' : 'candidates'} for ${activeRolesCount} ${activeRolesCount === 1 ? 'role' : 'roles'}`
              : hasCompletedCultureQuiz
              ? 'No candidates yet'
              : 'Unlocks after the culture quiz'
          }
          action={hasCompletedCultureQuiz ? 'See top candidates' : 'Take the culture quiz'}
          to={hasCompletedCultureQuiz ? '/app/employer/top-candidates' : '/app/employer/culture-assessment'}
        />
        <SummaryCard
          label="Coffee chats"
          loading={!statsLoaded}
          value={totalChats(chatCounts)}
          detail={chatSummary(upcomingChats, chatCounts)}
          action="Open coffee chats"
          to="/app/employer/chats"
        />
      </div>

      <div className="mt-10">
        <EmployerCandidateTable
          candidates={topCandidates}
          hasCompletedCultureQuiz={hasCompletedCultureQuiz === true}
          onRowClick={(candidate) => navigate(`/app/employer/ember?deepdive=${candidate.candidateId}`)}
          onRefresh={handleRefreshCandidates}
        />
      </div>

      <EmployerSetupModal
        isOpen={showSetupModal}
        onClose={handleSetupSkip}
        onComplete={handleSetupComplete}
      />
    </div>
  );
}
