import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { login as loginService, logout as logoutService, getCurrentUser, getToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getCurrentUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await loginService(email, password);

    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user);
    }

    return response;
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

  const role = useMemo(() => {
    if (!user) {
      return null;
    }
    return user.role || null;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      isAuthenticated,
      loading,
      login,
      logout,
    }),
    [user, token, role, isAuthenticated, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the authentication context.
 * Must be used within an AuthProvider.
 * @returns {{ user: object|null, token: string|null, role: string|null, isAuthenticated: boolean, loading: boolean, login: function, logout: function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}

export default AuthContext;