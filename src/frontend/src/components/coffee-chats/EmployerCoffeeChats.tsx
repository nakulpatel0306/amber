import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { supabase } from '../../lib/supabase';
import { CoffeeBrewLoader, useMinLoader } from '../ui/CoffeeBrewLoader';
import { CoffeeChatCard, CoffeeChatData, ChatStatus } from './CoffeeChatCard';
import { CoffeeChatPrep } from './CoffeeChatPrep';
import { CoffeeChatFollowUp } from './CoffeeChatFollowUp';
import { CoffeeChatsCalendar } from './CoffeeChatsCalendar';
import { ScheduleModal } from './ScheduleModal';
import { FeedbackModal } from './FeedbackModal';
import { CoffeeChatDetailModal } from './CoffeeChatDetailModal';
import { AcceptWithDateModal } from './AcceptWithDateModal';
import { PageBanner } from '../ui/PageBanner';
import { Facts } from '../ui/Facts';
import { Button } from '../ui/Button';
import { InboxPanel } from '../connections/InboxPanel';
import { RequestsButton } from './RequestsButton';
import { useConnections } from '../../contexts/ConnectionsContext';
import { deriveDisplayStatus, type DisplayStatus } from '../../utils/coffeeChatStatus';
import { apiFetch } from '../../utils/api';


type TabValue = 'calendar' | 'pending' | 'upcoming' | 'completed';

const tabs: { value: TabValue; label: string }[] = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'pending', label: 'Pending' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const emptyStates: Partial<Record<TabValue, { title: string; message: string }>> = {
  pending: {
    title: 'No pending requests',
    message: 'Explore your Ember matches to start connecting.',
  },
  upcoming: {
    title: 'No upcoming chats',
    message: 'Accept a pending request to get started.',
  },
  completed: {
    title: 'No completed chats',
    message: 'Your chat history will appear here.',
  },
};

/** Derive display status for a chat */
function getDisplayStatus(chat: CoffeeChatData): DisplayStatus {
  return deriveDisplayStatus(chat.status, chat.scheduled_at);
}

export function EmployerCoffeeChats() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const { openChat } = useMessaging();
  const { pendingReceivedCount } = useConnections();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [chats, setChats] = useState<CoffeeChatData[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>('calendar');
  const [_employerId, setEmployerId] = useState<string | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [acceptWithDateModalOpen, setAcceptWithDateModalOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatPartner, setActiveChatPartner] = useState('');
  const [activeChat, setActiveChat] = useState<CoffeeChatData | null>(null);
  const [chatToAccept, setChatToAccept] = useState<CoffeeChatData | null>(null);
  const [customDatesByChat, setCustomDatesByChat] = useState<Record<string, string[]>>({});

  const showLoader = useMinLoader(isLoading);

  // Handle opening message panel
  const handleMessage = useCallback((chatId: string, partnerName: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    openChat(chatId, {
      id: chat.candidate_id,
      name: partnerName,
      avatarUrl: null,
      coffeeChatId: chatId,
    });
  }, [chats, openChat]);

  // Handle viewing partner details
  const handleViewDetails = useCallback((chat: CoffeeChatData) => {
    setActiveChat(chat);
    setDetailModalOpen(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadChats();
  }, [user]);

  // Real-time subscription for coffee chat changes
  useEffect(() => {
    if (!_employerId) return;
    const channel = supabase
      .channel('employer-coffee-chats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coffee_chats', filter: `employer_id=eq.${_employerId}` },
        () => loadChats()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [_employerId]);

  // isLoading starts true, so only the first load shows the full-screen loader;
  // realtime refreshes update the calendar in place
  const loadChats = async () => {
    if (!user) return;

    try {
      const { data: employer } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employer) {
        setIsLoading(false);
        return;
      }

      setEmployerId(employer.id);

      // Query without JOINs - use stored candidate_name to avoid RLS issues
      const { data: chatData } = await supabase
        .from('coffee_chats')
        .select('*')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false });

      if (chatData) {
        const mapped: CoffeeChatData[] = chatData.map((c: any) => ({
          id: c.id,
          candidate_id: c.candidate_id,
          employer_id: c.employer_id,
          role_id: c.role_id,
          connection_id: c.connection_id,
          status: c.status as ChatStatus,
          message: c.message,
          initiated_by: c.initiated_by,
          scheduled_at: c.scheduled_at,
          meeting_link: c.meeting_link,
          rating: c.rating,
          feedback: c.feedback,
          created_at: c.created_at,
          partner_name: c.candidate_name || 'Unknown',
          match_score: c.match_score,
          role_title: c.role_title,
          preferred_dates: c.preferred_dates,
          duration_minutes: c.duration_minutes,
        }));
        setChats(mapped);
      }
    } catch (err) {
      console.error('Error loading coffee chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthHeaders = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    };
  };

  const updateChatStatus = async (chatId: string, status: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch(`/api/coffee-chats/${chatId}/status?status=${status}`, {
        method: 'PATCH', headers,
      });
      if (!res.ok) throw new Error('Failed to update');
      setChats(prev =>
        prev.map(c => (c.id === chatId ? { ...c, status: status as ChatStatus } : c))
      );
      success('Updated', `Chat ${status}`);
    } catch {
      showError('Error', 'Failed to update chat');
    }
  };

  // Handle accepting a chat - if it has preferred dates, show modal to select one
  const handleAcceptChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    if (chat.preferred_dates && chat.preferred_dates.length > 0) {
      // Has preferred dates - show modal to select one
      setChatToAccept(chat);
      setAcceptWithDateModalOpen(true);
    } else {
      // No preferred dates - just accept (will need to schedule later)
      updateChatStatus(chatId, 'accepted');
    }
  };

  // Accept and schedule with a selected date
  const handleAcceptWithDate = async (scheduledAt: string) => {
    if (!chatToAccept) return;
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch(`/api/coffee-chats/${chatToAccept.id}/schedule`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      });
      if (!res.ok) throw new Error('Failed to schedule');
      setChats(prev =>
        prev.map(c =>
          c.id === chatToAccept.id
            ? { ...c, status: 'scheduled' as ChatStatus, scheduled_at: scheduledAt }
            : c
        )
      );
      success('Scheduled!', `Coffee chat scheduled with ${chatToAccept.partner_name}`);
      setAcceptWithDateModalOpen(false);
      setChatToAccept(null);
    } catch {
      showError('Error', 'Failed to accept and schedule');
    }
  };

  const handleSchedule = async (scheduledAt: string, meetingLink?: string) => {
    if (!activeChatId) return;
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch(`/api/coffee-chats/${activeChatId}/schedule`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ scheduled_at: scheduledAt, meeting_link: meetingLink || null }),
      });
      if (!res.ok) throw new Error('Failed to schedule');
      setChats(prev =>
        prev.map(c =>
          c.id === activeChatId
            ? { ...c, status: 'scheduled' as ChatStatus, scheduled_at: scheduledAt, meeting_link: meetingLink }
            : c
        )
      );
      setScheduleModalOpen(false);
      success('Scheduled', 'Coffee chat scheduled!');
    } catch {
      showError('Error', 'Failed to schedule');
    }
  };

  const handleFeedback = async (rating: number, feedback?: string) => {
    if (!activeChatId) return;
    try {
      const headers = await getAuthHeaders();
      const res = await apiFetch(`/api/coffee-chats/${activeChatId}/feedback`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ rating, feedback: feedback || null }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setChats(prev =>
        prev.map(c =>
          c.id === activeChatId
            ? { ...c, status: 'completed' as ChatStatus, rating, feedback: feedback || null }
            : c
        )
      );
      success('Thanks!', 'Feedback submitted');
    } catch {
      showError('Error', 'Failed to submit feedback');
    }
  };

  // Tab-based filtering using derived display status; the header facts read the same counts
  const tabCounts = useMemo(() => ({
    calendar: chats.filter(c => c.status !== 'cancelled').length,
    pending: chats.filter(c => getDisplayStatus(c) === 'pending').length,
    upcoming: chats.filter(c => getDisplayStatus(c) === 'upcoming').length,
    completed: chats.filter(c => getDisplayStatus(c) === 'completed').length,
  }), [chats]);

  const filteredChats = useMemo(() => {
    switch (activeTab) {
      case 'pending': return chats.filter(c => getDisplayStatus(c) === 'pending');
      case 'upcoming': return chats.filter(c => getDisplayStatus(c) === 'upcoming');
      case 'completed': return chats.filter(c => getDisplayStatus(c) === 'completed');
      default: return chats;
    }
  }, [chats, activeTab]);

  const empty = emptyStates[activeTab as keyof typeof emptyStates];

  if (showLoader) {
    return (
      <CoffeeBrewLoader variant="fullscreen" message="Loading coffee chats…" />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageBanner
        title="Coffee chats"
        subtitle="Manage conversations with potential hires"
        belowSubtitle={
          <Facts
            items={[
              { label: 'Pending', value: tabCounts.pending },
              { label: 'Upcoming', value: tabCounts.upcoming },
              { label: 'Completed', value: tabCounts.completed },
            ]}
          />
        }
        rightContent={
          <>
            <RequestsButton count={pendingReceivedCount} onClick={() => setInboxOpen(true)} />
            <Button size="sm" onClick={() => navigate('/app/employer/ember')}>
              Find a match
            </Button>
          </>
        }
      />

      {/* Tabs: quiet selected state, counts live in the header facts */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hidden border-b" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              aria-pressed={isActive}
              className="flex-shrink-0 -mb-px px-3 py-2.5 text-sm font-medium border-b-2 transition-colors hover:text-[var(--color-text)]"
              style={{
                borderColor: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Calendar view */}
      {activeTab === 'calendar' ? (
        <CoffeeChatsCalendar
          chats={chats}
          onMessage={handleMessage}
          onViewDetails={handleViewDetails}
        />
      ) : filteredChats.length === 0 ? (
        <div className="bento-card text-center py-16">
          <h3 className="text-heading" style={{ color: 'var(--color-text)' }}>
            {empty?.title}
          </h3>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: 'var(--color-textMuted)' }}>
            {empty?.message}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChats.map(chat => (
            <CoffeeChatCard
              key={chat.id}
              chat={chat}
              userRole="employer"
              onAccept={handleAcceptChat}
              onDecline={id => updateChatStatus(id, 'cancelled')}
              onSchedule={id => {
                setActiveChatId(id);
                setScheduleModalOpen(true);
              }}
              onReschedule={id => {
                setActiveChatId(id);
                setScheduleModalOpen(true);
              }}
              onComplete={id => updateChatStatus(id, 'completed')}
              onFeedback={id => {
                const c = chats.find(ch => ch.id === id);
                setActiveChatId(id);
                setActiveChatPartner(c?.partner_name || '');
                setFeedbackModalOpen(true);
              }}
              onViewMatch={id => {
                const c = chats.find(ch => ch.id === id);
                if (c?.candidate_id) {
                  navigate(`/app/employer/ember?deepdive=${c.candidate_id}`);
                } else {
                  navigate('/app/employer/ember');
                }
              }}
              onMessage={handleMessage}
              onViewDetails={handleViewDetails}
            >
              {(chat.status === 'accepted' || chat.status === 'scheduled') && (
                <CoffeeChatPrep chatId={chat.id} />
              )}
              {chat.status === 'completed' && chat.rating && (
                <CoffeeChatFollowUp chat={chat} />
              )}
            </CoffeeChatCard>
          ))}
        </div>
      )}

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleSchedule}
      />

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleFeedback}
        partnerName={activeChatPartner}
      />

      {activeChat && (
        <CoffeeChatDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setActiveChat(null);
          }}
          coffeeChatId={activeChat.id}
          viewerRole="employer"
          partnerId={activeChat.candidate_id}
          partnerName={activeChat.partner_name}
          matchScore={activeChat.match_score}
          onMessage={() => {
            setDetailModalOpen(false);
            handleMessage(activeChat.id, activeChat.partner_name);
          }}
        />
      )}

      <InboxPanel isOpen={inboxOpen} onClose={() => setInboxOpen(false)} />

      {chatToAccept && (
        <AcceptWithDateModal
          isOpen={acceptWithDateModalOpen}
          onClose={() => {
            setAcceptWithDateModalOpen(false);
            setChatToAccept(null);
          }}
          onAccept={handleAcceptWithDate}
          partnerName={chatToAccept.partner_name}
          preferredDates={chatToAccept.preferred_dates || []}
          customDates={customDatesByChat[chatToAccept.id] || []}
          onAddCustomDate={(scheduledAt) => {
            const chatId = chatToAccept.id;
            setCustomDatesByChat(prev => {
              const existing = prev[chatId] || [];
              if (existing.includes(scheduledAt)) return prev;
              return { ...prev, [chatId]: [...existing, scheduledAt] };
            });
          }}
        />
      )}
    </div>
  );
}
