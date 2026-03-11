// Validation utilities for ATTY Financial Application

import { VALIDATION, ERROR_MESSAGES } from './constants';

// ============================================
// Matter Validation
// ============================================
export function validateMatterId(id: string): { valid: boolean; error?: string } {
  if (!id || id.trim().length === 0) {
    return { valid: false, error: 'Matter ID is required' };
  }

  if (id.length < VALIDATION.MATTER_ID.minLength) {
    return {
      valid: false,
      error: `Matter ID must be at least ${VALIDATION.MATTER_ID.minLength} character`,
    };
  }

  if (id.length > VALIDATION.MATTER_ID.maxLength) {
    return {
      valid: false,
      error: `Matter ID must not exceed ${VALIDATION.MATTER_ID.maxLength} characters`,
    };
  }

  if (!VALIDATION.MATTER_ID.pattern.test(id)) {
    return {
      valid: false,
      error: 'Matter ID can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
}

export function validateClientName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Client name is required' };
  }

  if (name.length < VALIDATION.CLIENT_NAME.minLength) {
    return {
      valid: false,
      error: `Client name must be at least ${VALIDATION.CLIENT_NAME.minLength} characters`,
    };
  }

  if (name.length > VALIDATION.CLIENT_NAME.maxLength) {
    return {
      valid: false,
      error: `Client name must not exceed ${VALIDATION.CLIENT_NAME.maxLength} characters`,
    };
  }

  return { valid: true };
}

export function validateMatterNotes(notes?: string): { valid: boolean; error?: string } {
  if (notes && notes.length > VALIDATION.NOTES.maxLength) {
    return {
      valid: false,
      error: `Notes must not exceed ${VALIDATION.NOTES.maxLength} characters`,
    };
  }

  return { valid: true };
}

export function validateMatterStatus(
  currentStatus: string,
  newStatus: string,
  principalBalance: number
): { valid: boolean; error?: string } {
  if (newStatus === 'Closed' || newStatus === 'Archive') {
    if (principalBalance > 0) {
      return { valid: false, error: ERROR_MESSAGES.CLOSE_MATTER_WITH_BALANCE };
    }
  }

  return { valid: true };
}

// ============================================
// Transaction Validation
// ============================================
export function validateTransactionAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: ERROR_MESSAGES.NEGATIVE_AMOUNT };
  }

  if (amount > VALIDATION.AMOUNT.max) {
    return {
      valid: false,
      error: `Amount must not exceed ${VALIDATION.AMOUNT.max.toLocaleString()}`,
    };
  }

  // Check decimal places
  const decimals = amount.toString().split('.')[1]?.length || 0;
  if (decimals > VALIDATION.AMOUNT.decimals) {
    return {
      valid: false,
      error: `Amount cannot have more than ${VALIDATION.AMOUNT.decimals} decimal places`,
    };
  }

  return { valid: true };
}

export function validatePaymentAmount(amount: number, principalBalance: number): { valid: boolean; error?: string } {
  const amountValidation = validateTransactionAmount(amount);
  if (!amountValidation.valid) {
    return amountValidation;
  }

  if (amount > principalBalance) {
    return { valid: false, error: ERROR_MESSAGES.PAYMENT_EXCEEDS_BALANCE };
  }

  return { valid: true };
}

export function validateTransactionDate(date: Date): { valid: boolean; error?: string } {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (date > today) {
    return { valid: false, error: 'Transaction date cannot be in the future' };
  }

  return { valid: true };
}

export function validateTransactionAllocations(
  allocations: Array<{ matterId: string; amount: number }>,
  totalAmount: number,
  matterStatuses: Record<string, string>
): { valid: boolean; error?: string } {
  if (allocations.length === 0) {
    return { valid: false, error: 'At least one matter must be selected' };
  }

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0);

  // Check if allocations match total amount
  if (Math.abs(allocatedTotal - totalAmount) > 0.01) {
    return {
      valid: false,
      error: `Allocations (${allocatedTotal.toFixed(2)}) must match transaction amount (${totalAmount.toFixed(2)})`,
    };
  }

  // Check if any allocation is to a closed/archived matter
  for (const allocation of allocations) {
    const status = matterStatuses[allocation.matterId];
    if (status === 'Closed' || status === 'Archive') {
      return { valid: false, error: ERROR_MESSAGES.ASSIGN_TO_CLOSED_MATTER };
    }
  }

  return { valid: true };
}

// ============================================
// Interest Rate Validation
// ============================================
export function validateRate(rate: number): { valid: boolean; error?: string } {
  if (isNaN(rate)) {
    return { valid: false, error: 'Rate must be a valid number' };
  }

  if (rate < 0) {
    return { valid: false, error: 'Rate cannot be negative' };
  }

  if (rate > 50) {
    return { valid: false, error: 'Rate cannot exceed 50%' };
  }

  return { valid: true };
}

export function validateRateChangeDate(date: Date, currentDate: Date = new Date()): { valid: boolean; error?: string } {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  if (date > currentDate) {
    return { valid: false, error: ERROR_MESSAGES.RATE_CHANGE_FUTURE };
  }

  return { valid: true };
}

// ============================================
// Firm & Settings Validation
// ============================================
export function validateFirmName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Firm name is required' };
  }

  if (name.length < 2 || name.length > 200) {
    return { valid: false, error: 'Firm name must be between 2 and 200 characters' };
  }

  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  const phoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true };
}

export function validateLineOfCreditLimit(limit: number): { valid: boolean; error?: string } {
  if (isNaN(limit)) {
    return { valid: false, error: 'Limit must be a valid number' };
  }

  if (limit <= 0) {
    return { valid: false, error: 'Limit must be greater than 0' };
  }

  if (limit > 100000000) {
    return { valid: false, error: 'Limit cannot exceed $100,000,000' };
  }

  return { valid: true };
}

// ============================================
// Report & Calculator Validation
// ============================================
export function validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }

  if (startDate > endDate) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_DATE_RANGE };
  }

  return { valid: true };
}

export function validateMatterSelection(selectedMatters: string[]): { valid: boolean; error?: string } {
  if (!selectedMatters || selectedMatters.length === 0) {
    return { valid: false, error: 'At least one matter must be selected' };
  }

  if (selectedMatters.length > 100) {
    return { valid: false, error: 'Cannot select more than 100 matters at once' };
  }

  return { valid: true };
}

export function validateCalculatorInput(input: Array<{ matterId: string; amount: number }>): { valid: boolean; error?: string } {
  if (!input || input.length === 0) {
    return { valid: false, error: 'At least one matter must be added' };
  }

  for (const item of input) {
    if (item.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
  }

  return { valid: true };
}

// ============================================
// File Validation
// ============================================
export function validateLogoFile(file?: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: true }; // Logo is optional
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Logo must be a JPEG, PNG, WebP, or SVG file',
    };
  }

  // Check file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Logo file size must not exceed 2MB' };
  }

  return { valid: true };
}

export function validateCSVFile(file?: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }

  // Check file type
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must not exceed 10MB' };
  }

  return { valid: true };
}

// ============================================
// Interest Allocation Validation
// ============================================
export function validateInterestAllocation(
  autodraftAmount: number,
  totalInterestDue: number,
  unassignedTransactions: number
): { valid: boolean; error?: string } {
  if (unassignedTransactions > 0) {
    return { valid: false, error: ERROR_MESSAGES.MISSING_ALLOCATIONS };
  }

  if (autodraftAmount <= 0) {
    return { valid: false, error: 'Autodraft amount must be greater than 0' };
  }

  return { valid: true };
}

// ============================================
// Utility Validation Functions
// ============================================
export function hasValidationErrors(errors: Record<string, { valid: boolean; error?: string }>): boolean {
  return Object.values(errors).some((error) => !error.valid);
}

export function getFirstValidationError(errors: Record<string, { valid: boolean; error?: string }>): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value.valid && value.error) {
      return value.error;
    }
  }
  return null;
}

export function validateRequired(value: any, fieldName: string): { valid: boolean; error?: string } {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}
