import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { getUnreadAlerts, markAlertsAsRead } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children, pollInterval = DEFAULT_POLL_INTERVAL }) {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const refreshAlerts = useCallback(async () => {
    if (!isAuthenticated) {
      setAlerts([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getUnreadAlerts();
      const data = response.data || response;
      const alertList = Array.isArray(data) ? data : [];

      if (mountedRef.current) {
        setAlerts(alertList);
        setUnreadCount(alertList.filter((a) => !a.read).length);
      }
    } catch (err) {
      if (mountedRef.current) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch notifications.';
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return;
    }

    try {
      setError(null);
      const response = await markAlertsAsRead(ids);
      const result = response.data || response;

      if (result.success !== false && mountedRef.current) {
        setAlerts((prev) => {
          const idSet = new Set(ids);
          return prev.map((alert) =>
            idSet.has(alert.id) ? { ...alert, read: true } : alert
          );
        });
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
      }
    } catch (err) {
      if (mountedRef.current) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to mark notifications as read.';
        setError(message);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setAlerts([]);
      setUnreadCount(0);
      setError(null);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    refreshAlerts();

    timerRef.current = setInterval(() => {
      refreshAlerts();
    }, pollInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, pollInterval, refreshAlerts]);

  const value = useMemo(
    () => ({
      alerts,
      unreadCount,
      loading,
      error,
      markAsRead,
      refreshAlerts,
    }),
    [alerts, unreadCount, loading, error, markAsRead, refreshAlerts]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  pollInterval: PropTypes.number,
};

/**
 * Custom hook to access the notification context.
 * Must be used within a NotificationProvider.
 * @returns {{ alerts: Array<{id: number, type: string, message: string, createdAt: string, read: boolean}>, unreadCount: number, loading: boolean, error: string|null, markAsRead: function, refreshAlerts: function }}
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider.');
  }
  return context;
}

export default NotificationContext;