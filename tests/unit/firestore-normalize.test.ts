import { Timestamp, GeoPoint } from 'firebase/firestore';
import { normalize } from '@/firebase/firestore.helpers';

/**
 * `normalize` is what makes the declared `createdAt: string` types honest: it
 * runs over every document read from Firestore and converts `Timestamp` values
 * to ISO strings. Before it existed, those objects reached `new Date(...)` and
 * rendered as "Invalid Date".
 */
describe('normalize', () => {
  const iso = '2026-07-20T12:00:00.000Z';
  const ts = Timestamp.fromDate(new Date(iso));

  it('converts a top-level Timestamp to an ISO string', () => {
    expect(normalize({ createdAt: ts })).toEqual({ createdAt: iso });
  });

  it('converts Timestamps nested in plain objects', () => {
    expect(normalize({ meta: { updatedAt: ts } })).toEqual({ meta: { updatedAt: iso } });
  });

  it('converts Timestamps inside arrays', () => {
    expect(normalize({ history: [ts, ts] })).toEqual({ history: [iso, iso] });
  });

  it('leaves other scalars untouched', () => {
    const doc = { title: 'Untitled', count: 3, isPremium: false, tags: ['a', 'b'] };
    expect(normalize(doc)).toEqual(doc);
  });

  it('preserves a pending serverTimestamp as null rather than inventing a date', () => {
    expect(normalize({ createdAt: null })).toEqual({ createdAt: null });
  });

  it('passes non-plain Firestore class instances through untouched', () => {
    // GeoPoint is a class instance, not a plain object — walking into it would
    // strip its prototype and destroy the value.
    const point = new GeoPoint(6.5244, 3.3792);
    const result = normalize({ point }) as { point: GeoPoint };
    expect(result.point).toBeInstanceOf(GeoPoint);
    expect(result.point.latitude).toBe(6.5244);
  });
});
