"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const JENIS_PRESET = [
  { id: "pakan", emoji: "🌾", label: "Pakan" },
  { id: "obat", emoji: "💊", label: "Obat / Vaksin" },
  { id: "tenaga", emoji: "👷", label: "Tenaga Kerja" },
  { id: "lainnya", emoji: "📝", label: "Lainnya" },
];

export function FormBiaya({ jenisCustom }: { jenisCustom: any[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [tgl, setTgl] = useState(new Date().toISOString().split("T")[0]);
  const [jenis, setJenis] = useState("pakan");
  const [jenisKustom, setJenisKustom] = useState("");
  const [judul, setJudul] = useState("");
  const [ket, setKet] = useState("");
  const [biaya, setBiaya] = useState(0);
  const [biayaKeterangan, setBiayaKeterangan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showTambahJenis, setShowTambahJenis] = useState(false);
  const [namaJenisBaru, setNamaJenisBaru] = useState("");
  const [emojiJenisBaru, setEmojiJenisBaru] = useState("🏷️");
  const [listJenisCustom, setListJenisCustom] = useState(jenisCustom);

  // Format Rupiah untuk display di input
  const formattedBiaya = new Intl.NumberFormat("id-ID").format(biaya || 0);

  function handleBiayaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setBiaya(Number(raw) || 0);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError("Foto maksimal 5 MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleTambahJenis(e: React.FormEvent) {
    e.preventDefault();
    if (!namaJenisBaru.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sapi/biaya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_jenis", nama: namaJenisBaru.trim(), emoji: emojiJenisBaru || "🏷️" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal tambah jenis");
      
      setListJenisCustom([...listJenisCustom, json.data]);
      setJenis(`custom:${json.data.nama}`);
      setShowTambahJenis(false);
      setNamaJenisBaru("");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi habis");

      const labelJenis = jenis.startsWith("custom:") ? jenis.replace("custom:", "") : JENIS_PRESET.find(j => j.id === jenis)?.label || "Lainnya";

      let fotoUrl = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `biaya/${user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("livestock-photos").upload(fileName, file, { cacheControl: "3600", upsert: true });
        if (upErr) throw new Error("Gagal upload foto: " + upErr.message);
        const { data: pubUrl } = supabase.storage.from("livestock-photos").getPublicUrl(fileName);
        fotoUrl = pubUrl.publicUrl;
      }

      const { error: insErr } = await supabase.from("farm_operational_logs").insert({
        user_id: user.id,
        tanggal: tgl,
        jenis_kegiatan: labelJenis,
        judul: judul.trim(),
        keterangan: ket || null,
        biaya: Number(biaya) || 0,
        foto_url: fotoUrl,
      });

      if (insErr) throw new Error(insErr.message);

      alert("✅ Biaya operasional berhasil disimpan");
      router.push("/peternakan/sapi/biaya");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal simpan biaya");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-6 space-y-5 shadow-sm">
      {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">📅 TANGGAL *</label>
        <input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} required className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-[#faf9f5]/50 text-[#2c5e2e] font-medium" />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">🎯 JENIS PENGELUARAN *</label>
        <div className="grid grid-cols-2 gap-2">
          {JENIS_PRESET.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setJenis(j.id)}
              className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                jenis === j.id ? "border-[#f0b429] bg-[#f0b429]/10" : "border-[#2c5e2e]/10 bg-white hover:border-[#f0b429]/40"
              }`}
            >
              <span className="text-2xl">{j.emoji}</span>
              <span className={`text-xs font-bold ${jenis === j.id ? "text-[#2c5e2e]" : "text-gray-600"}`}>{j.label}</span>
            </button>
          ))}
          {listJenisCustom.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setJenis(`custom:${c.nama}`)}
              className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                jenis === `custom:${c.nama}` ? "border-[#f0b429] bg-[#f0b429]/10" : "border-[#2c5e2e]/10 bg-white hover:border-[#f0b429]/40"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className={`text-xs font-bold ${jenis === `custom:${c.nama}` ? "text-[#2c5e2e]" : "text-gray-600"}`}>{c.nama}</span>
            </button>
          ))}
          
          <button
            type="button"
            onClick={() => setShowTambahJenis(!showTambahJenis)}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#2c5e2e]/30 hover:border-[#f0b429] bg-gray-50 hover:bg-[#f0b429]/5 transition-all"
          >
            <span className="text-2xl font-bold text-gray-400">+</span>
            <span className="text-xs font-bold text-gray-500">Tambah Jenis</span>
          </button>
        </div>
        
        {showTambahJenis && (
          <div className="mt-3 bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-3 flex gap-2 flex-wrap items-end">
            <div className="flex-1 min-w-[100px]">
              <label className="block text-[10px] font-bold text-[#2c5e2e] mb-1">Nama Jenis</label>
              <input type="text" value={namaJenisBaru} onChange={(e) => setNamaJenisBaru(e.target.value)} placeholder="Cth: Beli Token Listrik" className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#f0b429]" />
            </div>
            <div className="w-16">
              <label className="block text-[10px] font-bold text-[#2c5e2e] mb-1">Emoji</label>
              <input type="text" value={emojiJenisBaru} onChange={(e) => setEmojiJenisBaru(e.target.value)} maxLength={2} className="w-full border-2 border-[#2c5e2e]/20 rounded-xl px-3 py-1.5 text-xs text-center focus:outline-none focus:border-[#f0b429]" />
            </div>
            <button type="button" onClick={handleTambahJenis} disabled={loading || !namaJenisBaru.trim()} className="bg-[#2c5e2e] text-white font-bold px-4 py-1.5 rounded-xl text-xs disabled:opacity-50">Simpan</button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">📌 JUDUL *</label>
        <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Beli konsentrat 1 karung" required className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-[#faf9f5]/50 text-[#2c5e2e] font-medium" />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">📝 DESKRIPSI (OPSIONAL)</label>
        <textarea value={ket} onChange={(e) => setKet(e.target.value)} placeholder="Detail pengeluaran..." rows={2} className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-[#faf9f5]/50 text-[#2c5e2e] font-medium resize-none" />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-1">💰 BIAYA (OPSIONAL)</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c5e2e]/50 font-bold">Rp</span>
            <input 
              type="text" 
              value={formattedBiaya} 
              onChange={handleBiayaChange} 
              placeholder="0" 
              className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-[#faf9f5]/50 text-[#2c5e2e] font-medium" 
            />
          </div>
          <input 
            type="text" 
            value={biayaKeterangan} 
            onChange={(e) => setBiayaKeterangan(e.target.value)} 
            placeholder="Untuk apa?" 
            className="w-1/3 border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-[#faf9f5]/50 text-[#2c5e2e] font-medium" 
          />
        </div>
        <p className="text-[10px] text-[#2c5e2e]/50 mt-1 italic">Contoh: Rp 150.000 — Beli konsentrat</p>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">📸 FOTO BUKTI (OPSIONAL)</label>
        {preview ? (
          <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-[#2c5e2e]/10 bg-gray-100">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md">✕</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2c5e2e]/30 hover:border-[#f0b429] rounded-2xl cursor-pointer bg-[#faf9f5] hover:bg-[#f0b429]/5 transition-colors">
            <div className="text-3xl mb-2">📷</div>
            <div className="text-sm font-bold text-[#2c5e2e]">Klik untuk pilih foto</div>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="flex-[2] bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 text-sm">
          {loading ? "⏳ Menyimpan..." : "💾 Simpan Biaya"}
        </button>
        <button type="button" onClick={() => router.back()} className="flex-1 bg-[#2c5e2e]/10 hover:bg-[#2c5e2e]/20 text-[#2c5e2e] font-bold py-3.5 rounded-full transition-all text-sm">
          Batal
        </button>
      </div>
    </form>
  );
}
