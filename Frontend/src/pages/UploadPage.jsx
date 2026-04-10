import React, { useState, useCallback } from 'react';
import FileDropzone from '../components/FileDropzone';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { uploadEvidence, confirmEvidence, validateEvidence } from '../services/evidenceService';

const PREVIEW_COLUMNS = [
  {
    key: 'employeeId',
    label: 'Employee ID',
    sortable: true,
  },
  {
    key: 'course',
    label: 'Course',
    sortable: true,
  },
  {
    key: 'completionDate',
    label: 'Completion Date',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => <StatusBadge status={value || 'Unknown'} size="sm" />,
  },
];

export default function UploadPage() {
  const [uploadProgress, setUploadProgress] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileDrop = useCallback(async (file) => {
    setError(null);
    setSuccessMessage(null);
    setPreviewData([]);
    setBatchId(null);
    setParsedCount(0);
    setDuplicateCount(0);
    setIsConfirmed(false);
    setValidationResult(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadEvidence(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      setPreviewData(result.preview || []);
      setBatchId(result.batchId || null);
      setParsedCount(result.parsed || 0);
      setDuplicateCount(result.duplicates || 0);
      setUploadProgress(100);
      setSuccessMessage(
        `File uploaded successfully. ${result.parsed} record${result.parsed !== 1 ? 's' : ''} parsed, ${result.duplicates} duplicate${result.duplicates !== 1 ? 's' : ''} found.`
      );
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An error occurred while uploading the file.';
      setError(message);
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!batchId) {
      setError('No batch to confirm. Please upload a file first.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsConfirming(true);

    try {
      await confirmEvidence(batchId);
      setIsConfirmed(true);
      setSuccessMessage('Batch confirmed successfully. You can now validate the evidence records.');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An error occurred while confirming the batch.';
      setError(message);
    } finally {
      setIsConfirming(false);
    }
  }, [batchId]);

  const handleValidate = useCallback(async () => {
    if (!batchId) {
      setError('No batch to validate. Please upload and confirm a file first.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsValidating(true);

    try {
      const result = await validateEvidence(batchId);
      setValidationResult(result);

      const validatedCount = result.validated ? result.validated.length : 0;
      const exceptionCount = result.exceptions ? result.exceptions.length : 0;

      setSuccessMessage(
        `Validation complete. ${validatedCount} record${validatedCount !== 1 ? 's' : ''} processed, ${exceptionCount} exception${exceptionCount !== 1 ? 's' : ''} flagged.`
      );
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'An error occurred during validation.';
      setError(message);
    } finally {
      setIsValidating(false);
    }
  }, [batchId]);

  const hasPreview = previewData.length > 0;
  const canConfirm = hasPreview && batchId && !isConfirmed && !isConfirming && !isUploading;
  const canValidate = isConfirmed && batchId && !isValidating && !validationResult;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Evidence</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a CSV or Excel (.xlsx) file containing training evidence records for compliance validation.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <FileDropzone
          onDrop={handleFileDrop}
          uploadProgress={uploadProgress}
          disabled={isUploading || isConfirming || isValidating}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
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
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {hasPreview && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Parsed Preview</h2>
              <p className="text-sm text-gray-500">
                {parsedCount} record{parsedCount !== 1 ? 's' : ''} parsed
                {duplicateCount > 0 && (
                  <span className="ml-1 text-yellow-600">
                    ({duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''} detected)
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {canConfirm && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="btn-primary"
                >
                  {isConfirming ? (
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
                      Confirming...
                    </>
                  ) : (
                    'Confirm Batch'
                  )}
                </button>
              )}

              {isConfirmed && !validationResult && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <svg
                    className="h-3.5 w-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Confirmed
                </span>
              )}

              {canValidate && (
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="btn-primary"
                >
                  {isValidating ? (
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
                      Validating...
                    </>
                  ) : (
                    'Validate Evidence'
                  )}
                </button>
              )}
            </div>
          </div>

          <DataTable
            columns={PREVIEW_COLUMNS}
            data={previewData}
            pageSize={10}
            loading={isUploading}
            emptyMessage="No evidence records found in the uploaded file."
            keyField="employeeId"
          />
        </div>
      )}

      {validationResult && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Validation Results</h2>

          {validationResult.validated && validationResult.validated.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Validated Records ({validationResult.validated.length})
              </h3>
              <DataTable
                columns={[
                  { key: 'evidenceId', label: 'Evidence ID', sortable: true },
                  { key: 'employeeId', label: 'Employee ID', sortable: true },
                  {
                    key: 'confidence',
                    label: 'Confidence',
                    sortable: true,
                    render: (value) => {
                      const colorMap = {
                        High: 'text-green-700 bg-green-100',
                        Medium: 'text-yellow-700 bg-yellow-100',
                        Low: 'text-red-700 bg-red-100',
                      };
                      const classes = colorMap[value] || 'text-gray-700 bg-gray-100';
                      return (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
                          {value}
                        </span>
                      );
                    },
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    render: (value) => <StatusBadge status={value || 'Unknown'} size="sm" />,
                  },
                ]}
                data={validationResult.validated}
                pageSize={10}
                emptyMessage="No validated records."
                keyField="evidenceId"
              />
            </div>
          )}

          {validationResult.exceptions && validationResult.exceptions.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-red-700">
                Exceptions Flagged ({validationResult.exceptions.length})
              </h3>
              <DataTable
                columns={[
                  { key: 'exceptionId', label: 'Exception ID', sortable: true },
                  { key: 'evidenceId', label: 'Evidence ID', sortable: true },
                  { key: 'reason', label: 'Reason', sortable: false },
                  {
                    key: 'slaDeadline',
                    label: 'SLA Deadline',
                    sortable: true,
                    render: (value) => {
                      if (!value) return '—';
                      try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return '—';
                        return new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }).format(date);
                      } catch {
                        return '—';
                      }
                    },
                  },
                ]}
                data={validationResult.exceptions}
                pageSize={10}
                emptyMessage="No exceptions flagged."
                keyField="exceptionId"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}