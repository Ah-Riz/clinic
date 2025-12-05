import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Default client for auth operations
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Create client with custom headers (e.g., x-device-id) while preserving auth session
export const createSupabaseBrowserClient = (
  headers?: Record<string, string>,
) => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: headers ?? {},
    },
  });
};
