import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardStagger, dashboardItem } from '../../utils/motion';
import { Button } from '../ui/Button';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { CandidateSetupModal } from '../candidate/CandidateSetupModal';
import { supabase } from '../../lib/supabase';
import { employerOceanFromRow, roleRequirementsFromRow, scoreMatch } from '../../lib/matchScore';

import { DashboardHeader } from './DashboardHeader';
import { SummaryCard } from './SummaryCard';
import { MatchingTable } from './MatchingTable';
import { ArchetypeStrip } from './ArchetypeStrip';

import { chatSummary, totalChats, type UpcomingChat } from './chatSummary';
import { greetingFirstName, timeOfDayGreeting } from './greeting';

interface PersonalityScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface CandidateData {
  headline: string | null;
  bio: string | null;
  location: string | null;
  openness_score: number | null;
  conscientiousness_score: number | null;
  extraversion_score: number | null;
  agreeableness_score: number | null;
  neuroticism_score: number | null;
  top_traits: string[] | null;
  assessment_completed_at: string | null;
}

interface TopMatch {
  name: string;
  company: string;
  role: string;
  matchScore: number;
  location: string;
  workStyle: string | null;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  employerId: string;
  chatStatus: 'none' | 'pending' | 'accepted' | 'scheduled' | 'completed' | 'connected';
}

export function JobSeekerDashboard() {
  const { profile, user } = useAuth();
  const greeting = timeOfDayGreeting(new Date().getHours());
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState<boolean | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [personalityScores, setPersonalityScores] = useState<PersonalityScores | null>(null);
  const [topTraits, setTopTraits] = useState<string[]>([]);

  // Stats
  const [_profileCompletion, setProfileCompletion] = useState(0);
  const [matchesAvailable, setMatchesAvailable] = useState(0);
  const [avgMatchScore, setAvgMatchScore] = useState(0);
  const [bestCompanyScore, setBestCompanyScore] = useState(0);
  const [pendingChats, setPendingChats] = useState(0);
  const [_connectionsCount, setConnectionsCount] = useState(0);
  const [acceptedChats, setAcceptedChats] = useState(0);
  const [scheduledChats, setScheduledChats] = useState(0);
  const [completedChats, setCompletedChats] = useState(0);
  const [_totalRoles, setTotalRoles] = useState(0);
  const [uniqueCompanies, setUniqueCompanies] = useState(0);

  // Loading states — prevent 0 → N/A → value flash
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);

  // Data
  const [allMatches, setAllMatches] = useState<TopMatch[]>([]);
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [matchPage, setMatchPage] = useState(0);
  const [upcomingChats, setUpcomingChats] = useState<UpcomingChat[]>([]);

  // Check profile and assessment completion status from candidates table
  useEffect(() => {
    if (!user) return;

    const checkCompletionStatus = async () => {
      const { data: candidate } = await supabase
        .from('candidates')
        .select('headline, bio, location, openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score, top_traits, assessment_completed_at')
        .eq('user_id', user.id)
        .single();

      const typedCandidate = candidate as CandidateData | null;

      // Store top traits for ArchetypeStrip
      setTopTraits(typedCandidate?.top_traits || []);

      // Profile is complete if they have a headline or bio filled out
      const profileComplete = !!(typedCandidate?.headline || typedCandidate?.bio);
      setHasCompletedProfile(profileComplete);

      // Compute profile completion %
      let completionParts = 0;
      if (typedCandidate?.headline) completionParts++;
      if (typedCandidate?.bio) completionParts++;
      if (typedCandidate?.location) completionParts++;
      if (typedCandidate?.openness_score !== null && typedCandidate?.openness_score !== undefined) completionParts++;
      setProfileCompletion(Math.round((completionParts / 4) * 100));

      // Show modal automatically if profile is not complete AND user hasn't skipped this session
      const hasSkippedThisSession = sessionStorage.getItem('profile_setup_skipped');
      if (!profileComplete && !hasSkippedThisSession) {
        setShowSetupModal(true);
      }

      // Assessment is complete if they have OCEAN scores
      const assessmentComplete = typedCandidate?.openness_score !== null && typedCandidate?.openness_score !== undefined;
      setHasCompletedAssessment(assessmentComplete);

      // Set personality scores if assessment is complete
      if (assessmentComplete && typedCandidate) {
        setPersonalityScores({
          openness: typedCandidate.openness_score || 0,
          conscientiousness: typedCandidate.conscientiousness_score || 0,
          extraversion: typedCandidate.extraversion_score || 0,
          agreeableness: typedCandidate.agreeableness_score || 0,
          neuroticism: typedCandidate.neuroticism_score || 0,
        });
      }
    };

    checkCompletionStatus();
  }, [user]);

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    setHasCompletedProfile(true);
    sessionStorage.removeItem('profile_setup_skipped');
  };

  const handleSetupSkip = () => {
    setShowSetupModal(false);
    sessionStorage.setItem('profile_setup_skipped', 'true');
  };

  const firstName = greetingFirstName(profile?.full_name);

  // Load chats, connections, and pending invites (independent of assessment)
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const { data: candidate } = await supabase
          .from('candidates')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!candidate) return;

        // Get pending coffee chats count
        const { data: pendingChatData } = await supabase
          .from('coffee_chats')
          .select('id')
          .eq('candidate_id', candidate.id)
          .eq('status', 'pending');

        setPendingChats(pendingChatData?.length || 0);

        // Get connections count (accepted + completed chats)
        const { data: connectionData } = await supabase
          .from('coffee_chats')
          .select('id, status')
          .eq('candidate_id', candidate.id)
          .in('status', ['accepted', 'scheduled', 'completed']);

        setConnectionsCount(connectionData?.length || 0);
        setAcceptedChats(connectionData?.filter(c => c.status === 'accepted').length || 0);
        setScheduledChats(connectionData?.filter(c => c.status === 'scheduled').length || 0);
        setCompletedChats(connectionData?.filter(c => c.status === 'completed').length || 0);

        // Get ALL non-cancelled coffee chats with full data (same as CandidateCoffeeChats)
        const { data: chats } = await supabase
          .from('coffee_chats')
          .select('*')
          .eq('candidate_id', candidate.id)
          .order('created_at', { ascending: false });

        if (chats) {
          setUpcomingChats(
            chats
              .filter((c: any) => c.status !== 'cancelled')
              .map((c: any) => ({
                id: c.id,
                // The other side of a candidate's chat is the company
                company: '',
                person: c.company_name || 'Unknown company',
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
      } finally {
        setChatsLoaded(true);
      }
    };

    loadChats();
  }, [user]);

  // Load matches (requires assessment completion)
  useEffect(() => {
    if (!user) return;
    if (!hasCompletedAssessment || !personalityScores) {
      // If assessment not done, we know the final value already
      if (hasCompletedAssessment === false) setMatchesLoaded(true);
      return;
    }

    const loadMatches = async () => {
      try {
        // Fetch roles and employer data separately to avoid inner-join RLS issues
        const { data: roles, error: rolesErr } = await supabase
          .from('roles')
          .select('*')
          .eq('status', 'active');

        if (rolesErr) {
          console.error('Error fetching roles:', rolesErr);
          return;
        }

        if (!roles || roles.length === 0) {
          setMatchesAvailable(0);
          return;
        }

        // Fetch employers via RPC (bypasses RLS — direct table query fails for candidates)
        const { data: employersRaw, error: empErr } = await supabase
          .rpc('get_employers_for_candidate', { candidate_user_id: user.id });

        if (empErr) {
          console.error('Error fetching employers via RPC:', empErr);
        }

        const employersArr = (employersRaw as Record<string, unknown>[] | null) || [];
        const employerMap = new Map(
          employersArr.map(e => [e.id as string, e])
        );

        // Fetch employer profile names
        const empUserIds = employersArr.map(e => e.user_id as string).filter(Boolean);
        const empProfileMap = new Map<string, string>();
        if (empUserIds.length > 0) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase
              .rpc('get_profiles_by_ids', { user_ids: empUserIds });
            const profiles = rpcErr ? [] : (rpcData || []);
            for (const p of profiles) {
              empProfileMap.set(p.id, p.full_name || '');
            }
          } catch {
            // Profile lookup failed
          }
        }

        // Fetch candidate record for chat status lookup and work-style scoring
        const { data: candRecord } = await supabase
          .from('candidates')
          .select('id, preferred_work_style')
          .eq('user_id', user.id)
          .single();

        // Build employer_id → chat status map
        const chatStatusMap = new Map<string, string>();
        if (candRecord) {
          const { data: chats } = await supabase
            .from('coffee_chats')
            .select('employer_id, status')
            .eq('candidate_id', candRecord.id);

          if (chats) {
            // Priority: completed > scheduled > accepted > pending
            const priority: Record<string, number> = { completed: 4, scheduled: 3, accepted: 2, pending: 1 };
            for (const chat of chats) {
              const existing = chatStatusMap.get(chat.employer_id);
              const existingPri = existing ? (priority[existing] || 0) : 0;
              const newPri = priority[chat.status] || 0;
              if (newPri > existingPri) {
                chatStatusMap.set(chat.employer_id, chat.status);
              }
            }
          }

          // Also check connections
          const { data: conns } = await supabase
            .from('connections')
            .select('employer_id, status')
            .eq('candidate_id', candRecord.id)
            .eq('status', 'accepted');

          if (conns) {
            for (const conn of conns) {
              // 'connected' overrides everything except completed
              const existing = chatStatusMap.get(conn.employer_id);
              if (existing !== 'completed') {
                chatStatusMap.set(conn.employer_id, 'connected');
              }
            }
          }
        }

        setTotalRoles(roles.length);

        const scoreFor = (emp: Record<string, unknown> | undefined, role?: Record<string, unknown>) =>
          scoreMatch({
            candidate: personalityScores,
            candidateWorkStyle: candRecord?.preferred_work_style,
            employer: employerOceanFromRow(emp ?? {}),
            cultureValues: emp?.culture_values as string[] | undefined,
            employerArchetypeName: emp?.archetype_name as string | undefined,
            role: role ? roleRequirementsFromRow(role) : null,
          }).overallMatchScore;

        const matches = roles
          .map(role => {
            const emp = employerMap.get(role.employer_id) as Record<string, unknown> | undefined;
            // Each row is a role, so it shows that role's fit
            const roleScore = scoreFor(emp, role);

            const rawChatStatus = chatStatusMap.get(role.employer_id) || 'none';

            const empUserId = emp?.user_id as string | undefined;

            return {
              name: (empUserId && empProfileMap.get(empUserId)) || (emp?.company_name as string) || 'Unknown',
              company: (emp?.company_name as string) || 'Unknown',
              role: role.title,
              matchScore: roleScore,
              location: role.location || (emp?.location as string) || 'Remote',
              workStyle: role.work_style || null,
              logoUrl: (emp?.company_logo_url as string) || null,
              description: (emp?.description as string) || null,
              industry: (emp?.industry as string) || null,
              employerId: role.employer_id as string,
              chatStatus: rawChatStatus as TopMatch['chatStatus'],
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore);

        setAllMatches(matches);
        setMatchPage(0);
        setTopMatches(matches.slice(0, 5));
        setMatchesAvailable(roles.length);

        // Company-level scores over the companies Ember ranks, so the average and best agree with it
        const companyScores = employersArr.filter(e => e.openness_preference !== null).map(e => scoreFor(e));
        setUniqueCompanies(companyScores.length);
        if (companyScores.length > 0) {
          setAvgMatchScore(Math.round(companyScores.reduce((sum, score) => sum + score, 0) / companyScores.length));
          setBestCompanyScore(Math.max(...companyScores));
        }
      } catch (err) {
        console.error('Error loading matches:', err);
      } finally {
        setMatchesLoaded(true);
      }
    };

    loadMatches();
  }, [user, hasCompletedAssessment, personalityScores]);

  const navigate = useNavigate();

  const handleRefreshMatches = () => {
    if (allMatches.length <= 5) return;
    const nextPage = matchPage + 1;
    const start = (nextPage * 5) % allMatches.length;
    const page = allMatches.slice(start, start + 5);
    // If we wrapped past the end, fill from the beginning
    if (page.length < 5) {
      page.push(...allMatches.slice(0, 5 - page.length));
    }
    setMatchPage(nextPage);
    setTopMatches(page);
  };

  const showLoader = useMinLoader(!matchesLoaded || !chatsLoaded, 1500);

  if (showLoader) {
    return <CoffeeBrewLoader variant="fullscreen" />;
  }

  const chatCounts = { pending: pendingChats, accepted: acceptedChats, scheduled: scheduledChats, completed: completedChats };

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
      variants={dashboardStagger}
      initial="hidden"
      animate="show"
    >
      <DashboardHeader greeting={greeting} firstName={firstName} />

      {(!hasCompletedProfile || hasCompletedAssessment === false) && (
        <motion.div variants={dashboardItem} className="bento-card mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
              Finish setting up
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {!hasCompletedProfile
                ? 'Set up your profile, then take the personality assessment to get matched.'
                : 'Take the personality assessment to start getting matched with roles.'}
            </p>
          </div>
          {hasCompletedProfile ? (
            <Link to="/app/personality" className="flex-shrink-0">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>Take the assessment</Button>
            </Link>
          ) : (
            <Button className="flex-shrink-0" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => setShowSetupModal(true)}>
              Set up profile
            </Button>
          )}
        </motion.div>
      )}

      <motion.div variants={dashboardItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasCompletedAssessment === true && topTraits.length > 0 && <ArchetypeStrip topTraits={topTraits} />}
        <SummaryCard
          label="Average match"
          loading={!matchesLoaded}
          value={avgMatchScore > 0 ? `${avgMatchScore}%` : '–'}
          detail={
            avgMatchScore > 0
              ? `Best ${bestCompanyScore}% across ${uniqueCompanies} ${uniqueCompanies === 1 ? 'company' : 'companies'} · ${matchesAvailable} open ${matchesAvailable === 1 ? 'role' : 'roles'}`
              : hasCompletedAssessment
              ? 'No open roles yet'
              : 'Unlocks after the assessment'
          }
          action={hasCompletedAssessment ? 'See matches' : 'Take the assessment'}
          to={hasCompletedAssessment ? '/app/ember' : '/app/personality'}
        />
        <SummaryCard
          label="Coffee chats"
          loading={!chatsLoaded}
          value={totalChats(chatCounts)}
          detail={chatSummary(upcomingChats, chatCounts)}
          action="Open coffee chats"
          to="/app/chats"
        />
      </motion.div>

      <motion.div variants={dashboardItem} className="mt-10">
        <MatchingTable
          matches={topMatches}
          hasCompletedAssessment={hasCompletedAssessment === true}
          onRowClick={(match) => navigate(`/app/ember?deepdive=${match.employerId}`)}
          onRefresh={handleRefreshMatches}
        />
      </motion.div>

      <CandidateSetupModal
        isOpen={showSetupModal}
        onClose={handleSetupSkip}
        onComplete={handleSetupComplete}
      />
    </motion.div>
  );
}
