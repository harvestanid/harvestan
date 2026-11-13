"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const JENIS_SAPI = ["Limosin", "Simental", "PO", "Brahman", "Angus", "Lainnya"];

function genToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export function SapiForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [namaSapi, setNamaSapi] = useState("");
  const [jenis, setJenis] = useState(JENIS_SAPI[0]);
  const [jenisCustom, setJenisCustom] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Jantan");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [bobotAwal, setBobotAwal] = useState("");
  const [tinggiAwal, setTinggiAwal] = useState("");
  const [panjangAwal, setPanjangAwal] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Foto maksimal 5 MB"); return; }
    setError("");
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis");
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("livestock-photos").upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data: pubUrl } = supabase.storage.from("livestock-photos").getPublicUrl(fileName);
      setFotoUrl(pubUrl.publicUrl);
    } catch (err: any) {
      setError("Gagal upload foto: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const finalJenis = jenis === "Lainnya" ? jenisCustom.trim() : jenis;
    if (!finalJenis) { setError("Jenis sapi wajib diisi"); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis");

      const { error: insertError } = await supabase.from("livestocks").insert({
        user_id: user.id,
        public_token: genToken(),
        nama_sapi: namaSapi.trim() || null,
        jenis: finalJenis,
        jenis_kelamin: jenisKelamin,
        tanggal_lahir: tanggalLahir || null,
        bobot_awal: Number(bobotAwal) || 0,
        tinggi_awal: Number(tinggiAwal) || 0,
        panjang_awal: Number(panjangAwal) || 0,
        harga_beli: Number(hargaBeli) || 0,
        tanggal_masuk: tanggalMasuk,
        status: "aktif",
        is_public: true,
        is_demo: false,
        foto_url: fotoUrl,
      });

      if (insertError) throw new Error(insertError.message);
      router.push("/peternakan/sapi");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-6 space-y-4">
      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

      <div>
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">Foto Sapi</label>
        {fotoUrl ? (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-[#2c5e2e]/10 bg-gray-100">
            <img src={fotoUrl} alt="Foto Sapi" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setFotoUrl(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md">✕</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2c5e2e]/30 hover:border-[#f0b429] rounded-2xl cursor-pointer bg-gray-50 hover:bg-[#f0b429]/5 transition-colors">
            <div className="text-2xl text-gray-400 mb-1">{uploading ? "⏳" : "📷"}</div>
            <div className="text-xs font-bold text-gray-500">{uploading ? "Mengupload..." : "Pilih Foto"}</div>
            <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploading} className="hidden" />
          </label>
        )}
      </div>

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
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Bobot Awal (Kg) *</label>
          <input type="number" value={bobotAwal} onChange={(e) => setBobotAwal(e.target.value)} placeholder="200" required className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Tinggi (Cm)</label>
          <input type="number" value={tinggiAwal} onChange={(e) => setTinggiAwal(e.target.value)} placeholder="120" className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Panjang (Cm)</label>
          <input type="number" value={panjangAwal} onChange={(e) => setPanjangAwal(e.target.value)} placeholder="150" className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">Harga Beli Bakalan (Rp) *</label>
        <input type="number" value={hargaBeli} onChange={(e) => setHargaBeli(e.target.value)} placeholder="15000000" required className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429]" />
        <p className="text-[10px] text-gray-500 mt-1 italic">*Harga ini rahasia, tidak akan tampil di link publik.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading || uploading} className="flex-1 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition shadow-md disabled:opacity-50">
          {loading ? "⏳ Menyimpan..." : "💾 Simpan Data Sapi"}
        </button>
        <button type="button" onClick={() => router.back()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3.5 rounded-full transition">Batal</button>
      </div>
    </form>
  );
}
