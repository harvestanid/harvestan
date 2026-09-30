import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PengaturanTab } from "./tab-container";

export const metadata = {
  title: "Pengaturan",
};

export default async function PengaturanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const meta = user.user_metadata || {};
  const username = meta.username || meta.nama || user.email?.split("@")[0] || "";
  const nama = meta.nama || meta.full_name || "";

  return (
    <PengaturanTab
      user={{
        email: user.email || "",
        nama,
        username,
      }}
    />
  );
}
