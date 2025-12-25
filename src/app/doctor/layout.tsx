/**
 * Doctor Portal Layout - RBAC Enforced
 * Senior Developer Implementation - No route can bypass role checks
 * Note: Login pages are excluded from role protection
 */

'use client';

import { usePathname } from 'next/navigation';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';

interface DoctorLayoutProps {
  children: React.ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const pathname = usePathname();
  
  // Don't protect login pages - allow unauthenticated access
  if (pathname?.includes('/login')) {
    return <>{children}</>;
  }

  return (
    <RoleProtectedRoute 
      requiredRoles={['doctor']}
      requireAll={false}
    >
      {children}
    </RoleProtectedRoute>
  );
}
