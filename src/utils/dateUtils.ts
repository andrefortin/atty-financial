// Date utilities for ATTY Financial Application

// ============================================
// Date Creation & Validation
// ============================================
export function createDate(date?: string | Date): Date {
  return date ? new Date(date) : new Date();
}

export function isValidDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(d.getTime());
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

// ============================================
// Date Arithmetic
// ============================================
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days);
}

export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date: Date | string, years: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

// ============================================
// Date Differences
// ============================================
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  // Reset time to midnight for accurate day calculation
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function businessDaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  let count = 0;
  let current = new Date(Math.min(d1.getTime(), d2.getTime()));
  const end = new Date(Math.max(d1.getTime(), d2.getTime()));

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday or Saturday
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

export function getDaysSince(date: Date | string): number {
  return daysBetween(date, new Date());
}

// ============================================
// Month & Year Utilities
// ============================================
export function getMonthName(date: Date | string, format: 'long' | 'short' = 'long'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const monthsLong = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return format === 'long' ? monthsLong[d.getMonth()] : monthsShort[d.getMonth()];
}

export function getMonthNumber(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getMonth() + 1; // 1-12
}

export function getYear(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getFullYear();
}

export function getQuarter(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor(d.getMonth() / 3) + 1;
}

export function isFirstDayOfMonth(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDate() === 1;
}

export function isLastDayOfMonth(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return d.getDate() === lastDay;
}

export function getDaysInMonth(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// ============================================
// Week Utilities
// ============================================
export function getWeekNumber(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function getStartOfWeek(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(d.setDate(diff));
}

export function getEndOfWeek(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Sunday as last day
  return new Date(d.setDate(diff));
}

// ============================================
// Date Range Utilities
// ============================================
export function getDateRange(
  range: 'today' | 'yesterday' | 'last7Days' | 'last30Days' | 'last90Days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { start, end };

    case 'yesterday':
      return {
        start: subtractDays(start, 1),
        end: subtractDays(end, 1),
      };

    case 'last7Days':
      return {
        start: subtractDays(start, 7),
        end,
      };

    case 'last30Days':
      return {
        start: subtractDays(start, 30),
        end,
      };

    case 'last90Days':
      return {
        start: subtractDays(start, 90),
        end,
      };

    case 'thisMonth':
      start.setDate(1);
      return { start, end };

    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return { start: lastMonthStart, end: lastMonthEnd };

    case 'thisYear':
      start.setMonth(0, 1);
      return { start, end };

    case 'lastYear':
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      lastYearEnd.setHours(23, 59, 59, 999);
      return { start: lastYearStart, end: lastYearEnd };

    default:
      return { start, end };
  }
}

// ============================================
// Interest Calculation Date Helpers
// ============================================
export function getAct360DaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  // ACT/360: Actual number of days divided by 360
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function getNextBusinessDay(date: Date | string): Date {
  let d = typeof date === 'string' ? new Date(date) : date;
  d = addDays(d, 1);
  while (isWeekend(d)) {
    d = addDays(d, 1);
  }
  return d;
}

// ============================================
// Date Comparison
// ============================================
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isSameMonth(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

export function isSameYear(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.getFullYear() === d2.getFullYear();
}

export function isBefore(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.getTime() < d2.getTime();
}

export function isAfter(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.getTime() > d2.getTime();
}

export function isBetween(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string,
  inclusive: boolean = true
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (inclusive) {
    return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
  } else {
    return d.getTime() > start.getTime() && d.getTime() < end.getTime();
  }
}

// ============================================
// Age & Duration Utilities
// ============================================
export function getAge(birthDate: Date | string): number {
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

export function getDuration(date1: Date | string, date2: Date | string): string {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    const remainingMonths = diffMonths - diffYears * 12;
    return remainingMonths > 0 ? `${diffYears}y ${remainingMonths}m` : `${diffYears}y`;
  } else if (diffMonths > 0) {
    const remainingDays = diffDays - diffMonths * 30;
    return remainingDays > 0 ? `${diffMonths}m ${remainingDays}d` : `${diffMonths}m`;
  } else {
    return `${diffDays}d`;
  }
}
