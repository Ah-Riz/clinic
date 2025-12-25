/**
 * Kiosk Portal Layout - RBAC Enforced
 * Senior Developer Implementation - No route can bypass role checks
 * Note: Login pages are excluded from role protection
 */

'use client';

import { usePathname } from 'next/navigation';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';

interface KioskLayoutProps {
  children: React.ReactNode;
}

export default function KioskLayout({ children }: KioskLayoutProps) {
  const pathname = usePathname();
  
  // Don't protect login pages - allow unauthenticated access
  if (pathname?.includes('/login')) {
    return <>{children}</>;
  }

  return (
    <RoleProtectedRoute 
      requiredRoles={['kiosk']}
      requireAll={false}
    >
      {children}
    </RoleProtectedRoute>
  );
}
