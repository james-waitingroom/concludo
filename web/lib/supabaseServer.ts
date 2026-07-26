import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Session-aware Supabase client for Server Components, route handlers, and server actions.
 * Uses the ANON key + the user's cookie session, so all reads/writes go through row-level security.
 * (Setting cookies from a plain Server Component is a no-op — middleware refreshes the session.)
 */
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* called from a Server Component — safe to ignore; middleware handles refresh */
          }
        },
      },
    },
  );
}
