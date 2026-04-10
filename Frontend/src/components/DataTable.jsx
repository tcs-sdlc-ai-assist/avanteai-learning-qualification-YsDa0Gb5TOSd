import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * @typedef {Object} Column
 * @property {string} key - The data key to access from each row
 * @property {string} label - Display label for the column header
 * @property {boolean} [sortable] - Whether the column is sortable
 * @property {function} [render] - Custom render function (value, row) => JSX
 */

/**
 * Reusable paginated data table with sortable columns and optional row actions.
 *
 * @param {Object} props
 * @param {Column[]} props.columns - Column configuration array
 * @param {Object[]} props.data - Array of row data objects
 * @param {number} [props.totalCount] - Total number of items (for server-side pagination)
 * @param {number} [props.pageSize] - Number of rows per page (default: 10)
 * @param {number} [props.currentPage] - Current page number (1-based, default: 1)
 * @param {string|null} [props.sortColumn] - Currently sorted column key
 * @param {'asc'|'desc'|null} [props.sortDirection] - Current sort direction
 * @param {function} [props.onSort] - Callback (columnKey, direction) when a sortable column header is clicked
 * @param {function} [props.onPageChange] - Callback (pageNumber) when pagination controls are used
 * @param {function} [props.renderActions] - Render function (row) => JSX for row action buttons
 * @param {boolean} [props.loading] - Whether the table is in a loading state
 * @param {string} [props.emptyMessage] - Message to display when data is empty
 * @param {string} [props.keyField] - Field to use as React key for rows (default: 'id')
 */
function DataTable({
  columns,
  data,
  totalCount,
  pageSize = 10,
  currentPage = 1,
  sortColumn = null,
  sortDirection = null,
  onSort,
  onPageChange,
  renderActions,
  loading = false,
  emptyMessage = 'No data available.',
  keyField = 'id',
}) {
  const [internalPage, setInternalPage] = useState(currentPage);
  const [internalSortColumn, setInternalSortColumn] = useState(sortColumn);
  const [internalSortDirection, setInternalSortDirection] = useState(sortDirection);

  const isControlledPagination = onPageChange !== undefined;
  const isControlledSort = onSort !== undefined;

  const activePage = isControlledPagination ? currentPage : internalPage;
  const activeSortColumn = isControlledSort ? sortColumn : internalSortColumn;
  const activeSortDirection = isControlledSort ? sortDirection : internalSortDirection;

  const effectiveTotalCount = totalCount !== undefined ? totalCount : data.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize));

  const handleSort = useCallback(
    (columnKey) => {
      let newDirection = 'asc';
      const currentCol = isControlledSort ? sortColumn : internalSortColumn;
      const currentDir = isControlledSort ? sortDirection : internalSortDirection;

      if (currentCol === columnKey) {
        if (currentDir === 'asc') {
          newDirection = 'desc';
        } else if (currentDir === 'desc') {
          newDirection = null;
        } else {
          newDirection = 'asc';
        }
      }

      if (isControlledSort) {
        onSort(columnKey, newDirection);
      } else {
        setInternalSortColumn(newDirection ? columnKey : null);
        setInternalSortDirection(newDirection);
      }
    },
    [isControlledSort, sortColumn, sortDirection, internalSortColumn, internalSortDirection, onSort]
  );

  const handlePageChange = useCallback(
    (page) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      if (isControlledPagination) {
        onPageChange(clampedPage);
      } else {
        setInternalPage(clampedPage);
      }
    },
    [isControlledPagination, onPageChange, totalPages]
  );

  const sortedData = useMemo(() => {
    if (isControlledSort || !activeSortColumn || !activeSortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[activeSortColumn];
      const bVal = b[activeSortColumn];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return activeSortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return activeSortDirection === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return activeSortDirection === 'asc' ? cmp : -cmp;
      }

      if (aVal < bVal) return activeSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return activeSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, activeSortColumn, activeSortDirection, isControlledSort]);

  const displayData = useMemo(() => {
    if (isControlledPagination) {
      return sortedData;
    }
    const startIndex = (activePage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, activePage, pageSize, isControlledPagination]);

  const hasActions = typeof renderActions === 'function';
  const totalColumns = columns.length + (hasActions ? 1 : 0);

  const getSortIcon = (columnKey) => {
    if (activeSortColumn !== columnKey || !activeSortDirection) {
      return (
        <span className="ml-1 text-gray-300 dark:text-gray-600 inline-flex flex-col leading-none text-xs">
          <span>▲</span>
          <span>▼</span>
        </span>
      );
    }
    if (activeSortDirection === 'asc') {
      return <span className="ml-1 text-blue-600 dark:text-blue-400 text-xs">▲</span>;
    }
    return <span className="ml-1 text-blue-600 dark:text-blue-400 text-xs">▼</span>;
  };

  const paginationRange = useMemo(() => {
    const range = [];
    const maxVisible = 5;
    let start = Math.max(1, activePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [activePage, totalPages]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''
                  }`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  aria-sort={
                    activeSortColumn === column.key && activeSortDirection
                      ? activeSortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className="flex items-center">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {hasActions && (
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                    <svg
                      className="h-5 w-5 animate-spin"
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
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const rowKey = row[keyField] !== undefined ? row[keyField] : rowIndex;
                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={`${rowKey}-${column.key}`}
                        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] !== undefined && row[column.key] !== null
                            ? String(row[column.key])
                            : '—'}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && displayData.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing{' '}
            <span className="font-medium">{(activePage - 1) * pageSize + 1}</span>
            {' '}to{' '}
            <span className="font-medium">
              {Math.min(activePage * pageSize, effectiveTotalCount)}
            </span>
            {' '}of{' '}
            <span className="font-medium">{effectiveTotalCount}</span> results
          </div>

          <nav className="flex items-center space-x-1" aria-label="Pagination">
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage <= 1}
              className="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Previous page"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="ml-1 hidden sm:inline">Prev</span>
            </button>

            {paginationRange[0] > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  1
                </button>
                {paginationRange[0] > 2 && (
                  <span className="px-1 text-gray-400 dark:text-gray-500">…</span>
                )}
              </>
            )}

            {paginationRange.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  page === activePage
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-current={page === activePage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}

            {paginationRange[paginationRange.length - 1] < totalPages && (
              <>
                {paginationRange[paginationRange.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-gray-400 dark:text-gray-500">…</span>
                )}
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage >= totalPages}
              className="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Next page"
            >
              <span className="mr-1 hidden sm:inline">Next</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  totalCount: PropTypes.number,
  pageSize: PropTypes.number,
  currentPage: PropTypes.number,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.oneOf(['asc', 'desc', null]),
  onSort: PropTypes.func,
  onPageChange: PropTypes.func,
  renderActions: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  keyField: PropTypes.string,
};

export default DataTable;