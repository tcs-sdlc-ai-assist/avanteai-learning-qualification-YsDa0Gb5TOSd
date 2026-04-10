import React, { useState, useCallback } from 'react';
import { exportData } from '../services/exportService';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Validated', label: 'Validated' },
  { value: 'Flagged', label: 'Flagged' },
  { value: 'Rejected', label: 'Rejected' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'Evidence', label: 'Evidence' },
  { value: 'Exception', label: 'Exception' },
  { value: 'Policy', label: 'Policy' },
  { value: 'Program', label: 'Program' },
];

const FORMAT_OPTIONS = [
  { value: 'Csv', label: 'CSV (.csv)' },
  { value: 'Json', label: 'JSON (.json)' },
];

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function getDefaultToDate() {
  return new Date().toISOString().split('T')[0];
}

export function ExportCenterPage() {
  const [fromDate, setFromDate] = useState(getDefaultFromDate);
  const [toDate, setToDate] = useState(getDefaultToDate);
  const [status, setStatus] = useState('');
  const [entity, setEntity] = useState('');
  const [format, setFormat] = useState('Csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const validate = useCallback(() => {
    if (!fromDate) {
      return 'Start date is required.';
    }
    if (!toDate) {
      return 'End date is required.';
    }
    if (new Date(fromDate) > new Date(toDate)) {
      return "'From' date must be less than or equal to 'To' date.";
    }
    return null;
  }, [fromDate, toDate]);

  const handleExport = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await exportData({
        from: fromDate,
        to: toDate,
        format,
        status: status || undefined,
        entity: entity || undefined,
      });

      setSuccess(`Export downloaded successfully as ${format === 'Csv' ? 'CSV' : 'JSON'}.`);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'An error occurred while generating the export.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, format, status, entity, validate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Export compliance data in CSV or JSON format. Select filters to narrow your export.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleExport} className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="export-from" className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                id="export-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="export-to" className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                id="export-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="export-status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="export-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="export-entity" className="block text-sm font-medium text-gray-700">
                Entity Type
              </label>
              <select
                id="export-entity"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              >
                {ENTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Export Format</label>
            <div className="mt-2 flex gap-4">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    format === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={opt.value}
                    checked={format === opt.value}
                    onChange={(e) => setFormat(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0"
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
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
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
                  Generating Export…
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download Export
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Section */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700">Export Information</h3>
        <ul className="mt-2 space-y-1 text-xs text-gray-500">
          <li>• Exports include evidence records matching the selected filters.</li>
          <li>• CSV exports can be opened in Excel or Google Sheets.</li>
          <li>• JSON exports are suitable for programmatic processing.</li>
          <li>• Large date ranges may take longer to generate.</li>
          <li>• All exports are logged in the audit trail for compliance tracking.</li>
        </ul>
      </div>
    </div>
  );
}

export default ExportCenterPage;