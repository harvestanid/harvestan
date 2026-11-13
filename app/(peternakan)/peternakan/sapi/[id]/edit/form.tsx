"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const JENIS_SAPI = ["Limosin", "Simental", "PO", "Brahman", "Angus", "Lainnya"];

export function FormEditSapi({ initial }: { initial: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [namaSapi, setNamaSapi] = useState(initial.nama_sapi || "");
  const [jenis, setJenis] = useState(JENIS_SAPI.includes(initial.jenis) ? initial.jenis : "Lainnya");
  const [jenisCustom, setJenisCustom] = useState(JENIS_SAPI.includes(initial.jenis) ? "" : initial.jenis);
  const [jenisKelamin, setJenisKelamin] = useState(initial.jenis_kelamin);
  const [tanggalLahir, setTanggalLahir] = useState(initial.tanggal_lahir || "");
  const [bobotAwal, setBobotAwal] = useState(initial.bobot_awal.toString());
  const [tinggiAwal, setTinggiAwal] = useState(initial.tinggi_awal?.toString() || "");
  const [panjangAwal, setPanjangAwal] = useState(initial.panjang_awal?.toString() || "");
  const [hargaBeli, setHargaBeli] = useState(initial.harga_beli.toString());
  const [tanggalMasuk, setTanggalMasuk] = useState(initial.tanggal_masuk);
  const [status, setStatus] = useState(initial.status);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis");

      const finalJenis = jenis === "Lainnya" ? jenisCustom.trim() : jenis;
      if (!finalJenis) throw new Error("Jenis sapi wajib diisi");

      const { error: insErr } = await supabase.from("livestocks").update({
        nama_sapi: namaSapi.trim() || null,
        jenis: finalJenis,
        jenis_kelamin: jenisKelamin,
        tanggal_lahir: tanggalLahir || null,
        bobot_awal: Number(bobotAwal) || 0,
        tinggi_awal: Number(tinggiAwal) || 0,
        panjang_awal: Number(panjangAwal) || 0,
        harga_beli: Number(hargaBeli) || 0,
        tanggal_masuk: tanggalMasuk,
        status,
      }).eq("id", initial.id);

      if (insErr) throw new Error(insErr.message);

      alert("✅ Data Sapi berhasil diupdate");
      router.push(`/peternakan/sapi/${initial.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal simpan data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-6 space-y-4 shadow-sm">
      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

      <div>
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Nama Sapi (Opsional)</label>
        <input type="text" value={namaSapi} onChange={(e) => setNamaSapi(e.target.value)} placeholder="Contoh: Si Jago / Bima" className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Jenis Sapi *</label>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]">
            {JENIS_SAPI.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          {jenis === "Lainnya" && (
            <input type="text" value={jenisCustom} onChange={(e) => setJenisCustom(e.target.value)} placeholder="Ketik jenis sapi..." className="w-full mt-2 border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#f0b429]" required />
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Jenis Kelamin *</label>
          <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]">
            <option value="Jantan">Jantan</option>
            <option value="Betina">Betina</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Tanggal Lahir</label>
          <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Tanggal Masuk *</label>
          <input type="date" value={tanggalMasuk} onChange={(e) => setTanggalMasuk(e.target.value)} required className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Bobot (Kg) *</label>
          <input type="number" value={bobotAwal} onChange={(e) => setBobotAwal(e.target.value)} required className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Tinggi (Cm)</label>
          <input type="number" value={tinggiAwal} onChange={(e) => setTinggiAwal(e.target.value)} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Panjang (Cm)</label>
          <input type="number" value={panjangAwal} onChange={(e) => setPanjangAwal(e.target.value)} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Harga Beli (Rp) *</label>
          <input type="number" value={hargaBeli} onChange={(e) => setHargaBeli(e.target.value)} required className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]">
            <option value="aktif">Aktif</option>
            <option value="terjual">Terjual</option>
            <option value="mati">Mati</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="flex-[2] bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 text-sm">
          {loading ? "⏳ Menyimpan..." : "💾 Update Sapi"}
        </button>
        <button type="button" onClick={() => router.back()} className="flex-1 bg-[#2c5e2e]/10 hover:bg-[#2c5e2e]/20 text-[#2c5e2e] font-bold py-3.5 rounded-full transition-all text-sm">
          Batal
        </button>
      </div>
    </form>
  );
}
