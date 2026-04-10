import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../services/programService';
import { formatDate } from '../utils/formatters';
import { validateRequired } from '../utils/validators';

const PROGRAM_STATUS_OPTIONS = ['Active', 'Inactive', 'Archived'];

const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  status: 'Active',
};

const INITIAL_FORM_ERRORS = {
  name: null,
  description: null,
  status: null,
};

function validateForm(values, isEdit = false) {
  const errors = { ...INITIAL_FORM_ERRORS };
  let isValid = true;

  const nameError = validateRequired(values.name, 'Name');
  if (nameError) {
    errors.name = nameError;
    isValid = false;
  } else if (values.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters.';
    isValid = false;
  }

  const descError = validateRequired(values.description, 'Description');
  if (descError) {
    errors.description = descError;
    isValid = false;
  } else if (values.description.trim().length > 500) {
    errors.description = 'Description must not exceed 500 characters.';
    isValid = false;
  }

  if (isEdit) {
    const statusError = validateRequired(values.status, 'Status');
    if (statusError) {
      errors.status = statusError;
      isValid = false;
    } else if (!PROGRAM_STATUS_OPTIONS.includes(values.status)) {
      errors.status = 'Status must be Active, Inactive, or Archived.';
      isValid = false;
    }
  }

  return { errors, isValid };
}

function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState(INITIAL_FORM_ERRORS);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formApiError, setFormApiError] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load programs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const filteredPrograms = useMemo(() => {
    let result = programs;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    if (statusFilter) {
      result = result.filter(
        (p) => p.status && p.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return result;
  }, [programs, searchQuery, statusFilter]);

  const handleSort = useCallback((columnKey, direction) => {
    setSortColumn(direction ? columnKey : null);
    setSortDirection(direction);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingProgram(null);
    setFormValues(INITIAL_FORM_STATE);
    setFormErrors(INITIAL_FORM_ERRORS);
    setFormApiError(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((program) => {
    setEditingProgram(program);
    setFormValues({
      name: program.name || '',
      description: program.description || '',
      status: program.status || 'Active',
    });
    setFormErrors(INITIAL_FORM_ERRORS);
    setFormApiError(null);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    if (formSubmitting) return;
    setIsFormOpen(false);
    setEditingProgram(null);
    setFormValues(INITIAL_FORM_STATE);
    setFormErrors(INITIAL_FORM_ERRORS);
    setFormApiError(null);
  }, [formSubmitting]);

  const handleFormChange = useCallback((field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: null }));
    setFormApiError(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormApiError(null);

      const isEdit = !!editingProgram;
      const { errors, isValid } = validateForm(formValues, isEdit);
      setFormErrors(errors);

      if (!isValid) return;

      setFormSubmitting(true);

      try {
        if (isEdit) {
          await updateProgram(editingProgram.id, {
            name: formValues.name.trim(),
            description: formValues.description.trim(),
            status: formValues.status,
          });
        } else {
          await createProgram({
            name: formValues.name.trim(),
            description: formValues.description.trim(),
            status: formValues.status || undefined,
          });
        }

        closeForm();
        await fetchPrograms();
      } catch (err) {
        const message =
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.message ||
          'An error occurred while saving the program.';
        setFormApiError(typeof message === 'string' ? message : 'An error occurred while saving the program.');
      } finally {
        setFormSubmitting(false);
      }
    },
    [editingProgram, formValues, closeForm, fetchPrograms]
  );

  const openDeleteConfirm = useCallback((program) => {
    setDeletingProgram(program);
    setIsDeleteOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    if (deleteLoading) return;
    setIsDeleteOpen(false);
    setDeletingProgram(null);
  }, [deleteLoading]);

  const handleDelete = useCallback(async () => {
    if (!deletingProgram) return;

    setDeleteLoading(true);
    try {
      await deleteProgram(deletingProgram.id);
      closeDeleteConfirm();
      await fetchPrograms();
    } catch (err) {
      const message =
        err.response?.data?.details ||
        err.response?.data?.error ||
        err.message ||
        'Failed to delete program.';
      setError(typeof message === 'string' ? message : 'Failed to delete program.');
      closeDeleteConfirm();
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingProgram, closeDeleteConfirm, fetchPrograms]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        render: (value) => {
          if (!value) return '—';
          return value.length > 80 ? `${value.slice(0, 80)}…` : value;
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value || 'Unknown'} size="sm" />,
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        render: (value) => formatDate(value),
      },
    ],
    []
  );

  const renderActions = useCallback(
    (row) => (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => openEditForm(row)}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => openDeleteConfirm(row)}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
        >
          Delete
        </button>
      </div>
    ),
    [openEditForm, openDeleteConfirm]
  );

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredPrograms;

    return [...filteredPrograms].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPrograms, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const isEdit = !!editingProgram;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Programs</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage compliance programs and their configurations.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="btn-primary"
        >
          <svg
            className="mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Program
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-500"
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
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">All Statuses</option>
          {PROGRAM_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        totalCount={sortedData.length}
        pageSize={pageSize}
        currentPage={currentPage}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onPageChange={handlePageChange}
        renderActions={renderActions}
        loading={loading}
        emptyMessage="No programs found."
        keyField="id"
      />

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEdit ? 'Edit Program' : 'Add Program'}
      >
        <form onSubmit={handleFormSubmit} noValidate>
          {formApiError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formApiError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="program-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="program-name"
                type="text"
                value={formValues.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className={`input-field mt-1 ${formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter program name"
                maxLength={100}
                disabled={formSubmitting}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="program-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="program-description"
                value={formValues.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className={`input-field mt-1 min-h-[80px] resize-y ${formErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter program description"
                maxLength={500}
                rows={3}
                disabled={formSubmitting}
              />
              <div className="mt-1 flex items-center justify-between">
                {formErrors.description ? (
                  <p className="text-xs text-red-600 dark:text-red-400">{formErrors.description}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {formValues.description.length}/500
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="program-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status {isEdit && <span className="text-red-500">*</span>}
              </label>
              <select
                id="program-status"
                value={formValues.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                className={`input-field mt-1 ${formErrors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={formSubmitting}
              >
                {PROGRAM_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {formErrors.status && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.status}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={formSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="btn-primary"
            >
              {formSubmitting && (
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isEdit ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
        title="Delete Program"
        message={
          deletingProgram
            ? `Are you sure you want to delete "${deletingProgram.name}"? This action cannot be undone and will also remove all associated policies.`
            : 'Are you sure you want to delete this program?'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

export default ProgramsPage;