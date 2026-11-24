import { useState, useEffect } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface PrepData {
  personality_summary: string;
  conversation_starters: string[];
  topics_to_explore: string[];
  things_to_be_mindful_of: string[];
  archetype_tips: string;
}

interface PrepResponse {
  chat_id: string;
  prep: PrepData;
  match_score: number;
  archetype: string;
}

interface CoffeeChatPrepProps {
  chatId: string;
}

export function CoffeeChatPrep({ chatId }: CoffeeChatPrepProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<PrepResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrep = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await apiFetch(`/api/coffee-chats/${chatId}/prep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch prep');
        const json: PrepResponse = await res.json();
        setData(json);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrep();
  }, [chatId]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  // Rendered inside the chat card, so it is a divided section rather than a card of its own
  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t space-y-2 animate-pulse" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-3.5 w-24 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="h-3 w-4/5 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="mt-4 pt-4 border-t text-label font-normal" style={{ borderColor: 'var(--color-border)', color: 'var(--color-textMuted)' }}>
        Prep brief unavailable
      </p>
    );
  }

  const { prep } = data;

  return (
    <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between py-1 text-left"
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Prep brief
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-textMuted)' }}
        />
      </button>

      {isExpanded && (
        <div className="pt-3 space-y-5">
          <PrepSection title="Personality summary">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              {prep.personality_summary}
            </p>
          </PrepSection>

          {prep.conversation_starters.length > 0 && (
            <PrepSection title="Conversation starters">
              <ol className="space-y-1.5">
                {prep.conversation_starters.map((starter, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm group">
                    <span className="flex-shrink-0 w-4 tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                      {i + 1}.
                    </span>
                    <span className="flex-1" style={{ color: 'var(--color-textSecondary)' }}>
                      {starter}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(starter, i);
                      }}
                      className="flex-shrink-0 p-1 rounded transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                      style={{ color: 'var(--color-textMuted)' }}
                      title="Copy to clipboard"
                      aria-label="Copy to clipboard"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ol>
            </PrepSection>
          )}

          {prep.topics_to_explore.length > 0 && (
            <PrepSection title="Topics to explore">
              <BulletList items={prep.topics_to_explore} />
            </PrepSection>
          )}

          {prep.things_to_be_mindful_of.length > 0 && (
            <PrepSection title="Things to be mindful of">
              <BulletList items={prep.things_to_be_mindful_of} />
            </PrepSection>
          )}

          {prep.archetype_tips && (
            <PrepSection title="Archetype tips">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                {prep.archetype_tips}
              </p>
            </PrepSection>
          )}
        </div>
      )}
    </div>
  );
}

function PrepSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-label mb-1.5" style={{ color: 'var(--color-text)' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span
            className="flex-shrink-0 w-1 h-1 rounded-full mt-2"
            style={{ backgroundColor: 'var(--color-textMuted)' }}
          />
          <span style={{ color: 'var(--color-textSecondary)' }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
