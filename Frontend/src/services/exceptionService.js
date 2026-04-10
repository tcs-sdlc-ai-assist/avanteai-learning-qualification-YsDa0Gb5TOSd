import api from './api';

/**
 * Fetches the exception queue with pagination and optional status filter.
 * @param {Object} params - Query parameters.
 * @param {number} [params.page=1] - Page number (1-based).
 * @param {number} [params.pageSize=25] - Number of items per page.
 * @param {string|null} [params.status=null] - Optional status filter (e.g., 'Pending', 'Approved').
 * @returns {Promise<{ exceptions: Array, total: number }>} The exception queue response.
 */
export async function getExceptionQueue({ page = 1, pageSize = 25, status = null } = {}) {
  try {
    const params = { page, pageSize };
    if (status) {
      params.status = status;
    }
    const response = await api.get('/exceptions/queue', { params });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to fetch exception queue.';
    throw new Error(message);
  }
}

/**
 * Processes an exception action (approve, override, or reject).
 * @param {number} exceptionId - The ID of the exception to process.
 * @param {Object} actionRequest - The action request payload.
 * @param {string} actionRequest.action - The action type: 'Approve', 'Override', or 'Reject'.
 * @param {string|null} [actionRequest.justification=null] - Required justification for override actions.
 * @returns {Promise<{ result: string, exceptionId: number }>} The exception action response.
 */
export async function processException(exceptionId, { action, justification = null }) {
  try {
    const payload = { action };
    if (justification) {
      payload.justification = justification;
    }
    const response = await api.post(`/exceptions/${exceptionId}/action`, payload);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to process exception action.';
    throw new Error(message);
  }
}

/**
 * Fetches exception statistics (counts by status, overdue SLA).
 * @returns {Promise<{ totalPending: number, totalApproved: number, totalOverridden: number, totalRejected: number, overdueSla: number }>} The exception stats response.
 */
export async function getExceptionStats() {
  try {
    const response = await api.get('/exceptions/stats');
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to fetch exception statistics.';
    throw new Error(message);
  }
}

export default {
  getExceptionQueue,
  processException,
  getExceptionStats,
};