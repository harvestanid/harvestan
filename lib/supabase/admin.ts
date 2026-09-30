import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client dengan SERVICE ROLE key.
 * Bypass RLS — hanya dipakai di server-side (API route / server action)
 * untuk operasi admin: approve premium, update user lain, dll.
 *
 * JANGAN pernah import file ini dari Client Component!
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE env vars. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ada di .env.local"
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
