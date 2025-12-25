/**
 * Role-Protected Route Component
 * Senior Developer Implementation - Best Practices
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleAuth, getPrimaryRole, ROLE_LABELS } from '@/lib/auth/useRoleAuth';

type UserRole = 'admin' | 'doctor' | 'pharmacist' | 'kiosk';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  requireAll?: boolean;
  fallbackPath?: string;
  customUnauthorized?: React.ReactNode;
}

/**
 * Component that protects routes based on user roles
 * Automatically redirects unauthorized users
 */
export default function RoleProtectedRoute({
  children,
  requiredRoles,
  requireAll = false,
  fallbackPath,
  customUnauthorized
}: RoleProtectedRouteProps) {
  const { userRoles, hasRole, hasAllRoles, loading, error } = useRoleAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const hasAccess = requireAll 
      ? hasAllRoles(requiredRoles)
      : hasRole(requiredRoles);

    if (!hasAccess) {
      if (userRoles.length > 0) {
        // User is authenticated but doesn't have required role - redirect immediately to their dashboard
        if (fallbackPath) {
          router.replace(fallbackPath);
        } else {
          // Redirect to their primary role's dashboard - NEVER home page for authenticated users
          const primaryRole = getPrimaryRole(userRoles);
          switch (primaryRole) {
            case 'admin':
              router.replace('/admin');
              break;
            case 'doctor':
              router.replace('/doctor');
              break;
            case 'pharmacist':
              router.replace('/pharmacy');
              break;
            case 'kiosk':
              router.replace('/kiosk');
              break;
            default:
              // If user has roles but none match, redirect to first available dashboard
              if (userRoles.includes('admin')) router.replace('/admin');
              else if (userRoles.includes('doctor')) router.replace('/doctor');
              else if (userRoles.includes('pharmacist')) router.replace('/pharmacy');
              else if (userRoles.includes('kiosk')) router.replace('/kiosk');
              else router.replace('/'); // Only if no roles found (shouldn't happen)
          }
        }
      } else {
        // User not authenticated - redirect to home page automatically
        router.replace('/');
      }
    }
  }, [userRoles, loading, hasRole, hasAllRoles, requiredRoles, requireAll, fallbackPath, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  // Check access - if no access, user will be automatically redirected by useEffect
  const hasAccess = requireAll 
    ? hasAllRoles(requiredRoles)
    : hasRole(requiredRoles);

  if (!hasAccess) {
    // Show loading while automatic redirect happens - NO BUTTONS, NO USER INTERACTION
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Mengalihkan...</p>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
