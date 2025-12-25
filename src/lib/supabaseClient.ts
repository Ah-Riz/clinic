import { createBrowserClient } from '@supabase/ssr';
import { getCurrentPortalDeviceId, type PortalType } from './device/portalDevice';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Check if we're in a build/SSR context without env vars
const isBuildTime = !supabaseUrl || !supabaseAnonKey;

// Create a dummy client for build time to prevent errors
const createSafeClient = (headers?: Record<string, string>) => {
  if (isBuildTime) {
    // Return a placeholder during build - will be replaced at runtime
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      { global: { headers: headers ?? {} } }
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: headers ?? {} },
  });
};

// Default client for auth operations (no device headers needed)
export const supabase = createSafeClient();

/**
 * Create Supabase client with device identity headers
 * Automatically includes x-device-id based on current portal context
 */
export const createSupabaseBrowserClient = (
  additionalHeaders?: Record<string, string>,
) => {
  const deviceId = getCurrentPortalDeviceId();
  const headers: Record<string, string> = {
    ...(additionalHeaders ?? {}),
  };
  
  // Add device ID header if we can detect current portal
  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }
  
  return createSafeClient(headers);
};

/**
 * Create Supabase client with specific portal device identity
 * Use this when you need to explicitly specify the portal context
 */
export const createPortalSupabaseClient = (
  portal: PortalType,
  additionalHeaders?: Record<string, string>,
) => {
  const { getPortalDeviceId } = require('./device/portalDevice');
  const deviceId = getPortalDeviceId(portal);
  
  const headers: Record<string, string> = {
    'x-device-id': deviceId,
    ...(additionalHeaders ?? {}),
  };
  
  return createSafeClient(headers);
};
