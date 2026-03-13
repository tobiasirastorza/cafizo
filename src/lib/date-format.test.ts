import { formatShortDate, formatWeekKeyLabel, parseWeekKey } from '@/lib/date-format';

describe('date-format', () => {
  it('formats short dates with lowercase month abbreviations', () => {
    expect(formatShortDate('2026-03-09T15:45:00.000Z', 'en-US')).toBe('09 - mar - 26');
  });

  it('returns an empty string when the input cannot be parsed', () => {
    expect(formatShortDate('not-a-date', 'en-US')).toBe('');
  });

  it('parses week keys and formats labels from them', () => {
    const parsed = parseWeekKey('2026-03-08');

    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(2);
    expect(parsed?.getDate()).toBe(8);
    expect(formatWeekKeyLabel('2026-03-08', 'en-US')).toBe('08 - mar - 26');
  });

  it('keeps the original label when the week key shape is invalid', () => {
    expect(parseWeekKey('2026/03/08')).toBeNull();
    expect(formatWeekKeyLabel('week-12', 'en-US')).toBe('week-12');
  });
});
