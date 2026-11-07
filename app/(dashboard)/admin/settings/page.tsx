import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsKlien } from "./klien";

export const metadata = { title: "Admin Settings" };

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("id", "global_premium_on")
    .single();

  const isOn = data?.value === "true";

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Pengaturan Sistem</h1>
      <p className="text-gray-600 text-sm mb-8">Kelola status global aplikasi.</p>

      <SettingsKlien initialValue={isOn} />
    </div>
  );
}
