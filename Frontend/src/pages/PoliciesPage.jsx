import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicyVersions,
} from '../services/policyService';
import { getPrograms } from '../services/programService';
import { formatDate } from '../utils/formatters';

const EMPTY_RULE = { field: '', operator: '', value: '' };

const OPERATOR_OPTIONS = [
  { value: '>=', label: '>= (greater or equal)' },
  { value: '<=', label: '<= (less or equal)' },
  { value: '==', label: '== (equals)' },
  { value: '!=', label: '!= (not equals)' },
  { value: '>', label: '> (greater than)' },
  { value: '<', label: '< (less than)' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
];

function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    programId: '',
    name: '',
    description: '',
    rules: [{ ...EMPTY_RULE }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState(null);

  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  const pageSize = 10;

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load policies.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const data = await getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch {
      // Programs are needed for the form; silently handle
      setPrograms([]);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
    fetchPrograms();
  }, [fetchPolicies, fetchPrograms]);

  const fetchVersions = useCallback(async (policyId) => {
    if (!policyId) {
      setVersions([]);
      return;
    }
    try {
      setVersionsLoading(true);
      setVersionsError(null);
      const data = await getPolicyVersions(policyId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      setVersionsError(err.message || 'Failed to load version history.');
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  const handleViewVersions = useCallback(
    (policy) => {
      if (selectedPolicyId === policy.id) {
        setSelectedPolicyId(null);
        setVersions([]);
        setVersionsError(null);
      } else {
        setSelectedPolicyId(policy.id);
        fetchVersions(policy.id);
      }
    },
    [selectedPolicyId, fetchVersions]
  );

  const resetForm = useCallback(() => {
    setFormData({
      programId: '',
      name: '',
      description: '',
      rules: [{ ...EMPTY_RULE }],
    });
    setFormErrors({});
    setEditingPolicy(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setIsFormOpen(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback(
    async (policy) => {
      resetForm();
      try {
        const fullPolicy = await getPolicyById(policy.id);
        setEditingPolicy(fullPolicy);
        setFormData({
          programId: fullPolicy.programId || '',
          name: fullPolicy.name || '',
          description: fullPolicy.description || '',
          rules:
            fullPolicy.rules && fullPolicy.rules.length > 0
              ? fullPolicy.rules.map((r) => ({ field: r.field || '', operator: r.operator || '', value: r.value || '' }))
              : [{ ...EMPTY_RULE }],
        });
        setIsFormOpen(true);
      } catch {
        setFormData({
          programId: policy.programId || '',
          name: policy.name || '',
          description: policy.description || '',
          rules:
            policy.rules && policy.rules.length > 0
              ? policy.rules.map((r) => ({ field: r.field || '', operator: r.operator || '', value: r.value || '' }))
              : [{ ...EMPTY_RULE }],
        });
        setEditingPolicy(policy);
        setIsFormOpen(true);
      }
    },
    [resetForm]
  );

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    resetForm();
  }, [resetForm]);

  const validateForm = useCallback(() => {
    const errors = {};

    if (!editingPolicy && !formData.programId) {
      errors.programId = 'Program is required.';
    }

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Name is required.';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters.';
    }

    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required.';
    } else if (formData.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters.';
    }

    if (!formData.rules || formData.rules.length === 0) {
      errors.rules = 'At least one rule is required.';
    } else {
      const ruleErrors = [];
      let hasRuleError = false;
      for (let i = 0; i < formData.rules.length; i++) {
        const rule = formData.rules[i];
        const ruleErr = {};
        if (!rule.field || rule.field.trim() === '') {
          ruleErr.field = 'Field is required.';
          hasRuleError = true;
        }
        if (!rule.operator || rule.operator.trim() === '') {
          ruleErr.operator = 'Operator is required.';
          hasRuleError = true;
        }
        if (!rule.value || rule.value.trim() === '') {
          ruleErr.value = 'Value is required.';
          hasRuleError = true;
        }
        ruleErrors.push(ruleErr);
      }
      if (hasRuleError) {
        errors.ruleItems = ruleErrors;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, editingPolicy]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setFormSubmitting(true);

      const rules = formData.rules.map((r) => ({
        field: r.field.trim(),
        operator: r.operator.trim(),
        value: r.value.trim(),
      }));

      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          rules,
        });
      } else {
        await createPolicy({
          programId: formData.programId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          rules,
        });
      }

      handleCloseForm();
      await fetchPolicies();

      if (selectedPolicyId && editingPolicy && selectedPolicyId === editingPolicy.id) {
        fetchVersions(selectedPolicyId);
      }
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save policy.' });
    } finally {
      setFormSubmitting(false);
    }
  }, [validateForm, formData, editingPolicy, handleCloseForm, fetchPolicies, selectedPolicyId, fetchVersions]);

  const handleOpenDelete = useCallback((policy) => {
    setDeletingPolicy(policy);
    setIsDeleteOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setDeletingPolicy(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingPolicy) return;
    try {
      setDeleteLoading(true);
      await deletePolicy(deletingPolicy.id);
      handleCloseDelete();
      await fetchPolicies();
      if (selectedPolicyId === deletingPolicy.id) {
        setSelectedPolicyId(null);
        setVersions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete policy.');
      handleCloseDelete();
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingPolicy, handleCloseDelete, fetchPolicies, selectedPolicyId]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      delete next.submit;
      return next;
    });
  }, []);

  const handleRuleChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const rules = [...prev.rules];
      rules[index] = { ...rules[index], [field]: value };
      return { ...prev, rules };
    });
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.rules;
      if (next.ruleItems) {
        const ruleItems = [...next.ruleItems];
        if (ruleItems[index]) {
          ruleItems[index] = { ...ruleItems[index] };
          delete ruleItems[index][field];
        }
        next.ruleItems = ruleItems;
      }
      delete next.submit;
      return next;
    });
  }, []);

  const handleAddRule = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, { ...EMPTY_RULE }],
    }));
  }, []);

  const handleRemoveRule = useCallback((index) => {
    setFormData((prev) => {
      const rules = prev.rules.filter((_, i) => i !== index);
      if (rules.length === 0) {
        return { ...prev, rules: [{ ...EMPTY_RULE }] };
      }
      return { ...prev, rules };
    });
  }, []);

  const handleSort = useCallback((columnKey, direction) => {
    setSortColumn(direction ? columnKey : null);
    setSortDirection(direction);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const programMap = useMemo(() => {
    const map = {};
    for (const p of programs) {
      map[p.id] = p.name;
    }
    return map;
  }, [programs]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
        ),
      },
      {
        key: 'programId',
        label: 'Program',
        sortable: false,
        render: (value) => programMap[value] || value || '—',
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => <StatusBadge status={value || 'Unknown'} size="sm" />,
      },
      {
        key: 'version',
        label: 'Version',
        sortable: true,
        render: (value) => (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            v{value}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        render: (value) => formatDate(value),
      },
    ],
    [programMap]
  );

  const versionColumns = useMemo(
    () => [
      {
        key: 'version',
        label: 'Version',
        sortable: false,
        render: (value) => (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            v{value}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: false,
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        render: (value) => (
          <span className="max-w-xs truncate block" title={value}>
            {value || '—'}
          </span>
        ),
      },
      {
        key: 'rules',
        label: 'Rules',
        sortable: false,
        render: (value) => {
          const count = Array.isArray(value) ? value.length : 0;
          return (
            <span className="text-gray-500 dark:text-gray-400">
              {count} rule{count !== 1 ? 's' : ''}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: false,
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
          onClick={() => handleViewVersions(row)}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
        >
          {selectedPolicyId === row.id ? 'Hide History' : 'History'}
        </button>
        <button
          type="button"
          onClick={() => handleOpenEdit(row)}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleOpenDelete(row)}
          className="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete
        </button>
      </div>
    ),
    [handleViewVersions, handleOpenEdit, handleOpenDelete, selectedPolicyId]
  );

  const selectedPolicyName = useMemo(() => {
    if (!selectedPolicyId) return '';
    const found = policies.find((p) => p.id === selectedPolicyId);
    return found ? found.name : '';
  }, [selectedPolicyId, policies]);

  if (loading && policies.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <SkeletonLoader variant="table" rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Policies</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage compliance policies and view version history.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
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
          Create Policy
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={policies}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={handlePageChange}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        renderActions={renderActions}
        loading={loading}
        emptyMessage="No policies found. Create your first policy to get started."
        keyField="id"
      />

      {selectedPolicyId && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Version History — {selectedPolicyName}
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedPolicyId(null);
                setVersions([]);
                setVersionsError(null);
              }}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close version history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {versionsError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {versionsError}
            </div>
          )}

          {versionsLoading ? (
            <SkeletonLoader variant="table" rows={3} columns={5} />
          ) : versions.length === 0 && !versionsError ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No version history available.</p>
          ) : (
            <DataTable
              columns={versionColumns}
              data={versions}
              pageSize={50}
              loading={versionsLoading}
              emptyMessage="No versions found."
              keyField="id"
            />
          )}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        title={editingPolicy ? 'Edit Policy' : 'Create Policy'}
      >
        <div className="space-y-4">
          {formErrors.submit && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formErrors.submit}
            </div>
          )}

          {!editingPolicy && (
            <div>
              <label htmlFor="policy-program" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                id="policy-program"
                value={formData.programId}
                onChange={(e) => handleFieldChange('programId', e.target.value)}
                className="input-field mt-1"
                disabled={formSubmitting}
              >
                <option value="">Select a program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {formErrors.programId && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.programId}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="policy-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="policy-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="input-field mt-1"
              placeholder="e.g., Annual Safety Training"
              maxLength={100}
              disabled={formSubmitting}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="policy-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="policy-description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="input-field mt-1"
              rows={3}
              placeholder="Describe the policy requirements..."
              maxLength={500}
              disabled={formSubmitting}
            />
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.description}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rules <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                disabled={formSubmitting}
                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <svg
                  className="mr-1 h-3.5 w-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Rule
              </button>
            </div>
            {formErrors.rules && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.rules}</p>
            )}

            <div className="mt-2 space-y-3">
              {formData.rules.map((rule, index) => (
                <div
                  key={index}
                  className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Rule {index + 1}
                    </span>
                    {formData.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(index)}
                        disabled={formSubmitting}
                        className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 focus:outline-none disabled:opacity-50 dark:hover:bg-red-900/20"
                        aria-label={`Remove rule ${index + 1}`}
                      >
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <input
                        type="text"
                        value={rule.field}
                        onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
                        className="input-field text-sm"
                        placeholder="Field"
                        maxLength={100}
                        disabled={formSubmitting}
                      />
                      {formErrors.ruleItems &&
                        formErrors.ruleItems[index] &&
                        formErrors.ruleItems[index].field && (
                          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                            {formErrors.ruleItems[index].field}
                          </p>
                        )}
                    </div>
                    <div>
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                        className="input-field text-sm"
                        disabled={formSubmitting}
                      >
                        <option value="">Operator</option>
                        {OPERATOR_OPTIONS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.ruleItems &&
                        formErrors.ruleItems[index] &&
                        formErrors.ruleItems[index].operator && (
                          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                            {formErrors.ruleItems[index].operator}
                          </p>
                        )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                        className="input-field text-sm"
                        placeholder="Value"
                        maxLength={500}
                        disabled={formSubmitting}
                      />
                      {formErrors.ruleItems &&
                        formErrors.ruleItems[index] &&
                        formErrors.ruleItems[index].value && (
                          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                            {formErrors.ruleItems[index].value}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={formSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
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
              {editingPolicy ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDelete}
        title="Delete Policy"
        message={`Are you sure you want to delete "${deletingPolicy?.name || 'this policy'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

export default PoliciesPage;