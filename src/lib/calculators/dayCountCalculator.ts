/**
 * Day Count Convention Calculator
 *
 * Calculates the number of days between two dates using various
 * day count conventions commonly used in financial applications:
 * - ACT/360 (Actual/360)
 * - ACT/365 (Actual/365)
 * - 30/360 (30-day months / 360-day year)
 *
 * @module lib/calculators/dayCountCalculator
 */

/**
 * Day count convention types
 */
export type DayCountConvention = 'ACT/360' | 'ACT/365' | '30/360';

/**
 * Day count result
 */
export interface DayCountResult {
  days: number;
  convention: DayCountConvention;
  startDate: Date;
  endDate: Date;
}

/**
 * Holiday interface for holiday calculations
 */
export interface Holiday {
  date: Date;
  name: string;
}

/**
 * Calculator options
 */
export interface DayCountCalculatorOptions {
  /**
   * Whether to include end date in the count (default: true)
   */
  includeEndDate?: boolean;

  /**
   * Holidays to exclude from count (optional)
   */
  holidays?: Holiday[];

  /**
   * Day of week for business day counting (optional)
   * If provided, only counts business days (Monday-Friday)
   */
  businessDays?: {
    startDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
    endDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  };
}

// ============================================
// Constants
// ============================================

const DAYS_PER_MONTH = {
  '30/360': 30,
  'ACT/360': 30.416666666666668, // 360 / 12
  'ACT/365': 30.4375, // 365 / 12
  '30/365': 30.416666666666668, // 365 / 12
} as const;

const DAYS_PER_YEAR = {
  '30/360': 360,
  'ACT/360': 360,
  'ACT/365': 365,
  '30/365': 360, // Simplified to 360 for consistency
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is a business day
 */
function isBusinessDay(date: Date, options?: DayCountCalculatorOptions): boolean {
  // If no business days specified, assume all days are business days
  if (!options?.businessDays) {
    return true;
  }

  // Check if it's a weekend
  if (isWeekend(date)) {
    return false;
  }

  // Check if it's within business day range
  const dayOfWeek = date.getDay();
  const startDay = options.businessDays!.startDay;
  const endDay = options.businessDays!.endDay;

  // Handle wrap-around (e.g., Friday to Monday)
  if (startDay <= endDay) {
    return dayOfWeek >= startDay && dayOfWeek <= endDay;
  } else {
    return dayOfWeek >= startDay || dayOfWeek <= endDay;
  }
}

/**
 * Check if a date is a holiday
 */
function isHoliday(date: Date, options?: DayCountCalculatorOptions): boolean {
  if (!options?.holidays || options.holidays.length === 0) {
    return false;
  }

  const dateStr = date.toISOString().split('T')[0];
  return options.holidays.some((holiday) => {
    const holidayStr = holiday.date.toISOString().split('T')[0];
    return holidayStr === dateStr;
  });
}

/**
 * Check if a date is a business day (not weekend and not holiday)
 */
function isBusinessDayOrHoliday(date: Date, options?: DayCountCalculatorOptions): boolean {
  return !isWeekend(date) && !isHoliday(date, options);
}

/**
 * Check if a date is a business day or the end date
 */
function isCountableDay(date: Date, options?: DayCountCalculatorOptions): boolean {
  const isBusiness = isBusinessDay(date, options);
  const isHolidayDay = isHoliday(date, options);
  const isEnd = options?.includeEndDate !== false && date.getTime() === options?.endDate?.getTime();

  // Include end date if it's a business day
  if (isEnd && isBusiness) {
    return true;
  }

  // Count business days, not holidays or weekends
  if (isBusiness && !isHolidayDay) {
    return true;
  }

  return false;
}

/**
 * Normalize dates to midnight (start of day)
 */
function toMidnight(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

// ============================================
// ACT/360 Convention
// ============================================

/**
 * Calculate days using Actual/360 convention
 *
 * Actual means if a year is 366 days, it's treated as 360 for calculation
 * Month is treated as 30 days regardless of actual length
 */
export function calculateDaysACT360(
  startDate: Date,
  endDate: Date,
  options?: DayCountCalculatorOptions
): DayCountResult {
  const start = toMidnight(startDate);
  const end = options?.includeEndDate !== false
    ? toMidnight(endDate)
    : toMidnight(new Date(endDate.getTime() - 86400000)); // Exclude end date if not included

  let days = 0;

  // Calculate full years
  let current = new Date(start);
  while (current < end) {
    const year = current.getFullYear();
    const daysInYear = isLeapYear(year) ? 366 : 365;

    // Treat leap years as 365 for ACT/360 convention
    const adjustedDaysInYear = 365;

    const nextYear = new Date(year + 1, 0, 1);

    if (nextYear > end) {
      days += Math.min(
        Math.floor((end.getTime() - current.getTime()) / 86400000),
        adjustedDaysInYear
      );
      current = nextYear;
      break;
    }

    days += adjustedDaysInYear;
    current = nextYear;
  }

  // Calculate remaining partial year
  if (current <= end) {
    const remainingDays = Math.floor(
      (end.getTime() - current.getTime()) / 86400000
    );
    days += remainingDays;
  }

  // Apply business days filter if specified
  if (options?.businessDays || options?.holidays) {
    let businessDays = 0;
    let countableDay = new Date(start);

    while (countableDay <= end) {
      if (isCountableDay(countableDay, options)) {
        businessDays++;
      }

      countableDay = new Date(countableDay.getTime() + 86400000); // Add 1 day
    }

    // Business day count cannot exceed total calendar days
    return {
      days: Math.min(businessDays, days),
      convention: 'ACT/360',
      startDate,
      endDate,
    };
  }

  return {
    days,
    convention: 'ACT/360',
    startDate,
    endDate,
  };
}

// ============================================
// ACT/365 Convention
// ============================================

/**
 * Calculate days using Actual/365 convention
 *
 * Actual means each day is counted as-is, including leap years
 */
export function calculateDaysACT365(
  startDate: Date,
  endDate: Date,
  options?: DayCountCalculatorOptions
): DayCountResult {
  const start = toMidnight(startDate);
  const end = toMidnight(endDate);

  const diffTime = end.getTime() - start.getTime();
  const days = Math.floor(diffTime / 86400000);

  // Apply business days filter if specified
  if (options?.businessDays || options?.holidays) {
    let businessDays = 0;
    let countableDay = new Date(start);

    while (countableDay <= end) {
      if (isCountableDay(countableDay, options)) {
        businessDays++;
      }

      countableDay = new Date(countableDay.getTime() + 86400000); // Add 1 day
    }

    // Business day count cannot exceed total calendar days
    return {
      days: Math.min(businessDays, days),
      convention: 'ACT/365',
      startDate,
      endDate,
    };
  }

  return {
    days,
    convention: 'ACT/365',
    startDate,
    endDate,
  };
}

// ============================================
// 30/360 Convention
// ============================================

/**
 * Calculate days using 30/360 convention
 *
 * Each month is treated as 30 days, year as 360 days
 */
export function calculateDays30360(
  startDate: Date,
  endDate: Date,
  options?: DayCountCalculatorOptions
): DayCountResult {
  const start = toMidnight(startDate);
  const end = toMidnight(endDate);

  let days = 0;
  let current = new Date(start);

  while (current < end) {
    const month = current.getMonth();
    const year = current.getFullYear();
    const daysInMonth = DAYS_PER_MONTH['30/360'];

    const nextMonth = new Date(year, month + 1, 1);

    if (nextMonth > end) {
      const remainingDays = Math.floor(
        (end.getTime() - current.getTime()) / 86400000
      );
      days += remainingDays;
      break;
    }

    days += daysInMonth;
    current = nextMonth;
  }

  // Calculate remaining partial month
  if (current <= end) {
    const remainingDays = Math.floor(
      (end.getTime() - current.getTime()) / 86400000
    );
    days += remainingDays;
  }

  // Apply business days filter if specified
  if (options?.businessDays || options?.holidays) {
    let businessDays = 0;
    let countableDay = new Date(start);

    while (countableDay <= end) {
      if (isCountableDay(countableDay, options)) {
        businessDays++;
      }

      countableDay = new Date(countableDay.getTime() + 86400000); // Add 1 day
    }

    // Business day count cannot exceed total calendar days
    return {
      days: Math.min(businessDays, days),
      convention: '30/360',
      startDate,
      endDate,
    };
  }

  return {
    days,
    convention: '30/360',
    startDate,
    endDate,
  };
}

// ============================================
// General Day Count Function
// ============================================

/**
 * Calculate days using specified convention
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param convention - Day count convention to use
 * @param options - Calculator options
 * @returns Day count result
 */
export function calculateDays(
  startDate: Date,
  endDate: Date,
  convention: DayCountConvention,
  options?: DayCountCalculatorOptions
): DayCountResult {
  switch (convention) {
    case 'ACT/360':
      return calculateDaysACT360(startDate, endDate, options);

    case 'ACT/365':
      return calculateDaysACT365(startDate, endDate, options);

    case '30/360':
      return calculateDays30360(startDate, endDate, options);

    default:
      throw new Error(`Unknown day count convention: ${convention}`);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Add days to a date
 */
export function addDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate fraction of a year based on convention
 */
export function getYearFraction(
  year: number,
  convention: DayCountConvention
): number {
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const adjustedDaysInYear = convention === 'ACT/360' ? 365 : daysInYear;

  // Determine month progress
  const date = new Date(year, 11, 1); // November 1st
  const month = date.getMonth(); // October
  const dayOfMonth = date.getDate(); // 1

  // Calculate how many days have passed in the year
  const daysPassed = new Date(year, month, dayOfMonth).getTime() -
    new Date(year, 0, 1).getTime();
  const daysPassedInYear = Math.floor(daysPassed / 86400000);

  return daysPassedInYear / adjustedDaysInYear;
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) ||
         (year % 100 === 0 && year % 400 === 0);
}

/**
 * Get number of days in a year based on convention
 */
export function getDaysInYear(
  year: number,
  convention: DayCountConvention
): number {
  if (convention === 'ACT/360' || convention === '30/360') {
    return 360;
  }

  return isLeapYear(year) ? 366 : 365;
}

/**
 * Get number of days in a month based on convention
 */
export function getDaysInMonth(
  year: number,
  month: number,
  convention: DayCountConvention
): number {
  if (convention === '30/360') {
    return DAYS_PER_MONTH['30/360'];
  }

  const isLeap = isLeapYear(year);
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];

  // Adjust February for leap year
  if (isLeap && month === 1) {
    return 29;
  }

  // For ACT/360 and ACT/365, use actual days but simplify for calculation
  if (convention === 'ACT/360') {
    // Each month is treated as 30.416666... days
    return DAYS_PER_MONTH['ACT/360'];
  }

  if (convention === 'ACT/365') {
    // Each month is treated as 30.4375 days
    return DAYS_PER_MONTH['ACT/365'];
  }

  return daysInMonth;
}

/**
 * Calculate day fraction for a period
 */
export function calculateDayFraction(
  startDate: Date,
  endDate: Date,
  convention: DayCountConvention,
  options?: DayCountCalculatorOptions
): number {
  const result = calculateDays(startDate, endDate, convention, options);

  const start = toMidnight(startDate);
  const end = toMidnight(endDate);

  const diffTime = end.getTime() - start.getTime();
  const year = start.getFullYear();

  const daysInYear = getDaysInYear(year, convention);
  const yearFraction = getYearFraction(year, convention);

  // Calculate fraction of year
  const totalDays = daysInYear * yearFraction;
  const yearDays = Math.floor(totalDays);
  const remainingDays = totalDays - yearDays;

  return yearDays + remainingDays;
}

/**
 * Calculate day fraction for multiple periods
 */
export function calculateDayFractionRange(
  startDate: Date,
  endDate: Date,
  convention: DayCountConvention,
  options?: DayCountCalculatorOptions
): number {
  const result = calculateDays(startDate, endDate, convention, options);
  return result.days;
}

// ============================================
// Common US Business Holidays (2024)
// ============================================

/**
 * US Federal holidays for 2024
 */
export const US_HOLIDAYS_2024: Holiday[] = [
  {
    date: new Date(2024, 0, 1),
    name: 'New Year\'s Day',
  },
  {
    date: new Date(2024, 0, 15),
    name: 'Martin Luther King Jr. Day',
  },
  {
    date: new Date(2024, 1, 19),
    name: 'Presidents\' Day',
  },
  {
    date: new Date(2024, 5, 27),
    name: 'Memorial Day',
  },
  {
    date: new Date(2024, 6, 19),
    name: 'Juneteenth',
  },
  {
    date: new Date(2024, 7, 4),
    name: 'Independence Day',
  },
  {
    date: new Date(2024, 9, 2),
    name: 'Labor Day',
  },
  {
    date: new Date(2024, 11, 11),
    name: 'Veterans Day',
  },
  {
    date: new Date(2024, 11, 28),
    name: 'Thanksgiving Day',
  },
  {
    date: new Date(2024, 12, 25),
    name: 'Christmas Day',
  },
];

/**
 * US Federal holidays for 2025 (projected)
 */
export const US_HOLIDAYS_2025: Holiday[] = [
  {
    date: new Date(2025, 0, 1),
    name: 'New Year\'s Day',
  },
  {
    date: new Date(2025, 0, 20),
    name: 'Martin Luther King Jr. Day',
  },
  {
    date: new Date(2025, 2, 17),
    name: 'Presidents\' Day',
  },
  {
    date: new Date(2025, 5, 26),
    name: 'Memorial Day',
  },
  {
    date: new Date(2025, 6, 19),
    name: 'Juneteenth',
  },
  {
    date: new Date(2025, 7, 4),
    name: 'Independence Day',
  },
  {
    date: new Date(2025, 9, 1),
    name: 'Labor Day',
  },
  {
    date: new Date(2025, 11, 11),
    name: 'Veterans Day',
  },
  {
    date: new Date(2025, 11, 27),
    name: 'Thanksgiving Day',
  },
  {
    date: new Date(2025, 12, 25),
    name: 'Christmas Day',
  },
];

/**
 * Get holidays for a year
 */
export function getHolidaysForYear(year: number): Holiday[] {
  if (year === 2024) {
    return US_HOLIDAYS_2024;
  }

  if (year === 2025) {
    return US_HOLIDAYS_2025;
  }

  return [];
}

/**
 * Get all holidays in a date range
 */
export function getHolidaysInRange(
  startDate: Date,
  endDate: Date
): Holiday[] {
  const holidays: [...US_HOLIDAYS_2024, ...US_HOLIDAYS_2025];
  const start = toMidnight(startDate);
  const end = toMidnight(endDate);

  return holidays.filter((holiday) => {
    const holidayDate = toMidnight(holiday.date);
    return holidayDate >= start && holidayDate <= end;
  });
}
