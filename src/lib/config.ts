/**
 * Application Configuration Management
 * Best Practice: Centralized, type-safe configuration
 */

// Environment variables validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
} as const;

/**
 * Validate environment variables at startup
 */
function validateEnv(): void {
  if (typeof window === 'undefined') {
    // Server-side validation
    const missing = requiredEnvVars.filter(
      key => !process.env[key]
    );

    if (missing.length > 0) {
      console.warn(
        `⚠️  Missing required environment variables: ${missing.join(', ')}\n` +
        `Please check your .env.local file.`
      );
    }
  }
}

// Run validation
validateEnv();

/**
 * Application configuration
 */
export const config = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },

  // Application
  app: {
    name: 'Clinic EMR System',
    version: '1.0.0',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    env: process.env.NODE_ENV ?? 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },

  // Feature flags
  features: {
    enableRealtime: true,
    enableEncryption: true,
    enableAuditLogging: true,
    enableRateLimiting: true,
    enableDeviceGating: true,
    enableCSP: true,
  },

  // Device IDs (should be in env vars in production)
  devices: {
    kiosk: process.env.NEXT_PUBLIC_KIOSK_DEVICE_ID ?? 'KIOSK-001',
    doctor: process.env.NEXT_PUBLIC_DOCTOR_DEVICE_ID ?? 'DOCTOR-001',
    pharmacy: process.env.NEXT_PUBLIC_PHARMACY_DEVICE_ID ?? 'PHARMACY-001',
    admin: process.env.NEXT_PUBLIC_ADMIN_DEVICE_ID ?? 'ADMIN-001',
    adminCron: process.env.NEXT_PUBLIC_ADMIN_CRON_DEVICE_ID ?? 'ADMIN-CRON-001',
  },

  // Security
  security: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // API
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Localization
  locale: {
    default: 'id-ID',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
  },

  // Business rules
  business: {
    queueExpiryHours: 2,
    lowStockThresholdDefault: 10,
    maxPrescriptionItems: 20,
    nikLength: 16,
    logRetentionDays: 365,
  },

  // Monitoring
  monitoring: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
    enableErrorReporting: process.env.NODE_ENV === 'production',
    enablePerformanceMonitoring: process.env.NODE_ENV === 'production',
  },
} as const;

/**
 * Get typed config value with fallback
 */
export function getConfig<T extends keyof typeof config>(
  section: T
): typeof config[T] {
  return config[section];
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof typeof config.features
): boolean {
  return config.features[feature] ?? false;
}

/**
 * Get device ID by role
 */
export function getDeviceId(
  role: 'kiosk' | 'doctor' | 'pharmacy' | 'admin' | 'adminCron'
): string {
  return config.devices[role];
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(config.locale.default, {
    style: 'currency',
    currency: config.locale.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(
  date: Date | string,
  includeTime: boolean = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: config.locale.timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat(config.locale.default, options).format(dateObj);
}

/**
 * Get today's date in Jakarta timezone
 */
export function getTodayJakarta(): string {
  return new Date().toLocaleDateString('sv-SE', { 
    timeZone: config.locale.timezone 
  });
}

/**
 * Check if date is expired
 */
export function isExpired(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

// Type exports
export type Config = typeof config;
export type Features = typeof config.features;
export type Devices = typeof config.devices;
export type Locale = typeof config.locale;
