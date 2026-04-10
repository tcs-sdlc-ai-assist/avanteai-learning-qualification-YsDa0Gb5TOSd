import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Modal } from './Modal';

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const isDisabled = loading || isProcessing;

  const handleConfirm = useCallback(async () => {
    if (isDisabled) return;

    try {
      setIsProcessing(true);
      await onConfirm();
    } catch {
      // Error handling is the caller's responsibility
    } finally {
      setIsProcessing(false);
    }
  }, [onConfirm, isDisabled]);

  const handleCancel = useCallback(() => {
    if (isDisabled) return;
    onCancel();
  }, [onCancel, isDisabled]);

  const confirmButtonStyles = {
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning:
      'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  };

  const iconColors = {
    danger: 'text-red-600',
    warning: 'text-yellow-500',
    primary: 'text-blue-600',
  };

  const iconBgColors = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    primary: 'bg-blue-100',
  };

  const buttonStyle = confirmButtonStyles[variant] || confirmButtonStyles.danger;
  const iconColor = iconColors[variant] || iconColors.danger;
  const iconBgColor = iconBgColors[variant] || iconBgColors.danger;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title}>
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBgColor}`}
        >
          {variant === 'danger' ? (
            <svg
              className={`h-6 w-6 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          ) : variant === 'warning' ? (
            <svg
              className={`h-6 w-6 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          ) : (
            <svg
              className={`h-6 w-6 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          )}
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isDisabled}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDisabled}
          className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyle}`}
        >
          {isDisabled && (
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning', 'primary']),
  loading: PropTypes.bool,
};

export default ConfirmDialog;