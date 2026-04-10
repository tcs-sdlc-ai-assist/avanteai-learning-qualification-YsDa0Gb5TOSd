import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatConfidenceScore,
  formatSlaRemaining,
  formatDuration,
  formatFileSize,
  truncateText,
  formatStatus,
  formatRelativeTime,
} from './formatters';

describe('formatDate', () => {
  it('formats a valid date string into a localized date', () => {
    const result = formatDate('2024-06-15T00:00:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date(2023, 0, 5));
    expect(result).toContain('Jan');
    expect(result).toContain('5');
    expect(result).toContain('2023');
  });

  it('returns "--" for null', () => {
    expect(formatDate(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatDate('')).toBe('--');
  });

  it('returns "--" for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('--');
  });

  it('accepts custom Intl options', () => {
    const result = formatDate('2024-03-01', { month: 'long' });
    expect(result).toContain('March');
  });
});

describe('formatDateTime', () => {
  it('formats a valid date string with time', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('returns "--" for null', () => {
    expect(formatDateTime(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatDateTime(undefined)).toBe('--');
  });

  it('returns "--" for invalid date', () => {
    expect(formatDateTime('invalid')).toBe('--');
  });
});

describe('formatNumber', () => {
  it('formats an integer with no decimals by default', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats a number with specified decimal places', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
  });

  it('formats a string number', () => {
    expect(formatNumber('9876', 0)).toBe('9,876');
  });

  it('returns "--" for null', () => {
    expect(formatNumber(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatNumber(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatNumber('')).toBe('--');
  });

  it('returns "--" for NaN string', () => {
    expect(formatNumber('abc')).toBe('--');
  });

  it('formats zero correctly', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatCurrency', () => {
  it('formats a number as USD by default', () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain('1,234.50');
    expect(result).toContain('$');
  });

  it('formats with custom currency', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toContain('100.00');
    expect(result).toContain('€');
  });

  it('returns "--" for null', () => {
    expect(formatCurrency(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatCurrency(undefined)).toBe('--');
  });

  it('returns "--" for non-numeric string', () => {
    expect(formatCurrency('abc')).toBe('--');
  });
});

describe('formatPercentage', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPercentage(0.85)).toBe('85%');
  });

  it('formats with decimal places', () => {
    expect(formatPercentage(0.8567, 2)).toBe('85.67%');
  });

  it('formats a value already in percent form', () => {
    expect(formatPercentage(85, 0, true)).toBe('85%');
  });

  it('returns "--" for null', () => {
    expect(formatPercentage(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatPercentage(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatPercentage('')).toBe('--');
  });

  it('returns "--" for non-numeric string', () => {
    expect(formatPercentage('abc')).toBe('--');
  });

  it('formats zero correctly', () => {
    expect(formatPercentage(0)).toBe('0%');
  });

  it('formats 100% correctly', () => {
    expect(formatPercentage(1.0)).toBe('100%');
  });

  it('parses a string number', () => {
    expect(formatPercentage('0.5')).toBe('50%');
  });
});

describe('formatConfidenceScore', () => {
  it('returns very high for score >= 0.9', () => {
    const result = formatConfidenceScore(0.95);
    expect(result.label).toBe('Very High');
    expect(result.level).toBe('very-high');
    expect(result.percentage).toBe('95.0%');
  });

  it('returns high for score >= 0.75', () => {
    const result = formatConfidenceScore(0.8);
    expect(result.label).toBe('High');
    expect(result.level).toBe('high');
    expect(result.percentage).toBe('80.0%');
  });

  it('returns medium for score >= 0.5', () => {
    const result = formatConfidenceScore(0.6);
    expect(result.label).toBe('Medium');
    expect(result.level).toBe('medium');
    expect(result.percentage).toBe('60.0%');
  });

  it('returns low for score >= 0.25', () => {
    const result = formatConfidenceScore(0.3);
    expect(result.label).toBe('Low');
    expect(result.level).toBe('low');
    expect(result.percentage).toBe('30.0%');
  });

  it('returns very low for score < 0.25', () => {
    const result = formatConfidenceScore(0.1);
    expect(result.label).toBe('Very Low');
    expect(result.level).toBe('very-low');
    expect(result.percentage).toBe('10.0%');
  });

  it('clamps values above 1 to 1', () => {
    const result = formatConfidenceScore(1.5);
    expect(result.percentage).toBe('100.0%');
    expect(result.label).toBe('Very High');
  });

  it('clamps values below 0 to 0', () => {
    const result = formatConfidenceScore(-0.5);
    expect(result.percentage).toBe('0.0%');
    expect(result.label).toBe('Very Low');
  });

  it('returns unknown for null', () => {
    const result = formatConfidenceScore(null);
    expect(result.label).toBe('Unknown');
    expect(result.percentage).toBe('--');
    expect(result.level).toBe('unknown');
  });

  it('returns unknown for undefined', () => {
    const result = formatConfidenceScore(undefined);
    expect(result.label).toBe('Unknown');
  });

  it('returns unknown for empty string', () => {
    const result = formatConfidenceScore('');
    expect(result.label).toBe('Unknown');
  });

  it('parses a string number', () => {
    const result = formatConfidenceScore('0.85');
    expect(result.label).toBe('High');
    expect(result.percentage).toBe('85.0%');
  });

  it('respects custom decimal places', () => {
    const result = formatConfidenceScore(0.876, 2);
    expect(result.percentage).toBe('87.60%');
  });
});

describe('formatSlaRemaining', () => {
  let nowSpy;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now');
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('returns remaining time for a future deadline', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const deadline = new Date('2024-06-17T12:00:00Z');
    const result = formatSlaRemaining(deadline);
    expect(result.isOverdue).toBe(false);
    expect(result.text).toBe('2d');
    expect(result.urgency).toBe('low');
  });

  it('returns overdue for a past deadline', () => {
    const now = new Date('2024-06-17T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const deadline = new Date('2024-06-15T12:00:00Z');
    const result = formatSlaRemaining(deadline);
    expect(result.isOverdue).toBe(true);
    expect(result.text).toContain('Overdue by');
    expect(result.urgency).toBe('critical');
  });

  it('returns critical urgency when less than 1 hour remains', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const deadline = new Date('2024-06-15T12:30:00Z');
    const result = formatSlaRemaining(deadline);
    expect(result.isOverdue).toBe(false);
    expect(result.urgency).toBe('critical');
  });

  it('returns high urgency when less than 4 hours remain', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const deadline = new Date('2024-06-15T14:00:00Z');
    const result = formatSlaRemaining(deadline);
    expect(result.isOverdue).toBe(false);
    expect(result.urgency).toBe('high');
  });

  it('returns medium urgency when less than 24 hours remain', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const deadline = new Date('2024-06-16T06:00:00Z');
    const result = formatSlaRemaining(deadline);
    expect(result.isOverdue).toBe(false);
    expect(result.urgency).toBe('medium');
  });

  it('handles milliseconds mode', () => {
    const result = formatSlaRemaining(7200000, true);
    expect(result.isOverdue).toBe(false);
    expect(result.text).toBe('2h');
  });

  it('handles negative milliseconds as overdue', () => {
    const result = formatSlaRemaining(-3600000, true);
    expect(result.isOverdue).toBe(true);
    expect(result.text).toContain('Overdue by');
  });

  it('returns "--" for null', () => {
    const result = formatSlaRemaining(null);
    expect(result.text).toBe('--');
    expect(result.isOverdue).toBe(false);
    expect(result.urgency).toBe('unknown');
  });

  it('returns "--" for undefined', () => {
    const result = formatSlaRemaining(undefined);
    expect(result.text).toBe('--');
  });

  it('returns "--" for empty string', () => {
    const result = formatSlaRemaining('');
    expect(result.text).toBe('--');
  });

  it('returns "--" for invalid date string', () => {
    const result = formatSlaRemaining('not-a-date');
    expect(result.text).toBe('--');
  });

  it('accepts a date string as deadline', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatSlaRemaining('2024-06-18T12:00:00Z');
    expect(result.isOverdue).toBe(false);
    expect(result.text).toBe('3d');
  });
});

describe('formatDuration', () => {
  it('formats days and hours', () => {
    const ms = 2 * 86400000 + 5 * 3600000;
    expect(formatDuration(ms)).toBe('2d 5h');
  });

  it('formats days only when no remaining hours', () => {
    expect(formatDuration(3 * 86400000)).toBe('3d');
  });

  it('formats hours and minutes', () => {
    const ms = 3 * 3600000 + 30 * 60000;
    expect(formatDuration(ms)).toBe('3h 30m');
  });

  it('formats hours only when no remaining minutes', () => {
    expect(formatDuration(2 * 3600000)).toBe('2h');
  });

  it('formats minutes only', () => {
    expect(formatDuration(45 * 60000)).toBe('45m');
  });

  it('returns "< 1m" for very short durations', () => {
    expect(formatDuration(500)).toBe('< 1m');
  });

  it('returns "< 1m" for zero', () => {
    expect(formatDuration(0)).toBe('< 1m');
  });

  it('returns "--" for negative values', () => {
    expect(formatDuration(-1000)).toBe('--');
  });

  it('returns "--" for NaN', () => {
    expect(formatDuration(NaN)).toBe('--');
  });

  it('returns "--" for non-number', () => {
    expect(formatDuration('abc')).toBe('--');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });

  it('formats with custom decimal places', () => {
    expect(formatFileSize(1536, 2)).toBe('1.50 KB');
  });

  it('returns "0 B" for zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('returns "--" for null', () => {
    expect(formatFileSize(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatFileSize(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatFileSize('')).toBe('--');
  });

  it('returns "--" for negative values', () => {
    expect(formatFileSize(-100)).toBe('--');
  });

  it('returns "--" for non-numeric string', () => {
    expect(formatFileSize('abc')).toBe('--');
  });

  it('parses a string number', () => {
    expect(formatFileSize('2048')).toBe('2.0 KB');
  });
});

describe('truncateText', () => {
  it('returns the full string if shorter than maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis when string exceeds maxLength', () => {
    expect(truncateText('Hello World, this is a long string', 10)).toBe('Hello Worl…');
  });

  it('returns the full string if exactly maxLength', () => {
    expect(truncateText('12345', 5)).toBe('12345');
  });

  it('uses default maxLength of 50', () => {
    const longStr = 'a'.repeat(60);
    const result = truncateText(longStr);
    expect(result).toHaveLength(51);
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns "--" for null', () => {
    expect(truncateText(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(truncateText(undefined)).toBe('--');
  });
});

describe('formatStatus', () => {
  it('formats underscore-separated status', () => {
    expect(formatStatus('IN_PROGRESS')).toBe('In Progress');
  });

  it('formats hyphen-separated status', () => {
    expect(formatStatus('pending-review')).toBe('Pending Review');
  });

  it('capitalizes single word', () => {
    expect(formatStatus('active')).toBe('Active');
  });

  it('returns "--" for null', () => {
    expect(formatStatus(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatStatus(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatStatus('')).toBe('--');
  });
});

describe('formatRelativeTime', () => {
  let nowSpy;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now');
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('returns "just now" for very recent times', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-06-15T11:59:50Z'));
    expect(result).toBe('just now');
  });

  it('returns minutes ago for recent past', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-06-15T11:55:00Z'));
    expect(result).toBe('5 minutes ago');
  });

  it('returns singular minute', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-06-15T11:59:00Z'));
    expect(result).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-06-15T09:00:00Z'));
    expect(result).toBe('3 hours ago');
  });

  it('returns days ago', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-06-13T12:00:00Z'));
    expect(result).toBe('2 days ago');
  });

  it('returns "in X days" for future dates', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-06-18T12:00:00Z'));
    expect(result).toBe('in 3 days');
  });

  it('returns weeks ago', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-05-25T12:00:00Z'));
    expect(result).toBe('3 weeks ago');
  });

  it('returns months ago', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2024-03-15T12:00:00Z'));
    expect(result).toBe('3 months ago');
  });

  it('returns years ago', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime(new Date('2022-06-15T12:00:00Z'));
    expect(result).toBe('2 years ago');
  });

  it('returns "--" for null', () => {
    expect(formatRelativeTime(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatRelativeTime('')).toBe('--');
  });

  it('returns "--" for invalid date string', () => {
    expect(formatRelativeTime('not-a-date')).toBe('--');
  });

  it('accepts a date string', () => {
    const now = new Date('2024-06-15T12:00:00Z').getTime();
    nowSpy.mockReturnValue(now);

    const result = formatRelativeTime('2024-06-14T12:00:00Z');
    expect(result).toBe('1 day ago');
  });
});