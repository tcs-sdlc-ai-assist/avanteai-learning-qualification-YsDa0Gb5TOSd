import api from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Fetches all compliance programs.
 * @returns {Promise<import('axios').AxiosResponse<Array<{id: string, name: string, description: string, status: string, createdAt: string}>>>}
 */
export async function getPrograms() {
  try {
    const response = await api.get(API_ENDPOINTS.PROGRAMS.BASE);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    throw error;
  }
}

/**
 * Fetches a single program by its ID.
 * @param {string} id - The program UUID.
 * @returns {Promise<{id: string, name: string, description: string, status: string, createdAt: string}>}
 */
export async function getProgramById(id) {
  try {
    const response = await api.get(API_ENDPOINTS.PROGRAMS.BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch program ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new compliance program.
 * @param {{ name: string, description: string, status?: string }} data - The program creation payload.
 * @returns {Promise<{id: string, name: string, description: string, status: string, createdAt: string}>}
 */
export async function createProgram(data) {
  try {
    const response = await api.post(API_ENDPOINTS.PROGRAMS.BASE, data);
    return response.data;
  } catch (error) {
    console.error('Failed to create program:', error);
    throw error;
  }
}

/**
 * Updates an existing compliance program.
 * @param {string} id - The program UUID.
 * @param {{ name: string, description: string, status: string }} data - The program update payload.
 * @returns {Promise<{id: string, name: string, description: string, status: string, createdAt: string}>}
 */
export async function updateProgram(id, data) {
  try {
    const response = await api.put(API_ENDPOINTS.PROGRAMS.BY_ID(id), data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update program ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a compliance program by its ID.
 * @param {string} id - The program UUID.
 * @returns {Promise<void>}
 */
export async function deleteProgram(id) {
  try {
    await api.delete(API_ENDPOINTS.PROGRAMS.BY_ID(id));
  } catch (error) {
    console.error(`Failed to delete program ${id}:`, error);
    throw error;
  }
}

export default {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
};