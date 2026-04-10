import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

const THRESHOLDS = {
  GREEN: 4 * 60 * 60 * 1000,
  YELLOW: 1 * 60 * 60 * 1000,
};

function getColorClasses(remainingMs) {
  if (remainingMs <= 0) {
    return {
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500 dark:text-red-400',
    };
  }
  if (remainingMs < THRESHOLDS.YELLOW) {
    return {
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500 dark:text-red-400',
    };
  }
  if (remainingMs < THRESHOLDS.GREEN) {
    return {
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500 dark:text-yellow-400',
    };
  }
  return {
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500 dark:text-green-400',
  };
}

function formatRemaining(ms) {
  if (ms <= 0) {
    const absMs = Math.abs(ms);
    const totalSeconds = Math.floor(absMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    if (days > 0) {
      const remainingHours = totalHours % 24;
      return remainingHours > 0
        ? `Overdue by ${days}d ${remainingHours}h`
        : `Overdue by ${days}d`;
    }
    if (totalHours > 0) {
      const remainingMinutes = totalMinutes % 60;
      return remainingMinutes > 0
        ? `Overdue by ${totalHours}h ${remainingMinutes}m`
        : `Overdue by ${totalHours}h`;
    }
    if (totalMinutes > 0) {
      return `Overdue by ${totalMinutes}m`;
    }
    return 'Overdue';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    const remainingHours = totalHours % 24;
    return remainingHours > 0
      ? `${days}d ${remainingHours}h remaining`
      : `${days}d remaining`;
  }
  if (totalHours > 0) {
    const remainingMinutes = totalMinutes % 60;
    return remainingMinutes > 0
      ? `${totalHours}h ${remainingMinutes}m remaining`
      : `${totalHours}h remaining`;
  }
  if (totalMinutes > 0) {
    const remainingSeconds = totalSeconds % 60;
    return remainingSeconds > 0
      ? `${totalMinutes}m ${remainingSeconds}s remaining`
      : `${totalMinutes}m remaining`;
  }
  if (totalSeconds > 0) {
    return `${totalSeconds}s remaining`;
  }
  return '< 1s remaining';
}

function getUrgencyLabel(remainingMs) {
  if (remainingMs <= 0) return 'Overdue';
  if (remainingMs < THRESHOLDS.YELLOW) return 'Critical';
  if (remainingMs < THRESHOLDS.GREEN) return 'Warning';
  return 'On Track';
}

export function SLACountdown({ deadline, showIcon = true, compact = false }) {
  const [now, setNow] = useState(Date.now());

  const deadlineMs = useMemo(() => {
    if (deadline === null || deadline === undefined || deadline === '') {
      return null;
    }
    try {
      const date = deadline instanceof Date ? deadline : new Date(deadline);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.getTime();
    } catch {
      return null;
    }
  }, [deadline]);

  const getInterval = useCallback(() => {
    if (deadlineMs === null) return 60000;
    const remaining = deadlineMs - Date.now();
    if (remaining <= 0) return 60000;
    if (remaining < THRESHOLDS.YELLOW) return 1000;
    if (remaining < THRESHOLDS.GREEN) return 15000;
    return 60000;
  }, [deadlineMs]);

  useEffect(() => {
    if (deadlineMs === null) return;

    let timerId;

    const tick = () => {
      setNow(Date.now());
      const interval = getInterval();
      timerId = setTimeout(tick, interval);
    };

    const interval = getInterval();
    timerId = setTimeout(tick, interval);

    return () => {
      clearTimeout(timerId);
    };
  }, [deadlineMs, getInterval]);

  if (deadlineMs === null) {
    return (
      <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
        —
      </span>
    );
  }

  const remainingMs = deadlineMs - now;
  const colors = getColorClasses(remainingMs);
  const displayText = formatRemaining(remainingMs);
  const urgencyLabel = getUrgencyLabel(remainingMs);
  const isOverdue = remainingMs <= 0;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
        title={`SLA Deadline: ${new Date(deadlineMs).toLocaleString()}`}
      >
        {isOverdue && (
          <svg
            className={`h-3 w-3 ${colors.icon}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        )}
        {displayText}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${colors.bg} ${colors.border}`}
      title={`SLA Deadline: ${new Date(deadlineMs).toLocaleString()}`}
    >
      {showIcon && (
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {isOverdue ? (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
      )}
      <div className="flex flex-col">
        <span className={`text-sm font-medium leading-tight ${colors.text}`}>
          {displayText}
        </span>
        <span className={`text-xs leading-tight ${colors.text} opacity-75`}>
          {urgencyLabel}
        </span>
      </div>
    </div>
  );
}

SLACountdown.propTypes = {
  deadline: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
  showIcon: PropTypes.bool,
  compact: PropTypes.bool,
};

SLACountdown.defaultProps = {
  deadline: null,
  showIcon: true,
  compact: false,
};

export default SLACountdown;