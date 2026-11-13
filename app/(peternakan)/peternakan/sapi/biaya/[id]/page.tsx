import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolAksi } from "./tombol-aksi";

export default async function DetailBiayaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: log } = await supabase
    .from("farm_operational_logs")
    .select("*")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .single();

  if (!log) notFound();

  function formatRp(n: number) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <Link href="/peternakan/sapi/biaya" className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium">
          ← Kembali ke Biaya Operasional
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3 mt-3">
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest bg-orange-100 text-orange-800 border-orange-300">
              {log.jenis_kegiatan}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] mt-3 leading-tight">{log.judul || "Tanpa Judul"}</h1>
            <p className="text-[#2c5e2e]/70 text-sm mt-2">
              📅 {new Date(log.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {log.foto_url && (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={log.foto_url} alt="Bukti" className="w-full rounded-3xl border-2 border-[#2c5e2e]/10 shadow-lg" />
        </div>
      )}

      {log.keterangan && (
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 mb-4 shadow-lg shadow-[#2c5e2e]/5">
          <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest mb-2">📝 Deskripsi</div>
          <p className="text-sm text-[#2c5e2e] leading-relaxed whitespace-pre-wrap">{log.keterangan}</p>
        </div>
      )}

      {Number(log.biaya) > 0 && (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-3xl p-5 mb-4">
          <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">💰 Biaya</div>
          <div className="text-2xl font-bold text-[#2c5e2e]">{formatRp(Number(log.biaya))}</div>
        </div>
      )}

      <TombolAksi id={log.id} isDemo={filter.is_demo} />

      <div className="mt-6 text-[10px] text-[#2c5e2e]/40 text-center italic">
        Dibuat: {new Date(log.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
