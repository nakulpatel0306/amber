import { cn } from '../../utils/cn';

interface Fact {
  label: string;
  value: React.ReactNode;
}

// A quiet row of label/value pairs under a page title, in place of colored stat chips
export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  return (
    <dl className={cn('mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <dt style={{ color: 'var(--color-textMuted)' }}>{item.label}</dt>
          <dd className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
