import PropTypes from 'prop-types';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  validated: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'in review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  flagged: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'md' }) {
  const normalizedStatus = status ? status.toLowerCase().trim() : '';
  const colorClasses = STATUS_STYLES[normalizedStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${sizeClasses} ${colorClasses}`}
    >
      {status || 'Unknown'}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default StatusBadge;