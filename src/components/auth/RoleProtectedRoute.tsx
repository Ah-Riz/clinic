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

    if (!hasAccess && userRoles.length > 0) {
      // User is authenticated but doesn't have required role
      if (fallbackPath) {
        router.push(fallbackPath);
      } else {
        // Redirect to their primary role's dashboard
        const primaryRole = getPrimaryRole(userRoles);
        if (primaryRole) {
          switch (primaryRole) {
            case 'admin':
              router.push('/admin');
              break;
            case 'doctor':
              router.push('/doctor');
              break;
            case 'pharmacist':
              router.push('/pharmacy');
              break;
            case 'kiosk':
              router.push('/kiosk');
              break;
            default:
              router.push('/');
          }
        } else {
          router.push('/');
        }
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

  // Check access
  const hasAccess = requireAll 
    ? hasAllRoles(requiredRoles)
    : hasRole(requiredRoles);

  if (!hasAccess) {
    // Custom unauthorized component
    if (customUnauthorized) {
      return <>{customUnauthorized}</>;
    }

    // Default unauthorized page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Peran yang diperlukan:</strong> {requiredRoles.map(role => ROLE_LABELS[role]).join(requireAll ? ' dan ' : ' atau ')}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Peran Anda:</strong> {userRoles.length > 0 
                ? userRoles.map(role => ROLE_LABELS[role]).join(', ')
                : 'Tidak ada peran'
              }
            </p>
          </div>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            Kembali
          </button>
          <button 
            onClick={() => {
              const primaryRole = getPrimaryRole(userRoles);
              if (primaryRole) {
                switch (primaryRole) {
                  case 'admin':
                    router.push('/admin');
                    break;
                  case 'doctor':
                    router.push('/doctor');
                    break;
                  case 'pharmacist':
                    router.push('/pharmacy');
                    break;
                  case 'kiosk':
                    router.push('/kiosk');
                    break;
                  default:
                    router.push('/');
                }
              } else {
                router.push('/');
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Dashboard Saya
          </button>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
