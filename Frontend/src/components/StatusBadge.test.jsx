import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with green classes for active status', () => {
    render(<StatusBadge status="Active" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders with green classes for validated status', () => {
    render(<StatusBadge status="Validated" />);
    const badge = screen.getByText('Validated');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders with green classes for approved status', () => {
    render(<StatusBadge status="Approved" />);
    const badge = screen.getByText('Approved');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders with gray classes for inactive status', () => {
    render(<StatusBadge status="Inactive" />);
    const badge = screen.getByText('Inactive');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
  });

  it('renders with gray classes for archived status', () => {
    render(<StatusBadge status="Archived" />);
    const badge = screen.getByText('Archived');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
  });

  it('renders with yellow classes for draft status', () => {
    render(<StatusBadge status="Draft" />);
    const badge = screen.getByText('Draft');
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('renders with blue classes for pending status', () => {
    render(<StatusBadge status="Pending" />);
    const badge = screen.getByText('Pending');
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
  });

  it('renders with red classes for flagged status', () => {
    render(<StatusBadge status="Flagged" />);
    const badge = screen.getByText('Flagged');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('renders with red classes for rejected status', () => {
    render(<StatusBadge status="Rejected" />);
    const badge = screen.getByText('Rejected');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('renders with red classes for expired status', () => {
    render(<StatusBadge status="Expired" />);
    const badge = screen.getByText('Expired');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('normalizes status to lowercase for matching', () => {
    render(<StatusBadge status="ACTIVE" />);
    const badge = screen.getByText('ACTIVE');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders with default gray classes for unknown status', () => {
    render(<StatusBadge status="SomeUnknownStatus" />);
    const badge = screen.getByText('SomeUnknownStatus');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
  });

  it('renders "Unknown" when status is empty string', () => {
    render(<StatusBadge status="" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders with sm size classes', () => {
    render(<StatusBadge status="Active" size="sm" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
  });

  it('renders with md size classes by default', () => {
    render(<StatusBadge status="Active" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('py-1');
    expect(badge).toHaveClass('text-sm');
  });

  it('renders with lg size classes', () => {
    render(<StatusBadge status="Active" size="lg" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
    expect(badge).toHaveClass('text-base');
  });

  it('renders as a span element with rounded-full class', () => {
    render(<StatusBadge status="Pending" />);
    const badge = screen.getByText('Pending');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('rounded-full');
  });

  it('renders with inline-flex and font-medium classes', () => {
    render(<StatusBadge status="Active" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('font-medium');
  });

  it('handles status with leading and trailing whitespace', () => {
    render(<StatusBadge status="  active  " />);
    const badge = screen.getByText('active');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders blue classes for in review status', () => {
    render(<StatusBadge status="In Review" />);
    const badge = screen.getByText('In Review');
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
  });
});