import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookie mutations are ignored
          }
        },
      },
    }
  );
}

/**
 * True service-role client — no cookies, no session.
 *
 * Deliberately NOT built on @supabase/ssr's createServerClient: that client
 * layers the caller's session (from cookies) on top of whatever key you
 * pass it, so an admin with a logged-in session ends up making requests as
 * their own "authenticated" role instead of "service_role" — silently
 * defeating the whole point of a service client (e.g. Storage RLS, which
 * has no "authenticated" policy, then rejects uploads). This uses the
 * plain supabase-js client with no session persistence, so it always acts
 * as service_role and always bypasses RLS, regardless of who's calling it.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
