import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { LogTanamForm } from "@/components/log-tanam-form";

export const metadata = {
  title: "Tambah Log Tanam",
};

export default async function LogTanamBaruPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: jenisCustom } = await supabase
    .from("activity_jenis_custom")
    .select("*")
    .eq("user_id", filter.user_id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/log-tanam"
          className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium transition-colors"
        >
          ← Kembali ke Log Tanam
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] mt-2">
          📝 Tambah Log Baru
        </h1>
        <p className="text-[#2c5e2e]/60 text-sm mt-1">
          Catat aktivitas yang kamu lakukan hari ini
        </p>
      </div>

      <LogTanamForm
        mode="create"
        jenisCustom={jenisCustom || []}
        isDemo={filter.is_demo}
      />
    </div>
  );
}
