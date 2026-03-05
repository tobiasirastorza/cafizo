export const BUSINESS_TIMEZONE = "America/Argentina/Cordoba";

type BusinessDateParts = {
  year: number;
  month: number;
  day: number;
  weekdayIndex: number;
};

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

function formatDateKeyFromUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function getBusinessDateParts(
  date: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): BusinessDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const weekdayIndex = WEEKDAY_TO_INDEX[weekday] ?? 1;

  return { year, month, day, weekdayIndex };
}

export function getBusinessDayIndex(
  date: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): number {
  return getBusinessDateParts(date, timeZone).weekdayIndex;
}

function getBusinessWeekStartUtcDate(
  date: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): Date {
  const parts = getBusinessDateParts(date, timeZone);
  const start = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  start.setUTCDate(start.getUTCDate() - (parts.weekdayIndex - 1));
  return start;
}

export function getBusinessWeekKey(
  date: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  return formatDateKeyFromUtcDate(getBusinessWeekStartUtcDate(date, timeZone));
}

export function getPreviousBusinessWeekKey(
  date: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): string {
  const previous = getBusinessWeekStartUtcDate(date, timeZone);
  previous.setUTCDate(previous.getUTCDate() - 7);
  return formatDateKeyFromUtcDate(previous);
}

export function isSameBusinessDate(
  a: Date,
  b: Date,
  timeZone: string = BUSINESS_TIMEZONE,
): boolean {
  const first = getBusinessDateParts(a, timeZone);
  const second = getBusinessDateParts(b, timeZone);
  return first.year === second.year && first.month === second.month && first.day === second.day;
}
