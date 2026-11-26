import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { deriveDisplayStatus, type DisplayStatus } from '../../utils/coffeeChatStatus';
import { Button } from '../ui/Button';
import type { CoffeeChatData } from './CoffeeChatCard';

/* ── Status dot colors: the only place status gets color ── */
const STATUS_DOT: Record<DisplayStatus, string> = {
  pending: 'var(--color-textMuted)',
  upcoming: 'var(--color-accent)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-error)',
  declined: 'var(--color-error)',
};

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_HEIGHT = 40; // compact: 40px per hour
const START_HOUR = 0;
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM – 11 PM (full 24h)

interface CoffeeChatsCalendarProps {
  chats: CoffeeChatData[];
  onMessage?: (chatId: string, partnerName: string) => void;
  onViewDetails?: (chat: CoffeeChatData) => void;
}

/** Enrich a chat with its display status */
function enrichChat(chat: CoffeeChatData) {
  return {
    ...chat,
    displayStatus: deriveDisplayStatus(chat.status, chat.scheduled_at),
  };
}

type EnrichedChat = CoffeeChatData & { displayStatus: DisplayStatus };

function NavButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="p-1.5 rounded-lg hover:bg-[var(--color-surfaceHover)] transition-colors"
      style={{ color: 'var(--color-textMuted)' }}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SMALL MONTH CALENDAR (with the status key folded in underneath)
   ════════════════════════════════════════════════════════════════════ */
function SmallMonthCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  chatsByDate,
}: {
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  chatsByDate: Map<string, EnrichedChat[]>;
}) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const legend: { label: string; status: DisplayStatus }[] = [
    { label: 'Scheduled', status: 'upcoming' },
    { label: 'Pending', status: 'pending' },
    { label: 'Completed', status: 'completed' },
    { label: 'Cancelled', status: 'cancelled' },
  ];

  return (
    <div className="bento-card !p-4">
      <div className="flex items-center justify-between mb-3">
        <NavButton onClick={() => onMonthChange(subMonths(currentMonth, 1))} label="Previous month">
          <ChevronLeft className="w-4 h-4" />
        </NavButton>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <NavButton onClick={() => onMonthChange(addMonths(currentMonth, 1))} label="Next month">
          <ChevronRight className="w-4 h-4" />
        </NavButton>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS_SHORT.map(d => (
          <div key={d} className="text-center text-2xs py-1" style={{ color: 'var(--color-textMuted)' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayChats = chatsByDate.get(key) || [];
          const inMonth = isSameMonth(day, currentMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);

          // One dot per chat (max 3), colored by status
          const dots = dayChats.slice(0, 3).map(c => c.displayStatus);

          return (
            <button
              key={idx}
              onClick={() => inMonth && onSelectDate(day)}
              className="relative flex flex-col items-center justify-center py-1.5 rounded-lg text-caption tabular-nums transition-colors"
              style={{
                color: selected
                  ? 'var(--color-accentText)'
                  : !inMonth
                  ? 'var(--color-textMuted)'
                  : 'var(--color-text)',
                backgroundColor: selected
                  ? 'var(--color-accent)'
                  : today
                  ? 'var(--color-surfaceHover)'
                  : 'transparent',
                fontWeight: today || selected ? 600 : 400,
                opacity: inMonth ? 1 : 0.35,
                cursor: inMonth ? 'pointer' : 'default',
              }}
            >
              {format(day, 'd')}
              {dots.length > 0 && !selected && (
                <div className="absolute bottom-0.5 flex gap-px">
                  {dots.map((s, i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: STATUS_DOT[s] }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1.5" style={{ borderColor: 'var(--color-border)' }}>
        {legend.map(({ label, status }) => (
          <span key={status} className="flex items-center gap-1.5 text-caption" style={{ color: 'var(--color-textSecondary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_DOT[status] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   NEXT UP CARD
   ════════════════════════════════════════════════════════════════════ */
function NextUpCard({
  chat,
  onMessage,
  onViewDetails,
}: {
  chat: EnrichedChat | null;
  onMessage?: (chatId: string, partnerName: string) => void;
  onViewDetails?: (chat: CoffeeChatData) => void;
}) {
  return (
    <div className="bento-card !p-4">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        Next up
      </h3>

      {!chat ? (
        <p className="mt-2 text-label font-normal" style={{ color: 'var(--color-textMuted)' }}>
          Nothing booked ahead. Accept a request or invite someone from your matches.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {chat.partner_company || chat.partner_name}
              </p>
              {chat.role_title && (
                <p className="text-label font-normal truncate" style={{ color: 'var(--color-textSecondary)' }}>
                  {chat.role_title}
                </p>
              )}
              {chat.scheduled_at && (
                <p className="text-label font-normal tabular-nums mt-1" style={{ color: 'var(--color-textMuted)' }}>
                  {format(parseISO(chat.scheduled_at), 'EEE, MMM d · h:mm a')}
                </p>
              )}
            </div>
            {chat.match_score != null && (
              <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--color-text)' }}>
                {Math.round(chat.match_score)}%
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onViewDetails?.(chat)}>
              Details
            </Button>
            <Button size="sm" className="flex-1" onClick={() => onMessage?.(chat.id, chat.partner_name)}>
              Message
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   WEEK CALENDAR EVENT BLOCK
   ════════════════════════════════════════════════════════════════════ */
function EventBlock({
  chat,
  top,
  height,
  onClick,
}: {
  chat: EnrichedChat;
  top: number;
  height: number;
  onClick?: () => void;
}) {
  const time = chat.scheduled_at ? format(parseISO(chat.scheduled_at), 'h:mm a') : '';

  return (
    <button
      onClick={onClick}
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left border transition-colors hover:border-[var(--color-borderHover)] overflow-hidden"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 22)}px`,
        backgroundColor: 'var(--color-surfaceHover)',
        borderColor: 'var(--color-border)',
        zIndex: 10,
      }}
      title={`${chat.partner_company || chat.partner_name}${time ? ` · ${time}` : ''}`}
    >
      <span className="flex items-center gap-1 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_DOT[chat.displayStatus] }} />
        <span className="text-2xs font-medium truncate leading-tight" style={{ color: 'var(--color-text)' }}>
          {chat.partner_company || chat.partner_name}
        </span>
      </span>
      {height > 28 && (
        <span className="block text-2xs truncate leading-tight" style={{ color: 'var(--color-textMuted)' }}>
          {time}
        </span>
      )}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   LARGE WEEK CALENDAR
   ════════════════════════════════════════════════════════════════════ */
function WeekCalendar({
  weekStart,
  onWeekChange,
  onTodayClick,
  chats,
  onEventClick,
}: {
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  onTodayClick: () => void;
  chats: EnrichedChat[];
  onEventClick?: (chat: CoffeeChatData) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Auto-scroll to the current hour on first render, or to the working day outside it
  useEffect(() => {
    if (scrollRef.current && !hasScrolled.current) {
      const hour = getHours(new Date());
      const anchor = hour >= 8 && hour <= 20 ? hour - 1 : 7;
      const scrollTo = Math.max(0, anchor * HOUR_HEIGHT - 8);
      scrollRef.current.scrollTop = scrollTo;
      hasScrolled.current = true;
    }
  }, []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);
  const monthLabel = isSameMonth(weekStart, weekEnd)
    ? format(weekStart, 'MMMM yyyy')
    : `${format(weekStart, 'MMM')} – ${format(weekEnd, 'MMM yyyy')}`;

  // Group chats by day column
  const chatsByDay = useMemo(() => {
    const map = new Map<number, EnrichedChat[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);

    chats.forEach(chat => {
      if (!chat.scheduled_at) return;
      const chatDate = parseISO(chat.scheduled_at);
      for (let i = 0; i < 7; i++) {
        if (isSameDay(chatDate, weekDays[i])) {
          map.get(i)!.push(chat);
          break;
        }
      }
    });
    return map;
  }, [chats, weekDays]);

  const getEventPosition = (chat: EnrichedChat) => {
    if (!chat.scheduled_at) return { top: 0, height: HOUR_HEIGHT / 2 };
    const d = parseISO(chat.scheduled_at);
    const h = getHours(d);
    const m = getMinutes(d);
    const top = (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
    const height = HOUR_HEIGHT / 2; // 30 min default
    return { top, height };
  };

  // Current time indicator
  const now = new Date();
  const nowDayIndex = weekDays.findIndex(d => isSameDay(d, now));
  const nowTop = (getHours(now) - START_HOUR) * HOUR_HEIGHT + (getMinutes(now) / 60) * HOUR_HEIGHT;

  return (
    <div className="bento-card !p-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {monthLabel}
          </h2>
          <div className="flex items-center">
            <NavButton onClick={() => onWeekChange(subWeeks(weekStart, 1))} label="Previous week">
              <ChevronLeft className="w-4 h-4" />
            </NavButton>
            <NavButton onClick={() => onWeekChange(addWeeks(weekStart, 1))} label="Next week">
              <ChevronRight className="w-4 h-4" />
            </NavButton>
          </div>
        </div>
        <Button size="xs" variant="outline" onClick={onTodayClick}>
          Today
        </Button>
      </div>

      {/* The grid keeps a readable minimum width and scrolls sideways inside the card on phones */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[44px_repeat(7,1fr)] border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div />
            {weekDays.map((day, i) => {
              const today = isToday(day);
              return (
                <div
                  key={i}
                  className="text-center py-1.5 border-l"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <p className="text-2xs" style={{ color: 'var(--color-textMuted)' }}>
                    {WEEKDAYS_SHORT[i]}
                  </p>
                  <p
                    className="text-sm font-medium tabular-nums mt-0.5 rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                    style={{
                      color: today ? 'var(--color-accentText)' : 'var(--color-text)',
                      backgroundColor: today ? 'var(--color-accent)' : 'transparent',
                    }}
                  >
                    {format(day, 'd')}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid — scrollable 24h */}
          <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <div className="relative grid grid-cols-[44px_repeat(7,1fr)]" style={{ minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}>
              <div className="relative">
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute right-1.5 text-2xs tabular-nums"
                    style={{
                      top: `${Math.max(0, (h - START_HOUR) * HOUR_HEIGHT - 6)}px`,
                      color: 'var(--color-textMuted)',
                    }}
                  >
                    {format(setMinutes(setHours(new Date(), h), 0), 'h a')}
                  </div>
                ))}
              </div>

              {weekDays.map((_day, dayIdx) => (
                <div
                  key={dayIdx}
                  className="relative border-l"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t"
                      style={{
                        top: `${(h - START_HOUR) * HOUR_HEIGHT}px`,
                        borderColor: 'var(--color-border)',
                        opacity: 0.4,
                      }}
                    />
                  ))}

                  {(chatsByDay.get(dayIdx) || []).map(chat => {
                    const { top, height } = getEventPosition(chat);
                    return (
                      <EventBlock
                        key={chat.id}
                        chat={chat}
                        top={top}
                        height={height}
                        onClick={() => onEventClick?.(chat)}
                      />
                    );
                  })}

                  {dayIdx === nowDayIndex && nowTop >= 0 && nowTop <= HOURS.length * HOUR_HEIGHT && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${nowTop}px` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full -ml-[3px]" style={{ backgroundColor: 'var(--color-accent)' }} />
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-accent)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════════ */
export function CoffeeChatsCalendar({
  chats,
  onMessage,
  onViewDetails,
}: CoffeeChatsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));

  // Enrich all chats with display status
  const enrichedChats = useMemo(() => chats.map(enrichChat), [chats]);

  // Build date → chats map for small calendar dots (one dot per chat)
  const chatsByDate = useMemo(() => {
    const map = new Map<string, EnrichedChat[]>();

    const addToDate = (key: string, chat: EnrichedChat) => {
      if (!map.has(key)) map.set(key, []);
      // Avoid adding same chat twice on same date
      if (!map.get(key)!.find(c => c.id === chat.id)) {
        map.get(key)!.push(chat);
      }
    };

    enrichedChats.forEach(chat => {
      // Scheduled chats go on their scheduled date
      if (chat.scheduled_at) {
        addToDate(format(parseISO(chat.scheduled_at), 'yyyy-MM-dd'), chat);
      }
      // Pending chats also appear on their preferred dates
      if (chat.displayStatus === 'pending' && chat.preferred_dates) {
        chat.preferred_dates.forEach(pd => {
          addToDate(format(parseISO(pd), 'yyyy-MM-dd'), chat);
        });
      }
    });
    return map;
  }, [enrichedChats]);

  // Chats visible in the current week (scheduled chats + pending chats with preferred dates in this week)
  const weekChats = useMemo(() => {
    const end = addDays(weekStart, 7);
    return enrichedChats.filter(chat => {
      // Scheduled chats
      if (chat.scheduled_at) {
        const d = parseISO(chat.scheduled_at);
        if (d >= weekStart && d < end) return true;
      }
      // Pending chats with preferred_dates that fall in this week
      if (chat.displayStatus === 'pending' && chat.preferred_dates) {
        return chat.preferred_dates.some(pd => {
          const d = parseISO(pd);
          return d >= weekStart && d < end;
        });
      }
      return false;
    });
  }, [enrichedChats, weekStart]);

  // For pending chats without scheduled_at, we use the first preferred_date in the current week
  // as a synthetic scheduled_at so they appear in the week grid
  const weekChatsWithPosition = useMemo(() => {
    const end = addDays(weekStart, 7);
    return weekChats.map(chat => {
      if (chat.scheduled_at) return chat;
      // Pending with preferred_dates — pick the first date in this week
      if (chat.preferred_dates) {
        const dateInWeek = chat.preferred_dates.find(pd => {
          const d = parseISO(pd);
          return d >= weekStart && d < end;
        });
        if (dateInWeek) {
          return { ...chat, scheduled_at: dateInWeek };
        }
      }
      return chat;
    });
  }, [weekChats, weekStart]);

  // Next upcoming chat
  const nextUp = useMemo(() => {
    const now = new Date();
    return enrichedChats
      .filter(c => c.displayStatus === 'upcoming' && c.scheduled_at)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .find(c => new Date(c.scheduled_at!) >= now) || null;
  }, [enrichedChats]);

  // Sync: clicking small calendar → update week
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setWeekStart(startOfWeek(date));
  }, []);

  // Sync: navigating week → update small calendar month if needed
  const handleWeekChange = useCallback((newWeekStart: Date) => {
    setWeekStart(newWeekStart);
    const midWeek = addDays(newWeekStart, 3);
    if (!isSameMonth(midWeek, currentMonth)) {
      setCurrentMonth(startOfMonth(midWeek));
    }
    setSelectedDate(midWeek);
  }, [currentMonth]);

  const handleTodayClick = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setWeekStart(startOfWeek(today));
    setCurrentMonth(startOfMonth(today));
  }, []);

  return (
    // Stacks on phones; the week grid needs the full width there
    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-[260px] flex-shrink-0 space-y-4">
        <SmallMonthCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          chatsByDate={chatsByDate}
        />
        <NextUpCard
          chat={nextUp}
          onMessage={onMessage}
          onViewDetails={onViewDetails}
        />
      </div>

      {/* RIGHT: WEEK CALENDAR */}
      <div className="flex-1 min-w-0">
        <WeekCalendar
          weekStart={weekStart}
          onWeekChange={handleWeekChange}
          onTodayClick={handleTodayClick}
          chats={weekChatsWithPosition}
          onEventClick={onViewDetails}
        />
      </div>
    </div>
  );
}
