import { formatCount, formatCurrency, truncate } from '@/utils/format';

describe('formatCount', () => {
  it('formats thousands', () => expect(formatCount(1500)).toBe('1.5K'));
  it('formats millions', () => expect(formatCount(2_000_000)).toBe('2.0M'));
  it('returns raw for small numbers', () => expect(formatCount(42)).toBe('42'));
});

describe('formatCurrency', () => {
  it('formats NGN', () => expect(formatCurrency(5000)).toBe('₦5,000'));
  it('formats USD', () => expect(formatCurrency(50, 'USD')).toBe('$50'));
});

describe('truncate', () => {
  it('truncates long strings', () => expect(truncate('hello world', 5)).toBe('hello…'));
  it('leaves short strings intact', () => expect(truncate('hi', 5)).toBe('hi'));
});
