/**
 * Smart Login Redirect System
 * Senior Developer Implementation - Role-aware redirects
 */

import { getPrimaryRole } from './useRoleAuth';
import { createSupabaseBrowserClient } from '../supabaseClient';

type UserRole = 'admin' | 'doctor' | 'pharmacist' | 'kiosk';

/**
 * Get dashboard path for a role
 */
function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'doctor':
      return '/doctor';
    case 'pharmacist':
      return '/pharmacy';
    case 'kiosk':
      return '/kiosk';
    default:
      return '/';
  }
}

/**
 * Fetch user roles after login
 */
async function fetchUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // Get staff record by id (staff.id = auth.users.id)
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('id', userId)
      .eq('active', true)
      .maybeSingle();

    if (staffError || !staffData) {
      return [];
    }

    // Get all roles for this staff member
    const { data: rolesData, error: rolesError } = await supabase
      .from('staff_roles')
      .select('role')
      .eq('staff_id', staffData.id);

    if (rolesError) {
      return [];
    }

    return (rolesData || []).map(r => r.role as UserRole);
  } catch (err) {
    console.error('Error fetching user roles for redirect:', err);
    return [];
  }
}

/**
 * Determine where to redirect user after successful login
 * Returns the dashboard URL based on user's primary role
 */
export async function getLoginRedirectPath(userId: string): Promise<string> {
  const userRoles = await fetchUserRoles(userId);
  
  if (userRoles.length === 0) {
    // User has no roles - redirect to home page
    // The NotProvisionedUser component will handle this state
    return '/';
  }
  
  const primaryRole = getPrimaryRole(userRoles);
  if (primaryRole) {
    return getRoleDashboard(primaryRole);
  }
  
  // Fallback - should not happen if userRoles is not empty
  return '/';
}

/**
 * Smart redirect handler for login success
 * Use this in login forms instead of hardcoded redirects
 */
export async function handleLoginRedirect(
  userId: string, 
  router: { push: (path: string) => void }
): Promise<void> {
  try {
    const redirectPath = await getLoginRedirectPath(userId);
    router.push(redirectPath);
  } catch (err) {
    console.error('Login redirect error:', err);
    // Fallback to home page on error
    router.push('/');
  }
}
