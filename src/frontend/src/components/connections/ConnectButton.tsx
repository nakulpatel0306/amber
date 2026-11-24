import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ConnectionStatus } from '../../types/connections.types';

// Connection state reads as a dot and a word, matching status everywhere else
function StatusText({ dot, className, children }: { dot: string; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-label font-normal ${className ?? ''}`}
      style={{ color: 'var(--color-textSecondary)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {children}
    </span>
  );
}

interface ConnectButtonProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function ConnectButton({
  status,
  onConnect,
  onAccept,
  onDecline,
  size = 'sm',
  className = '',
}: ConnectButtonProps) {
  switch (status) {
    case 'none':
    case 'rejected':
      return (
        <Button
          size={size}
          variant="outline"
          onClick={(e) => { e.stopPropagation(); onConnect(); }}
          className={className}
        >
          Connect
        </Button>
      );

    case 'pending_sent':
      return (
        <StatusText dot="var(--color-warning)" className={className}>
          Request sent
        </StatusText>
      );

    case 'pending_received':
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          <Button
            size={size}
            onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
          >
            Accept
          </Button>
          <Button
            size={size}
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onDecline?.(); }}
            aria-label="Decline"
            title="Decline"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      );

    case 'accepted':
      return (
        <StatusText dot="var(--color-success)" className={className}>
          Connected
        </StatusText>
      );

    default:
      return null;
  }
}
