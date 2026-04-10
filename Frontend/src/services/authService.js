import api from './api';

/**
 * Authenticates a user with email and password.
 * Stores the JWT token, refresh token, and user info in localStorage on success.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<{success: boolean, token: string, refreshToken: string, expiresAt: string, user: {id: string, firstName: string, lastName: string, email: string, role: string}, message?: string}>} The authentication response.
 */
export async function login(email, password) {
  try {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        success: false,
        token: '',
        refreshToken: '',
        expiresAt: '',
        user: { id: '', firstName: '', lastName: '', email: '', role: '' },
        message: error.response.data.message || 'Login failed. Please check your credentials.',
      };
    }
    throw error;
  }
}

/**
 * Registers a new user account.
 * Stores the JWT token, refresh token, and user info in localStorage on success.
 * @param {{ firstName: string, lastName: string, email: string, password: string, confirmPassword: string, role?: string }} params - Registration parameters.
 * @returns {Promise<{success: boolean, token: string, refreshToken: string, expiresAt: string, user: {id: string, firstName: string, lastName: string, email: string, role: string}, message?: string}>} The authentication response.
 */
export async function register({ firstName, lastName, email, password, confirmPassword, role }) {
  try {
    const response = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role: role || undefined,
    });
    const data = response.data;

    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        success: false,
        token: '',
        refreshToken: '',
        expiresAt: '',
        user: { id: '', firstName: '', lastName: '', email: '', role: '' },
        message: error.response.data.message || 'Registration failed. Please try again.',
      };
    }
    throw error;
  }
}

/**
 * Logs out the current user by clearing all auth-related data from localStorage.
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

/**
 * Returns the currently stored authentication token, or null if not authenticated.
 * @returns {string|null} The JWT token or null.
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Returns the currently stored user info, or null if not authenticated.
 * @returns {{ id: string, firstName: string, lastName: string, email: string, role: string }|null} The user info or null.
 */
export function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Checks whether a user is currently authenticated (has a stored token).
 * @returns {boolean} True if a token exists in localStorage.
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export default {
  login,
  register,
  logout,
  getToken,
  getCurrentUser,
  isAuthenticated,
};