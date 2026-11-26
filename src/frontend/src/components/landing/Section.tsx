import type { ReactNode } from 'react';

// Each section borrows one trait color for its label, so the page reads as the same five-color system as the app
export function Section({
  id,
  eyebrow,
  color = 'var(--color-accent)',
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow?: string;
  color?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          {eyebrow && <Eyebrow color={color}>{eyebrow}</Eyebrow>}
          <h2 className="text-headline" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          {intro && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              {intro}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 mb-4 h-7 px-3 rounded-full text-caption font-medium"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

// Tinted card: a wash of one color over the surface, readable in both themes because the tint is mixed with transparent
export function TintCard({ color, className = '', children }: { color: string; className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-transform duration-300 ease-out-strong hover:-translate-y-0.5 ${className}`}
      style={{
        borderColor: `color-mix(in srgb, ${color} 28%, var(--color-border))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${color} 13%, var(--color-surface)), var(--color-surface) 70%)`,
      }}
    >
      {children}
    </div>
  );
}

export const TRAIT = {
  o: 'var(--color-trait-openness)',
  c: 'var(--color-trait-conscientiousness)',
  e: 'var(--color-trait-extraversion)',
  a: 'var(--color-trait-agreeableness)',
  n: 'var(--color-trait-stability)',
};
