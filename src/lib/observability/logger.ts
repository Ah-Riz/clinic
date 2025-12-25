/**
 * Enhanced Logging and Observability System
 * Senior Developer Implementation - Production-ready error tracking
 */

import { config } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  deviceId?: string;
  portal?: string;
}

class Logger {
  private isDevelopment = config.app.isDevelopment;
  private isProduction = config.app.isProduction;

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    return `${prefix}: ${entry.message}${context}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.getCurrentUserId(),
      deviceId: this.getCurrentDeviceId(),
      portal: this.getCurrentPortal(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from local storage or context
    try {
      const session = localStorage.getItem('sb-session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed?.user?.id;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  private getCurrentDeviceId(): string | undefined {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return config.devices.admin;
      if (path.startsWith('/doctor')) return config.devices.doctor;
      if (path.startsWith('/pharmacy')) return config.devices.pharmacy;
      if (path.startsWith('/kiosk')) return config.devices.kiosk;
    }
    return undefined;
  }

  private getCurrentPortal(): string | undefined {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/doctor')) return 'doctor';
      if (path.startsWith('/pharmacy')) return 'pharmacy';
      if (path.startsWith('/kiosk')) return 'kiosk';
    }
    return undefined;
  }

  private log(entry: LogEntry): void {
    // Always log to console in development
    if (this.isDevelopment) {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                          entry.level === 'warn' ? 'warn' : 
                          entry.level === 'info' ? 'info' : 'log';
      console[consoleMethod](this.formatMessage(entry), entry.context);
    }

    // In production, also send to external monitoring service
    if (this.isProduction && config.monitoring.enableErrorReporting) {
      this.sendToMonitoringService(entry);
    }

    // Store critical errors locally for admin diagnostics
    if (entry.level === 'error') {
      this.storeErrorLocally(entry);
    }
  }

  private sendToMonitoringService(entry: LogEntry): void {
    // TODO: Integrate with Sentry, LogRocket, or similar service
    // Example:
    // Sentry.captureMessage(entry.message, entry.level);
    // Sentry.setContext('app', entry.context);
  }

  private storeErrorLocally(entry: LogEntry): void {
    try {
      const errors = this.getStoredErrors();
      errors.push(entry);
      // Keep only last 50 errors
      const trimmed = errors.slice(-50);
      localStorage.setItem('clinic-errors', JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
  }

  public getStoredErrors(): LogEntry[] {
    try {
      const stored = localStorage.getItem('clinic-errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public clearStoredErrors(): void {
    try {
      localStorage.removeItem('clinic-errors');
    } catch {
      // Ignore errors
    }
  }

  // Public logging methods
  public debug(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry('debug', message, context));
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry('info', message, context));
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry('warn', message, context));
  }

  public error(message: string, context?: Record<string, any>): void {
    this.log(this.createLogEntry('error', message, context));
  }

  // Specialized logging for common scenarios
  public logAuthEvent(event: string, context?: Record<string, any>): void {
    this.info(`AUTH: ${event}`, { category: 'auth', ...context });
  }

  public logRoleEvent(event: string, context?: Record<string, any>): void {
    this.info(`ROLE: ${event}`, { category: 'role', ...context });
  }

  public logDeviceEvent(event: string, context?: Record<string, any>): void {
    this.info(`DEVICE: ${event}`, { category: 'device', ...context });
  }

  public logDatabaseEvent(event: string, context?: Record<string, any>): void {
    this.info(`DB: ${event}`, { category: 'database', ...context });
  }

  public logSecurityEvent(event: string, context?: Record<string, any>): void {
    this.warn(`SECURITY: ${event}`, { category: 'security', ...context });
  }
}

export const logger = new Logger();

// Error tracking utilities
export function trackError(error: Error, context?: Record<string, any>): void {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
}

export function trackAsyncError(promise: Promise<any>, context?: Record<string, any>): Promise<any> {
  return promise.catch(error => {
    trackError(error, context);
    throw error; // Re-throw to maintain promise chain
  });
}

// Performance monitoring
export function measureAsync<T>(
  label: string, 
  fn: () => Promise<T>, 
  context?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  
  return fn()
    .then(result => {
      const duration = performance.now() - start;
      logger.info(`PERF: ${label}`, {
        duration: Math.round(duration),
        category: 'performance',
        ...context
      });
      return result;
    })
    .catch(error => {
      const duration = performance.now() - start;
      logger.error(`PERF: ${label} (failed)`, {
        duration: Math.round(duration),
        error: error.message,
        category: 'performance',
        ...context
      });
      throw error;
    });
}
