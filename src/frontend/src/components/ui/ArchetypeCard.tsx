import { motion } from 'framer-motion';

interface ArchetypeCardProps {
  name: string;
  description: string;
  strengths: string[];
  idealEnvironments?: string[];
  idealCandidates?: string[];
  blindspots?: string[];
  isPrimary?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary';
  delay?: number;
}

const RANK_LABEL = { primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary' };

export function ArchetypeCard({
  name,
  description,
  strengths,
  idealEnvironments,
  idealCandidates,
  blindspots,
  isPrimary = false,
  variant,
  delay = 0,
}: ArchetypeCardProps) {
  const idealItems = idealEnvironments || idealCandidates || [];
  const rank = variant ?? (isPrimary ? 'primary' : null);

  const groups = [
    { label: 'Strengths', items: strengths.slice(0, 4) },
    { label: idealCandidates ? 'Ideal candidates' : 'Ideal for', items: idealItems.slice(0, 3) },
    { label: 'Watch for', items: (blindspots ?? []).slice(0, 3) },
  ].filter((g) => g.items.length > 0);

  return (
    <motion.div
      className="bento-card h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {rank && (
        <p
          className="text-caption font-medium"
          style={{ color: rank === 'primary' ? 'var(--color-accent)' : 'var(--color-textMuted)' }}
        >
          {RANK_LABEL[rank]}
        </p>
      )}
      <h3 className="mt-1 text-heading" style={{ color: 'var(--color-text)' }}>
        {name}
      </h3>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
        {description}
      </p>

      {groups.length > 0 && (
        <dl className="mt-4 space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <dt className="text-caption" style={{ color: 'var(--color-textMuted)' }}>
                {group.label}
              </dt>
              <dd className="mt-0.5 text-sm" style={{ color: 'var(--color-text)' }}>
                {group.items.join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </motion.div>
  );
}
