import api from './api';

/**
 * Fetches the dashboard summary metrics for the current user's role.
 * @param {string} [userRole] - Optional role to filter summary data.
 * @returns {Promise<import('../../Backend/DTOs/DashboardDto').DashboardSummaryResponse>} The dashboard summary data.
 */
export async function getSummary(userRole) {
  try {
    const params = {};
    if (userRole) {
      params.userRole = userRole;
    }
    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to fetch dashboard summary.';
    throw new Error(message);
  }
}

/**
 * Fetches exception trend data for a given date range.
 * @param {string} from - Start date in ISO 8601 format (e.g., '2024-06-01').
 * @param {string} to - End date in ISO 8601 format (e.g., '2024-06-10').
 * @returns {Promise<import('../../Backend/DTOs/DashboardDto').ExceptionTrendResponse>} The exception trend data.
 */
export async function getExceptionTrends(from, to) {
  try {
    const params = {};
    if (from) {
      params.from = from;
    }
    if (to) {
      params.to = to;
    }
    const response = await api.get('/dashboard/exceptions', { params });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to fetch exception trends.';
    throw new Error(message);
  }
}

/**
 * Fetches operational metrics for the current user's role.
 * @param {string} [userRole] - Optional role to filter operational metrics.
 * @returns {Promise<import('../../Backend/DTOs/DashboardDto').OperationalMetricsResponse>} The operational metrics data.
 */
export async function getOperationalMetrics(userRole) {
  try {
    const params = {};
    if (userRole) {
      params.userRole = userRole;
    }
    const response = await api.get('/dashboard/operational-metrics', { params });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to fetch operational metrics.';
    throw new Error(message);
  }
}

export default {
  getSummary,
  getExceptionTrends,
  getOperationalMetrics,
};