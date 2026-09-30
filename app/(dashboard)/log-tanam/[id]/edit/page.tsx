import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { LogTanamForm } from "@/components/log-tanam-form";

export const metadata = {
  title: "Edit Log Tanam",
};

export default async function EditLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: log } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!log) notFound();

  const { data: jenisCustom } = await supabase
    .from("activity_jenis_custom")
    .select("*")
    .eq("user_id", filter.user_id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/log-tanam/${id}`}
          className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium transition-colors"
        >
          ← Kembali ke Detail Log
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] mt-2">
          ✏️ Edit Log
        </h1>
      </div>

      <LogTanamForm
        mode="edit"
        logId={log.id}
        jenisCustom={jenisCustom || []}
        isDemo={filter.is_demo}
        initial={{
          tanggal: log.tanggal,
          jenis: log.jenis,
          jenis_custom: log.jenis_custom,
          judul: log.judul,
          deskripsi: log.deskripsi,
          biaya: Number(log.biaya),
          keterangan_biaya: log.keterangan_biaya,
          foto_url: log.foto_url,
        }}
      />
    </div>
  );
}
