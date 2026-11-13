"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Sapi = {
  id: string;
  public_token: string;
  jenis: string;
  jenis_kelamin: string;
  tanggal_lahir: string | null;
  bobot_awal: number;
  tinggi_awal: number | null;
  panjang_awal: number | null;
  harga_beli: number;
  tanggal_masuk: string;
  status: string;
  foto_url: string | null;
  is_public: boolean;
};

type Measurement = {
  id: string;
  tanggal: string;
  bobot_kg: number;
  tinggi_cm: number | null;
  panjang_cm: number | null;
  catatan: string | null;
};

type Log = {
  id: string;
  tanggal: string;
  jenis_kegiatan: string;
  keterangan: string | null;
  biaya: number;
};

type Props = {
  sapi: Sapi;
  measurements: Measurement[];
  logs: Log[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function DetailSapiKlien({ sapi, measurements, logs }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // State untuk Timbang
  const [showFormTimbang, setShowFormTimbang] = useState(false);
  const [tglTimbang, setTglTimbang] = useState(new Date().toISOString().split("T")[0]);
  const [bobot, setBobot] = useState("");
  const [tinggi, setTinggi] = useState("");
  const [panjang, setPanjang] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [loadingTimbang, setLoadingTimbang] = useState(false);

  // State untuk Log
  const [showFormLog, setShowFormLog] = useState(false);
  const [tglLog, setTglLog] = useState(new Date().toISOString().split("T")[0]);
  const [jenisLog, setJenisLog] = useState("Pakan");
  const [ketLog, setKetLog] = useState("");
  const [biayaLog, setBiayaLog] = useState("");
  const [loadingLog, setLoadingLog] = useState(false);

  const [error, setError] = useState("");

  // Hitung ADG (Average Daily Gain)
  const lastMeasurement = measurements[measurements.length - 1];
  const bobotTerakhir = lastMeasurement ? lastMeasurement.bobot_kg : sapi.bobot_awal;
  
  const totalHari = Math.max(1, Math.floor((new Date().getTime() - new Date(sapi.tanggal_masuk).getTime()) / (1000 * 60 * 60 * 24)));
  const adg = (bobotTerakhir - sapi.bobot_awal) / totalHari;

  // Total Biaya Log
  const totalBiayaLog = logs.reduce((s, l) => s + Number(l.biaya || 0), 0);
  
  // Estimasi Profit Sederhana (Harga jual belum tahu, jadi cuma info biaya)
  const totalInvestasi = sapi.harga_beli + totalBiayaLog;

  async function handleTimbang(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoadingTimbang(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis");

      let fotoUrl = sapi.foto_url;

      // Upload foto baru (kalau ada)
      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/${sapi.id}-${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("livestock-photos")
          .upload(fileName, fotoFile, { cacheControl: "3600", upsert: true });

        if (upErr) throw new Error("Gagal upload foto: " + upErr.message);

        const { data: pubUrl } = supabase.storage
          .from("livestock-photos")
          .getPublicUrl(fileName);
        
        fotoUrl = pubUrl.publicUrl;
      }

      // Insert Measurement
      const { error: insErr } = await supabase.from("livestock_measurements").insert({
        livestock_id: sapi.id,
        tanggal: tglTimbang,
        bobot_kg: Number(bobot) || 0,
        tinggi_cm: Number(tinggi) || null,
        panjang_cm: Number(panjang) || null,
        catatan: catatan || null,
      });

      if (insErr) throw new Error(insErr.message);

      // Update foto di tabel livestocks (karena cuma 1 foto terbaru)
      if (fotoUrl !== sapi.foto_url) {
        await supabase.from("livestocks").update({ foto_url: fotoUrl }).eq("id", sapi.id);
      }

      alert("✅ Data timbang berhasil disimpan");
      setShowFormTimbang(false);
      setBobot("");
      setTinggi("");
      setPanjang("");
      setCatatan("");
      setFotoFile(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal simpan timbang");
    } finally {
      setLoadingTimbang(false);
    }
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoadingLog(true);

    try {
      const { error: insErr } = await supabase.from("livestock_logs").insert({
        livestock_id: sapi.id,
        tanggal: tglLog,
        jenis_kegiatan: jenisLog,
        keterangan: ketLog || null,
        biaya: Number(biayaLog) || 0,
      });

      if (insErr) throw new Error(insErr.message);

      alert("✅ Log berhasil disimpan");
      setShowFormLog(false);
      setKetLog("");
      setBiayaLog("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal simpan log");
    } finally {
      setLoadingLog(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/peternakan/sapi" className="text-[#2c5e2e] hover:text-[#f0b429] text-sm font-medium">
            ← Kembali ke Daftar Sapi
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            🐄 Sapi {sapi.jenis}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {sapi.jenis_kelamin} · Masuk: {formatTanggal(sapi.tanggal_masuk)} · Status: <span className="font-bold uppercase">{sapi.status}</span>
          </p>
        </div>
        
        {/* Tombol QR Publik */}
        <Link
          href={`/peternakan/sapi/${sapi.id}/qr`}
          className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-5 py-2.5 rounded-full transition shadow-md flex items-center gap-2"
        >
          📲 Generate QR
        </Link>
      </div>

      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

      {/* Ringkasan & Foto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-green-700 font-bold uppercase">Bobot Terakhir</div>
              <div className="text-xl font-bold text-green-900 mt-1">{bobotTerakhir.toLocaleString("id-ID")} Kg</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-blue-700 font-bold uppercase">ADG (Pertumbuhan/Hari)</div>
              <div className="text-xl font-bold text-blue-900 mt-1">{adg.toFixed(2)} Kg/Hari</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-[10px] text-red-700 font-bold uppercase">Total Investasi (Beli + Biaya)</div>
            <div className="text-lg font-bold text-red-900 mt-1">{formatRp(totalInvestasi)}</div>
            <div className="text-[10px] text-red-600 italic mt-0.5">Harga beli: {formatRp(sapi.harga_beli)} · Biaya operasional: {formatRp(totalBiayaLog)}</div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-3 shadow-sm flex flex-col items-center justify-center">
          {sapi.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sapi.foto_url} alt="Foto Sapi" className="w-full h-40 object-cover rounded-2xl" />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">Belum ada foto</div>
          )}
          <div className="text-[10px] text-gray-500 mt-2">Foto terbaru</div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowFormTimbang(!showFormTimbang)}
          className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3 rounded-2xl transition shadow-md"
        >
          ⚖️ Input Timbang
        </button>
        <button
          onClick={() => setShowFormLog(!showFormLog)}
          className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold py-3 rounded-2xl transition shadow-md"
        >
          📝 Input Log/Biaya
        </button>
      </div>

      {/* Form Timbang */}
      {showFormTimbang && (
        <form onSubmit={handleTimbang} className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-[#2c5e2e]">⚖️ Input Timbang & Ukur</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tanggal *</label>
              <input type="date" value={tglTimbang} onChange={(e) => setTglTimbang(e.target.value)} required className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Bobot (Kg) *</label>
              <input type="number" value={bobot} onChange={(e) => setBobot(e.target.value)} required placeholder="250" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tinggi (Cm)</label>
              <input type="number" value={tinggi} onChange={(e) => setTinggi(e.target.value)} placeholder="130" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Panjang (Cm)</label>
              <input type="number" value={panjang} onChange={(e) => setPanjang(e.target.value)} placeholder="160" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Foto Terbaru (Ganti Foto Lama)</label>
            <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#2c5e2e]/10 file:text-[#2c5e2e] hover:file:bg-[#2c5e2e]/20" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Catatan (Opsional)</label>
            <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Kondisi sapi, nafsu makan, dll" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loadingTimbang} className="flex-1 bg-[#2c5e2e] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {loadingTimbang ? "Menyimpan..." : "💾 Simpan Timbang"}
            </button>
            <button type="button" onClick={() => setShowFormTimbang(false)} className="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm">
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Form Log */}
      {showFormLog && (
        <form onSubmit={handleLog} className="bg-white border-2 border-[#f0b429]/40 rounded-3xl p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-[#2c5e2e]">📝 Input Log & Biaya</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Tanggal *</label>
              <input type="date" value={tglLog} onChange={(e) => setTglLog(e.target.value)} required className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Jenis Kegiatan *</label>
              <select value={jenisLog} onChange={(e) => setJenisLog(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]">
                <option value="Pakan">🌾 Pakan</option>
                <option value="Obat">💊 Obat / Vaksin</option>
                <option value="Tenaga Kerja">👷 Tenaga Kerja</option>
                <option value="Lainnya">📝 Lainnya</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Keterangan</label>
              <input type="text" value={ketLog} onChange={(e) => setKetLog(e.target.value)} placeholder="Contoh: Konsentrat 5kg" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Biaya (Rp) *</label>
              <input type="number" value={biayaLog} onChange={(e) => setBiayaLog(e.target.value)} placeholder="50000" required className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429]" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loadingLog} className="flex-1 bg-[#f0b429] text-[#2c5e2e] font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {loadingLog ? "Menyimpan..." : "💾 Simpan Log"}
            </button>
            <button type="button" onClick={() => setShowFormLog(false)} className="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm">
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Grafik Sederhana (Bar Chart CSS) */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-[#2c5e2e] mb-4">📈 Grafik Pertumbuhan Bobot</h3>
        {measurements.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm italic">Belum ada data timbang</div>
        ) : (
          <div className="space-y-3">
            {measurements.map((m, i) => {
              const prev = i === 0 ? sapi.bobot_awal : measurements[i - 1].bobot_kg;
              const diff = m.bobot_kg - prev;
              const maxBobot = Math.max(...measurements.map(x => x.bobot_kg), sapi.bobot_awal);
              const pct = maxBobot > 0 ? (m.bobot_kg / maxBobot) * 100 : 0;

              return (
                <div key={m.id}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium">{formatTanggal(m.tanggal)}</span>
                    <span className="font-bold">{m.bobot_kg.toLocaleString("id-ID")} Kg {diff > 0 && <span className="text-green-600">(+{diff})</span>}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#2c5e2e] to-[#4a9d4e] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Log */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-[#2c5e2e] mb-4">📋 Riwayat Pengeluaran</h3>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm italic">Belum ada log pengeluaran</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-xl border border-gray-200 gap-2">
                <div>
                  <div className="font-bold text-sm text-gray-800">{l.jenis_kegiatan}</div>
                  <div className="text-[10px] text-gray-500">{formatTanggal(l.tanggal)} {l.keterangan && `· ${l.keterangan}`}</div>
                </div>
                <div className="font-bold text-red-600 text-sm flex-shrink-0">{formatRp(l.biaya)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
