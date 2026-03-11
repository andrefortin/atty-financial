#!/usr/bin/env tsx

/**
 * Environment Variable Validator
 *
 * Validates that all required environment variables are set and properly formatted.
 * Supports validation for different environments (development, staging, production).
 *
 * Usage:
 *   tsx scripts/validate-env.ts              # Validate current environment
 *   tsx scripts/validate-env.ts production  # Validate production environment
 *   tsx scripts/validate-env.ts --check     # Only check, exit with error if invalid
 *   tsx scripts/validate-env.ts --list      # List all required variables
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ==============================================================================
// Types
// ==============================================================================

interface EnvVarSchema {
  name: string;
  required: boolean;
  environments: ('development' | 'staging' | 'production')[];
  format?: RegExp;
  description: string;
  defaultValue?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
}

// ==============================================================================
// Environment Variable Schemas
// ==============================================================================

const REQUIRED_ENV_VARS: EnvVarSchema[] = [
  // Firebase Configuration
  {
    name: 'VITE_FIREBASE_API_KEY',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^AIza[A-Za-z0-9_-]{35}$/,
    description: 'Firebase API key (must be a valid Firebase API key)',
  },
  {
    name: 'VITE_FIREBASE_AUTH_DOMAIN',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^[a-z0-9-]+\.firebaseapp\.com$/,
    description: 'Firebase auth domain (format: project-id.firebaseapp.com)',
  },
  {
    name: 'VITE_FIREBASE_PROJECT_ID',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^[a-z0-9-]+$/,
    description: 'Firebase project ID',
  },
  {
    name: 'VITE_FIREBASE_STORAGE_BUCKET',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^[a-z0-9-]+\.firebasestorage\.app$/,
    description: 'Firebase storage bucket (format: project-id.appspot.com)',
  },
  {
    name: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^\d+$/,
    description: 'Firebase messaging sender ID (numeric)',
  },
  {
    name: 'VITE_FIREBASE_APP_ID',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^\d+:\d+:[a-z0-9]+:[a-z0-9-]+$/,
    description: 'Firebase app ID (format: 1:123456789:web:abc123)',
  },
  {
    name: 'VITE_FIREBASE_MEASUREMENT_ID',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^G-[A-Z0-9]+$/,
    description: 'Firebase Analytics measurement ID (format: G-XXXXXXXX)',
  },
  {
    name: 'VITE_FIREBASE_USE_EMULATOR',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Whether to use Firebase emulator',
    defaultValue: 'false',
  },
  {
    name: 'VITE_FIREBASE_ANALYTICS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Whether to enable Firebase Analytics',
    defaultValue: 'true',
  },

  // BankJoy API Configuration
  {
    name: 'VITE_BANKJOY_API_URL',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^https?:\/\/[a-z0-9.-]+(\:[0-9]+)?(\/.*)?$/,
    description: 'BankJoy API base URL (must be HTTPS in production)',
  },
  {
    name: 'VITE_BANKJOY_API_KEY',
    required: true,
    environments: ['development', 'staging', 'production'],
    description: 'BankJoy API key',
  },
  {
    name: 'VITE_BANKJOY_API_TIMEOUT',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^\d+$/,
    description: 'BankJoy API timeout in milliseconds',
    defaultValue: '30000',
  },
  {
    name: 'VITE_BANKJOY_MAX_RETRIES',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^\d+$/,
    description: 'Maximum number of retries for BankJoy API calls',
    defaultValue: '3',
  },
  {
    name: 'VITE_BANKJOY_RATE_LIMIT_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Whether to enable rate limiting for BankJoy API',
    defaultValue: 'true',
  },

  // Feature Flags
  {
    name: 'VITE_FEATURE_BANK_INTEGRATION_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable bank integration feature',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_AUTO_ALLOCATE_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable auto-allocation feature',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_EMAIL_NOTIFICATIONS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable email notifications',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_SSO_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable single sign-on',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_MULTI_TENANT_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable multi-tenant support',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_ADVANCED_REPORTING_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable advanced reporting',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_API_ACCESS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable API access',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_WEBHOOKS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable webhooks',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_BULK_IMPORT_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable bulk import',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_CUSTOM_FIELDS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable custom fields',
    defaultValue: 'true',
  },
  {
    name: 'VITE_FEATURE_AI_INSIGHTS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable AI insights (beta feature)',
    defaultValue: 'false',
  },
  {
    name: 'VITE_FEATURE_PREDICTIVE_ANALYTICS_ENABLED',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable predictive analytics (beta feature)',
    defaultValue: 'false',
  },

  // Analytics Configuration
  {
    name: 'VITE_GA4_MEASUREMENT_ID',
    required: false,
    environments: ['staging', 'production'],
    format: /^G-[A-Z0-9]+$/,
    description: 'Google Analytics 4 measurement ID',
  },
  {
    name: 'VITE_SEGMENT_WRITE_KEY',
    required: false,
    environments: ['staging', 'production'],
    description: 'Segment analytics write key',
  },
  {
    name: 'VITE_MIXPANEL_TOKEN',
    required: false,
    environments: ['staging', 'production'],
    description: 'Mixpanel analytics token',
  },

  // API Configuration
  {
    name: 'VITE_API_URL',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^https?:\/\/[a-z0-9.-]+(\:[0-9]+)?(\/.*)?$/,
    description: 'API base URL (must be HTTPS in production)',
  },
  {
    name: 'VITE_API_TIMEOUT',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^\d+$/,
    description: 'API timeout in milliseconds',
    defaultValue: '30000',
  },

  // Application Configuration
  {
    name: 'VITE_APP_ENV',
    required: true,
    environments: ['development', 'staging', 'production'],
    format: /^(development|staging|production)$/,
    description: 'Application environment',
    defaultValue: 'development',
  },
  {
    name: 'VITE_APP_VERSION',
    required: false,
    environments: ['development', 'staging', 'production'],
    description: 'Application version',
    defaultValue: '1.0.0',
  },

  // Security Configuration
  {
    name: 'VITE_CSP_ENABLED',
    required: false,
    environments: ['staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable Content Security Policy',
    defaultValue: 'true',
  },
  {
    name: 'VITE_X_FRAME_OPTIONS',
    required: false,
    environments: ['staging', 'production'],
    description: 'X-Frame-Options header value',
  },
  {
    name: 'VITE_CONTENT_SECURITY_POLICY',
    required: false,
    environments: ['staging', 'production'],
    description: 'Content Security Policy header value',
  },

  // Performance Configuration
  {
    name: 'VITE_ENABLE_SERVICE_WORKER',
    required: false,
    environments: ['staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable service worker',
    defaultValue: 'true',
  },
  {
    name: 'VITE_CACHE_STRATEGY',
    required: false,
    environments: ['staging', 'production'],
    description: 'Cache strategy (network-first, cache-first, stale-while-revalidate)',
  },
  {
    name: 'VITE_OFFLINE_ENABLED',
    required: false,
    environments: ['staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable offline support',
    defaultValue: 'true',
  },

  // Logging & Monitoring
  {
    name: 'VITE_SENTRY_DSN',
    required: false,
    environments: ['staging', 'production'],
    description: 'Sentry DSN for error tracking',
  },
  {
    name: 'VITE_SENTRY_ENVIRONMENT',
    required: false,
    environments: ['staging', 'production'],
    description: 'Sentry environment name',
  },
  {
    name: 'VITE_LOG_LEVEL',
    required: false,
    environments: ['development', 'staging', 'production'],
    format: /^(debug|info|warn|error)$/,
    description: 'Log level',
    defaultValue: 'info',
  },

  // Rate Limiting
  {
    name: 'VITE_RATE_LIMIT_ENABLED',
    required: false,
    environments: ['staging', 'production'],
    format: /^(true|false)$/,
    description: 'Enable rate limiting',
    defaultValue: 'true',
  },
  {
    name: 'VITE_RATE_LIMIT_MAX_REQUESTS',
    required: false,
    environments: ['staging', 'production'],
    format: /^\d+$/,
    description: 'Maximum requests per window',
    defaultValue: '100',
  },
  {
    name: 'VITE_RATE_LIMIT_WINDOW_MS',
    required: false,
    environments: ['staging', 'production'],
    format: /^\d+$/,
    description: 'Rate limit window in milliseconds',
    defaultValue: '60000',
  },

  // Content Delivery
  {
    name: 'VITE_CDN_URL',
    required: false,
    environments: ['production'],
    format: /^https?:\/\/[a-z0-9.-]+(\:[0-9]+)?(\/.*)?$/,
    description: 'CDN base URL',
  },
  {
    name: 'VITE_ASSET_VERSION',
    required: false,
    environments: ['production'],
    description: 'Asset version for cache busting',
  },

  // Support & Documentation
  {
    name: 'VITE_SUPPORT_EMAIL',
    required: false,
    environments: ['staging', 'production'],
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Support email address',
  },
  {
    name: 'VITE_SUPPORT_PHONE',
    required: false,
    environments: ['staging', 'production'],
    description: 'Support phone number',
  },
  {
    name: 'VITE_DOCS_URL',
    required: false,
    environments: ['staging', 'production'],
    format: /^https?:\/\/[a-z0-9.-]+(\:[0-9]+)?(\/.*)?$/,
    description: 'Documentation URL',
  },
  {
    name: 'VITE_STATUS_PAGE_URL',
    required: false,
    environments: ['staging', 'production'],
    format: /^https?:\/\/[a-z0-9.-]+(\:[0-9]+)?(\/.*)?$/,
    description: 'Status page URL',
  },

  // Development & Debugging
  {
    name: 'VITE_DEBUG_MODE',
    required: false,
    environments: ['development', 'staging'],
    format: /^(true|false)$/,
    description: 'Enable debug mode',
    defaultValue: 'false',
  },
  {
    name: 'VITE_DEVTOOLS',
    required: false,
    environments: ['development', 'staging'],
    format: /^(true|false)$/,
    description: 'Enable dev tools',
    defaultValue: 'false',
  },
  {
    name: 'VITE_VERBOSE_LOGGING',
    required: false,
    environments: ['development', 'staging'],
    format: /^(true|false)$/,
    description: 'Enable verbose logging',
    defaultValue: 'false',
  },
];

// ==============================================================================
// Environment-Specific Validation Rules
// ==============================================================================

const ENVIRONMENT_RULES: Record<string, { strictness: 'strict' | 'lenient' }> = {
  development: { strictness: 'lenient' },
  staging: { strictness: 'strict' },
  production: { strictness: 'strict' },
};

// ==============================================================================
// Validation Functions
// ==============================================================================

/**
 * Load environment variables from .env file
 */
function loadEnvFile(envFile: string): Record<string, string> {
  if (!existsSync(envFile)) {
    console.warn(`Warning: Environment file ${envFile} not found`);
    return {};
  }

  const content = readFileSync(envFile, 'utf-8');
  const envVars: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Remove quotes if present
      envVars[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  return envVars;
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(
  schema: EnvVarSchema,
  envVars: Record<string, string>,
  environment: string
): { valid: boolean; error?: string } {
  // Check if variable is required for this environment
  if (!schema.environments.includes(environment as any)) {
    return { valid: true };
  }

  const value = envVars[schema.name] || schema.defaultValue;

  // Check if required variable is missing
  if (schema.required && !value) {
    return {
      valid: false,
      error: `Missing required environment variable: ${schema.name} (${schema.description})`,
    };
  }

  // If value is missing but not required, skip format validation
  if (!value) {
    return { valid: true };
  }

  // Validate format if regex is provided
  if (schema.format && !schema.format.test(value)) {
    return {
      valid: false,
      error: `Invalid format for ${schema.name}: expected to match ${schema.format.toString()} but got "${value}" (${schema.description})`,
    };
  }

  // Production-specific validation
  if (environment === 'production') {
    // Check for placeholder values
    const placeholders = ['your_', 'your-', 'YOUR_', 'example', 'test', 'mock'];
    if (placeholders.some(p => value.toLowerCase().includes(p.toLowerCase()))) {
      return {
        valid: false,
        error: `${schema.name} appears to be a placeholder value. Production values must be real values.`,
      };
    }

    // Ensure API URLs use HTTPS
    if (schema.name.includes('URL') || schema.name.includes('API')) {
      if (value.startsWith('http://') && !schema.name.includes('DEV')) {
        return {
          valid: false,
          error: `${schema.name} must use HTTPS in production`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate all environment variables
 */
function validateEnvironment(
  environment: string,
  envFile?: string
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
    invalid: [],
  };

  // Load environment variables
  let envVars: Record<string, string> = {};

  if (envFile) {
    envVars = loadEnvFile(envFile);
  } else {
    // Try to load from process.env
    envVars = { ...process.env };
  }

  // Validate each variable in the schema
  for (const schema of REQUIRED_ENV_VARS) {
    const validation = validateEnvVar(schema, envVars, environment);

    if (!validation.valid) {
      result.valid = false;
      result.errors.push(validation.error!);

      // Track missing vs invalid separately
      const value = envVars[schema.name] || schema.defaultValue;
      if (!value) {
        result.missing.push(schema.name);
      } else {
        result.invalid.push(schema.name);
      }
    }
  }

  // Check for unknown environment variables
  const knownVarNames = new Set(REQUIRED_ENV_VARS.map(v => v.name));
  const unknownVars = Object.keys(envVars).filter(
    key => !knownVarNames.has(key) && key.startsWith('VITE_')
  );

  if (unknownVars.length > 0) {
    result.warnings.push(
      `Found ${unknownVars.length} unknown environment variables: ${unknownVars.join(', ')}`
    );
  }

  // Environment-specific warnings
  if (environment === 'production') {
    const sensitiveVars = envVars.VITE_DEBUG_MODE === 'true' ||
                          envVars.VITE_VERBOSE_LOGGING === 'true' ||
                          envVars.VITE_DEVTOOLS === 'true';

    if (sensitiveVars) {
      result.warnings.push(
        'Debug mode or verbose logging is enabled in production. Consider disabling for better security.'
      );
    }
  }

  return result;
}

/**
 * List all required environment variables
 */
function listEnvironmentVariables(): void {
  console.log('\n=== Required Environment Variables ===\n');

  const categories: Record<string, EnvVarSchema[]> = {
    'Firebase Configuration': REQUIRED_ENV_VARS.filter(v => v.name.includes('FIREBASE')),
    'BankJoy API Configuration': REQUIRED_ENV_VARS.filter(v => v.name.includes('BANKJOY')),
    'Feature Flags': REQUIRED_ENV_VARS.filter(v => v.name.includes('FEATURE')),
    'Analytics': REQUIRED_ENV_VARS.filter(v => v.name.includes('GA4') || v.name.includes('SEGMENT') || v.name.includes('MIXPANEL')),
    'API Configuration': REQUIRED_ENV_VARS.filter(v => v.name.includes('API') && !v.name.includes('BANKJOY')),
    'Application Configuration': REQUIRED_ENV_VARS.filter(v => v.name.includes('APP')),
    'Security': REQUIRED_ENV_VARS.filter(v => v.name.includes('CSP') || v.name.includes('X_FRAME')),
    'Performance': REQUIRED_ENV_VARS.filter(v => v.name.includes('SERVICE_WORKER') || v.name.includes('CACHE') || v.name.includes('OFFLINE')),
    'Logging & Monitoring': REQUIRED_ENV_VARS.filter(v => v.name.includes('SENTRY') || v.name.includes('LOG')),
    'Rate Limiting': REQUIRED_ENV_VARS.filter(v => v.name.includes('RATE_LIMIT')),
    'Support & Documentation': REQUIRED_ENV_VARS.filter(v => v.name.includes('SUPPORT') || v.name.includes('DOCS') || v.name.includes('STATUS')),
    'Development & Debugging': REQUIRED_ENV_VARS.filter(v => v.name.includes('DEBUG') || v.name.includes('DEVTOOLS') || v.name.includes('VERBOSE')),
  };

  for (const [category, vars] of Object.entries(categories)) {
    if (vars.length === 0) continue;

    console.log(`\n--- ${category} ---\n`);
    for (const v of vars) {
      const required = v.required ? 'Required' : 'Optional';
      const envs = v.environments.join(', ');
      const defaultValue = v.defaultValue ? ` (default: ${v.defaultValue})` : '';
      console.log(`  ${v.name}`);
      console.log(`    - ${v.description}`);
      console.log(`    - ${required}${defaultValue}`);
      console.log(`    - Environments: ${envs}`);
      if (v.format) {
        console.log(`    - Format: ${v.format.toString()}`);
      }
      console.log('');
    }
  }
}

/**
 * Print validation results
 */
function printResults(result: ValidationResult, environment: string): void {
  console.log(`\n=== Environment Validation Results (${environment}) ===\n`);

  if (result.valid) {
    console.log('✅ All environment variables are valid!\n');
  } else {
    console.log('❌ Environment validation failed!\n');
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log('Errors:\n');
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    console.log('');
  }

  // Print missing variables
  if (result.missing.length > 0) {
    console.log(`Missing Variables (${result.missing.length}):\n`);
    for (const name of result.missing) {
      console.log(`  - ${name}`);
    }
    console.log('');
  }

  // Print invalid variables
  if (result.invalid.length > 0) {
    console.log(`Invalid Variables (${result.invalid.length}):\n`);
    for (const name of result.invalid) {
      console.log(`  - ${name}`);
    }
    console.log('');
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('Warnings:\n');
    for (const warning of result.warnings) {
      console.log(`  ⚠️  ${warning}`);
    }
    console.log('');
  }

  // Print summary
  console.log('Summary:');
  console.log(`  - Valid: ${result.valid ? 'Yes' : 'No'}`);
  console.log(`  - Errors: ${result.errors.length}`);
  console.log(`  - Warnings: ${result.warnings.length}`);
  console.log(`  - Missing: ${result.missing.length}`);
  console.log(`  - Invalid: ${result.invalid.length}`);
  console.log('');
}

// ==============================================================================
// Main
// ==============================================================================

function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let environment = process.env.VITE_APP_ENV || process.env.NODE_ENV || 'development';
  let checkOnly = false;
  let listOnly = false;
  let envFile: string | undefined;

  for (const arg of args) {
    if (arg === '--check') {
      checkOnly = true;
    } else if (arg === '--list') {
      listOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: tsx scripts/validate-env.ts [environment] [--check] [--list] [--help]');
      console.log('');
      console.log('Arguments:');
      console.log('  environment  - Environment to validate (development|staging|production)');
      console.log('  --check     - Only check, exit with error if invalid');
      console.log('  --list      - List all required environment variables');
      console.log('  --help, -h  - Show this help message');
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      environment = arg;
    }
  }

  // List mode
  if (listOnly) {
    listEnvironmentVariables();
    process.exit(0);
  }

  // Determine env file based on environment
  if (environment === 'development') {
    envFile = resolve(process.cwd(), '.env');
  } else if (environment === 'staging') {
    envFile = resolve(process.cwd(), '.env.staging');
  } else if (environment === 'production') {
    envFile = resolve(process.cwd(), '.env.production');
  }

  // Validate environment name
  if (!['development', 'staging', 'production'].includes(environment)) {
    console.error(`Error: Invalid environment "${environment}". Must be one of: development, staging, production`);
    process.exit(1);
  }

  // Run validation
  const result = validateEnvironment(environment, envFile);

  // Print results
  if (!checkOnly) {
    printResults(result, environment);
  }

  // Exit with appropriate code
  if (checkOnly) {
    process.exit(result.valid ? 0 : 1);
  } else {
    process.exit(0);
  }
}

// Run main function
main();
