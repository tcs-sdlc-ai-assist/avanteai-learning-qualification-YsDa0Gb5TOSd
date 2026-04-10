import api from './api';

/**
 * Fetches all unread notifications/alerts for the current user.
 * @returns {Promise<import('axios').AxiosResponse<Array<{id: number, type: string, message: string, createdAt: string, read: boolean}>>>}
 */
export async function getUnreadAlerts() {
  const response = await api.get('/notifications/unread');
  return response;
}

/**
 * Marks the specified notification/alert IDs as read.
 * @param {number[]} ids - Array of notification IDs to mark as read.
 * @returns {Promise<import('axios').AxiosResponse<{success: boolean}>>}
 */
export async function markAlertsAsRead(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { data: { success: false } };
  }
  const response = await api.post('/notifications/mark-read', { ids });
  return response;
}

export default {
  getUnreadAlerts,
  markAlertsAsRead,
};