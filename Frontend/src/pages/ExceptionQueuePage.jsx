import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { SLACountdown } from '../components/SLACountdown';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { getExceptionQueue, processException, getExceptionStats } from '../services/exceptionService';

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Overridden', value: 'Overridden' },
  { label: 'Rejected', value: 'Rejected' },
];

function ExceptionQueuePage() {
  const [exceptions, setExceptions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [selectedExceptionId, setSelectedExceptionId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [justification, setJustification] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExceptionQueue({
        page: currentPage,
        pageSize: PAGE_SIZE,
        status: statusFilter || null,
      });
      setExceptions(result.exceptions || []);
      setTotalCount(result.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load exception queue.');
      setExceptions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getExceptionStats();
      setStats(result);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleRowClick = useCallback((exception) => {
    setSelectedExceptionId(exception.exceptionId);
    setReviewModalOpen(true);
    setActionType(null);
    setJustification('');
    setActionError(null);
  }, []);

  const handleCloseReviewModal = useCallback(() => {
    setReviewModalOpen(false);
    setSelectedExceptionId(null);
    setActionType(null);
    setJustification('');
    setActionError(null);
  }, []);

  const handleActionSelect = useCallback((type) => {
    setActionType(type);
    setActionError(null);
    if (type !== 'Override') {
      setJustification('');
    }
  }, []);

  const handleSubmitAction = useCallback(() => {
    if (!actionType) {
      setActionError('Please select an action.');
      return;
    }
    if (actionType === 'Override' && !justification.trim()) {
      setActionError('Justification is required for override actions.');
      return;
    }
    setConfirmOpen(true);
  }, [actionType, justification]);

  const handleConfirmAction = useCallback(async () => {
    if (!selectedExceptionId || !actionType) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await processException(selectedExceptionId, {
        action: actionType,
        justification: actionType === 'Override' ? justification.trim() : null,
      });
      setConfirmOpen(false);
      handleCloseReviewModal();
      await fetchExceptions();
      await fetchStats();
    } catch (err) {
      setActionError(err.message || 'Failed to process exception action.');
      setConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  }, [selectedExceptionId, actionType, justification, handleCloseReviewModal, fetchExceptions, fetchStats]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const selectedExceptionData = useMemo(() => {
    if (!selectedExceptionId) return null;
    return exceptions.find((e) => e.exceptionId === selectedExceptionId) || null;
  }, [selectedExceptionId, exceptions]);

  const columns = useMemo(
    () => [
      {
        key: 'exceptionId',
        label: 'ID',
        sortable: true,
        render: (value) => (
          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">#{value}</span>
        ),
      },
      {
        key: 'employeeId',
        label: 'Employee',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">{value || '—'}</span>
        ),
      },
      {
        key: 'course',
        label: 'Course',
        sortable: true,
        render: (value) => (
          <span className="text-gray-700 dark:text-gray-300">{value || '—'}</span>
        ),
      },
      {
        key: 'reason',
        label: 'Reason',
        sortable: false,
        render: (value) => (
          <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate block" title={value}>
            {value || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value || 'Unknown'} size="sm" />,
      },
      {
        key: 'slaDeadline',
        label: 'SLA Deadline',
        sortable: true,
        render: (value) => <SLACountdown deadline={value} compact />,
      },
    ],
    []
  );

  const confirmMessage = useMemo(() => {
    if (!actionType || !selectedExceptionId) return '';
    const actionVerb =
      actionType === 'Approve'
        ? 'approve'
        : actionType === 'Override'
          ? 'override'
          : 'reject';
    return `Are you sure you want to ${actionVerb} exception #${selectedExceptionId}?${
      actionType === 'Override' ? ` Justification: "${justification.trim()}"` : ''
    }`;
  }, [actionType, selectedExceptionId, justification]);

  const confirmVariant = useMemo(() => {
    if (actionType === 'Reject') return 'danger';
    if (actionType === 'Override') return 'warning';
    return 'primary';
  }, [actionType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Exception Queue</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review and process compliance exceptions requiring human review.
        </p>
      </div>

      {!statsLoading && stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Pending" value={stats.totalPending} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Approved" value={stats.totalApproved} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Overridden" value={stats.totalOverridden} color="text-yellow-600" bg="bg-yellow-50" />
          <StatCard label="Rejected" value={stats.totalRejected} color="text-red-600" bg="bg-red-50" />
          <StatCard label="Overdue SLA" value={stats.overdueSla} color="text-red-700" bg="bg-red-100" />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="input-field w-auto min-w-[140px]"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {totalCount} exception{totalCount !== 1 ? 's' : ''} found
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={exceptions}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        loading={loading}
        emptyMessage="No exceptions found for the selected filter."
        keyField="exceptionId"
        renderActions={(row) =>
          row.status === 'Pending' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row);
              }}
              className="btn-primary text-xs px-3 py-1"
            >
              Review
            </button>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">Processed</span>
          )
        }
      />

      <Modal
        isOpen={reviewModalOpen}
        onClose={handleCloseReviewModal}
        title={`Review Exception #${selectedExceptionId || ''}`}
      >
        {selectedExceptionData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Exception ID" value={`#${selectedExceptionData.exceptionId}`} />
              <DetailField label="Evidence ID" value={selectedExceptionData.evidenceId} />
              <DetailField label="Employee" value={selectedExceptionData.employeeId || '—'} />
              <DetailField label="Course" value={selectedExceptionData.course || '—'} />
            </div>

            <div>
              <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Reason</span>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {selectedExceptionData.reason || '—'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedExceptionData.status} size="sm" />
                </div>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">SLA Deadline</span>
                <div className="mt-1">
                  <SLACountdown deadline={selectedExceptionData.slaDeadline} compact />
                </div>
              </div>
            </div>

            {selectedExceptionData.status === 'Pending' && (
              <>
                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Action</span>
                  <div className="mt-2 flex gap-2">
                    <ActionButton
                      label="Approve"
                      selected={actionType === 'Approve'}
                      onClick={() => handleActionSelect('Approve')}
                      color="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                      selectedColor="bg-green-600 text-white border-green-600"
                    />
                    <ActionButton
                      label="Override"
                      selected={actionType === 'Override'}
                      onClick={() => handleActionSelect('Override')}
                      color="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
                      selectedColor="bg-yellow-500 text-white border-yellow-500"
                    />
                    <ActionButton
                      label="Reject"
                      selected={actionType === 'Reject'}
                      onClick={() => handleActionSelect('Reject')}
                      color="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                      selectedColor="bg-red-600 text-white border-red-600"
                    />
                  </div>
                </div>

                {actionType === 'Override' && (
                  <div>
                    <label
                      htmlFor="justification"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="justification"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={3}
                      placeholder="Provide a justification for overriding this exception..."
                      className="input-field mt-1 resize-none"
                    />
                  </div>
                )}

                {actionError && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {actionError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseReviewModal}
                    className="btn-secondary"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitAction}
                    disabled={!actionType || actionLoading}
                    className="btn-primary"
                  >
                    {actionLoading ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              </>
            )}

            {selectedExceptionData.status !== 'Pending' && (
              <div className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This exception has already been processed.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Exception data not available.</p>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
        title="Confirm Action"
        message={confirmMessage}
        confirmLabel={actionType || 'Confirm'}
        cancelLabel="Cancel"
        variant={confirmVariant}
        loading={actionLoading}
      />
    </div>
  );
}

function StatCard({ label, value, color, bg }) {
  return (
    <div className={`rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-700 ${bg} dark:bg-gray-800`}>
      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value ?? '—'}</p>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{label}</span>
      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
    </div>
  );
}

function ActionButton({ label, selected, onClick, color, selectedColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        selected ? selectedColor : color
      }`}
    >
      {label}
    </button>
  );
}

export default ExceptionQueuePage;