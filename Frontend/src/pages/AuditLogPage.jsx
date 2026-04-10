import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { formatDateTime } from '../utils/formatters';
import { getAuditLogs } from '../services/auditLogService';

const PAGE_SIZE = 25;

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'Create', label: 'Create' },
  { value: 'Update', label: 'Update' },
  { value: 'Delete', label: 'Delete' },
  { value: 'Approve', label: 'Approve' },
  { value: 'Override', label: 'Override' },
  { value: 'Reject', label: 'Reject' },
  { value: 'Upload', label: 'Upload' },
  { value: 'Validate', label: 'Validate' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'Evidence', label: 'Evidence' },
  { value: 'EvidenceBatch', label: 'Evidence Batch' },
  { value: 'Exception', label: 'Exception' },
  { value: 'Policy', label: 'Policy' },
  { value: 'Program', label: 'Program' },
];

function getActionBadgeClasses(action) {
  const normalized = (action || '').toLowerCase();
  switch (normalized) {
    case 'create':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'update':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'delete':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'approve':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'override':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'reject':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'upload':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case 'validate':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

const columns = [
  {
    key: 'timestamp',
    label: 'Timestamp',
    sortable: false,
    render: (value) => (
      <span className="text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
        {formatDateTime(value)}
      </span>
    ),
  },
  {
    key: 'user',
    label: 'User',
    sortable: false,
    render: (value) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{value || '—'}</span>
    ),
  },
  {
    key: 'action',
    label: 'Action',
    sortable: false,
    render: (value) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionBadgeClasses(value)}`}
      >
        {value || '—'}
      </span>
    ),
  },
  {
    key: 'entity',
    label: 'Entity',
    sortable: false,
    render: (value) => (
      <span className="text-gray-700 dark:text-gray-300">{value || '—'}</span>
    ),
  },
  {
    key: 'entityId',
    label: 'Entity ID',
    sortable: false,
    render: (value) => (
      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
        {value !== undefined && value !== null ? String(value) : '—'}
      </span>
    ),
  },
  {
    key: 'details',
    label: 'Details',
    sortable: false,
    render: (value) => {
      if (!value) return <span className="text-gray-400">—</span>;
      const truncated = value.length > 80 ? `${value.slice(0, 80)}…` : value;
      return (
        <span className="text-gray-600 dark:text-gray-400 text-xs" title={value}>
          {truncated}
        </span>
      );
    },
  },
];

function AuditLogPage() {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    user: '',
    action: '',
    entity: '',
    from: '',
    to: '',
  });

  const fetchAuditLogs = useCallback(async (page, filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize: PAGE_SIZE,
      };

      if (filters.user) {
        params.user = filters.user.trim();
      }
      if (filters.action) {
        params.action = filters.action;
      }
      if (filters.entity) {
        params.entity = filters.entity;
      }
      if (filters.from) {
        params.from = new Date(filters.from).toISOString();
      }
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        params.to = toDate.toISOString();
      }

      const response = await getAuditLogs(params);

      setData(response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      const message = err?.message || 'Failed to fetch audit logs.';
      setError(message);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs(currentPage, appliedFilters);
  }, [currentPage, appliedFilters, fetchAuditLogs]);

  const handleApplyFilters = useCallback((e) => {
    e.preventDefault();

    if (filterFrom && filterTo && new Date(filterFrom) > new Date(filterTo)) {
      setError("'From' date must be before or equal to 'To' date.");
      return;
    }

    setCurrentPage(1);
    setAppliedFilters({
      user: filterUser,
      action: filterAction,
      entity: filterEntity,
      from: filterFrom,
      to: filterTo,
    });
  }, [filterUser, filterAction, filterEntity, filterFrom, filterTo]);

  const handleResetFilters = useCallback(() => {
    setFilterUser('');
    setFilterAction('');
    setFilterEntity('');
    setFilterFrom('');
    setFilterTo('');
    setCurrentPage(1);
    setAppliedFilters({
      user: '',
      action: '',
      entity: '',
      from: '',
      to: '',
    });
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      appliedFilters.user ||
      appliedFilters.action ||
      appliedFilters.entity ||
      appliedFilters.from ||
      appliedFilters.to
    );
  }, [appliedFilters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Immutable record of all system actions. Entries cannot be modified or deleted.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleApplyFilters}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <label
                htmlFor="filter-user"
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                User
              </label>
              <input
                id="filter-user"
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Filter by user..."
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="filter-action"
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Action
              </label>
              <select
                id="filter-action"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="input-field"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-entity"
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Entity
              </label>
              <select
                id="filter-entity"
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="input-field"
              >
                {ENTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-from"
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                From
              </label>
              <input
                id="filter-from"
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="filter-to"
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                To
              </label>
              <input
                id="filter-to"
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary">
              <svg
                className="mr-1.5 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              Apply Filters
            </button>

            {hasActiveFilters && (
              <button type="button" onClick={handleResetFilters} className="btn-secondary">
                <svg
                  className="mr-1.5 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Filters
              </button>
            )}

            {!loading && totalCount > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount.toLocaleString()} {totalCount === 1 ? 'entry' : 'entries'} found
              </span>
            )}
          </div>
        </form>
      </div>

      {error && (
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
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        loading={loading}
        emptyMessage="No audit log entries found matching the current filters."
        keyField="id"
      />
    </div>
  );
}

export default AuditLogPage;