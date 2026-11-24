import { useMemo } from 'react';
import { RankedList } from './RankedList';

interface MatchRow {
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

interface MatchingTableProps {
  matches: MatchRow[];
  hasCompletedAssessment: boolean;
  onRowClick?: (match: MatchRow) => void;
  onRefresh?: () => void;
}

function formatWorkStyle(ws: string | null): string {
  if (!ws) return 'Flexible';
  const lower = ws.toLowerCase().trim();
  if (lower === 'remote') return 'Remote';
  if (lower === 'hybrid') return 'Hybrid';
  if (lower === 'on-site' || lower === 'onsite' || lower === 'on_site') return 'On-site';
  if (lower === 'in-office' || lower === 'in_office') return 'In-office';
  return ws.charAt(0).toUpperCase() + ws.slice(1);
}

function formatCompany(name: string): string {
  if (!name || name.toLowerCase() === 'unknown') return 'Unlisted';
  return name;
}

const STATUS_LABEL: Record<MatchRow['chatStatus'], string> = {
  connected: 'Connected',
  completed: 'Chat done',
  scheduled: 'Chat booked',
  accepted: 'Accepted',
  pending: 'Request sent',
  none: 'New match',
};

export function MatchingTable({ matches, hasCompletedAssessment, onRowClick, onRefresh }: MatchingTableProps) {
  const sorted = useMemo(() => [...matches].sort((a, b) => b.matchScore - a.matchScore), [matches]);

  return (
    <RankedList
      title="Top matches"
      locked={!hasCompletedAssessment}
      lockedMessage="Take the personality assessment to see the roles that fit you."
      onRowClick={(i) => onRowClick?.(sorted[i])}
      onRefresh={onRefresh}
      rows={sorted.map((match, i) => {
        const company = formatCompany(match.company);
        return {
          key: `${match.employerId}-${match.role}-${i}`,
          initial: company.charAt(0),
          imageUrl: match.logoUrl,
          primary: match.role,
          secondary: company,
          meta: formatWorkStyle(match.workStyle),
          status: STATUS_LABEL[match.chatStatus],
          active: match.chatStatus !== 'none',
          score: match.matchScore,
        };
      })}
    />
  );
}
