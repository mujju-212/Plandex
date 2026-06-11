import type { Todo } from '../types/todo.types';

type TodoDateLike = Pick<
  Todo,
  | 'date_type'
  | 'start_date'
  | 'end_date'
  | 'is_recurring'
  | 'recurring_type'
  | 'recurring_interval'
  | 'recurring_end_date'
>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) return null;

  const [yearRaw, monthRaw, dayRaw] = dateValue.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDate(dateValue: Date | string): Date | null {
  if (typeof dateValue === 'string') {
    return parseLocalDate(dateValue);
  }

  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
}

function diffInDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS);
}

function diffInMonths(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function isTodoScheduledForDate(todo: TodoDateLike, dateValue: Date | string): boolean {
  const target = normalizeDate(dateValue);
  const start = parseLocalDate(todo.start_date);

  if (!target || !start) return false;

  if (todo.is_recurring && todo.recurring_type) {
    const recurringEnd = parseLocalDate(todo.recurring_end_date);
    const interval = Math.max(todo.recurring_interval ?? 1, 1);
    const dayDelta = diffInDays(start, target);

    if (dayDelta < 0) return false;
    if (recurringEnd && target.getTime() > recurringEnd.getTime()) return false;

    if (todo.recurring_type === 'daily') {
      return dayDelta % interval === 0;
    }

    if (todo.recurring_type === 'weekly') {
      return target.getDay() === start.getDay() && Math.floor(dayDelta / 7) % interval === 0;
    }

    if (todo.recurring_type === 'monthly') {
      const monthDelta = diffInMonths(start, target);
      return monthDelta >= 0 && target.getDate() === start.getDate() && monthDelta % interval === 0;
    }
  }

  if (todo.date_type === 'range' || todo.date_type === 'week' || todo.date_type === 'month') {
    const end = parseLocalDate(todo.end_date) ?? start;
    return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
  }

  if (todo.date_type === 'single') {
    return target.getTime() === start.getTime();
  }

  return false;
}
