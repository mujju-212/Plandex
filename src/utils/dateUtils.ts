// src/utils/dateUtils.ts

export type TimeFormatPreference = '12h' | '24h';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) return null;
  const [yearRaw, monthRaw, dayRaw] = dateValue.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeToLocalDate(dateValue: Date | string): Date | null {
  if (typeof dateValue === 'string') return parseLocalDate(dateValue);
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
}

function diffInDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS);
}

function diffInMonths(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function formatTimeString(
  timeValue: string | null | undefined,
  timeFormat: TimeFormatPreference = '24h',
): string {
  if (!timeValue) return 'All day';

  const trimmed = timeValue.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return trimmed;

  if (timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = ((hours + 11) % 12) + 1;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatDateLabel(
  dateValue: string | Date | null | undefined,
  preset: 'short' | 'medium' | 'long' = 'medium',
): string {
  const d = dateValue === null || dateValue === undefined
    ? null
    : typeof dateValue === 'string'
      ? parseLocalDate(dateValue)
      : new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());

  if (!d) return '';

  const options: Intl.DateTimeFormatOptions =
    preset === 'short'
      ? { month: 'short', day: 'numeric' }
      : preset === 'long'
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { weekday: 'short', month: 'short', day: 'numeric' };

  try {
    return new Intl.DateTimeFormat(undefined, options).format(d);
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export function formatDateTimeString(
  dateTimeValue: string | null | undefined,
  timeFormat: TimeFormatPreference = '24h',
): string {
  if (!dateTimeValue) return '';

  const isoIndex = dateTimeValue.indexOf('T');
  if (isoIndex >= 0) return formatTimeString(dateTimeValue.slice(isoIndex + 1, isoIndex + 6), timeFormat);

  const spaceIndex = dateTimeValue.indexOf(' ');
  if (spaceIndex >= 0) return formatTimeString(dateTimeValue.slice(spaceIndex + 1, spaceIndex + 6), timeFormat);

  return formatTimeString(dateTimeValue, timeFormat);
}

export type RecurringPatternLike = {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  end_date?: string;
};

export type EventLike = {
  start_datetime: string;
  end_datetime: string | null;
  is_recurring: boolean;
  recurring_pattern: RecurringPatternLike | null;
};

export function isEventOccurringOnDate(event: EventLike, dateValue: Date | string): boolean {
  const target = normalizeToLocalDate(dateValue);
  if (!target) return false;

  const startDateStr = (event.start_datetime || '').slice(0, 10);
  const start = parseLocalDate(startDateStr);
  if (!start) return false;

  if (event.is_recurring && event.recurring_pattern) {
    const { type, interval } = event.recurring_pattern;
    const safeInterval = Math.max(interval || 1, 1);
    const dayDelta = diffInDays(start, target);
    if (dayDelta < 0) return false;

    const endDate = parseLocalDate(event.recurring_pattern.end_date);
    if (endDate && target.getTime() > endDate.getTime()) return false;

    if (type === 'daily') return dayDelta % safeInterval === 0;
    if (type === 'weekly') return target.getDay() === start.getDay() && Math.floor(dayDelta / 7) % safeInterval === 0;
    if (type === 'monthly') {
      const monthDelta = diffInMonths(start, target);
      return monthDelta >= 0 && target.getDate() === start.getDate() && monthDelta % safeInterval === 0;
    }
  }

  const endDateStr = (event.end_datetime || event.start_datetime || '').slice(0, 10);
  const end = parseLocalDate(endDateStr) ?? start;
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
}

export function getEventOccurrenceStartDateTime(event: EventLike, dateValue: Date | string): string {
  const target = typeof dateValue === 'string' ? dateValue : [
    String(dateValue.getFullYear()).padStart(4, '0'),
    String(dateValue.getMonth() + 1).padStart(2, '0'),
    String(dateValue.getDate()).padStart(2, '0'),
  ].join('-');

  if (!event.is_recurring || !event.recurring_pattern) return event.start_datetime;

  const startDateStr = (event.start_datetime || '').slice(0, 10);
  if (startDateStr === target) return event.start_datetime;

  const tail = event.start_datetime.length > 10 ? event.start_datetime.slice(10) : '';
  return `${target}${tail}`;
}

export type HabitLike = {
  is_active: boolean;
  frequency_type: 'daily' | 'specific_days' | 'x_per_week';
  specific_days: number[];
  start_date: string;
  end_date: string | null;
};

export function isHabitDueOnDate(habit: HabitLike, dateValue: Date | string): boolean {
  if (!habit.is_active) return false;

  const target = normalizeToLocalDate(dateValue);
  if (!target) return false;

  const start = parseLocalDate(habit.start_date);
  if (start && target.getTime() < start.getTime()) return false;

  const end = parseLocalDate(habit.end_date);
  if (end && target.getTime() > end.getTime()) return false;

  if (habit.frequency_type === 'daily' || habit.frequency_type === 'x_per_week') return true;
  if (habit.frequency_type === 'specific_days') {
    const weekday = target.getDay() === 0 ? 7 : target.getDay();
    return Array.isArray(habit.specific_days) && habit.specific_days.includes(weekday);
  }
  return true;
}
