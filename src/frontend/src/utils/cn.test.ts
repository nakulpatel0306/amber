import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a text color next to a custom type-scale size', () => {
    expect(cn('text-[var(--color-accentText)]', 'text-label')).toBe('text-[var(--color-accentText)] text-label');
    expect(cn('text-[var(--color-accentText)]', 'text-caption')).toBe('text-[var(--color-accentText)] text-caption');
  });

  it('still lets a later size replace an earlier one', () => {
    expect(cn('text-sm', 'text-label')).toBe('text-label');
  });
});
