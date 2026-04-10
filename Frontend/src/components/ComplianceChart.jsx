import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  validated: '#10B981',
  flagged: '#EF4444',
  pending: '#F59E0B',
};

const LABELS = {
  validated: 'Validated',
  flagged: 'Flagged',
  pending: 'Pending',
};

function buildChartData(data) {
  const entries = [];
  if (data.validated != null && data.validated > 0) {
    entries.push({ name: LABELS.validated, value: data.validated, color: COLORS.validated });
  }
  if (data.flagged != null && data.flagged > 0) {
    entries.push({ name: LABELS.flagged, value: data.flagged, color: COLORS.flagged });
  }
  if (data.pending != null && data.pending > 0) {
    entries.push({ name: LABELS.pending, value: data.pending, color: COLORS.pending });
  }
  return entries;
}

function computeComplianceRate(data) {
  const total = (data.validated || 0) + (data.flagged || 0) + (data.pending || 0);
  if (total === 0) return 0;
  return ((data.validated || 0) / total) * 100;
}

function CustomTooltipContent({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const entry = payload[0];
  return (
    <div className="rounded-md bg-white px-3 py-2 shadow-lg border border-gray-200">
      <p className="text-sm font-medium" style={{ color: entry.payload.color }}>
        {entry.name}
      </p>
      <p className="text-sm text-gray-700">{entry.value} items</p>
    </div>
  );
}

CustomTooltipContent.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
      payload: PropTypes.shape({
        color: PropTypes.string,
      }),
    })
  ),
};

CustomTooltipContent.defaultProps = {
  active: false,
  payload: [],
};

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ComplianceChart({ data }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">No compliance data available.</p>
      </div>
    );
  }

  const chartData = buildChartData(data);
  const complianceRate = computeComplianceRate(data);
  const total = (data.validated || 0) + (data.flagged || 0) + (data.pending || 0);

  if (chartData.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">No compliance data to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Compliance Rate</h3>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            complianceRate >= 80
              ? 'bg-green-100 text-green-800'
              : complianceRate >= 50
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {complianceRate.toFixed(1)}%
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipContent />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-600">{data.validated || 0}</p>
          <p className="text-xs text-gray-500">Validated</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{data.flagged || 0}</p>
          <p className="text-xs text-gray-500">Flagged</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600">{data.pending || 0}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>
    </div>
  );
}

ComplianceChart.propTypes = {
  data: PropTypes.shape({
    validated: PropTypes.number,
    flagged: PropTypes.number,
    pending: PropTypes.number,
  }),
};

ComplianceChart.defaultProps = {
  data: null,
};

export default ComplianceChart;