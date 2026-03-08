import { describe, it, expect } from 'vitest';

// --- Utilities duplicated from page components for testability ---

function formatCurrency(val) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function deadlineBadgeClass(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const daysUntil = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'text-slate-400';
  if (daysUntil < 14) return 'text-red-600 font-semibold';
  if (daysUntil < 30) return 'text-yellow-600 font-semibold';
  return 'text-green-700';
}

// --- formatCurrency ---

describe('formatCurrency', () => {
  it('formats millions with one decimal', () => {
    expect(formatCurrency(1500000)).toBe('$1.5M');
    expect(formatCurrency(4500000)).toBe('$4.5M');
  });

  it('formats thousands with no decimal', () => {
    expect(formatCurrency(650000)).toBe('$650K');
    expect(formatCurrency(1000)).toBe('$1K');
  });

  it('formats small values as dollars', () => {
    expect(formatCurrency(500)).toBe('$500');
  });

  it('returns null for null, undefined, or empty string', () => {
    expect(formatCurrency(null)).toBeNull();
    expect(formatCurrency(undefined)).toBeNull();
    expect(formatCurrency('')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(formatCurrency('abc')).toBeNull();
  });

  it('handles numeric strings', () => {
    expect(formatCurrency('2000000')).toBe('$2.0M');
  });
});

// --- formatDate ---

describe('formatDate', () => {
  it('returns null for null or empty input', () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate('')).toBeNull();
    expect(formatDate(undefined)).toBeNull();
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2026-04-15T12:00:00Z');
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });

  it('returns the original string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

// --- deadlineBadgeClass ---

describe('deadlineBadgeClass', () => {
  it('returns empty string for null or missing date', () => {
    expect(deadlineBadgeClass(null)).toBe('');
    expect(deadlineBadgeClass('')).toBe('');
  });

  it('returns red class for deadlines less than 14 days away', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(deadlineBadgeClass(soon)).toContain('text-red-600');
  });

  it('returns yellow class for deadlines 14–29 days away', () => {
    const medium = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
    expect(deadlineBadgeClass(medium)).toContain('text-yellow-600');
  });

  it('returns green class for deadlines 30+ days away', () => {
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(deadlineBadgeClass(far)).toBe('text-green-700');
  });

  it('returns slate class for past deadlines', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(deadlineBadgeClass(past)).toContain('text-slate-400');
  });

  it('returns empty string for invalid date strings', () => {
    expect(deadlineBadgeClass('not-a-date')).toBe('');
  });
});
