import type { NextConfig } from "next";

const publicSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (publicSupabaseKey?.startsWith("sb_secret_")) {
  throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY bevat een geheime Supabase-key. Gebruik uitsluitend sb_publishable_... of de legacy anon key.");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    typedEnv: false,
  },
};

export default nextConfig;
