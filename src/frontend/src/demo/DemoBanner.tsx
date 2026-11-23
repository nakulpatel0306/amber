import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { resetDemo } from './store';

/** Reloads into a clean demo; a full reload also drops in-memory React state. */
export function restartDemo(): void {
  resetDemo();
  window.location.assign(`${import.meta.env.BASE_URL}demo`);
}

export function DemoBanner() {
  const { pathname } = useLocation();
  const [confirming, setConfirming] = useState(false);

  // The case-study landing page explains the demo itself
  if (pathname === '/') return null;

  return (
    <div
      role="status"
      className="fixed bottom-3 inset-x-0 mx-auto w-fit z-[60] flex items-center gap-2 sm:gap-3 rounded-full border pl-3 pr-1.5 py-1.5 text-xs shadow-lg max-w-[calc(100vw-32px)]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-textSecondary)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <span
        className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}
      >
        Demo
      </span>
      <span className="truncate">
        <span className="hidden sm:inline">Made-up data, saved only in this browser</span>
        <span className="sm:hidden">Made-up data</span>
      </span>
      {confirming ? (
        <span className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={restartDemo}
            className="rounded-full px-2.5 py-1 font-medium text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Reset
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-full px-2.5 py-1 font-medium"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 font-medium flex-shrink-0 transition-colors hover:bg-[var(--color-background)]"
          style={{ color: 'var(--color-text)' }}
        >
          <RotateCcw className="w-3 h-3" />
          Reset demo
        </button>
      )}
    </div>
  );
}
