/**
 * Centralized Roles Provider
 * Senior Developer Implementation - Single source of truth for user roles
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createSupabaseBrowserClient } from '../supabaseClient';
import { getPrimaryRole } from './useRoleAuth';
import { logger } from '../observability/logger';

type UserRole = 'admin' | 'doctor' | 'pharmacist' | 'kiosk';

interface RolesContextType {
  // Role data
  userRoles: UserRole[];
  primaryRole: UserRole | null;
  
  // Loading states
  rolesLoading: boolean;
  rolesError: string | null;
  
  // Staff provisioning
  isProvisionedStaff: boolean;
  
  // Role checking utilities
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  
  // Actions
  refreshRoles: () => Promise<void>;
}

const RolesContext = createContext<RolesContextType>({
  userRoles: [],
  primaryRole: null,
  rolesLoading: true,
  rolesError: null,
  isProvisionedStaff: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  hasAllRoles: () => false,
  refreshRoles: async () => {},
});

interface RolesProviderProps {
  children: ReactNode;
}

export function RolesProvider({ children }: RolesProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const fetchUserRoles = async (): Promise<void> => {
    if (!user || authLoading) {
      setUserRoles([]);
      setRolesLoading(false);
      return;
    }

    logger.logRoleEvent('Fetching user roles', { userId: user.id });
    setRolesLoading(true);
    setRolesError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      
      // First, get staff record by id (staff.id = auth.users.id)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (staffError) {
        throw new Error(`Error fetching staff data: ${staffError.message}`);
      }

      if (!staffData) {
        logger.logRoleEvent('User not provisioned as staff', { userId: user.id });
        setUserRoles([]);
        setRolesLoading(false);
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
      logger.logRoleEvent('Roles fetched successfully', { 
        userId: user.id, 
        roles: roles,
        staffId: staffData.id 
      });
      setUserRoles(roles);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user roles';
      logger.error(`Role fetch failed: ${errorMessage}`, { 
        userId: user.id,
        error: err instanceof Error ? err.stack : undefined
      });
      setRolesError(errorMessage);
      setUserRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  // Fetch roles when user changes
  useEffect(() => {
    fetchUserRoles();
  }, [user, authLoading]);

  // Computed values
  const primaryRole = getPrimaryRole(userRoles);
  const isProvisionedStaff = user !== null && userRoles.length > 0;
  
  // Role checking utilities
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every(role => userRoles.includes(role));
  };

  const contextValue: RolesContextType = {
    userRoles,
    primaryRole,
    rolesLoading: authLoading || rolesLoading,
    rolesError,
    isProvisionedStaff,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refreshRoles: fetchUserRoles,
  };

  return (
    <RolesContext.Provider value={contextValue}>
      {children}
    </RolesContext.Provider>
  );
}

/**
 * Hook to access roles context
 * Use this instead of useRoleAuth() for better performance
 */
export function useRoles(): RolesContextType {
  const context = useContext(RolesContext);
  if (!context) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
}
