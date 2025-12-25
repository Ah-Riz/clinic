/**
 * Portal Device Identity Management
 * Senior Developer Implementation - First-class device gating
 */

import { getDeviceId } from '@/lib/config';

export type PortalType = 'admin' | 'doctor' | 'pharmacy' | 'kiosk';

/**
 * Get the device ID for a specific portal
 */
export function getPortalDeviceId(portal: PortalType): string {
  switch (portal) {
    case 'admin':
      return getDeviceId('admin');
    case 'doctor':
      return getDeviceId('doctor');
    case 'pharmacy':
      return getDeviceId('pharmacy');
    case 'kiosk':
      return getDeviceId('kiosk');
    default:
      throw new Error(`Unknown portal type: ${portal}`);
  }
}

/**
 * Detect current portal from pathname
 */
export function detectPortalFromPath(pathname: string): PortalType | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/doctor')) return 'doctor';
  if (pathname.startsWith('/pharmacy')) return 'pharmacy';
  if (pathname.startsWith('/kiosk')) return 'kiosk';
  return null;
}

/**
 * Get current portal device ID from current location
 */
export function getCurrentPortalDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  
  const portal = detectPortalFromPath(window.location.pathname);
  return portal ? getPortalDeviceId(portal) : null;
}

/**
 * Validate device ID format
 */
export function isValidDeviceId(deviceId: string): boolean {
  // Device ID format: PORTAL-XXX (e.g., ADMIN-001, DOCTOR-001)
  const deviceIdPattern = /^(ADMIN|DOCTOR|PHARMACY|KIOSK)-\d{3}$/;
  return deviceIdPattern.test(deviceId);
}

/**
 * Device identity for RPC calls
 */
export interface DeviceIdentity {
  deviceId: string;
  portal: PortalType;
}

/**
 * Get device identity for current portal
 */
export function getCurrentDeviceIdentity(): DeviceIdentity | null {
  if (typeof window === 'undefined') return null;
  
  const portal = detectPortalFromPath(window.location.pathname);
  if (!portal) return null;
  
  const deviceId = getPortalDeviceId(portal);
  return { deviceId, portal };
}

/**
 * Create RPC parameters with device identity
 */
export function withDeviceIdentity<T extends Record<string, any>>(
  params: T,
  portal?: PortalType
): T & { p_device_id: string } {
  const deviceIdentity = portal 
    ? { deviceId: getPortalDeviceId(portal), portal }
    : getCurrentDeviceIdentity();
    
  if (!deviceIdentity) {
    throw new Error('Unable to determine device identity. Ensure you are on a portal page.');
  }
  
  return {
    ...params,
    p_device_id: deviceIdentity.deviceId,
  };
}
