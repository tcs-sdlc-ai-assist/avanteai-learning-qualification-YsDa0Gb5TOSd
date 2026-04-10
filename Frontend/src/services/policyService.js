import api from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Fetches all policies.
 * @returns {Promise<import('axios').AxiosResponse<Array<object>>>} The list of policies.
 */
export async function getPolicies() {
  try {
    const response = await api.get(API_ENDPOINTS.POLICIES.BASE);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    throw error;
  }
}

/**
 * Fetches a single policy by its ID.
 * @param {string} id - The policy UUID.
 * @returns {Promise<object>} The policy object.
 */
export async function getPolicyById(id) {
  try {
    const response = await api.get(API_ENDPOINTS.POLICIES.BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch policy ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new policy.
 * @param {object} data - The policy creation payload.
 * @param {string} data.programId - The parent program UUID.
 * @param {string} data.name - The policy name (max 100 chars).
 * @param {string} data.description - The policy description (max 500 chars).
 * @param {Array<{field: string, operator: string, value: string}>} data.rules - The policy rules.
 * @returns {Promise<object>} The created policy object.
 */
export async function createPolicy(data) {
  try {
    const response = await api.post(API_ENDPOINTS.POLICIES.BASE, data);
    return response.data;
  } catch (error) {
    console.error('Failed to create policy:', error);
    throw error;
  }
}

/**
 * Updates an existing policy. This creates a new version on the backend.
 * @param {string} id - The policy UUID.
 * @param {object} data - The policy update payload.
 * @param {string} data.name - The updated policy name.
 * @param {string} data.description - The updated policy description.
 * @param {Array<{field: string, operator: string, value: string}>} data.rules - The updated policy rules.
 * @returns {Promise<object>} The updated policy object.
 */
export async function updatePolicy(id, data) {
  try {
    const response = await api.put(API_ENDPOINTS.POLICIES.BY_ID(id), data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update policy ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a policy by its ID.
 * @param {string} id - The policy UUID.
 * @returns {Promise<void>}
 */
export async function deletePolicy(id) {
  try {
    await api.delete(API_ENDPOINTS.POLICIES.BY_ID(id));
  } catch (error) {
    console.error(`Failed to delete policy ${id}:`, error);
    throw error;
  }
}

/**
 * Fetches the version history for a specific policy.
 * @param {string} policyId - The policy UUID.
 * @returns {Promise<Array<object>>} The list of policy version objects.
 */
export async function getPolicyVersions(policyId) {
  try {
    const response = await api.get(API_ENDPOINTS.POLICIES.VERSIONS(policyId));
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch versions for policy ${policyId}:`, error);
    throw error;
  }
}

export default {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicyVersions,
};