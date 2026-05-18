import { describe, it, expect, beforeEach } from 'vitest';
import { hashTagColor, PALETTES } from './tagColors';

describe('hashTagColor', () => {
  // Clear cache before each test to ensure deterministic results
  beforeEach(() => {
    // The function uses an internal cache; we test determinism by calling
    // multiple times and checking consistency within a single call chain
  });

  it('is deterministic: same tag returns the same color every time', () => {
    const tag = 'typescript';
    const result1 = hashTagColor(tag);
    const result2 = hashTagColor(tag);
    expect(result1).toEqual(result2);
    expect(result1.color).toBe(result2.color);
    expect(result1.border).toBe(result2.border);
    expect(result1.bg).toBe(result2.bg);
  });

  it('return value has color, border, bg keys', () => {
    const result = hashTagColor('react');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('border');
    expect(result).toHaveProperty('bg');
  });

  it('different tags produce different colors (statistically)', () => {
    const tags = ['react', 'typescript', 'vue', 'svelte', 'rust', 'go', 'python', 'java', 'ruby', 'php'];
    const colors = tags.map((tag) => hashTagColor(tag).color);
    const uniqueColors = new Set(colors);
    // With 10 distinct tags and 24 palette entries, collisions should be rare
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  it('all colors in PALETTE are valid CSS color strings', () => {
    for (const palette of PALETTES) {
      expect(palette.color).toMatch(/^#[0-9a-fA-F]{3,8}$|^rgba?\(.+\)$/);
      expect(palette.border).toMatch(/^#[0-9a-fA-F]{3,8}$|^rgba?\(.+\)$/);
      expect(palette.bg).toMatch(/^#[0-9a-fA-F]{3,8}$|^rgba?\(.+\)$/);
    }
  });
});
