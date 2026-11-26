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
    <section id={id} className={SECTION_CLASS}>
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          {eyebrow && <Eyebrow color={color}>{eyebrow}</Eyebrow>}
          <h2 className="text-headline text-balance" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          {intro && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-pretty" style={{ color: 'var(--color-textSecondary)' }}>
              {intro}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// Shared by every landing section so the gaps between them stay even
export const SECTION_CLASS = 'px-4 sm:px-6 lg:px-8 py-10 sm:py-12 scroll-mt-20';

// Trait colors are tuned for fills; as text they lean toward the text color so yellow and cyan stay legible on white.
// 70% is enough for large numerals; small text needs about 50% to clear 4.5:1 on a tinted background.
export const readable = (c: string, pct = 70) => `color-mix(in srgb, ${c} ${pct}%, var(--color-text))`;

export function Eyebrow({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 mb-4 h-7 px-3 rounded-full text-caption font-medium"
      style={{ color: readable(color, 50), backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
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

// The four score weights (40/30/20/10) get shades of the accent, heaviest first, so they never read as traits
export const WEIGHT_SHADES = [
  'color-mix(in srgb, var(--color-accent) 62%, var(--color-text))',
  'var(--color-accent)',
  'color-mix(in srgb, var(--color-accent) 62%, var(--color-surface))',
  'color-mix(in srgb, var(--color-accent) 36%, var(--color-surface))',
];
