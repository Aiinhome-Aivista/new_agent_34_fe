/**
 * Global Date & Time Formatting Utilities for FraudOps AI.
 * Explicitly converts any UTC, ISO, epoch timestamp, or Date representation into Indian Standard Time (IST / UTC+05:30).
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
 * Parses any incoming date representation strictly as UTC unless an explicit timezone offset is provided.
 */
function parseAsUTC(input: string | number | Date): Date {
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === 'number') {
    // If number is in seconds (10 digits), convert to ms
    return new Date(input < 1e11 ? input * 1000 : input);
  }
  if (typeof input === 'string') {
    let s = input.trim();
    // Normalize SQL datetime string (e.g. "2026-10-28 07:02:27" -> "2026-10-28T07:02:27")
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:/.test(s)) {
      s = s.replace(/\s+/, 'T');
    }
    // If no timezone offset (no Z and no +/-HH:MM at the end), explicitly treat as UTC
    if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
      s += 'Z';
    }
    return new Date(s);
  }
  return new Date(NaN);
}

/**
 * Global function to format any date/time into Indian Standard Time (IST, UTC+05:30).
 * Explicitly converts UTC database/API timestamps to IST (+5:30).
 *
 * @param input Date, string, number, null, or undefined
 * @param options Formatting options
 * @returns Formatted IST string, e.g. "28/10/2026, 12:32:27 pm" or "12:32:27 pm"
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

  const date = parseAsUTC(input);

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
 * Convenience helper to format time only into IST (e.g. "12:32:27 pm").
 */
export function formatTimeToIST(
  input: string | number | Date | null | undefined,
  showSeconds = true
): string {
  return formatToIST(input, { timeOnly: true, includeSeconds: showSeconds });
}

/**
 * Convenience helper to format date only into IST (e.g. "28/10/2026").
 */
export function formatDateToIST(
  input: string | number | Date | null | undefined
): string {
  return formatToIST(input, { dateOnly: true });
}
