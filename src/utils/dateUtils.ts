/**
 * Global Date & Time Formatting Utilities for FraudOps AI.
 * Converts any UTC, ISO, epoch timestamp, or Date representation into Indian Standard Time (IST / UTC+05:30).
 */

export interface FormatISTOptions {
  /** Include time component (default: true) */
  includeTime?: boolean;
  /** Include seconds in time component (default: true) */
  includeSeconds?: boolean;
  /** Display only the date component (e.g. DD/MM/YYYY) */
  dateOnly?: boolean;
  /** Display only the time component (e.g. HH:MM:SS AM/PM) */
  timeOnly?: boolean;
  /** Append "IST" suffix to string (default: false) */
  showTimezone?: boolean;
  /** Custom fallback string when value is null, undefined, or empty */
  fallback?: string;
}

/**
 * Global function to format any date/time into Indian Standard Time (IST, UTC+05:30).
 * Handles:
 * - UTC ISO strings with 'Z' (e.g. '2026-10-28T05:30:00Z')
 * - UTC ISO strings with offset (e.g. '2026-10-28T05:30:00+00:00')
 * - Naive ISO strings from backend / MySQL (e.g. '2026-10-28T11:00:00')
 * - Date instances (e.g. new Date())
 * - Epoch timestamps in milliseconds or seconds
 * - Null, undefined, empty strings
 *
 * @param input Date, string, number, null, or undefined
 * @param options Formatting options
 * @returns Formatted IST string, e.g. "28/10/2026, 11:00:00 am" or "11:00:00 am"
 */
export function formatToIST(
  input: string | number | Date | null | undefined,
  options: FormatISTOptions = {}
): string {
  const {
    includeTime = true,
    includeSeconds = true,
    dateOnly = false,
    timeOnly = false,
    showTimezone = false,
    fallback = '—',
  } = options;

  if (input === null || input === undefined || input === '') {
    return fallback;
  }

  let date: Date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'number') {
    // If number is in seconds (10 digits), convert to ms
    date = new Date(input < 1e11 ? input * 1000 : input);
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return fallback;
    date = new Date(trimmed);
  } else {
    return fallback;
  }

  if (isNaN(date.getTime())) {
    return fallback;
  }

  // Format explicitly in Asia/Kolkata timezone (IST / GMT+5:30)
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour12: true,
  };

  if (timeOnly) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    if (includeSeconds) {
      formatOptions.second = '2-digit';
    }
  } else if (dateOnly) {
    formatOptions.day = '2-digit';
    formatOptions.month = '2-digit';
    formatOptions.year = 'numeric';
  } else {
    formatOptions.day = '2-digit';
    formatOptions.month = '2-digit';
    formatOptions.year = 'numeric';
    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
    }
  }

  try {
    const formatted = new Intl.DateTimeFormat('en-IN', formatOptions).format(date);
    return showTimezone ? `${formatted} IST` : formatted;
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Convenience helper to format time only into IST (e.g. "12:38:43 pm").
 */
export function formatTimeToIST(
  input: string | number | Date | null | undefined,
  showSeconds = true
): string {
  return formatToIST(input, { timeOnly: true, includeSeconds: showSeconds });
}

/**
 * Convenience helper to format date only into IST (e.g. "26/10/2026").
 */
export function formatDateToIST(
  input: string | number | Date | null | undefined
): string {
  return formatToIST(input, { dateOnly: true });
}
