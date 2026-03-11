// Formatting utilities for ATTY Financial Application

// ============================================
// String Utilities
// ============================================
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// ============================================
// Currency Formatting
// ============================================
export function formatCurrency(amount: number, options?: {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: options?.currency || 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

// ============================================
// Number Formatting
// ============================================
export function formatNumber(num: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(num);
}

export function formatPercentage(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value / 100);
}

export function formatRate(value: number): string {
  // Rate is stored as 8.5 for 8.5%, display as "Prime + 2.5% = 11.0%"
  return `${value.toFixed(2)}%`;
}

// ============================================
// Date Formatting
// ============================================
export function formatDate(date: Date | string, format: 'display' | 'short' | 'long' | 'input' = 'display'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions = {
    display: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' },
    input: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };

  return new Intl.DateTimeFormat('en-US', options[format]).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export function formatDaysAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return `${diffInDays} days ago`;
}

// ============================================
// Phone Number Formatting
// ============================================
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// ============================================
// Matter ID Formatting
// ============================================
export function formatMatterId(id: string): string {
  return id.toUpperCase();
}

// ============================================
// Transaction Type Formatting
// ============================================
export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    Draw: 'Draw',
    'Principal Payment': 'Principal Payment',
    'Interest Autodraft': 'Interest Payment',
  };
  return typeMap[type] || type;
}

// ============================================
// Status Badge Utilities
// ============================================
export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  const colors: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#C6F6D5', text: '#22543D' },
    Closed: { bg: '#FEEBC8', text: '#744210' },
    Archive: { bg: '#E2E8F0', text: '#4A5568' },
    Unassigned: { bg: '#FED7D7', text: '#742A2A' },
    Assigned: { bg: '#BEE3F8', text: '#2C5282' },
    Allocated: { bg: '#C6F6D5', text: '#22543D' },
    Warning: { bg: '#FEEBC8', text: '#744210' },
    Error: { bg: '#FED7D7', text: '#742A2A' },
  };
  return colors[status] || { bg: '#E2E8F0', text: '#4A5568' };
}

export function getAlertLevelColor(level: 'Warning' | 'Error'): string {
  return level === 'Warning' ? '#F6AD55' : '#FC8181';
}

// ============================================
// File Size Formatting
// ============================================
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// ============================================
// List Formatting
// ============================================
export function formatList(items: string[], conjunction: 'and' | 'or' = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}

// ============================================
// Percentage of Total
// ============================================
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function formatPercentageOfTotal(part: number, total: number): string {
  const percentage = calculatePercentage(part, total);
  return `${percentage.toFixed(1)}%`;
}

// ============================================
// Sort Utilities
// ============================================
export function sortByDate<T>(
  items: T[],
  dateKey: keyof T,
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateKey] as Date);
    const dateB = new Date(b[dateKey] as Date);
    return direction === 'asc'
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
}

export function sortByAmount<T>(
  items: T[],
  amountKey: keyof T,
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const amountA = a[amountKey] as number;
    const amountB = b[amountKey] as number;
    return direction === 'asc'
      ? amountA - amountB
      : amountB - amountA;
  });
}

// ============================================
// Validation Helpers
// ============================================
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function isValidMatterId(id: string): boolean {
  return /^[A-Za-z0-9\-_]{1,50}$/.test(id);
}

export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 999999999.99;
}

// ============================================
// Range Utilities
// ============================================
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================
// CSV Export Utilities
// ============================================

export function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = value === null || value === undefined ? '' : String(value);
        const needsQuotes = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n');
        const escapedValue = stringValue.replace(/"/g, '""');
        return needsQuotes ? `"${escapedValue}"` : escapedValue;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);

  const rows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        const stringValue = value === null || value === undefined ? '' : String(value);
        const needsQuotes = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n');
        const escapedValue = stringValue.replace(/"/g, '""');
        return needsQuotes ? `"${escapedValue}"` : escapedValue;
      }).join(',')
    ),
  ];

  return rows.join('\n');
}
