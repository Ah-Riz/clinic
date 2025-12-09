/**
 * Security Utilities and Best Practices
 * Senior Developer Implementation
 */

// Input validation regex patterns
export const VALIDATION_PATTERNS = {
  NIK: /^\d{16}$/,
  PHONE: /^(\+62|0)[0-9]{9,12}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  DEVICE_ID: /^[A-Z]+-\d{3}$/,
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_CALLS: 100,
  API_WINDOW_MS: 60 * 1000, // 1 minute
} as const;

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
} as const;

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate NIK format
 */
export function validateNIK(nik: string): boolean {
  if (!VALIDATION_PATTERNS.NIK.test(nik)) return false;
  
  // Additional validation: check if NIK follows Indonesian format
  // First 6 digits: area code (should exist)
  // Next 6 digits: date of birth (DDMMYY)
  // Last 4 digits: sequence number
  
  const dateStr = nik.substring(6, 12);
  const day = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4));
  
  // Basic date validation
  if (day < 1 || day > 71) return false; // Women's day can be +40
  if (month < 1 || month > 12) return false;
  
  return true;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  return VALIDATION_PATTERNS.PHONE.test(phone);
}

/**
 * Validate device ID
 */
export function validateDeviceId(deviceId: string): boolean {
  return VALIDATION_PATTERNS.DEVICE_ID.test(deviceId);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sensitive data (client-side, for non-critical hashing)
 * For critical hashing, use server-side Edge Functions
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if running in secure context
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true; // SSR
  return window.isSecureContext || window.location.protocol === 'https:';
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    // Clean up old entries periodically
    if (this.attempts.size > 1000) {
      this.cleanup();
    }
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.attempts.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, valid);
      }
    }
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Content Security Policy builder
 */
export class CSPBuilder {
  private directives: Map<string, string[]> = new Map();

  constructor() {
    // Set secure defaults
    this.directive('default-src', "'self'");
    this.directive('script-src', "'self'");
    this.directive('style-src', "'self'");
    this.directive('img-src', "'self' data: https:");
    this.directive('font-src', "'self'");
    this.directive('connect-src', "'self'");
    this.directive('frame-ancestors', "'none'");
    this.directive('base-uri', "'self'");
    this.directive('form-action', "'self'");
  }

  directive(name: string, ...values: string[]): this {
    const existing = this.directives.get(name) || [];
    this.directives.set(name, [...existing, ...values]);
    return this;
  }

  build(): string {
    return Array.from(this.directives.entries())
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ');
  }
}

/**
 * Audit logger for security events
 */
export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private queue: SecurityEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  log(event: SecurityEvent): void {
    this.queue.push({
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    });

    // Batch events and flush periodically
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 5000);
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];
    this.flushTimer = null;

    try {
      // In production, send to logging service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to logging service
        console.log('Security events:', events);
      } else {
        console.table(events);
      }
    } catch (error) {
      console.error('Failed to log security events:', error);
    }
  }
}

// Types
export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 
        'access_denied' | 'data_access' | 'data_modification' |
        'suspicious_activity' | 'rate_limit_exceeded';
  userId?: string;
  deviceId?: string;
  ip?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  userAgent?: string;
}

// Export singleton instances
export const loginRateLimiter = new RateLimiter(
  RATE_LIMITS.LOGIN_ATTEMPTS,
  RATE_LIMITS.LOGIN_WINDOW_MS
);

export const apiRateLimiter = new RateLimiter(
  RATE_LIMITS.API_CALLS,
  RATE_LIMITS.API_WINDOW_MS
);

export const securityLogger = SecurityAuditLogger.getInstance();
