import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ==============================================================================
// Environment-specific configuration
// ==============================================================================

/**
 * Get configuration for specific environment
 */
function getConfigForEnv(mode: string): UserConfig {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Base configuration for all environments
    define: {
      // Expose environment variables to client code
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || 'development'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
    },

    // Environment-specific optimization
    build: {
      // Production build optimizations
      sourcemap: mode === 'production' ? false : true,
      minify: mode === 'production' ? 'terser' : 'esbuild',
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,

      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'query-vendor': ['@tanstack/react-query'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers'],
            'ui-vendor': ['sonner'],
          },
        },
      },

      // Asset optimization
      chunkSizeWarningLimit: mode === 'production' ? 1000 : 1500,

      // CSS code splitting
      cssCodeSplit: true,
    },

    // Server configuration
    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
      host: env.VITE_DEV_HOST || 'localhost',
      strictPort: mode === 'production',
      open: mode !== 'production',

      // CORS configuration
      cors: {
        origin: env.VITE_CORS_ORIGIN || '*',
        credentials: true,
      },

      // Proxy for API calls (development only)
      proxy: mode === 'development' ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/api/bankjoy': {
          target: env.VITE_BANKJOY_API_URL || 'https://api.bankjoy.com/v1',
          changeOrigin: true,
          secure: true,
        },
      } : undefined,
    },

    // Preview configuration
    preview: {
      port: Number(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_PREVIEW_HOST || 'localhost',
      strictPort: true,

      // CORS configuration
      cors: {
        origin: env.VITE_CORS_ORIGIN || '*',
        credentials: true,
      },
    },

    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/analytics',
        '@tanstack/react-query',
        'react-hook-form',
        'zod',
        'zustand',
      ],
      exclude: ['@firebase/app-check'],
    },

    // Experimental features
    experimental: {
      renderBuiltUrl(filename: string) {
        // Use CDN for production assets if configured
        if (mode === 'production' && env.VITE_CDN_URL) {
          return `${env.VITE_CDN_URL}${filename}`;
        }
        return filename;
      },
    },
  };
}

// ==============================================================================
// Vite Configuration
// ==============================================================================

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  // Base configuration
  const baseConfig: UserConfig = {
    plugins: [
      react({
        // Enable Fast Refresh in development
        fastRefresh: mode !== 'production',

        // Babel configuration
        babel: {
          plugins: mode === 'production' ? [
            // Add production-specific Babel plugins if needed
          ] : [],
        },
      }),
    ],

    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        '@/test': path.resolve(__dirname, './src/test'),
      },
    },

    // Base path (for subdirectory deployment)
    base: env.VITE_BASE_PATH || '/',

    // Public directory
    publicDir: 'public',

    // Cache directory
    cacheDir: 'node_modules/.vite',

    // CSS configuration
    css: {
      postcss: './postcss.config.js',
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production'
          ? '[hash:base64:5]'
          : '[local]__[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },

    // JSON configuration
    json: {
      namedExports: true,
      stringify: true,
    },

    // ESBuild configuration
    esbuild: {
      // Drop console and debugger in production
      drop: mode === 'production' ? ['console', 'debugger'] : [],

      // Target browsers
      target: 'es2020',
    },

    // Worker configuration (for background tasks)
    worker: {
      format: 'es',
    },

    // Test configuration (for Vitest)
    test: mode === 'test' ? {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
        ],
      },
    } : undefined,

    // Development environment validation
    ...getConfigForEnv(mode),
  };

  // Environment-specific overrides
  const envConfigs: Record<string, Partial<UserConfig>> = {
    development: {
      // Development-specific settings
      server: {
        ...baseConfig.server,
        hmr: {
          overlay: true,
        },
      },
    },

    staging: {
      // Staging-specific settings
      build: {
        ...baseConfig.build,
        sourcemap: true, // Keep sourcemaps for staging
        minify: 'esbuild',
      },
    },

    production: {
      // Production-specific settings
      build: {
        ...baseConfig.build,
        // Additional production optimizations
        target: 'es2020',
      },
    },

    test: {
      // Test-specific settings
      test: baseConfig.test,
    },
  };

  // Apply environment-specific overrides
  return {
    ...baseConfig,
    ...envConfigs[mode as keyof typeof envConfigs],
  };
});

// ==============================================================================
// Type definitions for environment variables
// ==============================================================================

interface ImportMetaEnv {
  // Application
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_APP_VERSION: string;

  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_FIREBASE_USE_EMULATOR: string;
  readonly VITE_FIREBASE_ANALYTICS_ENABLED: string;

  // BankJoy API
  readonly VITE_BANKJOY_API_URL: string;
  readonly VITE_BANKJOY_API_KEY: string;
  readonly VITE_BANKJOY_API_TIMEOUT: string;
  readonly VITE_BANKJOY_MAX_RETRIES: string;
  readonly VITE_BANKJOY_RATE_LIMIT_ENABLED: string;

  // Feature Flags
  readonly VITE_FEATURE_BANK_INTEGRATION_ENABLED: string;
  readonly VITE_FEATURE_AUTO_ALLOCATE_ENABLED: string;
  readonly VITE_FEATURE_EMAIL_NOTIFICATIONS_ENABLED: string;
  readonly VITE_FEATURE_SSO_ENABLED: string;
  readonly VITE_FEATURE_MULTI_TENANT_ENABLED: string;
  readonly VITE_FEATURE_ADVANCED_REPORTING_ENABLED: string;
  readonly VITE_FEATURE_API_ACCESS_ENABLED: string;
  readonly VITE_FEATURE_WEBHOOKS_ENABLED: string;
  readonly VITE_FEATURE_BULK_IMPORT_ENABLED: string;
  readonly VITE_FEATURE_CUSTOM_FIELDS_ENABLED: string;
  readonly VITE_FEATURE_AI_INSIGHTS_ENABLED: string;
  readonly VITE_FEATURE_PREDICTIVE_ANALYTICS_ENABLED: string;

  // Analytics
  readonly VITE_GA4_MEASUREMENT_ID: string;
  readonly VITE_SEGMENT_WRITE_KEY: string;
  readonly VITE_MIXPANEL_TOKEN: string;

  // API
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;

  // Security
  readonly VITE_CSP_ENABLED: string;
  readonly VITE_X_FRAME_OPTIONS: string;
  readonly VITE_CONTENT_SECURITY_POLICY: string;

  // Performance
  readonly VITE_ENABLE_SERVICE_WORKER: string;
  readonly VITE_CACHE_STRATEGY: string;
  readonly VITE_OFFLINE_ENABLED: string;

  // Logging & Monitoring
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_LOG_LEVEL: string;

  // Rate Limiting
  readonly VITE_RATE_LIMIT_ENABLED: string;
  readonly VITE_RATE_LIMIT_MAX_REQUESTS: string;
  readonly VITE_RATE_LIMIT_WINDOW_MS: string;

  // Content Delivery
  readonly VITE_CDN_URL: string;
  readonly VITE_ASSET_VERSION: string;

  // Support
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_SUPPORT_PHONE: string;
  readonly VITE_DOCS_URL: string;
  readonly VITE_STATUS_PAGE_URL: string;

  // Third-party Integrations
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_WORKOS_CLIENT_ID: string;
  readonly VITE_SLACK_CLIENT_ID: string;

  // Legal & Compliance
  readonly VITE_TERMS_URL: string;
  readonly VITE_PRIVACY_URL: string;
  readonly VITE_COOKIE_POLICY_URL: string;

  // Development & Debugging
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_DEVTOOLS: string;
  readonly VITE_VERBOSE_LOGGING: string;

  // Development Server
  readonly VITE_DEV_PORT: string;
  readonly VITE_DEV_HOST: string;
  readonly VITE_PREVIEW_PORT: string;
  readonly VITE_PREVIEW_HOST: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_CORS_ORIGIN: string;

  // Environment-specific Overrides
  readonly VITE_DEFAULT_PAGE_SIZE: string;
  readonly VITE_DATE_FORMAT: string;
  readonly VITE_CURRENCY_FORMAT: string;
  readonly VITE_TIMEZONE: string;

  // Staging-specific
  readonly VITE_USE_TEST_DATA: string;
  readonly VITE_MOCK_BANKJOY: string;
  readonly VITE_MOCK_FIREBASE: string;
  readonly VITE_MOCK_AUTHENTICATION: string;
  readonly VITE_ENABLE_FEATURE_TESTING: string;
  readonly VITE_TEST_USER_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Export types for use in application code
export type { ImportMetaEnv, ImportMeta };
