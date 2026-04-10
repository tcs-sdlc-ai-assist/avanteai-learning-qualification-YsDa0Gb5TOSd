import api from './api';

/**
 * Uploads an evidence file (CSV or Excel) for parsing and preview.
 * @param {File} file - The evidence file to upload.
 * @param {function} [onUploadProgress] - Optional callback for upload progress tracking.
 * @returns {Promise<import('axios').AxiosResponse<{preview: Array<{employeeId: string, course: string, completionDate: string, status: string}>, duplicates: number, parsed: number, batchId: string}>>}
 */
export async function uploadEvidence(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('evidenceFile', file);

  const response = await api.post('/evidence/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress || undefined,
  });

  return response.data;
}

/**
 * Confirms a previously uploaded evidence batch for validation.
 * @param {string} batchId - The unique identifier of the evidence batch.
 * @returns {Promise<boolean>} Whether the confirmation was successful.
 */
export async function confirmEvidence(batchId) {
  const response = await api.post('/evidence/confirm', { batchId });
  return response.data;
}

/**
 * Retrieves a preview of parsed evidence rows for a given batch.
 * @param {string} batchId - The unique identifier of the evidence batch.
 * @returns {Promise<Array<{employeeId: string, course: string, completionDate: string, status: string}>>}
 */
export async function getPreview(batchId) {
  const response = await api.get(`/evidence/preview/${batchId}`);
  return response.data;
}

/**
 * Retrieves all evidence records associated with a specific batch.
 * @param {string} batchId - The unique identifier of the evidence batch.
 * @returns {Promise<Array<{evidenceId: number, batchId: string, employeeId: string, course: string, completionDate: string, status: string, confidence: string|null, createdAt: string}>>}
 */
export async function getEvidenceByBatch(batchId) {
  const response = await api.get(`/evidence/batch/${batchId}`);
  return response.data;
}

/**
 * Retrieves aggregate statistics for evidence records.
 * @returns {Promise<Record<string, number>>} A mapping of status names to their counts.
 */
export async function getEvidenceStats() {
  const response = await api.get('/evidence/stats');
  return response.data;
}

/**
 * Triggers validation of all evidence records in a batch.
 * @param {string} batchId - The unique identifier of the evidence batch to validate.
 * @returns {Promise<{validated: Array<{evidenceId: number, employeeId: string, confidence: string, status: string}>, exceptions: Array<{exceptionId: number, evidenceId: number, reason: string, slaDeadline: string}>}>}
 */
export async function validateEvidence(batchId) {
  const response = await api.post('/evidence/validate', { batchId });
  return response.data;
}

export default {
  uploadEvidence,
  confirmEvidence,
  getPreview,
  getEvidenceByBatch,
  getEvidenceStats,
  validateEvidence,
};