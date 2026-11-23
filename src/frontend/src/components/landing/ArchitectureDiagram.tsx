import type { ReactNode } from 'react';

function Box({ title, lines, accent = false }: { title: string; lines: string[]; accent?: boolean }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: accent ? 'color-mix(in srgb, var(--color-accent) 45%, var(--color-border))' : 'var(--color-border)',
        backgroundColor: accent ? 'color-mix(in srgb, var(--color-accent) 6%, var(--color-surface))' : 'var(--color-surface)',
      }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </p>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function Arrow({ label }: { label: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--color-textMuted)' }}>
      <span aria-hidden>↓</span>
      {label}
    </div>
  );
}

/** Production topology on the left, the demo build's substitution on the right. */
export function ArchitectureDiagram() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: 'var(--color-textMuted)' }}>
          The real product
        </p>
        <Box
          title="React 19 + Vite SPA"
          lines={['Contexts for auth, theme, connections, messaging', 'Client-side scoring through lib/ember (TS port)', 'Lazy routes per role: candidate and employer']}
        />
        <div className="grid grid-cols-2 gap-3">
          <Arrow label="supabase-js" />
          <Arrow label="REST" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Box
            title="Supabase"
            lines={['Postgres with Row Level Security', 'Realtime for chats and requests', 'Auth: email, Google, GitHub']}
          />
          <Box
            title="FastAPI"
            lines={['Ember agent and scoring engine', 'Connections, coffee chats, prep briefs', 'Stripe Checkout and webhooks']}
          />
        </div>
        <Arrow label="service role + webhooks" />
        <Box title="Stripe" lines={['Two subscription tiers, monthly or yearly', 'Plan state synced to profiles by webhook']} />
      </div>

      <div>
        <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: 'var(--color-textMuted)' }}>
          This demo
        </p>
        <Box
          accent
          title="Same SPA, VITE_DEMO=1"
          lines={['Runs the production components and contexts', 'Built for GitHub Pages under /amber/']}
        />
        <Arrow label="one seam" />
        <Box
          accent
          title="src/demo"
          lines={[
            'supabase-js stand-in: queries, embeds, RLS rules, realtime, auth',
            'FastAPI stand-in: the same routes, backed by the TS Ember port',
            'Seeded fictional people, kept in localStorage',
            'Seeded people reply on their own, labelled as automatic',
          ]}
        />
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--color-textMuted)' }}>
          The Python engine stays the source of truth. A shared fixture of 120 cases runs through pytest and vitest,
          so the TypeScript port has to produce identical numbers to pass CI.
        </p>
      </div>
    </div>
  );
}
