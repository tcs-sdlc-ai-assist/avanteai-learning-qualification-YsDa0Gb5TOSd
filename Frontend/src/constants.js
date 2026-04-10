export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
    ROLES: '/users/roles',
  },
  PROGRAMS: {
    BASE: '/programs',
    BY_ID: (id) => `/programs/${id}`,
    CONTROLS: (id) => `/programs/${id}/controls`,
  },
  CONTROLS: {
    BASE: '/controls',
    BY_ID: (id) => `/controls/${id}`,
    EVIDENCE: (id) => `/controls/${id}/evidence`,
  },
  EVIDENCE: {
    BASE: '/evidence',
    BY_ID: (id) => `/evidence/${id}`,
    UPLOAD: '/evidence/upload',
    REVIEW: (id) => `/evidence/${id}/review`,
  },
  POLICIES: {
    BASE: '/policies',
    BY_ID: (id) => `/policies/${id}`,
    VERSIONS: (id) => `/policies/${id}/versions`,
  },
  EXCEPTIONS: {
    BASE: '/exceptions',
    BY_ID: (id) => `/exceptions/${id}`,
    APPROVE: (id) => `/exceptions/${id}/approve`,
    REJECT: (id) => `/exceptions/${id}/reject`,
  },
  REPORTS: {
    BASE: '/reports',
    EXPORT: '/reports/export',
    DASHBOARD: '/reports/dashboard',
  },
  AI: {
    ANALYZE: '/ai/analyze',
    SUGGESTIONS: '/ai/suggestions',
    MAP_CONTROLS: '/ai/map-controls',
  },
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  COMPLIANCE_MANAGER: 'ComplianceManager',
  AUDITOR: 'Auditor',
  CONTROL_OWNER: 'ControlOwner',
  VIEWER: 'Viewer',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.COMPLIANCE_MANAGER]: 'Compliance Manager',
  [USER_ROLES.AUDITOR]: 'Auditor',
  [USER_ROLES.CONTROL_OWNER]: 'Control Owner',
  [USER_ROLES.VIEWER]: 'Viewer',
};

export const EVIDENCE_STATUSES = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'UnderReview',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  STALE: 'Stale',
};

export const EVIDENCE_STATUS_LABELS = {
  [EVIDENCE_STATUSES.PENDING]: 'Pending',
  [EVIDENCE_STATUSES.SUBMITTED]: 'Submitted',
  [EVIDENCE_STATUSES.UNDER_REVIEW]: 'Under Review',
  [EVIDENCE_STATUSES.APPROVED]: 'Approved',
  [EVIDENCE_STATUSES.REJECTED]: 'Rejected',
  [EVIDENCE_STATUSES.EXPIRED]: 'Expired',
  [EVIDENCE_STATUSES.STALE]: 'Stale',
};

export const EVIDENCE_STATUS_COLORS = {
  [EVIDENCE_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
  [EVIDENCE_STATUSES.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [EVIDENCE_STATUSES.UNDER_REVIEW]: 'bg-indigo-100 text-indigo-800',
  [EVIDENCE_STATUSES.APPROVED]: 'bg-green-100 text-green-800',
  [EVIDENCE_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
  [EVIDENCE_STATUSES.EXPIRED]: 'bg-gray-100 text-gray-800',
  [EVIDENCE_STATUSES.STALE]: 'bg-orange-100 text-orange-800',
};

export const EXCEPTION_STATUSES = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'PendingApproval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

export const EXCEPTION_STATUS_LABELS = {
  [EXCEPTION_STATUSES.DRAFT]: 'Draft',
  [EXCEPTION_STATUSES.PENDING_APPROVAL]: 'Pending Approval',
  [EXCEPTION_STATUSES.APPROVED]: 'Approved',
  [EXCEPTION_STATUSES.REJECTED]: 'Rejected',
  [EXCEPTION_STATUSES.EXPIRED]: 'Expired',
  [EXCEPTION_STATUSES.REVOKED]: 'Revoked',
};

export const EXCEPTION_STATUS_COLORS = {
  [EXCEPTION_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800',
  [EXCEPTION_STATUSES.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800',
  [EXCEPTION_STATUSES.APPROVED]: 'bg-green-100 text-green-800',
  [EXCEPTION_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
  [EXCEPTION_STATUSES.EXPIRED]: 'bg-gray-100 text-gray-600',
  [EXCEPTION_STATUSES.REVOKED]: 'bg-red-100 text-red-600',
};

export const PROGRAM_STATUSES = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  IN_PROGRESS: 'InProgress',
  UNDER_REVIEW: 'UnderReview',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const PROGRAM_STATUS_LABELS = {
  [PROGRAM_STATUSES.DRAFT]: 'Draft',
  [PROGRAM_STATUSES.ACTIVE]: 'Active',
  [PROGRAM_STATUSES.IN_PROGRESS]: 'In Progress',
  [PROGRAM_STATUSES.UNDER_REVIEW]: 'Under Review',
  [PROGRAM_STATUSES.COMPLETED]: 'Completed',
  [PROGRAM_STATUSES.ARCHIVED]: 'Archived',
};

export const PROGRAM_STATUS_COLORS = {
  [PROGRAM_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800',
  [PROGRAM_STATUSES.ACTIVE]: 'bg-green-100 text-green-800',
  [PROGRAM_STATUSES.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [PROGRAM_STATUSES.UNDER_REVIEW]: 'bg-indigo-100 text-indigo-800',
  [PROGRAM_STATUSES.COMPLETED]: 'bg-emerald-100 text-emerald-800',
  [PROGRAM_STATUSES.ARCHIVED]: 'bg-gray-100 text-gray-600',
};

export const POLICY_STATUSES = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'PendingReview',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  RETIRED: 'Retired',
};

export const POLICY_STATUS_LABELS = {
  [POLICY_STATUSES.DRAFT]: 'Draft',
  [POLICY_STATUSES.PENDING_REVIEW]: 'Pending Review',
  [POLICY_STATUSES.APPROVED]: 'Approved',
  [POLICY_STATUSES.PUBLISHED]: 'Published',
  [POLICY_STATUSES.RETIRED]: 'Retired',
};

export const POLICY_STATUS_COLORS = {
  [POLICY_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800',
  [POLICY_STATUSES.PENDING_REVIEW]: 'bg-yellow-100 text-yellow-800',
  [POLICY_STATUSES.APPROVED]: 'bg-green-100 text-green-800',
  [POLICY_STATUSES.PUBLISHED]: 'bg-blue-100 text-blue-800',
  [POLICY_STATUSES.RETIRED]: 'bg-gray-100 text-gray-600',
};

export const CONFIDENCE_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  VERY_LOW: 'VeryLow',
};

export const CONFIDENCE_LEVEL_LABELS = {
  [CONFIDENCE_LEVELS.HIGH]: 'High Confidence',
  [CONFIDENCE_LEVELS.MEDIUM]: 'Medium Confidence',
  [CONFIDENCE_LEVELS.LOW]: 'Low Confidence',
  [CONFIDENCE_LEVELS.VERY_LOW]: 'Very Low Confidence',
};

export const CONFIDENCE_LEVEL_COLORS = {
  [CONFIDENCE_LEVELS.HIGH]: 'bg-green-100 text-green-800',
  [CONFIDENCE_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [CONFIDENCE_LEVELS.LOW]: 'bg-orange-100 text-orange-800',
  [CONFIDENCE_LEVELS.VERY_LOW]: 'bg-red-100 text-red-800',
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.4,
};

export const SLA_DURATIONS = {
  EVIDENCE_REVIEW: 5,
  EXCEPTION_APPROVAL: 10,
  POLICY_REVIEW: 14,
  CONTROL_ASSESSMENT: 30,
  EVIDENCE_REFRESH: 90,
  POLICY_RENEWAL: 365,
};

export const SLA_DURATION_LABELS = {
  [SLA_DURATIONS.EVIDENCE_REVIEW]: '5 business days',
  [SLA_DURATIONS.EXCEPTION_APPROVAL]: '10 business days',
  [SLA_DURATIONS.POLICY_REVIEW]: '14 business days',
  [SLA_DURATIONS.CONTROL_ASSESSMENT]: '30 days',
  [SLA_DURATIONS.EVIDENCE_REFRESH]: '90 days',
  [SLA_DURATIONS.POLICY_RENEWAL]: '1 year',
};

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
  JSON: 'json',
};

export const EXPORT_FORMAT_LABELS = {
  [EXPORT_FORMATS.PDF]: 'PDF Document',
  [EXPORT_FORMATS.CSV]: 'CSV Spreadsheet',
  [EXPORT_FORMATS.EXCEL]: 'Excel Workbook',
  [EXPORT_FORMATS.JSON]: 'JSON Data',
};

export const EXPORT_FORMAT_MIME_TYPES = {
  [EXPORT_FORMATS.PDF]: 'application/pdf',
  [EXPORT_FORMATS.CSV]: 'text/csv',
  [EXPORT_FORMATS.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [EXPORT_FORMATS.JSON]: 'application/json',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
};

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
  ACCEPTED_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
    'text/plain',
  ],
  ACCEPTED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv', '.json', '.txt'],
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  INPUT: 'yyyy-MM-dd',
};

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
};