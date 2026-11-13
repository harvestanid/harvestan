"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Livestock = {
  id: string;
  jenis: string;
  jenis_kelamin: string;
  tanggal_masuk: string;
  bobot_awal: number;
  harga_beli: number;
  status: string;
};

type Log = {
  id: string;
  tanggal: string;
  jenis_kegiatan: string;
  keterangan: string | null;
  biaya: number;
};

export function SapiListKlien({ 
  livestocks, 
  operationalLogs 
}: { 
  livestocks: Livestock[], 
  operationalLogs: Log[] 
}) {
  const router = useRouter();
  const supabase = createClient();

  const [showFormBiaya, setShowFormBiaya] = useState(false);
  const [tglLog, setTglLog] = useState(new Date().toISOString().split("T")[0]);
  const [jenisLog, setJenisLog] = useState("Pakan");
  const [ketLog, setKetLog] = useState("");
  const [biayaLog, setBiayaLog] = useState("");
  const [loadingLog, setLoadingLog] = useState(false);
  const [error, setError] = useState("");

  const totalSapi = livestocks.length;
  const sapiAktif = livestocks.filter((l) => l.status === "aktif").length;
  const totalBobot = livestocks.reduce((s, l) => s + Number(l.bobot_awal), 0);
  const totalInvestasi = livestocks.reduce((s, l) => s + Number(l.harga_beli), 0);
  
  const totalBiayaOps = operationalLogs.reduce((s, l) => s + Number(l.biaya || 0), 0);

  async function handleSaveBiaya(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoadingLog(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis");

      // Karena biaya ini global (bukan per sapi), kita simpan dengan livestock_id null
      // (Pastikan tabel livestock_logs mengizinkan livestock_id null di database)
      const { error: insErr } = await supabase.from("livestock_logs").insert({
        user_id: user.id, // Simpan sebagai milik user
        livestock_id: null, // Null = operasional global
        tanggal: tglLog,
        jenis_kegiatan: jenisLog,
        keterangan: ketLog || null,
        biaya: Number(biayaLog) || 0,
      });

      if (insErr) throw new Error(insErr.message);

      alert("✅ Biaya operasional berhasil disimpan");
      setShowFormBiaya(false);
      setKetLog("");
      setBiayaLog("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal simpan biaya");
    } finally {
      setLoadingLog(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🐄 Manajemen Sapi</h1>
          <p className="text-gray-600 text-sm mt-1">Kelola data sapi, pakan, dan pertumbuhan.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFormBiaya(!showFormBiaya)}
            className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-5 py-2.5 rounded-full transition shadow-md"
          >
            📝 Input Biaya Operasional
          </button>
          <Link
            href="/peternakan/sapi/baru"
            className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-5 py-2.5 rounded-full transition shadow-md"
          >
            + Tambah Sapi
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

      {showFormBiaya && (
        <form onSubmit={handleSaveBiaya} className="bg-white border-2 border-[#f0b429]/40 rounded-3xl p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-[#2c5e2e]">📝 Input Biaya Operasional (Global)</h3>
          <p className="text-xs text-gray-500 italic mb-2">Biaya ini akan mengurangi total profit peternakan (tidak masuk ke 1 sapi saja).</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tanggal *</label>
              <input type="date" value={tglLog} onChange={(e) => setTglLog(e.target.value)} required className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Jenis Kegiatan *</label>
              <select value={jenisLog} onChange={(e) => setJenisLog(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]">
                <option value="Pakan">🌾 Pakan (Global)</option>
                <option value="Obat">💊 Obat / Vaksin (Global)</option>
                <option value="Tenaga Kerja">👷 Tenaga Kerja (Global)</option>
                <option value="Lainnya">📝 Lainnya (Global)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Keterangan</label>
              <input type="text" value={ketLog} onChange={(e) => setKetLog(e.target.value)} placeholder="Contoh: Beli konsentrat 1 karung" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Biaya (Rp) *</label>
              <input type="number" value={biayaLog} onChange={(e) => setBiayaLog(e.target.value)} placeholder="50000" required className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loadingLog} className="flex-1 bg-[#f0b429] text-[#2c5e2e] font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {loadingLog ? "Menyimpan..." : "💾 Simpan Biaya"}
            </button>
            <button type="button" onClick={() => setShowFormBiaya(false)} className="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm">
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Total Sapi</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalSapi}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Sapi Aktif</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{sapiAktif}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Total Bobot</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{totalBobot.toLocaleString("id-ID")} Kg</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">Total Investasi</div>
          <div className="text-base font-bold text-orange-700 mt-1">Rp {totalInvestasi.toLocaleString("id-ID")}</div>
          <div className="text-[10px] text-red-500 mt-1">Biaya Ops: Rp {totalBiayaOps.toLocaleString("id-ID")}</div>
        </div>
      </div>

      {livestocks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4 opacity-50">🐄</div>
          <h3 className="font-bold text-gray-800 mb-2 text-lg">Belum ada sapi</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Mulai catat sapi pertama Anda untuk memantau pertumbuhan dan keuntungan.</p>
          <Link href="/peternakan/sapi/baru" className="inline-block bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-6 py-3 rounded-full transition">
            + Tambah Sapi Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {livestocks.map((sapi) => (
            <Link
              key={sapi.id}
              href={`/peternakan/sapi/${sapi.id}`}
              className="block bg-white border-2 border-gray-100 hover:border-[#f0b429] rounded-3xl p-5 transition shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-lg text-[#2c5e2e]">{sapi.jenis}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{sapi.jenis_kelamin} · Masuk: {new Date(sapi.tanggal_masuk).toLocaleDateString("id-ID")}</div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${sapi.status === "aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {sapi.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Bobot Awal</div>
                  <div className="font-bold text-gray-800">{Number(sapi.bobot_awal).toLocaleString("id-ID")} Kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Harga Beli</div>
                  <div className="font-bold text-gray-800">Rp {Number(sapi.harga_beli).toLocaleString("id-ID")}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
