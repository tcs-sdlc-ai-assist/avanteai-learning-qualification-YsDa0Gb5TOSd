import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSummary, getExceptionTrends, getOperationalMetrics } from '../services/dashboardService';
import ComplianceChart from '../components/ComplianceChart';
import ExceptionTrendChart from '../components/ExceptionTrendChart';
import SkeletonLoader from '../components/SkeletonLoader';
import { formatPercentage, formatNumber, formatDateTime } from '../utils/formatters';

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function SummaryCard({ label, value, icon, color, subtext }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtext}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-opacity-10 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { role } = useAuth();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(null);

  const dateRange = useMemo(() => getDefaultDateRange(), []);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await getSummary(role || undefined);
      setSummary(data);
    } catch (err) {
      setSummaryError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setSummaryLoading(false);
    }
  }, [role]);

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const data = await getExceptionTrends(dateRange.from, dateRange.to);
      setTrends(data);
    } catch (err) {
      setTrendsError(err.message || 'Failed to load exception trends.');
    } finally {
      setTrendsLoading(false);
    }
  }, [dateRange]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const data = await getOperationalMetrics(role || undefined);
      setMetrics(data);
    } catch (err) {
      setMetricsError(err.message || 'Failed to load operational metrics.');
    } finally {
      setMetricsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchSummary();
    fetchTrends();
    fetchMetrics();
  }, [fetchSummary, fetchTrends, fetchMetrics]);

  const complianceChartData = useMemo(() => {
    if (!summary) return null;
    const validated = summary.totalEvidence - summary.exceptionsOpen - summary.pendingCount;
    return {
      validated: Math.max(0, validated),
      flagged: summary.exceptionsOpen || 0,
      pending: summary.pendingCount || 0,
    };
  }, [summary]);

  const trendData = useMemo(() => {
    if (!trends || !trends.trend) return [];
    return trends.trend;
  }, [trends]);

  const getMetricValue = useCallback(
    (metricName) => {
      if (!metrics || !metrics.metrics) return null;
      const found = metrics.metrics.find((m) => m.metricName === metricName);
      return found ? found.value : null;
    },
    [metrics]
  );

  const isLoading = summaryLoading && trendsLoading && metricsLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonLoader variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonLoader variant="chart" />
          <SkeletonLoader variant="chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Compliance overview and operational metrics
          {role && (
            <span className="ml-1 text-gray-400 dark:text-gray-500">
              — {role} view
            </span>
          )}
        </p>
      </div>

      {summaryError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{summaryError}</p>
            <button
              type="button"
              onClick={fetchSummary}
              className="ml-auto text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          <div className="col-span-full">
            <SkeletonLoader variant="card" count={4} />
          </div>
        ) : summary ? (
          <>
            <SummaryCard
              label="Compliance Rate"
              value={formatPercentage(summary.complianceRate, 1)}
              color="text-green-600"
              subtext={`${formatNumber(summary.totalEvidence)} total evidence records`}
              icon={
                <svg
                  className="h-6 w-6 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <SummaryCard
              label="Total Evidence"
              value={formatNumber(summary.totalEvidence)}
              color="text-blue-600"
              subtext={`${formatNumber(summary.pendingCount)} pending review`}
              icon={
                <svg
                  className="h-6 w-6 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              }
            />
            <SummaryCard
              label="Open Exceptions"
              value={formatNumber(summary.exceptionsOpen)}
              color="text-yellow-600"
              subtext={`${formatNumber(summary.exceptionsResolved)} resolved`}
              icon={
                <svg
                  className="h-6 w-6 text-yellow-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              }
            />
            <SummaryCard
              label="Pending Review"
              value={formatNumber(summary.pendingCount)}
              color="text-purple-600"
              subtext={summary.lastUpdated ? `Updated ${formatDateTime(summary.lastUpdated)}` : null}
              icon={
                <svg
                  className="h-6 w-6 text-purple-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </>
        ) : null}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          {summaryLoading ? (
            <SkeletonLoader variant="chart" />
          ) : (
            <ComplianceChart data={complianceChartData} />
          )}
        </div>
        <div>
          {trendsLoading ? (
            <SkeletonLoader variant="chart" />
          ) : (
            <ExceptionTrendChart
              data={trendData}
              loading={false}
              error={trendsError}
            />
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Operational Metrics
        </h2>
        {metricsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{metricsError}</p>
              <button
                type="button"
                onClick={fetchMetrics}
                className="ml-auto text-sm font-medium text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {metricsLoading ? (
          <SkeletonLoader variant="card" count={3} />
        ) : metrics && metrics.metrics && metrics.metrics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {metrics.metrics.map((metric) => (
              <div
                key={metric.metricName}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {formatMetricName(metric.metricName)}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metric.unit === 'percent'
                    ? `${formatNumber(metric.value, 1)}%`
                    : metric.unit === 'score'
                      ? formatNumber(metric.value, 2)
                      : formatNumber(metric.value)}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {metric.unit !== 'count' ? metric.unit : ''}
                  {metric.measuredAt && (
                    <span className="ml-1">
                      as of {formatDateTime(metric.measuredAt)}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : !metricsError ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No operational metrics available.
            </p>
          </div>
        ) : null}
      </div>

      {summary && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Quick Summary
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Exceptions Resolved
                </p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  {formatNumber(summary.exceptionsResolved)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
                <svg
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Open Exceptions
                </p>
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                  {formatNumber(summary.exceptionsOpen)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Compliance Rate
                </p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {formatPercentage(summary.complianceRate, 1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMetricName(name) {
  if (!name) return '';
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default DashboardPage;