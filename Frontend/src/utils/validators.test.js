import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validateFileType,
  validateFileSize,
  validatePolicyRules,
} from './validators';

describe('validateRequired', () => {
  it('returns null for a non-empty string', () => {
    expect(validateRequired('hello')).toBeNull();
  });

  it('returns null for a string with content after trimming', () => {
    expect(validateRequired('  valid  ')).toBeNull();
  });

  it('returns error message for null value', () => {
    expect(validateRequired(null)).toBe('This field is required.');
  });

  it('returns error message for undefined value', () => {
    expect(validateRequired(undefined)).toBe('This field is required.');
  });

  it('returns error message for empty string', () => {
    expect(validateRequired('')).toBe('This field is required.');
  });

  it('returns error message for whitespace-only string', () => {
    expect(validateRequired('   ')).toBe('This field is required.');
  });

  it('uses custom field name in error message', () => {
    expect(validateRequired('', 'Email')).toBe('Email is required.');
  });

  it('uses default field name when not provided', () => {
    expect(validateRequired(null)).toBe('This field is required.');
  });
});

describe('validateEmail', () => {
  it('returns null for a valid email address', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns null for an email with subdomains', () => {
    expect(validateEmail('user@mail.example.co.uk')).toBeNull();
  });

  it('returns null for an email with plus addressing', () => {
    expect(validateEmail('user+tag@example.com')).toBeNull();
  });

  it('returns required error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required.');
  });

  it('returns required error for null', () => {
    expect(validateEmail(null)).toBe('Email is required.');
  });

  it('returns required error for undefined', () => {
    expect(validateEmail(undefined)).toBe('Email is required.');
  });

  it('returns invalid error for email without @', () => {
    expect(validateEmail('userexample.com')).toBe('Please enter a valid email address.');
  });

  it('returns invalid error for email without domain', () => {
    expect(validateEmail('user@')).toBe('Please enter a valid email address.');
  });

  it('returns invalid error for email without local part', () => {
    expect(validateEmail('@example.com')).toBe('Please enter a valid email address.');
  });

  it('returns invalid error for email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe('Please enter a valid email address.');
  });

  it('returns invalid error for email without TLD', () => {
    expect(validateEmail('user@example')).toBe('Please enter a valid email address.');
  });
});

describe('validateFileType', () => {
  const allowedTypes = ['application/pdf', 'text/csv', 'image/png'];

  it('returns null for a file with an allowed MIME type', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateFileType(file, allowedTypes)).toBeNull();
  });

  it('returns null for another allowed MIME type', () => {
    const file = new File(['data'], 'data.csv', { type: 'text/csv' });
    expect(validateFileType(file, allowedTypes)).toBeNull();
  });

  it('returns error for a file with a disallowed MIME type', () => {
    const file = new File(['content'], 'script.js', { type: 'application/javascript' });
    const result = validateFileType(file, allowedTypes);
    expect(result).toContain('Invalid file type');
    expect(result).toContain('Allowed types');
  });

  it('returns error when no file is provided', () => {
    expect(validateFileType(null, allowedTypes)).toBe('No file selected.');
  });

  it('returns error when file is undefined', () => {
    expect(validateFileType(undefined, allowedTypes)).toBe('No file selected.');
  });

  it('returns null when allowedTypes is empty array', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateFileType(file, [])).toBeNull();
  });

  it('returns null when allowedTypes is not an array', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateFileType(file, null)).toBeNull();
  });
});

describe('validateFileSize', () => {
  const maxSize = 5 * 1024 * 1024; // 5 MB

  it('returns null for a file within the size limit', () => {
    const file = new File(['a'.repeat(1000)], 'small.txt', { type: 'text/plain' });
    expect(validateFileSize(file, maxSize)).toBeNull();
  });

  it('returns null for a file exactly at the size limit', () => {
    const content = new ArrayBuffer(maxSize);
    const file = new File([content], 'exact.bin', { type: 'application/octet-stream' });
    expect(validateFileSize(file, maxSize)).toBeNull();
  });

  it('returns error for a file exceeding the size limit', () => {
    const content = new ArrayBuffer(maxSize + 1);
    const file = new File([content], 'large.bin', { type: 'application/octet-stream' });
    const result = validateFileSize(file, maxSize);
    expect(result).toContain('exceeds the maximum allowed size');
  });

  it('returns error when no file is provided', () => {
    expect(validateFileSize(null, maxSize)).toBe('No file selected.');
  });

  it('returns error when file is undefined', () => {
    expect(validateFileSize(undefined, maxSize)).toBe('No file selected.');
  });

  it('returns null when maxSizeBytes is not a valid number', () => {
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' });
    expect(validateFileSize(file, -1)).toBeNull();
  });

  it('returns null when maxSizeBytes is zero', () => {
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' });
    expect(validateFileSize(file, 0)).toBeNull();
  });
});

describe('validatePolicyRules', () => {
  it('returns null for valid policy rules', () => {
    const rules = [
      { name: 'Rule A', enabled: true, description: 'First rule' },
      { name: 'Rule B', enabled: false, description: 'Second rule' },
    ];
    expect(validatePolicyRules(rules)).toBeNull();
  });

  it('returns null for a single valid rule', () => {
    const rules = [{ name: 'Only Rule', enabled: true }];
    expect(validatePolicyRules(rules)).toBeNull();
  });

  it('returns error for null rules', () => {
    expect(validatePolicyRules(null)).toBe('Policy rules are required.');
  });

  it('returns error for undefined rules', () => {
    expect(validatePolicyRules(undefined)).toBe('Policy rules are required.');
  });

  it('returns error for non-array rules', () => {
    expect(validatePolicyRules('not an array')).toBe('Policy rules are required.');
  });

  it('returns error for empty rules array', () => {
    expect(validatePolicyRules([])).toBe('At least one policy rule must be defined.');
  });

  it('returns error for a rule without a name', () => {
    const rules = [{ name: '', enabled: true }];
    const result = validatePolicyRules(rules);
    expect(result).toContain('must have a name');
  });

  it('returns error for a rule with whitespace-only name', () => {
    const rules = [{ name: '   ', enabled: true }];
    const result = validatePolicyRules(rules);
    expect(result).toContain('must have a name');
  });

  it('returns error for a rule without enabled property', () => {
    const rules = [{ name: 'Rule A' }];
    const result = validatePolicyRules(rules);
    expect(result).toContain('must have an enabled status');
  });

  it('returns error for a rule with non-boolean enabled', () => {
    const rules = [{ name: 'Rule A', enabled: 'yes' }];
    const result = validatePolicyRules(rules);
    expect(result).toContain('must have an enabled status');
  });

  it('returns error for duplicate rule names', () => {
    const rules = [
      { name: 'Rule A', enabled: true },
      { name: 'Rule A', enabled: false },
    ];
    const result = validatePolicyRules(rules);
    expect(result).toContain('Duplicate rule name');
  });

  it('returns error for duplicate rule names with different casing', () => {
    const rules = [
      { name: 'Rule A', enabled: true },
      { name: 'rule a', enabled: false },
    ];
    const result = validatePolicyRules(rules);
    expect(result).toContain('Duplicate rule name');
  });

  it('returns error for an invalid rule object (null entry)', () => {
    const rules = [null];
    const result = validatePolicyRules(rules);
    expect(result).toContain('invalid');
  });

  it('returns error for an invalid rule object (non-object entry)', () => {
    const rules = ['not a rule'];
    const result = validatePolicyRules(rules);
    expect(result).toBeTruthy();
  });
});