export function PostSkeleton() {
  return (
    <div className="bento-card !p-0 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--color-border)' }}
        />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square" style={{ backgroundColor: 'var(--color-border)' }} />

      {/* Like */}
      <div className="px-4 py-3">
        <div className="h-5 w-5 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>

      {/* Caption */}
      <div className="px-4 pb-3 space-y-2">
        <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="h-3 w-3/4 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>

      {/* Tags */}
      <div className="flex gap-2 px-4 pb-4">
        <div className="h-5 w-16 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="h-5 w-20 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>
    </div>
  );
}
