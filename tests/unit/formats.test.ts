import { FORMATS, FORMAT_FILTERS } from '@/utils/formats';
import type { WorkType } from '@/types';

/**
 * `FORMATS` is a `Record<WorkType, …>`, so the compiler already rejects a missing
 * type. These tests cover what it cannot: that the filter chips between them
 * reach every work, and that no work is reachable from two chips.
 */
const ALL_TYPES = Object.keys(FORMATS) as WorkType[];

describe('format metadata', () => {
  it('gives every format a label, an icon and the three colour classes', () => {
    for (const type of ALL_TYPES) {
      const f = FORMATS[type];
      expect(f.label).toBeTruthy();
      expect(f.icon).toBeTruthy();
      expect(f.text).toMatch(/^text-fmt-/);
      expect(f.tint).toMatch(/^bg-fmt-.*-bg$/);
      expect(f.solid).toMatch(/^bg-fmt-/);
    }
  });

  it('covers all six work types', () => {
    expect(ALL_TYPES.sort()).toEqual(
      ['artwork', 'long_work', 'playlet', 'poetry', 'screenplay', 'short_story']);
  });
});

describe('Home format filters', () => {
  const typed = FORMAT_FILTERS.filter(f => f.types);

  it('has one unfiltered "all" chip, first', () => {
    expect(FORMAT_FILTERS[0]).toMatchObject({ id: 'all', types: null });
    expect(FORMAT_FILTERS.filter(f => f.types === null)).toHaveLength(1);
  });

  it('reaches every work type, so nothing is hidden by every filter but "all"', () => {
    const reached = typed.flatMap(f => f.types!);
    expect(new Set(reached)).toEqual(new Set(ALL_TYPES));
  });

  it('puts each work type under exactly one chip', () => {
    const reached = typed.flatMap(f => f.types!);
    expect(reached.length).toBe(new Set(reached).size);
  });
});
