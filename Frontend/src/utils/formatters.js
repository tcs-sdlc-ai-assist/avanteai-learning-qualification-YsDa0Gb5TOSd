/**
 * Utility functions for formatting dates, numbers, percentages, confidence scores,
 * SLA remaining time, and file sizes for display in the UI.
 */

/**
 * Formats a date value into a localized date string.
 * @param {string | number | Date} value - The date value to format.
 * @param {object} [options] - Intl.DateTimeFormat options.
 * @returns {string} The formatted date string, or '--' if invalid.
 */
export function formatDate(value, options = {}) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '--';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch {
    return '--';
  }
}

/**
 * Formats a date value into a localized date and time string.
 * @param {string | number | Date} value - The date value to format.
 * @param {object} [options] - Intl.DateTimeFormat options.
 * @returns {string} The formatted date-time string, or '--' if invalid.
 */
export function formatDateTime(value, options = {}) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '--';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch {
    return '--';
  }
}

/**
 * Formats a number with locale-aware separators and optional decimal places.
 * @param {number | string} value - The number to format.
 * @param {number} [decimals=0] - Number of decimal places.
 * @returns {string} The formatted number string, or '--' if invalid.
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a currency value.
 * @param {number | string} value - The currency amount.
 * @param {string} [currency='USD'] - The ISO 4217 currency code.
 * @param {number} [decimals=2] - Number of decimal places.
 * @returns {string} The formatted currency string, or '--' if invalid.
 */
export function formatCurrency(value, currency = 'USD', decimals = 2) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formats a decimal value as a percentage string.
 * @param {number | string} value - The value to format (0.85 becomes "85%", or 85 becomes "85%" if already a whole number).
 * @param {number} [decimals=0] - Number of decimal places.
 * @param {boolean} [isAlreadyPercent=false] - If true, value is already in percent form (e.g., 85 instead of 0.85).
 * @returns {string} The formatted percentage string, or '--' if invalid.
 */
export function formatPercentage(value, decimals = 0, isAlreadyPercent = false) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return '--';
  }

  const percentValue = isAlreadyPercent ? num : num * 100;

  return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Formats a confidence score (0-1) into a human-readable label with percentage.
 * @param {number | string} value - The confidence score between 0 and 1.
 * @param {number} [decimals=1] - Number of decimal places for the percentage.
 * @returns {{ label: string, percentage: string, level: string }} An object with label, percentage, and level.
 */
export function formatConfidenceScore(value, decimals = 1) {
  const defaultResult = { label: 'Unknown', percentage: '--', level: 'unknown' };

  if (value === null || value === undefined || value === '') {
    return defaultResult;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return defaultResult;
  }

  const clamped = Math.max(0, Math.min(1, num));
  const percentage = `${(clamped * 100).toFixed(decimals)}%`;

  let label;
  let level;

  if (clamped >= 0.9) {
    label = 'Very High';
    level = 'very-high';
  } else if (clamped >= 0.75) {
    label = 'High';
    level = 'high';
  } else if (clamped >= 0.5) {
    label = 'Medium';
    level = 'medium';
  } else if (clamped >= 0.25) {
    label = 'Low';
    level = 'low';
  } else {
    label = 'Very Low';
    level = 'very-low';
  }

  return { label, percentage, level };
}

/**
 * Formats SLA remaining time from a deadline date or milliseconds remaining.
 * @param {string | number | Date} deadline - The SLA deadline as a date, or milliseconds remaining if number and isMilliseconds is true.
 * @param {boolean} [isMilliseconds=false] - If true, treat the value as milliseconds remaining.
 * @returns {{ text: string, isOverdue: boolean, urgency: string }} Formatted SLA info.
 */
export function formatSlaRemaining(deadline, isMilliseconds = false) {
  const overdueResult = { text: 'Overdue', isOverdue: true, urgency: 'critical' };
  const unknownResult = { text: '--', isOverdue: false, urgency: 'unknown' };

  if (deadline === null || deadline === undefined || deadline === '') {
    return unknownResult;
  }

  let remainingMs;

  if (isMilliseconds) {
    remainingMs = typeof deadline === 'string' ? parseFloat(deadline) : deadline;
    if (typeof remainingMs !== 'number' || isNaN(remainingMs)) {
      return unknownResult;
    }
  } else {
    try {
      const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return unknownResult;
      }
      remainingMs = deadlineDate.getTime() - Date.now();
    } catch {
      return unknownResult;
    }
  }

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    const overdueText = formatDuration(overdueMs);
    return { text: `Overdue by ${overdueText}`, isOverdue: true, urgency: 'critical' };
  }

  const text = formatDuration(remainingMs);
  let urgency;

  const oneHour = 3600000;
  const fourHours = 14400000;
  const twentyFourHours = 86400000;

  if (remainingMs < oneHour) {
    urgency = 'critical';
  } else if (remainingMs < fourHours) {
    urgency = 'high';
  } else if (remainingMs < twentyFourHours) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  return { text, isOverdue: false, urgency };
}

/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Human-readable duration string.
 */
export function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
    return '--';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days}d`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return '< 1m';
}

/**
 * Formats a file size in bytes into a human-readable string.
 * @param {number | string} bytes - The file size in bytes.
 * @param {number} [decimals=1] - Number of decimal places.
 * @returns {string} The formatted file size string, or '--' if invalid.
 */
export function formatFileSize(bytes, decimals = 1) {
  if (bytes === null || bytes === undefined || bytes === '') {
    return '--';
  }

  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;

  if (typeof num !== 'number' || isNaN(num) || num < 0) {
    return '--';
  }

  if (num === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const i = Math.floor(Math.log(num) / Math.log(k));
  const unitIndex = Math.min(i, units.length - 1);

  const size = num / Math.pow(k, unitIndex);

  if (unitIndex === 0) {
    return `${Math.round(size)} B`;
  }

  return `${size.toFixed(decimals)} ${units[unitIndex]}`;
}

/**
 * Truncates a string to a maximum length and appends an ellipsis.
 * @param {string} value - The string to truncate.
 * @param {number} [maxLength=50] - Maximum length before truncation.
 * @returns {string} The truncated string, or '--' if invalid.
 */
export function truncateText(value, maxLength = 50) {
  if (value === null || value === undefined) {
    return '--';
  }

  const str = String(value);

  if (str.length <= maxLength) {
    return str;
  }

  return `${str.slice(0, maxLength)}…`;
}

/**
 * Formats a compliance status string into a display-friendly format.
 * @param {string} status - The raw status string (e.g., 'IN_PROGRESS', 'pending_review').
 * @returns {string} The formatted status string, or '--' if invalid.
 */
export function formatStatus(status) {
  if (status === null || status === undefined || status === '') {
    return '--';
  }

  const str = String(status);

  return str
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats a relative time string (e.g., "2 hours ago", "in 3 days").
 * @param {string | number | Date} value - The date to compare against now.
 * @returns {string} The relative time string, or '--' if invalid.
 */
export function formatRelativeTime(value) {
  if (value === null || value === undefined || value === '') {
    return '--';
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '--';
    }

    const now = Date.now();
    const diffMs = date.getTime() - now;
    const absDiffMs = Math.abs(diffMs);

    const seconds = Math.floor(absDiffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let unit;
    let amount;

    if (years > 0) {
      unit = 'year';
      amount = years;
    } else if (months > 0) {
      unit = 'month';
      amount = months;
    } else if (weeks > 0) {
      unit = 'week';
      amount = weeks;
    } else if (days > 0) {
      unit = 'day';
      amount = days;
    } else if (hours > 0) {
      unit = 'hour';
      amount = hours;
    } else if (minutes > 0) {
      unit = 'minute';
      amount = minutes;
    } else {
      return 'just now';
    }

    const plural = amount !== 1 ? 's' : '';

    if (diffMs < 0) {
      return `${amount} ${unit}${plural} ago`;
    }

    return `in ${amount} ${unit}${plural}`;
  } catch {
    return '--';
  }
}