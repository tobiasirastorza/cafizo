export function formatShortDate(
  value: Date | string | number,
  locale: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = new Intl.DateTimeFormat(locale, { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(date)
    .replace(/\./g, "")
    .toLowerCase();
  const year = new Intl.DateTimeFormat(locale, { year: "2-digit" }).format(date);

  return `${day} - ${month} - ${year}`;
}

export function parseWeekKey(weekKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekKey);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatWeekKeyLabel(weekKey: string, locale: string): string {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;
  return formatShortDate(parsed, locale);
}
