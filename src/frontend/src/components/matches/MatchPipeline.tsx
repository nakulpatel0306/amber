import { useMemo } from 'react';
import { PipelineCard } from './PipelineCard';
import type { SavedMatch, PipelineTab } from '../../types/matching.types';

interface MatchPipelineProps {
  savedMatches: SavedMatch[];
  activeTab: PipelineTab;
  onTabChange: (tab: PipelineTab) => void;
  counts: Record<PipelineTab, number>;
  mode: 'candidate' | 'employer';
  onViewInEmber: (matchId: string) => void;
  onRemove: (id: string) => void;
  onCoffeeChat: (match: SavedMatch) => void;
}

const candidateTabs: { value: PipelineTab; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'pending', label: 'Pending' },
  { value: 'connected', label: 'Connected' },
];

const employerTabs: { value: PipelineTab; label: string }[] = [
  { value: 'saved', label: 'Shortlisted' },
  { value: 'pending', label: 'Pending' },
  { value: 'connected', label: 'Connected' },
];

const emptyMessages: Record<PipelineTab, { title: string; message: string }> = {
  saved: {
    title: 'No saved matches',
    message: 'Explore your Ember matches to start saving.',
  },
  pending: {
    title: 'No pending requests',
    message: 'Send a coffee chat to get started.',
  },
  connected: {
    title: 'No connections yet',
    message: 'Accept a pending request to connect.',
  },
};

export function MatchPipeline({
  savedMatches,
  activeTab,
  onTabChange,
  counts,
  mode,
  onViewInEmber,
  onRemove,
  onCoffeeChat,
}: MatchPipelineProps) {
  const tabs = mode === 'candidate' ? candidateTabs : employerTabs;

  const filteredMatches = useMemo(() => {
    return savedMatches.filter(m => m.status === activeTab);
  }, [savedMatches, activeTab]);

  const empty = emptyMessages[activeTab];

  return (
    <div>
      <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hidden border-b" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              aria-pressed={isActive}
              className="flex-shrink-0 -mb-px flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors hover:text-[var(--color-text)]"
              style={{
                borderColor: isActive ? 'var(--color-accent)' : 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-textSecondary)',
              }}
            >
              {tab.label}
              <span className="font-normal tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                {counts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bento-card !p-0 overflow-hidden">
        {filteredMatches.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="text-heading" style={{ color: 'var(--color-text)' }}>
              {empty.title}
            </h3>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: 'var(--color-textSecondary)' }}>
              {empty.message}
            </p>
          </div>
        ) : (
          <ul>
            {filteredMatches.map((match, i) => (
              <li key={match.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}>
                <PipelineCard
                  match={match}
                  mode={mode}
                  onViewInEmber={() => onViewInEmber(match.role_id || match.candidate_id || '')}
                  onRemove={() => onRemove(match.id)}
                  onCoffeeChat={() => onCoffeeChat(match)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
