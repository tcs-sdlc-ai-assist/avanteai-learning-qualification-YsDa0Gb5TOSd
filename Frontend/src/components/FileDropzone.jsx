import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export function FileDropzone({
  onDrop,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = ACCEPTED_FILE_TYPES,
  uploadProgress = null,
  disabled = false,
}) {
  const [validationError, setValidationError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      setValidationError(null);
      setSelectedFile(null);

      if (fileRejections && fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errors = rejection.errors || [];
        if (errors.length > 0) {
          const firstError = errors[0];
          if (firstError.code === 'file-too-large') {
            setValidationError(
              `File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB.`
            );
          } else if (firstError.code === 'file-invalid-type') {
            setValidationError('Invalid file format. Only CSV or Excel (.xlsx) files are allowed.');
          } else {
            setValidationError(firstError.message || 'File rejected.');
          }
        } else {
          setValidationError('File rejected. Please upload a valid CSV or Excel file.');
        }
        return;
      }

      if (!acceptedFiles || acceptedFiles.length === 0) {
        setValidationError('No file selected. Please upload a CSV or Excel file.');
        return;
      }

      const file = acceptedFiles[0];
      setSelectedFile(file);

      if (onDrop) {
        try {
          onDrop(file);
        } catch (err) {
          setValidationError(err.message || 'An error occurred while processing the file.');
        }
      }
    },
    [onDrop, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept: acceptedTypes,
    maxSize,
    multiple: false,
    disabled,
  });

  const isUploading = uploadProgress !== null && uploadProgress >= 0 && uploadProgress < 100;
  const isComplete = uploadProgress === 100;

  const borderColor = validationError || isDragReject
    ? 'border-red-400'
    : isDragActive
      ? 'border-blue-500'
      : isComplete
        ? 'border-green-400'
        : 'border-gray-300';

  const bgColor = isDragActive && !isDragReject
    ? 'bg-blue-50'
    : isDragReject
      ? 'bg-red-50'
      : disabled
        ? 'bg-gray-100'
        : 'bg-white';

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors duration-200 ${borderColor} ${bgColor} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}`}
      >
        <input {...getInputProps()} />

        <svg
          className={`mb-3 h-10 w-10 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        {isDragActive && !isDragReject && (
          <p className="text-sm font-medium text-blue-600">Drop the file here...</p>
        )}

        {isDragReject && (
          <p className="text-sm font-medium text-red-600">This file type is not accepted.</p>
        )}

        {!isDragActive && !isDragReject && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Drag &amp; drop your evidence file here, or{' '}
              <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Accepted formats: CSV, Excel (.xlsx) — Max size: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        )}
      </div>

      {selectedFile && !validationError && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-gray-50 px-4 py-2">
          <svg
            className="h-5 w-5 flex-shrink-0 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="truncate text-sm text-gray-700">{selectedFile.name}</span>
          <span className="ml-auto text-xs text-gray-400">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
        </div>
      )}

      {isUploading && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {isComplete && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span>Upload complete</span>
        </div>
      )}

      {validationError && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
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
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

FileDropzone.propTypes = {
  onDrop: PropTypes.func.isRequired,
  maxSize: PropTypes.number,
  acceptedTypes: PropTypes.object,
  uploadProgress: PropTypes.number,
  disabled: PropTypes.bool,
};

export default FileDropzone;