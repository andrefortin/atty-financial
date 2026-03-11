/**
 * Analytics Configuration
 *
 * Firebase Analytics configuration, custom event tracking,
 * and event schema definitions for ATTY Financial.
 *
 * @module lib/analytics
 */

import { getAnalytics, logEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';

// ============================================
// Types
// ============================================

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  consentRequired: boolean;
  defaultConsent: {
    analytics: boolean;
    performance: boolean;
    errorTracking: boolean;
  };
  customEventsEnabled: boolean;
  conversionTrackingEnabled: boolean;
  userPropertiesEnabled: boolean;
}

/**
 * Custom event schema
 */
export interface CustomEvent {
  name: string;
  parameters?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

/**
 * User action event
 */
export interface UserActionEvent extends CustomEvent {
  action: 'click' | 'submit' | 'view' | 'edit' | 'delete' | 'download' | 'upload' | 'login' | 'logout';
  feature: string;
  screen?: string;
  category?: string;
  label?: string;
  value?: number;
}

/**
 * Feature usage event
 */
export interface FeatureUsageEvent extends CustomEvent {
  feature: string;
  action: 'open' | 'close' | 'toggle' | 'configure' | 'reset';
  duration?: number; // in seconds
  success?: boolean;
  error?: string;
}

/**
 * Error event
 */
export interface ErrorEvent extends CustomEvent {
  level: 'info' | 'warning' | 'error' | 'fatal';
  type: string;
  message: string;
  stack?: string;
  component?: string;
  feature?: string;
  endpoint?: string;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Conversion event
 */
export interface ConversionEvent extends CustomEvent {
  conversionType: 'sign_up' | 'upgrade' | 'trial_start' | 'trial_convert' | 'purchase';
  value?: number;
  currency?: string;
  paymentMethod?: string;
  plan?: 'free' | 'standard' | 'professional' | 'enterprise';
  trialLength?: number; // in days
}

/**
 * Funnel event
 */
export interface FunnelEvent extends CustomEvent {
  funnelName: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  completed?: boolean;
  skipped?: boolean;
  value?: number;
}

/**
 * Performance event
 */
export interface PerformanceEvent extends CustomEvent {
  metric: string;
  value: number;
  unit: 'milliseconds' | 'seconds' | 'bytes' | 'count';
  component?: string;
  operation?: string;
  duration?: number; // in milliseconds
}

/**
 * User properties
 */
export interface UserProperties {
  userId: string;
  email?: string;
  role?: string;
  tier?: 'free' | 'standard' | 'professional' | 'enterprise';
  subscription?: {
    plan: string;
    status: 'active' | 'trial' | 'expired';
    startDate: string;
    endDate?: string;
  };
  firmId?: string;
  firmName?: string;
  firmSize?: string;
  createdAt?: string;
  lastActiveAt?: string;
}

// ============================================
// Analytics Configuration
// ============================================

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  appName: 'atty-financial',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: (import.meta.env.VITE_APP_ENV as any) || 'development',
  consentRequired: true,
  defaultConsent: {
    analytics: true,
    performance: true,
    errorTracking: true,
  },
  customEventsEnabled: true,
  conversionTrackingEnabled: true,
  userPropertiesEnabled: true,
};

/**
 * Get analytics configuration
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const config: Partial<AnalyticsConfig> = {
    enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    appName: import.meta.env.VITE_APP_NAME || 'atty-financial',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.VITE_APP_ENV as any) || 'development',
    consentRequired: import.meta.env.VITE_ANALYTICS_CONSENT_REQUIRED !== 'false',
    customEventsEnabled: import.meta.env.VITE_CUSTOM_EVENTS_ENABLED !== 'false',
    conversionTrackingEnabled: import.meta.env.VITE_CONVERSION_TRACKING_ENABLED !== 'false',
    userPropertiesEnabled: import.meta.env.VITE_USER_PROPERTIES_ENABLED !== 'false',
  };

  return {
    ...DEFAULT_ANALYTICS_CONFIG,
    ...config,
  } as AnalyticsConfig;
}

// ============================================
// Analytics Initialization
// ============================================

let analyticsInstance: Analytics | null = null;

/**
 * Initialize Firebase Analytics
 */
export async function initializeAnalytics(): Promise<Analytics | null> {
  const config = getAnalyticsConfig();

  if (!config.enabled) {
    console.log('Analytics is disabled');
    return null;
  }

  try {
    const analytics = getAnalytics();

    // Set analytics collection enabled
    analytics.setAnalyticsCollectionEnabled(true);

    // Set default user ID
    if (typeof window !== 'undefined' && window.localStorage) {
      const userId = window.localStorage.getItem('userId');
      if (userId) {
        setUserId(userId);
      }
    }

    // Set user properties
    const userProperties = getUserProperties();
    if (userProperties) {
      setUserProperties(userProperties);
    }

    // Log analytics initialization
    console.log('Analytics initialized:', {
      appName: config.appName,
      appVersion: config.appVersion,
      environment: config.environment,
      customEventsEnabled: config.customEventsEnabled,
      conversionTrackingEnabled: config.conversionTrackingEnabled,
    });

    analyticsInstance = analytics;
    return analytics;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    return null;
  }
}

/**
 * Get analytics instance
 */
export function getAnalyticsInstance(): Analytics | null {
  return analyticsInstance;
}

// ============================================
// Consent Management

/**
 * Check if analytics consent is granted
 */
export function hasAnalyticsConsent(): boolean {
  const config = getAnalyticsConfig();

  // Skip consent check in development
  if (config.environment === 'development') {
    return true;
  }

  if (!config.consentRequired) {
    return true;
  }

  // Check consent from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'true';
  }

  // Default to default consent
  return config.defaultConsent.analytics;
}

/**
 * Grant analytics consent
 */
export function grantAnalyticsConsent(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('analytics_consent', 'true');
    localStorage.setItem('analytics_consent_date', new Date().toISOString());
  }
}

/**
 * Revoke analytics consent
 */
export function revokeAnalyticsConsent(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('analytics_consent', 'false');
    localStorage.removeItem('analytics_consent_date');
  }
}

/**
 * Update analytics consent
 */
export function updateAnalyticsConsent(consent: {
  analytics?: boolean;
  performance?: boolean;
  errorTracking?: boolean;
}): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('analytics_consent', JSON.stringify(consent));
    localStorage.setItem('analytics_consent_date', new Date().toISOString());
  }
}

// ============================================
// Event Tracking

/**
 * Track custom event
 */
export async function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number>
): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    await logEvent(analytics, eventName, parameters);

    console.log('Event tracked:', { eventName, parameters });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Track user action event
 */
export async function trackUserAction(event: UserActionEvent): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.customEventsEnabled || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    const parameters: Record<string, string | number> = {
      action: event.action,
      feature: event.feature,
    };

    if (event.screen) {
      parameters.screen = event.screen;
    }

    if (event.category) {
      parameters.category = event.category;
    }

    if (event.label) {
      parameters.label = event.label;
    }

    if (event.value) {
      parameters.value = event.value;
    }

    await logEvent(analytics, 'user_action', parameters);

    console.log('User action tracked:', event);
  } catch (error) {
    console.error('Failed to track user action:', error);
  }
}

/**
 * Track feature usage event
 */
export async function trackFeatureUsage(event: FeatureUsageEvent): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.customEventsEnabled || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    const parameters: Record<string, string | number | boolean> = {
      feature: event.name,
      action: event.action,
      success: event.success ?? true,
    };

    if (event.duration) {
      parameters.duration = event.duration;
    }

    if (event.error) {
      parameters.error = event.error;
    }

    await logEvent(analytics, 'feature_usage', parameters);

    console.log('Feature usage tracked:', event);
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

/**
 * Track conversion event
 */
export async function trackConversion(event: ConversionEvent): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.conversionTrackingEnabled || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    const parameters: Record<string, string | number> = {
      conversion_type: event.conversionType,
    };

    if (event.value) {
      parameters.value = event.value;
    }

    if (event.currency) {
      parameters.currency = event.currency;
    }

    if (event.paymentMethod) {
      parameters.payment_method = event.paymentMethod;
    }

    if (event.plan) {
      parameters.plan = event.plan;
    }

    if (event.trialLength) {
      parameters.trial_length = event.trialLength;
    }

    await logEvent(analytics, 'conversion', parameters);

    console.log('Conversion tracked:', event);
  } catch (error) {
    console.error('Failed to track conversion:', error);
  }
}

/**
 * Track funnel event
 */
export async function trackFunnelEvent(event: FunnelEvent): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.customEventsEnabled || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    const parameters: Record<string, string | number | boolean> = {
      funnel_name: event.funnelName,
      step_name: event.stepName,
      step_number: event.stepNumber,
      total_steps: event.totalSteps,
      completed: event.completed ?? false,
      skipped: event.skipped ?? false,
    };

    if (event.value) {
      parameters.value = event.value;
    }

    await logEvent(analytics, 'funnel_step', parameters);

    console.log('Funnel event tracked:', event);
  } catch (error) {
    console.error('Failed to track funnel event:', error);
  }
}

/**
 * Track error event
 */
export async function trackError(event: ErrorEvent): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.defaultConsent.errorTracking || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    const parameters: Record<string, string | number> = {
      error_level: event.level,
      error_type: event.type,
      error_message: event.message,
    };

    if (event.component) {
      parameters.component = event.component;
    }

    if (event.feature) {
      parameters.feature = event.feature;
    }

    if (event.endpoint) {
      parameters.endpoint = event.endpoint;
    }

    if (event.context) {
      Object.entries(event.context).forEach(([key, value]) => {
        parameters[`context_${key}`] = value;
      });
    }

    await logEvent(analytics, 'error', parameters);

    console.log('Error tracked:', event);
  } catch (error) {
    console.error('Failed to track error:', error);
  }
}

/**
 * Track performance event
 */
export async function trackPerformance(event: PerformanceEvent): Promise<void> {
  const config = getAnalyticsConfig();

  if (!config.enabled || !config.defaultConsent.performance || !hasAnalyticsConsent()) {
    return;
  }

  try {
    const analytics = getAnalyticsInstance();

    if (!analytics) {
      throw new Error('Analytics not initialized');
    }

    const parameters: Record<string, string | number> = {
      metric: event.metric,
      value: event.value,
      unit: event.unit,
    };

    if (event.component) {
      parameters.component = event.component;
    }

    if (event.operation) {
      parameters.operation = event.operation;
    }

    if (event.duration) {
      parameters.duration = event.duration;
    }

    await logEvent(analytics, 'performance', parameters);

    console.log('Performance tracked:', event);
  } catch (error) {
    console.error('Failed to track performance:', error);
  }
}

// ============================================
// User Properties

/**
 * Get user properties
 */
export function getUserProperties(): Record<string, string> | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const userId = window.localStorage.getItem('userId');
  if (!userId) {
    return null;
  }

  // Get user from localStorage (simplified)
  const userJson = window.localStorage.getItem('user');
  if (!userJson) {
    return null;
  }

  const user = JSON.parse(userJson);

  const properties: Record<string, string> = {
    user_id: userId,
    email: user.email || '',
    role: user.role || '',
    tier: user.tier || 'standard',
    firm_id: user.firmId || '',
    firm_name: user.firmName || '',
    firm_size: user.firmSize || '',
  };

  if (user.subscription) {
    properties.subscription_plan = user.subscription.plan || '';
    properties.subscription_status = user.subscription.status || '';
    properties.subscription_start_date = user.subscription.startDate || '';
    properties.subscription_end_date = user.subscription.endDate || '';
  }

  return properties;
}

/**
 * Set user properties
 */
export async function setUserProperties(properties: Record<string, string>): Promise<void> {
  const analytics = getAnalyticsInstance();

  if (!analytics) {
    throw new Error('Analytics not initialized');
  }

  try {
    await analytics.setUserProperties(properties);
    console.log('User properties set:', properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
}

/**
 * Update user property
 */
export async function updateUserProperty(property: string, value: string): Promise<void> {
  const analytics = getAnalyticsInstance();

  if (!analytics) {
    throw new Error('Analytics not initialized');
  }

  try {
    await analytics.setUserProperties({ [property]: value });
    console.log('User property updated:', { property, value });
  } catch (error) {
    console.error('Failed to update user property:', error);
  }
}

// ============================================
// Conversion Tracking

/**
 * Track sign-up conversion
 */
export async function trackSignUp(userId: string, email: string): Promise<void> {
  await trackConversion({
    name: 'sign_up',
    parameters: {
      user_id: userId,
      email: email,
    },
  });

  await trackEvent('conversion', {
    conversion_type: 'sign_up',
  });
}

/**
 * Track upgrade conversion
 */
export async function trackUpgrade(
  fromPlan: string,
  toPlan: string,
  value: number,
  currency: string = 'USD'
): Promise<void> {
  await trackConversion({
    name: 'upgrade',
    parameters: {
      from_plan: fromPlan,
      to_plan: toPlan,
      value,
      currency,
    },
  });

  await trackEvent('conversion', {
    conversion_type: 'upgrade',
    from_plan: fromPlan,
    to_plan: toPlan,
    value,
    currency,
  });
}

/**
 * Track trial start
 */
export async function trackTrialStart(plan: string, trialLength: number): Promise<void> {
  await trackConversion({
    name: 'trial_start',
    parameters: {
      plan,
      trial_length: trialLength,
    },
  });

  await trackEvent('conversion', {
    conversion_type: 'trial_start',
    plan,
    trial_length: trialLength,
  });
}

/**
 * Track trial conversion
 */
export async function trackTrialConversion(plan: string, value: number): Promise<void> {
  await trackConversion({
    name: 'trial_convert',
    parameters: {
      plan,
      value,
    },
  });

  await trackEvent('conversion', {
    conversion_type: 'trial_convert',
    plan,
    value,
  });
}

// ============================================
// Funnel Tracking

/**
 * Track funnel start
 */
export async function trackFunnelStart(
  funnelName: string,
  totalSteps: number
): Promise<void> {
  await trackFunnelEvent({
    name: funnelName,
    parameters: {
      funnel_name: funnelName,
      step_name: 'start',
      step_number: 0,
      total_steps: totalSteps,
      completed: false,
      skipped: false,
    },
  });
}

/**
 * Track funnel step
 */
export async function trackFunnelStep(
  funnelName: string,
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  options?: {
    completed?: boolean;
    skipped?: boolean;
    value?: number;
  }
): Promise<void> {
  await trackFunnelEvent({
    name: funnelName,
    parameters: {
      funnel_name: funnelName,
      step_name,
      step_number,
      total_steps,
      completed: options?.completed ?? false,
      skipped: options?.skipped ?? false,
      ...options,
    },
  });
}

/**
 * Track funnel completion
 */
export async function trackFunnelComplete(
  funnelName: string,
  totalSteps: number,
  value?: number
): Promise<void> {
  await trackFunnelEvent({
    name: funnelName,
    parameters: {
      funnel_name: funnelName,
      step_name: 'complete',
      step_number: totalSteps,
      total_steps,
      completed: true,
      skipped: false,
      value,
    },
  });
}

// ============================================
// Predefined Events

/**
 * Page view event
 */
export async function trackPageView(pageName: string, pageCategory: string): Promise<void> {
  await trackUserAction({
    action: 'view',
    feature: pageName,
    category: pageCategory,
    screen: pageName,
  });
}

/**
 * Form submission event
 */
export async function trackFormSubmission(
  formName: string,
  formCategory: string
): Promise<void> {
  await trackUserAction({
    action: 'submit',
    feature: formName,
    category: formCategory,
  });
}

/**
 * Button click event
 */
export async function trackButtonClick(
  buttonLabel: string,
  buttonCategory: string,
  screen?: string
): Promise<void> {
  await trackUserAction({
    action: 'click',
    feature: buttonLabel,
    category: buttonCategory,
    screen,
  });
}

/**
 * API call event
 */
export async function trackApiCall(
  endpoint: string,
  method: string,
  duration: number
): Promise<void> {
  await trackPerformance({
    metric: 'api_call',
    value: duration,
    unit: 'milliseconds',
    component: 'api',
    operation: `${method} ${endpoint}`,
    duration,
  });
}

/**
 * Error tracking
 */
export async function trackAnalyticsError(
  error: Error,
  context?: {
    component?: string;
    feature?: string;
    endpoint?: string;
    operation?: string;
  }
): Promise<void> {
  await trackError({
    level: 'error',
    type: 'application_error',
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Warning tracking
 */
export async function trackAnalyticsWarning(
  warning: string,
  context?: {
    component?: string;
    feature?: string;
    operation?: string;
  }
): Promise<void> {
  await trackError({
    level: 'warning',
    type: 'warning',
    message: warning,
    ...context,
  });
}

// ============================================
// E-commerce Events

/**
 * Track matter creation
 */
export async function trackMatterCreated(matterId: string): Promise<void> {
  await trackUserAction({
    action: 'create',
    feature: 'matter',
    category: 'matters',
    label: matterId,
  });
}

/**
 * Track transaction creation
 */
export async function trackTransactionCreated(transactionId: string, amount: number): Promise<void> {
  await trackUserAction({
    action: 'create',
    feature: 'transaction',
    category: 'transactions',
    label: transactionId,
    value: amount,
  });
}

/**
 * Track allocation generated
 */
export async function trackAllocationGenerated(allocationId: string, amount: number): Promise<void> {
  await trackUserAction({
    action: 'generate',
    feature: 'allocation',
    category: 'allocations',
    label: allocationId,
    value: amount,
  });
}

/**
 * Track report generated
 */
export async function trackReportGenerated(
  reportType: string,
  reportId: string
): Promise<void> {
  await trackUserAction({
    action: 'generate',
    feature: 'report',
    category: 'reports',
    label: reportType,
  });
}

// ============================================
// Exports

export {
  // Configuration
  getAnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,

  // Initialization
  initializeAnalytics,
  getAnalyticsInstance,

  // Consent
  hasAnalyticsConsent,
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
  updateAnalyticsConsent,

  // Event Tracking
  trackEvent,
  trackUserAction,
  trackFeatureUsage,
  trackConversion,
  trackFunnelEvent,
  trackError,
  trackPerformance,

  // User Properties
  getUserProperties,
  setUserProperties,
  updateUserProperty,

  // Predefined Events
  trackPageView,
  trackFormSubmission,
  trackButtonClick,
  trackApiCall,
  trackAnalyticsError,
  trackAnalyticsWarning,

  // E-commerce Events
  trackMatterCreated,
  trackTransactionCreated,
  trackAllocationGenerated,
  trackReportGenerated,

  // Conversion Tracking
  trackSignUp,
  trackUpgrade,
  trackTrialStart,
  trackTrialConversion,

  // Funnel Tracking
  trackFunnelStart,
  trackFunnelStep,
  trackFunnelComplete,

  // Types
  AnalyticsConfig,
  CustomEvent,
  UserActionEvent,
  FeatureUsageEvent,
  ErrorEvent,
  ConversionEvent,
  FunnelEvent,
  PerformanceEvent,
  UserProperties,
};
