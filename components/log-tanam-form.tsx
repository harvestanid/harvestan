"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type JenisCustom = {
  id: string;
  nama: string;
  emoji: string;
};

type Props = {
  mode: "create" | "edit";
  logId?: string;
  jenisCustom: JenisCustom[];
  isDemo?: boolean;
  initial?: {
    tanggal?: string;
    jenis?: string;
    jenis_custom?: string | null;
    judul?: string;
    deskripsi?: string | null;
    biaya?: number;
    keterangan_biaya?: string | null;
    foto_url?: string | null;
  };
};

const JENIS_PRESET: { value: string; emoji: string; label: string }[] = [
  { value: "pemupukan", emoji: "🌱", label: "Pemupukan" },
  { value: "penyemprotan", emoji: "🧴", label: "Penyemprotan" },
  { value: "penyiraman", emoji: "💧", label: "Penyiraman" },
  { value: "pemangkasan", emoji: "✂️", label: "Pemangkasan" },
  { value: "cek_hama", emoji: "🐛", label: "Cek Hama" },
  { value: "penanaman", emoji: "🌾", label: "Penanaman" },
  { value: "lainnya", emoji: "📝", label: "Lainnya" },
];

// ============================================================
// Helper: format angka jadi "1.234.567" (tanpa Rp)
// ============================================================
function formatRibuan(value: string): string {
  // Hapus semua karakter selain digit
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  // Tambah titik tiap 3 digit dari belakang
  return Number(digits).toLocaleString("id-ID");
}

// ============================================================
// Helper: ambil angka murni dari "1.234.567" → 1234567
// ============================================================
function parseRibuan(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function LogTanamForm({
  mode,
  logId,
  jenisCustom: initialJenisCustom,
  isDemo = false,
  initial,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tanggal, setTanggal] = useState(
    initial?.tanggal || new Date().toISOString().split("T")[0]
  );
  const [jenis, setJenis] = useState(initial?.jenis || "pemupukan");
  const [jenisCustom, setJenisCustom] = useState(initial?.jenis_custom || "");
  const [judul, setJudul] = useState(initial?.judul || "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi || "");

  // Biaya: state disimpan sebagai string ter-format (contoh: "150.000")
  const [biaya, setBiaya] = useState(
    initial?.biaya ? formatRibuan(String(initial.biaya)) : ""
  );

  const [keteranganBiaya, setKeteranganBiaya] = useState(
    initial?.keterangan_biaya || ""
  );
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    initial?.foto_url || null
  );
  const [hapusFoto, setHapusFoto] = useState(false);

  const [jenisCustomList, setJenisCustomList] =
    useState<JenisCustom[]>(initialJenisCustom);
  const [showAddJenis, setShowAddJenis] = useState(false);
  const [namaJenisBaru, setNamaJenisBaru] = useState("");
  const [emojiJenisBaru, setEmojiJenisBaru] = useState("📝");
  const [loadingJenis, setLoadingJenis] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // Handler biaya: auto-format saat user ngetik
  // ============================================================
  function handleBiayaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setBiaya(formatRibuan(raw));
  }

  function handlePilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Foto maksimal 5 MB");
      return;
    }
    setFotoFile(f);
    setHapusFoto(false);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(String(reader.result));
    reader.readAsDataURL(f);
  }

  function handleHapusFoto() {
    setFotoFile(null);
    setFotoPreview(null);
    setHapusFoto(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleTambahJenis() {
    if (!namaJenisBaru.trim()) {
      setError("Nama jenis wajib diisi");
      return;
    }
    setError("");
    setLoadingJenis(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis");

      const { data, error: insertErr } = await supabase
        .from("activity_jenis_custom")
        .insert({
          user_id: user.id,
          nama: namaJenisBaru.trim(),
          emoji: emojiJenisBaru || "📝",
        })
        .select()
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          throw new Error("Jenis ini udah ada");
        }
        throw new Error(insertErr.message);
      }

      setJenisCustomList([...jenisCustomList, data]);
      setJenis("custom");
      setJenisCustom(data.nama);
      setShowAddJenis(false);
      setNamaJenisBaru("");
      setEmojiJenisBaru("📝");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal tambah jenis");
    } finally {
      setLoadingJenis(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!judul.trim()) {
      setError("Judul wajib diisi");
      return;
    }

    if (jenis === "custom" && !jenisCustom) {
      setError("Pilih jenis custom dulu");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis");

      // Upload foto kalau ada
      let fotoUrl = initial?.foto_url || null;

      if (hapusFoto && !fotoFile) {
        // Hapus foto lama dari storage (kalau edit)
        if (initial?.foto_url) {
          try {
            const url = new URL(initial.foto_url);
            const pathParts = url.pathname.split("/activity-photos/");
            if (pathParts[1]) {
              await supabase.storage
                .from("activity-photos")
                .remove([decodeURIComponent(pathParts[1])]);
            }
          } catch (e) {
            console.error("Gagal hapus foto lama:", e);
          }
        }
        fotoUrl = null;
      }

      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("activity-photos")
          .upload(fileName, fotoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          throw new Error("Gagal upload foto: " + uploadErr.message);
        }

        const { data: publicUrl } = supabase.storage
          .from("activity-photos")
          .getPublicUrl(fileName);

        fotoUrl = publicUrl.publicUrl;
      }

      const payload = {
        tanggal,
        jenis,
        jenis_custom: jenis === "custom" ? jenisCustom.trim() : null,
        judul: judul.trim(),
        deskripsi: deskripsi.trim() || null,
        // Biaya: parse dari "150.000" → 150000
        biaya: parseRibuan(biaya),
        keterangan_biaya: keteranganBiaya.trim() || null,
        foto_url: fotoUrl,
      };

      if (mode === "create") {
        const { error: insertErr } = await supabase
          .from("activity_logs")
          .insert({
            ...payload,
            user_id: user.id,
            is_demo: false,
          });

        if (insertErr) throw new Error(insertErr.message);
      } else if (mode === "edit" && logId) {
        const { error: updateErr } = await supabase
          .from("activity_logs")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId)
          .eq("user_id", user.id);

        if (updateErr) throw new Error(updateErr.message);
      }

      router.push("/log-tanam");
      router.refresh();
    } catch (err: any) {
      console.error("Error simpan log:", err);
      setError(err.message || "Gagal menyimpan log");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 md:p-6 space-y-5 shadow-lg shadow-[#2c5e2e]/5"
    >
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-2xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* TANGGAL */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          📅 Tanggal <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          required
          className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
        />
      </div>

      {/* JENIS AKTIVITAS */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          🎯 Jenis Aktivitas <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {JENIS_PRESET.map((j) => {
            const aktif = jenis === j.value;
            return (
              <button
                key={j.value}
                type="button"
                onClick={() => setJenis(j.value)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  aktif
                    ? "border-[#f0b429] bg-[#f0b429]/10"
                    : "border-[#2c5e2e]/10 bg-white hover:border-[#f0b429]/40"
                }`}
              >
                <div className="text-xl mb-1">{j.emoji}</div>
                <div className="text-xs font-bold text-[#2c5e2e]">
                  {j.label}
                </div>
              </button>
            );
          })}

          {/* Jenis Custom */}
          {jenisCustomList.map((c) => {
            const aktif = jenis === "custom" && jenisCustom === c.nama;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setJenis("custom");
                  setJenisCustom(c.nama);
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  aktif
                    ? "border-orange-400 bg-orange-50"
                    : "border-orange-200 bg-white hover:border-orange-400"
                }`}
              >
                <div className="text-xl mb-1">{c.emoji}</div>
                <div className="text-xs font-bold text-orange-800">
                  {c.nama}
                </div>
              </button>
            );
          })}

          {/* Tombol tambah jenis custom */}
          <button
            type="button"
            onClick={() => setShowAddJenis(true)}
            className="p-3 rounded-2xl border-2 border-dashed border-[#2c5e2e]/30 bg-white hover:border-[#f0b429] hover:bg-[#f0b429]/5 text-left transition-all"
          >
            <div className="text-xl mb-1">➕</div>
            <div className="text-xs font-bold text-[#2c5e2e]">
              Tambah Jenis
            </div>
          </button>
        </div>

        {/* Modal tambah jenis custom */}
        {showAddJenis && (
          <div className="mt-3 bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-orange-900 uppercase tracking-widest">
              ➕ Jenis Custom Baru
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] text-orange-800 mb-1">
                  Emoji
                </label>
                <input
                  type="text"
                  value={emojiJenisBaru}
                  onChange={(e) => setEmojiJenisBaru(e.target.value)}
                  maxLength={4}
                  className="w-full border-2 border-orange-300 rounded-xl px-2 py-2 text-lg text-center focus:outline-none focus:border-orange-500 bg-white"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[10px] text-orange-800 mb-1">
                  Nama Jenis
                </label>
                <input
                  type="text"
                  value={namaJenisBaru}
                  onChange={(e) => setNamaJenisBaru(e.target.value)}
                  placeholder="Contoh: Cek pH Tanah"
                  maxLength={40}
                  className="w-full border-2 border-orange-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTambahJenis}
                disabled={loadingJenis}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-full transition-all disabled:opacity-50"
              >
                {loadingJenis ? "⏳ Menyimpan..." : "💾 Simpan Jenis"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddJenis(false);
                  setNamaJenisBaru("");
                  setEmojiJenisBaru("📝");
                }}
                className="bg-white hover:bg-orange-100 text-orange-800 text-xs font-bold px-4 py-2.5 rounded-full border-2 border-orange-300 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JUDUL */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          📌 Judul <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Contoh: Pupuk Urea tahap 1"
          maxLength={100}
          required
          className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
        />
      </div>

      {/* DESKRIPSI */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          📝 Deskripsi (opsional)
        </label>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Detail aktivitas — berapa Kg pupuk, apa yang dilakukan, dll"
          rows={3}
          maxLength={500}
          className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium resize-none"
        />
      </div>

      {/* BIAYA */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          💰 Biaya (opsional)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#2c5e2e]/60 pointer-events-none">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={biaya}
              onChange={handleBiayaChange}
              placeholder="0"
              className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
            />
          </div>
          <input
            type="text"
            value={keteranganBiaya}
            onChange={(e) => setKeteranganBiaya(e.target.value)}
            placeholder="Untuk apa?"
            maxLength={80}
            className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          />
        </div>
        {biaya && (
          <p className="text-xs text-[#2c5e2e] font-bold mt-2">
            💰 Rp {biaya}
          </p>
        )}
        <p className="text-[10px] text-[#2c5e2e]/60 mt-1 italic">
          Contoh: Rp 150.000 — Beli Urea 50 Kg
        </p>
      </div>

      {/* FOTO */}
      <div>
        <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
          📸 Foto (opsional, max 5 MB)
        </label>

        {fotoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoPreview}
              alt="Preview"
              className="w-full max-h-64 object-cover rounded-2xl border-2 border-[#2c5e2e]/10"
            />
            <button
              type="button"
              onClick={handleHapusFoto}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-bold shadow-lg transition-all"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#2c5e2e]/30 hover:border-[#f0b429] rounded-2xl p-6 cursor-pointer transition-all bg-[#faf9f5]">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-xs font-bold text-[#2c5e2e]">
              Klik untuk pilih foto
            </div>
            <div className="text-[10px] text-[#2c5e2e]/60 mt-1">
              JPG / PNG — max 5 MB
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePilihFoto}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* TOMBOL */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || isDemo}
          className="flex-1 bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
        >
          {loading
            ? "⏳ Menyimpan..."
            : mode === "create"
            ? "💾 Simpan Log"
            : "💾 Simpan Perubahan"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-6 py-3.5 rounded-full transition-all"
        >
          Batal
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3">
          <p className="text-xs text-amber-800 leading-relaxed text-center">
            🔒 <strong>Mode Demo</strong> — gak bisa simpan log. Selesai demo
            untuk input data asli.
          </p>
        </div>
      )}
    </form>
  );
}
