/**
 * Calculators Index
 *
 * Central export point for all calculation modules.
 *
 * @module lib/calculators
 */

export * from './dayCountCalculator';
export * from './interestCalculator';

/**
 * Calculator metadata
 */
export const CALCULATOR_VERSION = '1.0.0';
export const CALCULATOR_CREATED_AT = 'March 5, 2026';

/**
 * Supported day count conventions
 */
export const SUPPORTED_DAY_COUNT_CONVENTIONS = [
  'ACT/360',
  'ACT/365',
  '30/360',
] as const;

/**
 * Supported interest calculation types
 */
export const SUPPORTED_INTEREST_TYPES = [
  'simple',
  'compound',
  'tiered',
  'tier1',
  'tier2',
  'waterfall',
] as const;

/**
 * Supported compounding periods
 */
export const SUPPORTED_COMPOUNDING_PERIODS = [
  'daily',
  'monthly',
  'annual',
] as const;
