import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolAksiLog } from "./tombol-aksi";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const JENIS_PRESET: Record<
  string,
  { emoji: string; label: string; warna: string }
> = {
  pemupukan: {
    emoji: "🌱",
    label: "Pemupukan",
    warna: "bg-green-100 text-green-800 border-green-300",
  },
  penyemprotan: {
    emoji: "🧴",
    label: "Penyemprotan",
    warna: "bg-blue-100 text-blue-800 border-blue-300",
  },
  penyiraman: {
    emoji: "💧",
    label: "Penyiraman",
    warna: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
  pemangkasan: {
    emoji: "✂️",
    label: "Pemangkasan",
    warna: "bg-purple-100 text-purple-800 border-purple-300",
  },
  cek_hama: {
    emoji: "🐛",
    label: "Cek Hama",
    warna: "bg-red-100 text-red-800 border-red-300",
  },
  penanaman: {
    emoji: "🌾",
    label: "Penanaman",
    warna: "bg-[#f0b429]/20 text-[#2c5e2e] border-[#f0b429]/50",
  },
  lainnya: {
    emoji: "📝",
    label: "Lainnya",
    warna: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

export default async function DetailLogPage({
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

  // Ambil jenis custom untuk label
  let jenisInfo = JENIS_PRESET[log.jenis] || JENIS_PRESET.lainnya;
  if (log.jenis === "custom" && log.jenis_custom) {
    const { data: custom } = await supabase
      .from("activity_jenis_custom")
      .select("emoji, nama")
      .eq("user_id", filter.user_id)
      .eq("nama", log.jenis_custom)
      .maybeSingle();

    jenisInfo = {
      emoji: custom?.emoji || "📝",
      label: log.jenis_custom,
      warna: "bg-orange-100 text-orange-800 border-orange-300",
    };
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/log-tanam"
          className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium transition-colors"
        >
          ← Kembali ke Log Tanam
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3 mt-3">
          <div className="min-w-0 flex-1">
            <span
              className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest ${jenisInfo.warna}`}
            >
              {jenisInfo.emoji} {jenisInfo.label}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] mt-3 leading-tight">
              {log.judul}
            </h1>
            <p className="text-[#2c5e2e]/70 text-sm mt-2">
              📅{" "}
              {new Date(log.tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* FOTO */}
      {log.foto_url && (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={log.foto_url}
            alt={log.judul}
            className="w-full rounded-3xl border-2 border-[#2c5e2e]/10 shadow-lg"
          />
        </div>
      )}

      {/* DESKRIPSI */}
      {log.deskripsi && (
        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 mb-4 shadow-lg shadow-[#2c5e2e]/5">
          <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest mb-2">
            📝 Deskripsi
          </div>
          <p className="text-sm text-[#2c5e2e] leading-relaxed whitespace-pre-wrap">
            {log.deskripsi}
          </p>
        </div>
      )}

      {/* BIAYA */}
      {Number(log.biaya) > 0 && (
        <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-3xl p-5 mb-4">
          <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
            💰 Biaya
          </div>
          <div className="text-2xl font-bold text-[#2c5e2e]">
            {formatRp(Number(log.biaya))}
          </div>
          {log.keterangan_biaya && (
            <div className="text-xs text-[#2c5e2e]/70 mt-1">
              {log.keterangan_biaya}
            </div>
          )}
        </div>
      )}

      {/* TOMBOL AKSI */}
      <TombolAksiLog
        logId={log.id}
        judul={log.judul}
        isDemo={filter.is_demo}
      />

      {/* Info created/updated */}
      <div className="mt-6 text-[10px] text-[#2c5e2e]/40 text-center italic">
        Dibuat:{" "}
        {new Date(log.created_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {log.updated_at && log.updated_at !== log.created_at && (
          <> · Diedit: {new Date(log.updated_at).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</>
        )}
      </div>
    </div>
  );
}
