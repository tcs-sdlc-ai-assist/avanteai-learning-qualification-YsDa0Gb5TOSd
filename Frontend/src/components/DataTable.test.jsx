import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DataTable from './DataTable';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
];

function generateRows(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 2 === 0 ? 'Admin' : 'Viewer',
  }));
}

const sampleData = generateRows(5);

describe('DataTable', () => {
  it('renders column headers correctly', () => {
    render(<DataTable columns={columns} data={sampleData} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders data rows correctly', () => {
    render(<DataTable columns={columns} data={sampleData} pageSize={10} />);

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('User 5')).toBeInTheDocument();
    expect(screen.getByText('user5@example.com')).toBeInTheDocument();
  });

  it('displays empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('displays custom empty message when provided', () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="Nothing to show here." />
    );

    expect(screen.getByText('Nothing to show here.')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<DataTable columns={columns} data={[]} loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom cell content via column render function', () => {
    const columnsWithRender = [
      {
        key: 'name',
        label: 'Name',
        sortable: false,
        render: (value) => React.createElement('strong', { 'data-testid': 'bold-name' }, value),
      },
      { key: 'email', label: 'Email', sortable: false },
    ];

    render(<DataTable columns={columnsWithRender} data={[sampleData[0]]} pageSize={10} />);

    const boldName = screen.getByTestId('bold-name');
    expect(boldName).toHaveTextContent('User 1');
  });

  it('renders null/undefined cell values as em dash', () => {
    const data = [{ id: 1, name: 'User 1', email: null, role: undefined }];

    render(<DataTable columns={columns} data={data} pageSize={10} />);

    const cells = screen.getAllByText('—');
    expect(cells.length).toBe(2);
  });

  it('renders actions column when renderActions is provided', () => {
    const renderActions = (row) =>
      React.createElement('button', { 'data-testid': `action-${row.id}` }, 'Edit');

    render(
      <DataTable
        columns={columns}
        data={sampleData}
        pageSize={10}
        renderActions={renderActions}
      />
    );

    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByTestId('action-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-5')).toBeInTheDocument();
  });

  describe('Pagination', () => {
    it('paginates data correctly with default page size', () => {
      const data = generateRows(25);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 10')).toBeInTheDocument();
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });

    it('shows pagination controls when there are multiple pages', () => {
      const data = generateRows(25);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    });

    it('does not show pagination controls when data fits on one page', () => {
      render(<DataTable columns={columns} data={sampleData} pageSize={10} />);

      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    });

    it('navigates to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      const data = generateRows(25);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.queryByText('User 11')).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Next page'));

      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
      expect(screen.getByText('User 11')).toBeInTheDocument();
      expect(screen.getByText('User 20')).toBeInTheDocument();
    });

    it('navigates to previous page when prev button is clicked', async () => {
      const user = userEvent.setup();
      const data = generateRows(25);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      await user.click(screen.getByLabelText('Next page'));
      expect(screen.getByText('User 11')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Previous page'));
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      const data = generateRows(25);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByLabelText('Previous page')).toBeDisabled();
    });

    it('disables next button on last page', async () => {
      const user = userEvent.setup();
      const data = generateRows(15);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      await user.click(screen.getByLabelText('Next page'));

      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });

    it('calls onPageChange callback when controlled', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const data = generateRows(10);

      render(
        <DataTable
          columns={columns}
          data={data}
          totalCount={25}
          pageSize={10}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByLabelText('Next page'));

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Sorting', () => {
    it('calls onSort callback when a sortable column header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={sampleData}
          pageSize={10}
          onSort={onSort}
          sortColumn={null}
          sortDirection={null}
        />
      );

      await user.click(screen.getByText('Name'));

      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('toggles sort direction on subsequent clicks (controlled)', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      const { rerender } = render(
        <DataTable
          columns={columns}
          data={sampleData}
          pageSize={10}
          onSort={onSort}
          sortColumn="name"
          sortDirection="asc"
        />
      );

      await user.click(screen.getByText('Name'));

      expect(onSort).toHaveBeenCalledWith('name', 'desc');

      rerender(
        <DataTable
          columns={columns}
          data={sampleData}
          pageSize={10}
          onSort={onSort}
          sortColumn="name"
          sortDirection="desc"
        />
      );

      await user.click(screen.getByText('Name'));

      expect(onSort).toHaveBeenCalledWith('name', null);
    });

    it('does not trigger sort when clicking a non-sortable column', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={sampleData}
          pageSize={10}
          onSort={onSort}
          sortColumn={null}
          sortDirection={null}
        />
      );

      await user.click(screen.getByText('Role'));

      expect(onSort).not.toHaveBeenCalled();
    });

    it('sorts data internally when onSort is not provided', async () => {
      const user = userEvent.setup();
      const data = [
        { id: 1, name: 'Charlie', email: 'c@test.com', role: 'Admin' },
        { id: 2, name: 'Alice', email: 'a@test.com', role: 'Viewer' },
        { id: 3, name: 'Bob', email: 'b@test.com', role: 'Admin' },
      ];

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      await user.click(screen.getByText('Name'));

      const rows = screen.getAllByRole('row');
      // rows[0] is the header row
      expect(within(rows[1]).getByText('Alice')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Bob')).toBeInTheDocument();
      expect(within(rows[3]).getByText('Charlie')).toBeInTheDocument();
    });

    it('sorts data in descending order on second click', async () => {
      const user = userEvent.setup();
      const data = [
        { id: 1, name: 'Charlie', email: 'c@test.com', role: 'Admin' },
        { id: 2, name: 'Alice', email: 'a@test.com', role: 'Viewer' },
        { id: 3, name: 'Bob', email: 'b@test.com', role: 'Admin' },
      ];

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      await user.click(screen.getByText('Name'));
      await user.click(screen.getByText('Name'));

      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Charlie')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Bob')).toBeInTheDocument();
      expect(within(rows[3]).getByText('Alice')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles data with missing key field gracefully', () => {
      const data = [
        { name: 'No ID User', email: 'noid@test.com', role: 'Viewer' },
      ];

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByText('No ID User')).toBeInTheDocument();
    });

    it('uses custom keyField when provided', () => {
      const data = [
        { uniqueKey: 'abc', name: 'Custom Key', email: 'ck@test.com', role: 'Admin' },
      ];

      render(
        <DataTable columns={columns} data={data} pageSize={10} keyField="uniqueKey" />
      );

      expect(screen.getByText('Custom Key')).toBeInTheDocument();
    });

    it('handles single row of data', () => {
      const data = [{ id: 1, name: 'Solo', email: 'solo@test.com', role: 'Admin' }];

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByText('Solo')).toBeInTheDocument();
      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
    });

    it('displays correct pagination info text', () => {
      const data = generateRows(25);

      render(<DataTable columns={columns} data={data} pageSize={10} />);

      expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1 to 10 of 25 results');
    });
  });
});