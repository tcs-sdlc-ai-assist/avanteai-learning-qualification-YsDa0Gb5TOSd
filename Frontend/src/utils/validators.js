/**
 * Frontend form validation utilities.
 * Each validator returns an error message string if invalid, or null if valid.
 */

/**
 * Validates that a value is not empty.
 * @param {string|null|undefined} value - The value to check.
 * @param {string} [fieldName='This field'] - The display name of the field.
 * @returns {string|null} Error message or null if valid.
 */
export function validateRequired(value, fieldName = 'This field') {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} is required.`;
  }
  return null;
}

/**
 * Validates that a value is a properly formatted email address.
 * @param {string} value - The email string to validate.
 * @returns {string|null} Error message or null if valid.
 */
export function validateEmail(value) {
  if (!value || String(value).trim() === '') {
    return 'Email is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(value).trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

/**
 * Validates that a file has an allowed MIME type.
 * @param {File|null|undefined} file - The file to validate.
 * @param {string[]} allowedTypes - Array of allowed MIME types (e.g., ['application/pdf', 'text/plain']).
 * @returns {string|null} Error message or null if valid.
 */
export function validateFileType(file, allowedTypes) {
  if (!file) {
    return 'No file selected.';
  }
  if (!Array.isArray(allowedTypes) || allowedTypes.length === 0) {
    return null;
  }
  if (!allowedTypes.includes(file.type)) {
    const readable = allowedTypes
      .map((t) => {
        const parts = t.split('/');
        return parts.length > 1 ? parts[1].toUpperCase() : t;
      })
      .join(', ');
    return `Invalid file type. Allowed types: ${readable}.`;
  }
  return null;
}

/**
 * Validates that a file does not exceed a maximum size in bytes.
 * @param {File|null|undefined} file - The file to validate.
 * @param {number} maxSizeBytes - Maximum allowed file size in bytes.
 * @returns {string|null} Error message or null if valid.
 */
export function validateFileSize(file, maxSizeBytes) {
  if (!file) {
    return 'No file selected.';
  }
  if (typeof maxSizeBytes !== 'number' || maxSizeBytes <= 0) {
    return null;
  }
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `File size (${fileSizeMB} MB) exceeds the maximum allowed size of ${maxSizeMB} MB.`;
  }
  return null;
}

/**
 * Validates a set of policy rules for completeness and correctness.
 * Each rule should be an object with at least a `name` (string) and `enabled` (boolean) property.
 * @param {Array<{name: string, enabled: boolean, description?: string}>|null|undefined} rules - The policy rules array.
 * @returns {string|null} Error message or null if valid.
 */
export function validatePolicyRules(rules) {
  if (!rules || !Array.isArray(rules)) {
    return 'Policy rules are required.';
  }
  if (rules.length === 0) {
    return 'At least one policy rule must be defined.';
  }
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule || typeof rule !== 'object') {
      return `Rule at position ${i + 1} is invalid.`;
    }
    if (!rule.name || String(rule.name).trim() === '') {
      return `Rule at position ${i + 1} must have a name.`;
    }
    if (typeof rule.enabled !== 'boolean') {
      return `Rule "${rule.name}" must have an enabled status (true or false).`;
    }
  }
  const names = rules.map((r) => String(r.name).trim().toLowerCase());
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) {
      return `Duplicate rule name detected: "${name}". Each rule must have a unique name.`;
    }
    seen.add(name);
  }
  return null;
}