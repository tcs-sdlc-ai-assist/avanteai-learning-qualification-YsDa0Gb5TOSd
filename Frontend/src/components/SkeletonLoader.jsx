import PropTypes from 'prop-types';

function SkeletonPulse({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

SkeletonPulse.propTypes = {
  className: PropTypes.string,
};

function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex gap-4 bg-gray-100 dark:bg-gray-800 p-4">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <SkeletonPulse
            key={`header-${colIdx}`}
            className="h-4 flex-1"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex gap-4 border-t border-gray-200 dark:border-gray-700 p-4"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonPulse
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`card-${idx}`}
          className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <SkeletonPulse className="h-5 w-2/3" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-5/6" />
          <SkeletonPulse className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

CardSkeleton.propTypes = {
  count: PropTypes.number,
};

function TextSkeleton({ lines = 4 }) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-full', 'w-5/6'];

  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonPulse
          key={`line-${idx}`}
          className={`h-4 ${widths[idx % widths.length]}`}
        />
      ))}
    </div>
  );
}

TextSkeleton.propTypes = {
  lines: PropTypes.number,
};

function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <SkeletonPulse className="h-5 w-1/3" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 8 }).map((_, idx) => {
          const heights = [40, 65, 50, 80, 55, 70, 45, 60];
          return (
            <SkeletonPulse
              key={`bar-${idx}`}
              className="flex-1 rounded-t"
              style={{ height: `${heights[idx % heights.length]}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonPulse
            key={`label-${idx}`}
            className="h-3 w-8"
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonLoader({ variant = 'text', rows, columns, lines, count }) {
  switch (variant) {
    case 'table':
      return <TableSkeleton rows={rows} columns={columns} />;
    case 'card':
      return <CardSkeleton count={count} />;
    case 'chart':
      return <ChartSkeleton />;
    case 'text':
    default:
      return <TextSkeleton lines={lines} />;
  }
}

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(['table', 'card', 'text', 'chart']),
  rows: PropTypes.number,
  columns: PropTypes.number,
  lines: PropTypes.number,
  count: PropTypes.number,
};

export { TableSkeleton, CardSkeleton, TextSkeleton, ChartSkeleton };
export default SkeletonLoader;