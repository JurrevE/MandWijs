import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

type ServerClientOptions = {
  strictCookieWrites?: boolean;
};

export async function createSupabaseServerClient(options: ServerClientOptions = {}) {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          try {
            items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (error) {
            if (options.strictCookieWrites) throw error;
            // Server Components mogen cookies niet altijd schrijven; proxy ververst ze.
          }
        },
      },
    },
  );
}
