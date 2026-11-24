import { Button } from '../ui/Button';

// Opens the connection-request inbox; the pending count sits inline instead of a floating badge
export function RequestsButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      Requests
      {count > 0 && (
        <span className="tabular-nums" style={{ color: 'var(--color-accent)' }}>
          {count}
        </span>
      )}
    </Button>
  );
}
