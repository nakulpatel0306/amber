import { useMemo } from 'react';
import { RankedList } from './RankedList';

interface CandidateRow {
  candidateId: string;
  name: string;
  headline: string;
  location: string;
  matchScore: number;
  topTrait: string;
  chatStatus: 'none' | 'pending' | 'accepted' | 'completed';
}

interface EmployerCandidateTableProps {
  candidates: CandidateRow[];
  hasCompletedCultureQuiz: boolean;
  onRowClick?: (candidate: CandidateRow) => void;
  onRefresh?: () => void;
}

const STATUS_LABEL: Record<CandidateRow['chatStatus'], string> = {
  completed: 'Chat done',
  accepted: 'Chat booked',
  pending: 'Request pending',
  none: 'New match',
};

export function EmployerCandidateTable({ candidates, hasCompletedCultureQuiz, onRowClick, onRefresh }: EmployerCandidateTableProps) {
  const sorted = useMemo(() => [...candidates].sort((a, b) => b.matchScore - a.matchScore), [candidates]);

  return (
    <RankedList
      title="Top culture matches"
      locked={!hasCompletedCultureQuiz}
      lockedMessage="Take the culture quiz to see the candidates who fit your team."
      onRowClick={(i) => onRowClick?.(sorted[i])}
      onRefresh={onRefresh}
      rows={sorted.map((candidate, i) => ({
        key: `${candidate.candidateId}-${i}`,
        initial: candidate.name.charAt(0),
        primary: candidate.name,
        secondary: candidate.headline,
        meta: candidate.topTrait,
        status: STATUS_LABEL[candidate.chatStatus],
        active: candidate.chatStatus !== 'none',
        score: candidate.matchScore,
      }))}
    />
  );
}
