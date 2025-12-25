/**
 * Role-Based Authentication Hook
 * Senior Developer Implementation - Best Practices
 */

import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { createSupabaseBrowserClient } from '../supabaseClient';

type UserRole = 'admin' | 'doctor' | 'pharmacist' | 'kiosk';

interface RoleAuthResult {
  userRoles: UserRole[];
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for role-based authentication
 * Provides role checking capabilities with proper error handling
 */
export function useRoleAuth(): RoleAuthResult {
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRoles() {
      if (!user || authLoading) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        
        // First, get staff record by user_id
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (staffError) {
          throw new Error(`Error fetching staff data: ${staffError.message}`);
        }

        if (!staffData) {
          setUserRoles([]);
          setLoading(false);
          return;
        }

        // Then get all roles for this staff member
        const { data: rolesData, error: rolesError } = await supabase
          .from('staff_roles')
          .select('role')
          .eq('staff_id', staffData.id);

        if (rolesError) {
          throw new Error(`Error fetching roles: ${rolesError.message}`);
        }

        const roles = (rolesData || []).map(r => r.role as UserRole);
        setUserRoles(roles);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user roles';
        setError(errorMessage);
        console.error('Role fetch error:', err);
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRoles();
  }, [user, authLoading]);

  // Check if user has a specific role or any of the specified roles
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    return userRoles.includes(role);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  };

  // Check if user has all of the specified roles
  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every(role => userRoles.includes(role));
  };

  return {
    userRoles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    loading: authLoading || loading,
    error
  };
}

/**
 * Role-based route protection utility
 * Returns true if user should be allowed access
 */
export function checkRouteAccess(
  userRoles: UserRole[], 
  requiredRoles: UserRole[],
  requireAll = false
): boolean {
  if (requiredRoles.length === 0) return true;
  
  if (requireAll) {
    return requiredRoles.every(role => userRoles.includes(role));
  } else {
    return requiredRoles.some(role => userRoles.includes(role));
  }
}

/**
 * Get user's primary role (highest priority)
 * Priority: admin > doctor > pharmacist > kiosk
 */
export function getPrimaryRole(roles: UserRole[]): UserRole | null {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('doctor')) return 'doctor';
  if (roles.includes('pharmacist')) return 'pharmacist';
  if (roles.includes('kiosk')) return 'kiosk';
  return null;
}

/**
 * Map roles to their readable Indonesian names
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Dokter',
  pharmacist: 'Apoteker',
  kiosk: 'Kiosk'
};

/**
 * Define which routes each role can access
 */
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ['/admin'],
  doctor: ['/doctor'],
  pharmacist: ['/pharmacy'],
  kiosk: ['/kiosk']
};

/**
 * Get allowed routes for user's roles
 */
export function getAllowedRoutes(roles: UserRole[]): string[] {
  const routes = new Set<string>();
  roles.forEach(role => {
    ROLE_ROUTES[role]?.forEach(route => routes.add(route));
  });
  return Array.from(routes);
}
