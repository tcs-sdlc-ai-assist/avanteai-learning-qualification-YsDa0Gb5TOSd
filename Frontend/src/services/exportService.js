import api from './api';

/**
 * Exports filtered compliance data in the requested format (CSV or JSON).
 * Triggers a file download in the browser via blob response.
 *
 * @param {Object} params - Export parameters.
 * @param {string} params.from - Start date in ISO 8601 format (e.g., '2024-06-01').
 * @param {string} params.to - End date in ISO 8601 format (e.g., '2024-06-10').
 * @param {string} params.format - Export format: 'Csv' or 'Json'.
 * @param {string} [params.status] - Optional status filter (e.g., 'approved', 'pending').
 * @param {string} [params.entity] - Optional entity filter (e.g., 'Evidence', 'Exception').
 * @returns {Promise<void>} Resolves when the file download has been triggered.
 */
export async function exportData({ from, to, format, status, entity }) {
  const params = {
    from,
    to,
    format,
  };

  if (status) {
    params.status = status;
  }

  if (entity) {
    params.entity = entity;
  }

  const response = await api.get('/export', {
    params,
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let fileName = `export_${from}_${to}`;

  if (format === 'Csv') {
    fileName += '.csv';
  } else if (format === 'Json') {
    fileName += '.json';
  } else {
    fileName += '.dat';
  }

  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/i);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1].trim();
    }
  }

  const contentType =
    response.headers['content-type'] || (format === 'Csv' ? 'text/csv' : 'application/json');

  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Fetches export metadata without triggering a file download.
 * Useful for previewing export details (record count, file size, etc.).
 *
 * @param {Object} params - Export parameters.
 * @param {string} params.from - Start date in ISO 8601 format.
 * @param {string} params.to - End date in ISO 8601 format.
 * @param {string} params.format - Export format: 'Csv' or 'Json'.
 * @param {string} [params.status] - Optional status filter.
 * @param {string} [params.entity] - Optional entity filter.
 * @returns {Promise<Object>} The export metadata response.
 */
export async function getExportMetadata({ from, to, format, status, entity }) {
  const params = {
    from,
    to,
    format,
  };

  if (status) {
    params.status = status;
  }

  if (entity) {
    params.entity = entity;
  }

  const response = await api.get('/export/metadata', {
    params,
  });

  return response.data;
}

export default {
  exportData,
  getExportMetadata,
};