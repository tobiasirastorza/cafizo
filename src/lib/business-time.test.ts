import {
  BUSINESS_TIMEZONE,
  getBusinessDateParts,
  getBusinessDayIndex,
  getBusinessWeekKey,
  getPreviousBusinessWeekKey,
  isSameBusinessDate,
} from '@/lib/business-time';

describe('business-time', () => {
  it('derives business date parts for the Cordoba timezone', () => {
    const date = new Date('2026-03-09T13:00:00.000Z');

    expect(getBusinessDateParts(date)).toEqual({
      year: 2026,
      month: 3,
      day: 9,
      weekdayIndex: 2,
    });
    expect(getBusinessDayIndex(date)).toBe(2);
  });

  it('builds current and previous business week keys from the same business week start', () => {
    const date = new Date('2026-03-11T18:00:00.000Z');

    expect(getBusinessWeekKey(date, BUSINESS_TIMEZONE)).toBe('2026-03-08');
    expect(getPreviousBusinessWeekKey(date, BUSINESS_TIMEZONE)).toBe('2026-03-01');
  });

  it('treats two timestamps on the same business day as equal even across UTC boundaries', () => {
    const a = new Date('2026-03-10T02:15:00.000Z');
    const b = new Date('2026-03-09T23:30:00-03:00');

    expect(isSameBusinessDate(a, b)).toBe(true);
    expect(isSameBusinessDate(a, new Date('2026-03-11T03:30:00.000Z'))).toBe(false);
  });
});
