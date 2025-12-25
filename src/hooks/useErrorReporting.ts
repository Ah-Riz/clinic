/**
 * Enhanced Error Reporting Hook
 * Senior Developer Implementation - Comprehensive error handling
 */

import { useCallback } from 'react';
import { logger, trackError } from '@/lib/observability/logger';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRoles } from '@/lib/auth/RolesProvider';

interface ErrorReportOptions {
  context?: Record<string, any>;
  critical?: boolean;
  userMessage?: string;
}

export function useErrorReporting() {
  const { user } = useAuth();
  const { userRoles, primaryRole } = useRoles();

  const reportError = useCallback((
    error: Error | string,
    options: ErrorReportOptions = {}
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const enhancedContext = {
      ...options.context,
      userId: user?.id,
      userEmail: user?.email,
      userRoles: userRoles,
      primaryRole: primaryRole,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    };

    // Log error with enhanced context
    trackError(errorObj, enhancedContext);

    // If critical, also log as security event
    if (options.critical) {
      logger.logSecurityEvent('Critical error occurred', enhancedContext);
    }

    return {
      errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userMessage: options.userMessage || 'Terjadi kesalahan yang tidak terduga.',
    };
  }, [user, userRoles, primaryRole]);

  const reportAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorReportOptions = {}
  ): Promise<T> => {
    try {
      return await asyncFn();
    } catch (error) {
      reportError(error as Error, options);
      throw error; // Re-throw to maintain promise chain
    }
  }, [reportError]);

  const wrapAsyncFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: ErrorReportOptions = {}
  ) => {
    return async (...args: T): Promise<R> => {
      return reportAsyncError(() => fn(...args), options);
    };
  }, [reportAsyncError]);

  return {
    reportError,
    reportAsyncError,
    wrapAsyncFunction,
  };
}
