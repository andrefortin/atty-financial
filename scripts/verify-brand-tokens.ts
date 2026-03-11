#!/usr/bin/env tsx

/**
 * Brand Token Verification Script
 *
 * Scans source files to ensure components use design tokens correctly
 * and don't hardcode brand colors or fonts.
 *
 * @usage
 *   npx tsx scripts/verify-brand-tokens.ts
 *   npx tsx scripts/verify-brand-tokens.ts src/components
 *   npx tsx scripts/verify-brand-tokens.ts --fix
 *   npx tsx scripts/verify-brand-tokens.ts --report brand-report.json
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CONFIGURATION
// ========================================

interface BrandConfig {
  colors: Record<string, {
    hex: string;
    rgb: string;
    token: string;
    description: string;
  }>;
  fonts: Record<string, {
    name: string;
    token: string;
    description: string;
  }>;
  ignorePatterns: string[];
  fileExtensions: string[];
  tokenPatterns: Record<string, RegExp>;
}

const BRAND_CONFIG: BrandConfig = {
  colors: {
    primaryBlack: {
      hex: '#000000',
      rgb: '0, 0, 0',
      token: '--color-primary-black',
      description: 'Primary black - used for text and CTAs',
    },
    primarySand: {
      hex: '#F6F0E4',
      rgb: '246, 240, 228',
      token: '--color-primary-sand',
      description: 'Primary sand - used for backgrounds',
    },
    primaryWhite: {
      hex: '#FFFFFF',
      rgb: '255, 255, 255',
      token: '--color-primary-white',
      description: 'Primary white - used for cards',
    },
    primaryGray: {
      hex: '#BBBBBB',
      rgb: '187, 187, 187',
      token: '--color-primary-gray',
      description: 'Primary gray - used for borders',
    },
    secondaryGreen: {
      hex: '#86BF9E',
      rgb: '134, 191, 158',
      token: '--color-secondary-green',
      description: 'Secondary green - success states',
    },
    secondaryPeriwinkle: {
      hex: '#CEDBFA',
      rgb: '206, 219, 250',
      token: '--color-secondary-periwinkle',
      description: 'Secondary periwinkle - info states',
    },
    secondaryMelon: {
      hex: '#FDE276',
      rgb: '253, 226, 118',
      token: '--color-secondary-melon',
      description: 'Secondary melon - warning states',
    },
    secondaryYellow: {
      hex: '#F1F698',
      rgb: '241, 246, 152',
      token: '--color-secondary-yellow',
      description: 'Secondary yellow - accent highlights',
    },
  },
  fonts: {
    lato: {
      name: 'Lato',
      token: '--font-family-base',
      description: 'Primary font family',
    },
    inter: {
      name: 'Inter',
      token: 'N/A',
      description: 'Legacy font - should be replaced with Lato',
    },
  },
  ignorePatterns: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.git/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/__tests__/**',
    '**/vendor/**',
    '**/public/**',
  ],
  fileExtensions: ['tsx', 'ts', 'jsx', 'js', 'css', 'scss'],
};

// Legacy colors to check for
const LEGACY_COLORS = [
  { hex: '#1E3A5F', name: 'Navy (legacy)' },
  { hex: '#2D5B87', name: 'Blue (legacy)' },
  { hex: '#4FD1C5', name: 'Teal (legacy)' },
  { hex: '#48BB78', name: 'Legacy Green' },
  { hex: '#F6AD55', name: 'Legacy Orange' },
];

// ========================================
// TYPES
// ========================================

interface Violation {
  type: 'hardcoded-color' | 'hardcoded-font' | 'legacy-color' | 'missing-token' | 'inconsistent-naming';
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column?: number;
  message: string;
  suggestion: string;
  code?: string;
}

interface FileResult {
  path: string;
  violations: Violation[];
  stats: {
    totalLines: number;
    violations: number;
    errors: number;
    warnings: number;
  };
}

interface Report {
  summary: {
    totalFiles: number;
    totalViolations: number;
    totalErrors: number;
    totalWarnings: number;
    filesWithViolations: number;
  };
  files: FileResult[];
  timestamp: string;
  config: BrandConfig;
}

// ========================================
// FILE SCANNER
// ========================================

function shouldIgnore(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return BRAND_CONFIG.ignorePatterns.some(pattern => {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    );
    return regex.test(normalizedPath);
  });
}

async function scanFiles(directories: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const dir of directories) {
    const patterns = BRAND_CONFIG.fileExtensions.map(ext =>
      path.join(dir, `**/*.${ext}`)
    );

    for (const pattern of patterns) {
      const matched = await glob(pattern, {
        ignore: BRAND_CONFIG.ignorePatterns,
        absolute: true,
      });
      files.push(...matched);
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

function analyzeFile(filePath: string): FileResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];

  // Check for hardcoded colors
  violations.push(...checkHardcodedColors(filePath, lines));

  // Check for hardcoded fonts
  violations.push(...checkHardcodedFonts(filePath, lines));

  // Check for legacy colors
  violations.push(...checkLegacyColors(filePath, lines));

  // Check for inconsistent naming in comments
  violations.push(...checkInconsistentNaming(filePath, lines));

  return {
    path: filePath,
    violations,
    stats: {
      totalLines: lines.length,
      violations: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
    },
  };
}

function checkHardcodedColors(filePath: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for hex colors (#RRGGBB or #RGB)
    const hexMatches = line.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g);

    if (hexMatches) {
      hexMatches.forEach(hex => {
        // Normalize hex to uppercase for comparison
        const normalizedHex = hex.toUpperCase();

        // Check if it's a brand color
        const brandColor = Object.values(BRAND_CONFIG.colors).find(
          c => c.hex.toUpperCase() === normalizedHex
        );

        if (brandColor) {
          // Skip if already using token (e.g., within var() comment or already migrated)
          if (line.includes('var(') || line.includes(brandColor.token)) {
            return;
          }

          violations.push({
            type: 'hardcoded-color',
            severity: 'error',
            file: filePath,
            line: lineNumber,
            message: `Hardcoded brand color: ${hex}`,
            suggestion: `Use CSS variable: ${brandColor.token} or import from tokens: colors.${getColorKeyName(brandColor)}`,
            code: line.trim(),
          });
        }
      });
    }

    // Check for RGB colors
    const rgbMatches = line.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi);

    if (rgbMatches) {
      rgbMatches.forEach(rgb => {
        const numbers = rgb.match(/\d+/g);
        if (numbers) {
          const rgbString = numbers.join(', ');
          const brandColor = Object.values(BRAND_CONFIG.colors).find(
            c => c.rgb === rgbString
          );

          if (brandColor) {
            if (line.includes('var(') || line.includes(brandColor.token)) {
              return;
            }

            violations.push({
              type: 'hardcoded-color',
              severity: 'error',
              file: filePath,
              line: lineNumber,
              message: `Hardcoded brand color: ${rgb}`,
              suggestion: `Use CSS variable: ${brandColor.token}`,
              code: line.trim(),
            });
          }
        }
      });
    }
  });

  return violations;
}

function checkHardcodedFonts(filePath: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for font-family declarations
    const fontMatches = line.match(/font-family\s*:\s*([^;]+)/gi);

    if (fontMatches) {
      fontMatches.forEach(match => {
        const fontFamily = match.split(':')[1]?.trim();

        if (fontFamily) {
          // Check for hardcoded Inter
          if (fontFamily.includes('Inter')) {
            violations.push({
              type: 'hardcoded-font',
              severity: 'error',
              file: filePath,
              line: lineNumber,
              message: 'Hardcoded font: Inter (legacy)',
              suggestion: 'Use Lato font via CSS variable: --font-family-base or --font-family-heading',
              code: line.trim(),
            });
          }

          // Check for hardcoded Lato without token
          if (fontFamily.includes('Lato') && !line.includes('var(')) {
            violations.push({
              type: 'hardcoded-font',
              severity: 'warning',
              file: filePath,
              line: lineNumber,
              message: 'Hardcoded font: Lato',
              suggestion: 'Use CSS variable: --font-family-base or --font-family-heading',
              code: line.trim(),
            });
          }
        }
      });
    }

    // Check for Google Fonts import with Inter
    if (line.includes('fonts.googleapis.com') && line.includes('Inter')) {
      violations.push({
        type: 'hardcoded-font',
        severity: 'error',
        file: filePath,
        line: lineNumber,
        message: 'Google Fonts import using Inter (legacy)',
        suggestion: 'Update import to use Lato: https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap',
        code: line.trim(),
      });
    }
  });

  return violations;
}

function checkLegacyColors(filePath: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    LEGACY_COLORS.forEach(legacy => {
      if (line.includes(legacy.hex) && !line.includes('// legacy')) {
        violations.push({
          type: 'legacy-color',
          severity: 'error',
          file: filePath,
          line: lineNumber,
          message: `Legacy color detected: ${legacy.name} (${legacy.hex})`,
          suggestion: 'Replace with appropriate brand token from ATTY Financial color palette',
          code: line.trim(),
        });
      }
    });
  });

  return violations;
}

function checkInconsistentNaming(filePath: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];

  // Check for old color names in comments
  const oldNames = ['navy', 'deep navy', 'medium blue', 'light teal'];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      oldNames.forEach(oldName => {
        if (line.toLowerCase().includes(oldName)) {
          violations.push({
            type: 'inconsistent-naming',
            severity: 'info',
            file: filePath,
            line: lineNumber,
            message: `Legacy color name in comment: "${oldName}"`,
            suggestion: 'Update to use current brand color names (Black, Sand, White, Gray, Green, Periwinkle, Melon, Yellow)',
            code: line.trim(),
          });
        }
      });
    }
  });

  return violations;
}

function getColorKeyName(color: { hex: string; token: string }): string {
  const entry = Object.entries(BRAND_CONFIG.colors).find(
    ([_, c]) => c.token === color.token
  );
  return entry ? entry[0] : 'unknown';
}

// ========================================
// REPORTING
// ========================================

function printResults(results: FileResult[]): void {
  const totalViolations = results.reduce((sum, r) => sum + r.stats.violations, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.stats.errors, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.stats.warnings, 0);
  const filesWithViolations = results.filter(r => r.stats.violations > 0).length;

  console.log('\n' + '='.repeat(80));
  console.log('BRAND TOKEN VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Files Scanned: ${results.length}`);
  console.log(`   Files with Violations: ${filesWithViolations}`);
  console.log(`   Total Violations: ${totalViolations}`);
  console.log(`   - Errors: ${totalErrors}`);
  console.log(`   - Warnings: ${totalWarnings}`);
  console.log('');

  if (filesWithViolations === 0) {
    console.log('✅ No violations found! All files are using brand tokens correctly.\n');
    return;
  }

  // Group violations by file
  results.forEach(result => {
    if (result.violations.length === 0) return;

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📄 ${path.relative(process.cwd(), result.path)}`);
    console.log(`   ${result.violations.length} violation(s)`);

    // Group by severity
    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');
    const infos = result.violations.filter(v => v.severity === 'info');

    if (errors.length > 0) {
      console.log(`\n   ❌ Errors (${errors.length}):`);
      errors.forEach(v => printViolation(v, '   '));
    }

    if (warnings.length > 0) {
      console.log(`\n   ⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(v => printViolation(v, '   '));
    }

    if (infos.length > 0) {
      console.log(`\n   ℹ️  Info (${infos.length}):`);
      infos.forEach(v => printViolation(v, '   '));
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('For detailed information, see: docs/brand/README.md');
  console.log('='.repeat(80) + '\n');
}

function printViolation(violation: Violation, indent: string): void {
  const icon = violation.severity === 'error' ? '❌' : '⚠️ ';
  console.log(`${indent}${icon} Line ${violation.line}: ${violation.message}`);
  console.log(`${indent}   💡 ${violation.suggestion}`);
  if (violation.code) {
    console.log(`${indent}   📝 ${violation.code}`);
  }
}

function generateJsonReport(results: FileResult[]): string {
  const report: Report = {
    summary: {
      totalFiles: results.length,
      totalViolations: results.reduce((sum, r) => sum + r.stats.violations, 0),
      totalErrors: results.reduce((sum, r) => sum + r.stats.errors, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.stats.warnings, 0),
      filesWithViolations: results.filter(r => r.stats.violations > 0).length,
    },
    files: results,
    timestamp: new Date().toISOString(),
    config: BRAND_CONFIG,
  };

  return JSON.stringify(report, null, 2);
}

// ========================================
// AUTO-FIX
// ========================================

function applyFixes(filePath: string, violations: Violation[]): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  violations.forEach(violation => {
    if (violation.type === 'hardcoded-color') {
      // Find the brand color
      const brandColor = Object.values(BRAND_CONFIG.colors).find(c =>
        violation.message.includes(c.hex)
      );

      if (brandColor && violation.code) {
        // Replace hex with token
        const regex = new RegExp(brandColor.hex.replace(/#/g, '#'), 'g');
        const newContent = content.replace(regex, `var(${brandColor.token})`);

        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }

    if (violation.type === 'hardcoded-font' && violation.message.includes('Inter')) {
      // Replace Inter with Lato
      const newContent = content.replace(/Inter/g, 'Lato');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }

  return false;
}

// ========================================
// CLI INTERFACE
// ========================================

interface CliArgs {
  directories: string[];
  fix: boolean;
  report?: string;
  verbose: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const directories: string[] = [];
  let fix = false;
  let report: string | undefined;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--fix' || arg === '-f') {
      fix = true;
    } else if (arg === '--report' || arg === '-r') {
      report = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg.startsWith('--')) {
      console.warn(`Unknown option: ${arg}`);
    } else {
      directories.push(arg);
    }
  }

  return { directories, fix, report, verbose };
}

// ========================================
// MAIN
// ========================================

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Default to src directory if none specified
  const directories = args.directories.length > 0
    ? args.directories
    : ['src'];

  console.log(`\n🔍 Scanning directories: ${directories.join(', ')}`);

  if (args.fix) {
    console.log('🔧 Auto-fix mode enabled');
  }

  const startTime = Date.now();

  // Scan files
  const files = await scanFiles(directories);

  if (args.verbose) {
    console.log(`📁 Found ${files.length} files to scan`);
  }

  // Analyze files
  const results = files.map(analyzeFile);

  // Print results
  printResults(results);

  // Generate report if requested
  if (args.report) {
    const reportPath = path.resolve(args.report);
    const reportData = generateJsonReport(results);
    fs.writeFileSync(reportPath, reportData, 'utf-8');
    console.log(`📊 Report saved to: ${reportPath}\n`);
  }

  // Apply fixes if requested
  if (args.fix) {
    console.log('\n🔧 Applying fixes...\n');
    let fixedCount = 0;

    results.forEach(result => {
      if (result.violations.length > 0) {
        if (applyFixes(result.path, result.violations)) {
          fixedCount++;
        }
      }
    });

    console.log(`\n✅ Fixed ${fixedCount} file(s)\n`);
  }

  const duration = Date.now() - startTime;
  console.log(`⏱️  Completed in ${duration}ms\n`);

  // Exit with error code if violations found
  const hasErrors = results.some(r => r.stats.errors > 0);
  if (hasErrors) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
