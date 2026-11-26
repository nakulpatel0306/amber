import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Minus, Send } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { IS_DEMO } from '../../demo/flag';
import { splitAutoReply } from '../../demo/autoReplyLabel';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging, type Message, type ChatPartner } from '../../contexts/MessagingContext';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

// The demo's reset pill floats at the bottom of the screen; open chats sit above it so the message box stays usable
const PANEL_BOTTOM = IS_DEMO ? 'bottom-16' : 'bottom-2 sm:bottom-4';

interface MessagePanelProps {
  coffeeChatId: string;
  partner: ChatPartner;
  messages: Message[];
  isMinimized: boolean;
  position: number;
}

export function MessagePanel({
  coffeeChatId,
  partner,
  messages,
  isMinimized,
  position,
}: MessagePanelProps) {
  const { user } = useAuth();
  const { closeChat, minimizeChat, maximizeChat, sendMessage, markAsRead, unreadCounts } = useMessaging();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const unreadCount = unreadCounts[coffeeChatId] || 0;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Mark as read when opening
  useEffect(() => {
    if (!isMinimized) {
      markAsRead(coffeeChatId);
    }
  }, [isMinimized, coffeeChatId, markAsRead]);

  // Focus input when maximized
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(coffeeChatId, newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages: insert date separators and detect consecutive same-sender
  const groupedMessages = useMemo(() => {
    const groups: { type: 'date' | 'message'; date?: string; msg?: Message; showAvatar?: boolean }[] = [];
    let lastDate: Date | null = null;
    let lastSenderId: string | null = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at);
      if (!lastDate || !isSameDay(msgDate, lastDate)) {
        groups.push({ type: 'date', date: msg.created_at });
        lastSenderId = null;
      }
      const showAvatar = msg.sender_id !== lastSenderId;
      groups.push({ type: 'message', msg, showAvatar });
      lastDate = msgDate;
      lastSenderId = msg.sender_id;
    });
    return groups;
  }, [messages]);

  // 384px wide + 24px gap per panel; phones get one full-width panel instead
  const rightOffset = 24 + position * 408;
  const offsetStyle = { '--panel-right': `${rightOffset}px` } as React.CSSProperties;

  if (isMinimized) {
    return (
      <button
        onClick={() => maximizeChat(coffeeChatId)}
        className={`fixed ${IS_DEMO ? 'bottom-16' : 'bottom-4'} right-2 sm:right-[var(--panel-right)] flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-colors hover:bg-[var(--color-accentHover)]`}
        style={{
          ...offsetStyle,
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accentText)',
          zIndex: 50,
        }}
      >
        <Avatar src={partner.avatarUrl} fallback={partner.name} size="xs" className="text-2xs" />
        <span className="text-sm font-medium max-w-[120px] truncate">{partner.name}</span>
        {unreadCount > 0 && (
          <span
            className="min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-2xs font-semibold tabular-nums"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed ${PANEL_BOTTOM} inset-x-2 sm:left-auto sm:right-[var(--panel-right)] sm:w-96 rounded-xl shadow-2xl overflow-hidden flex flex-col`}
      style={{
        ...offsetStyle,
        height: `min(460px, calc(100dvh - ${IS_DEMO ? '5rem' : '1rem'}))`,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        zIndex: 50,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={partner.avatarUrl} fallback={partner.name} size="sm" className="text-xs" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {partner.name}
            </p>
            {partner.subtitle && (
              <p className="text-caption truncate" style={{ color: 'var(--color-textMuted)' }}>
                {partner.subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => minimizeChat(coffeeChatId)}
            aria-label="Minimize"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
          >
            <Minus className="w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
          </button>
          <button
            onClick={() => closeChat(coffeeChatId)}
            aria-label="Close"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-center" style={{ color: 'var(--color-textMuted)' }}>
              No messages yet.<br />Say hello!
            </p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === 'date' && item.date) {
              return (
                <div key={`date-${idx}`} className="flex justify-center my-3">
                  <span className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
                    {formatDateSeparator(item.date)}
                  </span>
                </div>
              );
            }
            if (item.type === 'message' && item.msg) {
              const msg = item.msg;
              const isOwn = msg.sender_id === user?.id;
              const { isAutoReply, text } = IS_DEMO ? splitAutoReply(msg.content) : { isAutoReply: false, text: msg.content };
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${item.showAvatar ? 'mt-3' : 'mt-0.5'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && item.showAvatar && (
                      <Avatar src={msg.sender_avatar_url} fallback={msg.sender_name || partner.name} size="xs" className="mt-1 text-2xs" />
                    )}
                    {!isOwn && !item.showAvatar && <div className="w-6 flex-shrink-0" />}
                    <div>
                      <div
                        className="message-enter px-3 py-2 rounded-xl text-sm"
                        style={{
                          backgroundColor: isOwn ? 'var(--color-accent)' : 'var(--color-surface)',
                          color: isOwn ? 'var(--color-accentText)' : 'var(--color-text)',
                          border: isOwn ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        {text}
                      </div>
                      {(item.showAvatar || isAutoReply) && (
                        <p
                          className={`flex items-center gap-1.5 text-2xs tabular-nums mt-0.5 ${isOwn ? 'justify-end' : ''}`}
                          style={{ color: 'var(--color-textMuted)' }}
                        >
                          {item.showAvatar && formatMessageTime(msg.created_at)}
                          {isAutoReply && (
                            <span className="px-1.5 rounded-full" style={{ border: '1px solid var(--color-border)' }}>
                              Demo auto-reply
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="p-3 border-t"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            aria-label="Message"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            style={{
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              maxHeight: '72px',
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            aria-label="Send"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
