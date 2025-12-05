import { createBrowserClient } from '@supabase/ssr';

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

// Default client for auth operations
export const supabase = createSafeClient();

// Create client with custom headers (e.g., x-device-id) while preserving auth session
export const createSupabaseBrowserClient = (
  headers?: Record<string, string>,
) => {
  return createSafeClient(headers);
};
