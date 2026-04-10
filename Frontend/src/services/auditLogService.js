import api from './api';

/**
 * Query parameters for fetching audit logs.
 * @typedef {Object} AuditLogQueryParams
 * @property {string} [entity] - Filter by entity type (e.g., "Evidence", "Policy", "Exception").
 * @property {number} [entityId] - Filter by entity ID.
 * @property {string} [action] - Filter by action type (e.g., "Create", "Update", "Delete", "Approve").
 * @property {string} [user] - Filter by user name.
 * @property {string} [from] - Start date (ISO 8601 string).
 * @property {string} [to] - End date (ISO 8601 string).
 * @property {number} [page] - Page number (1-based, default: 1).
 * @property {number} [pageSize] - Number of items per page (default: 50, max: 200).
 */

/**
 * A single audit log entry.
 * @typedef {Object} AuditLogEntry
 * @property {number} id
 * @property {string} entity
 * @property {number} entityId
 * @property {string} action
 * @property {string} user
 * @property {string} timestamp
 * @property {string|null} details
 */

/**
 * Paged response for audit log queries.
 * @typedef {Object} AuditLogPagedResponse
 * @property {AuditLogEntry[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

/**
 * Fetches audit log entries with optional filtering and pagination.
 * @param {AuditLogQueryParams} [params={}] - Query parameters for filtering and pagination.
 * @returns {Promise<AuditLogPagedResponse>} The paged audit log response.
 */
export async function getAuditLogs(params = {}) {
  const queryParams = {};

  if (params.entity) {
    queryParams.entity = params.entity;
  }
  if (params.entityId !== undefined && params.entityId !== null) {
    queryParams.entityId = params.entityId;
  }
  if (params.action) {
    queryParams.action = params.action;
  }
  if (params.user) {
    queryParams.user = params.user;
  }
  if (params.from) {
    queryParams.from = params.from;
  }
  if (params.to) {
    queryParams.to = params.to;
  }
  if (params.page !== undefined && params.page !== null) {
    queryParams.page = params.page;
  }
  if (params.pageSize !== undefined && params.pageSize !== null) {
    queryParams.pageSize = params.pageSize;
  }

  const response = await api.get('/auditlog', { params: queryParams });
  return response.data;
}

export default {
  getAuditLogs,
};