import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PageBannerProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  belowSubtitle?: React.ReactNode;
  className?: string;
}

// The one page header: a plain title row, no card, so the page content is the first surface
export function PageBanner({ title, subtitle, rightContent, belowSubtitle, className }: PageBannerProps) {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn('mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}
    >
      <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
        <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {subtitle}
          </p>
        )}
        {belowSubtitle}
      </div>
      {rightContent && <div className="flex flex-wrap items-center gap-2">{rightContent}</div>}
    </motion.header>
  );
}
