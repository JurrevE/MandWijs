import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminView } from "@/components/admin/admin-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Datacontrole" };

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) redirect("/login");
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();
    if (profile?.role !== "admin") redirect("/dashboard");
  }
  return <AdminView />;
}
