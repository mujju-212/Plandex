// src/utils/validationUtils.ts

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Check that a required string field is non-empty after trimming */
export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

/** Validate a string does not exceed max length */
export function validateMaxLength(value: string | null | undefined, max: number, fieldName: string): string | null {
  if (value && value.length > max) return `${fieldName} must be at most ${max} characters`;
  return null;
}

/** Validate a number is within range (inclusive) */
export function validateRange(value: number | null | undefined, min: number, max: number, fieldName: string): string | null {
  if (value == null) return null;
  if (value < min || value > max) return `${fieldName} must be between ${min} and ${max}`;
  return null;
}

/** Validate a rating value (1-5 or 1-10) */
export function validateRating(value: number | null | undefined, fieldName: string, maxRating = 5): string | null {
  return validateRange(value, 1, maxRating, fieldName);
}

/** Validate a date string is in YYYY-MM-DD format and represents a valid date */
export function validateDateString(value: string | null | undefined, fieldName: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return `${fieldName} must be in YYYY-MM-DD format`;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) {
    return `${fieldName} is not a valid date`;
  }
  return null;
}

/** Validate an ISO datetime string */
export function validateDatetime(value: string | null | undefined, fieldName: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return `${fieldName} is not a valid date/time`;
  return null;
}

/** Validate end is after start */
export function validateDateOrder(start: string | null | undefined, end: string | null | undefined, startLabel = 'Start', endLabel = 'End'): string | null {
  if (!start || !end) return null;
  if (new Date(end).getTime() <= new Date(start).getTime()) {
    return `${endLabel} must be after ${startLabel}`;
  }
  return null;
}

/** Sanitize a string: trim whitespace, collapse multiple spaces, remove control characters */
export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars (keep \n, \r, \t)
    .replace(/  +/g, ' ');
}

/** Run multiple validation checks and collect errors */
export function validate(...checks: (string | null)[]): ValidationResult {
  const errors = checks.filter((e): e is string => e !== null);
  return { valid: errors.length === 0, errors };
}
