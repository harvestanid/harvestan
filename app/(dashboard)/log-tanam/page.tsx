import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { LogTanamKlien } from "./klien";

export const metadata = {
  title: "Log Tanam",
};

export default async function LogTanamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  // Ambil logs
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });

  // Ambil jenis custom
  const { data: jenisCustom } = await supabase
    .from("activity_jenis_custom")
    .select("*")
    .eq("user_id", filter.user_id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Log Tanam</h1>
          <p className="text-gray-600 text-sm mt-1">
            Catatan aktivitas harian di lahan — pemupukan, penyemprotan, dll
          </p>
        </div>
        <Link
          href="/log-tanam/baru"
          className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02] shadow-md"
        >
          + Tambah Log
        </Link>
      </div>

      <LogTanamKlien
        logs={logs || []}
        jenisCustom={jenisCustom || []}
        isDemo={filter.is_demo}
      />
    </div>
  );
}
