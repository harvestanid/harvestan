"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MarkdownRenderer } from "./markdown-renderer";

type Kategori = "panduan" | "harga" | "hama" | "bisnis" | "teknologi" | "kisah";

const KATEGORI_OPTIONS: { value: Kategori; label: string; emoji: string }[] = [
  { value: "panduan", label: "Panduan Tanam", emoji: "📗" },
  { value: "harga", label: "Harga & Pasar", emoji: "💰" },
  { value: "hama", label: "Hama & Penyakit", emoji: "🐛" },
  { value: "bisnis", label: "Bisnis Tani", emoji: "📈" },
  { value: "teknologi", label: "Teknologi", emoji: "💻" },
  { value: "kisah", label: "Kisah Sukses", emoji: "📖" },
];

type Props = {
  mode: "create" | "edit";
  articleId?: string;
  initial?: {
    slug?: string;
    judul?: string;
    ringkasan?: string;
    konten?: string;
    cover_url?: string | null;
    kategori?: Kategori;
    tags?: string[];
    status?: "draft" | "published";
  };
};

function buatSlug(judul: string): string {
  return judul
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function hitungReadingTime(konten: string): number {
  const words = konten.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function BlogForm({ mode, articleId, initial }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const kontenRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const kontenImageInputRef = useRef<HTMLInputElement>(null);

  const [judul, setJudul] = useState(initial?.judul || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugManual, setSlugManual] = useState(!!initial?.slug);
  const [ringkasan, setRingkasan] = useState(initial?.ringkasan || "");
  const [konten, setKonten] = useState(initial?.konten || "");
  const [kategori, setKategori] = useState<Kategori>(
    initial?.kategori || "panduan"
  );
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(initial?.tags) ? initial.tags.join(", ") : ""
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initial?.cover_url || null
  );
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const readingTime = useMemo(() => hitungReadingTime(konten), [konten]);

  // Auto-generate slug dari judul (kalau belum diubah manual)
  function handleJudulChange(val: string) {
    setJudul(val);
    if (!slugManual) {
      setSlug(buatSlug(val));
    }
  }

  async function uploadFile(file: File, folder: string): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: publicUrl } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Cover maksimal 5 MB");
      return;
    }

    setError("");
    setUploadingCover(true);
    try {
      const url = await uploadFile(f, "covers");
      setCoverUrl(url);
    } catch (err: any) {
      setError("Gagal upload cover: " + err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleUploadInlineImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Gambar maksimal 5 MB");
      return;
    }

    setError("");
    setUploadingImage(true);
    try {
      const url = await uploadFile(f, "inline");

      // Insert markdown ke posisi kursor
      const textarea = kontenRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const mdText = `\n![${f.name.replace(/\.[^.]+$/, "")}](${url})\n`;
        const newKonten =
          konten.slice(0, start) + mdText + konten.slice(end);
        setKonten(newKonten);

        // Pindah kursor ke akhir gambar yang baru di-insert
        setTimeout(() => {
          const newPos = start + mdText.length;
          textarea.focus();
          textarea.setSelectionRange(newPos, newPos);
        }, 50);
      } else {
        setKonten(konten + `\n![gambar](${url})\n`);
      }
    } catch (err: any) {
      setError("Gagal upload gambar: " + err.message);
    } finally {
      setUploadingImage(false);
      if (kontenImageInputRef.current) {
        kontenImageInputRef.current.value = "";
      }
    }
  }

  function handleHapusCover() {
    setCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  async function handleSubmit(
    e: React.FormEvent,
    statusOverride?: "draft" | "published"
  ) {
    e.preventDefault();
    setError("");

    if (!judul.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    if (!slug.trim()) {
      setError("Slug wajib diisi");
      return;
    }
    if (!ringkasan.trim()) {
      setError("Ringkasan wajib diisi");
      return;
    }
    if (!konten.trim()) {
      setError("Konten wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login habis");

      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const authorNama =
        user.user_metadata?.nama ||
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Admin";

      const status = statusOverride || initial?.status || "draft";

      const payload = {
        slug: slug.trim(),
        judul: judul.trim(),
        ringkasan: ringkasan.trim(),
        konten,
        cover_url: coverUrl,
        kategori,
        tags: tagsArray,
        status,
        reading_time: readingTime,
        author_id: user.id,
        author_nama: authorNama,
      };

      if (mode === "create") {
        const { error: insertErr } = await supabase
          .from("articles")
          .insert({
            ...payload,
            published_at:
              status === "published" ? new Date().toISOString() : null,
          });

        if (insertErr) {
          if (insertErr.code === "23505") {
            throw new Error("Slug sudah dipakai. Ganti slug lain.");
          }
          throw new Error(insertErr.message);
        }
      } else if (mode === "edit" && articleId) {
        const { error: updateErr } = await supabase
          .from("articles")
          .update({
            ...payload,
            published_at:
              status === "published" && !initial?.status
                ? new Date().toISOString()
                : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", articleId);

        if (updateErr) {
          if (updateErr.code === "23505") {
            throw new Error("Slug sudah dipakai. Ganti slug lain.");
          }
          throw new Error(updateErr.message);
        }
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Gagal menyimpan artikel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-2xl text-sm sticky top-20 z-20">
          ⚠️ {error}
        </div>
      )}

      {/* ACTION BAR */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 sticky top-20 z-10 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-[#2c5e2e]/60">
            📝{" "}
            <span className="font-bold text-[#2c5e2e]">{readingTime} menit</span>{" "}
            · {konten.trim().split(/\s+/).length} kata
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, "draft")}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-2.5 px-5 rounded-full transition-all disabled:opacity-50"
          >
            💾 Simpan Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, "published")}
            disabled={loading}
            className="bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold text-sm py-2.5 px-6 rounded-full transition-all hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "⏳ Menyimpan..." : "🚀 Publish"}
          </button>
        </div>
      </div>

      {/* GRID: KONTEN + PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ============ KIRI: FORM ============ */}
        <div className="space-y-4">
          {/* JUDUL */}
          <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
            <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              📌 Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => handleJudulChange(e.target.value)}
              placeholder="Contoh: Cara Menanam Padi dari Awal sampai Panen"
              maxLength={200}
              className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-base focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-bold"
            />

            <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2 mt-4">
              🔗 Slug (URL) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 bg-[#2c5e2e]/5 border-2 border-[#2c5e2e]/10 rounded-2xl px-4 py-2.5">
              <span className="text-xs text-[#2c5e2e]/60 font-mono">
                /blog/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(buatSlug(e.target.value));
                  setSlugManual(true);
                }}
                placeholder="cara-menanam-padi"
                className="flex-1 bg-transparent text-sm focus:outline-none text-[#2c5e2e] font-mono font-medium"
              />
            </div>
            <p className="text-[10px] text-[#2c5e2e]/50 mt-1 italic">
              Auto-generate dari judul. Bisa diubah manual.
            </p>
          </div>

          {/* KATEGORI + RINGKASAN */}
          <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                🏷️ Kategori <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {KATEGORI_OPTIONS.map((k) => {
                  const aktif = kategori === k.value;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKategori(k.value)}
                      className={`p-2.5 rounded-2xl border-2 text-left transition-all text-xs font-bold ${
                        aktif
                          ? "border-[#f0b429] bg-[#f0b429]/10 text-[#2c5e2e]"
                          : "border-[#2c5e2e]/10 bg-white text-[#2c5e2e] hover:border-[#f0b429]/40"
                      }`}
                    >
                      {k.emoji} {k.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                📝 Ringkasan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Ringkasan 1-2 kalimat untuk meta description + preview"
                rows={3}
                maxLength={200}
                className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium resize-none"
              />
              <p className="text-[10px] text-[#2c5e2e]/50 mt-1 text-right">
                {ringkasan.length}/200
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                🏷️ Tags (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="padi, pemula, panduan, tanam"
                className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
              />
            </div>
          </div>

          {/* COVER */}
          <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
            <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
              🖼️ Cover Image (opsional)
            </label>

            {coverUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt="Cover"
                  className="w-full max-h-64 object-cover rounded-2xl border-2 border-[#2c5e2e]/10"
                />
                <button
                  type="button"
                  onClick={handleHapusCover}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-bold shadow-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#2c5e2e]/30 hover:border-[#f0b429] rounded-2xl p-6 cursor-pointer transition-all bg-[#faf9f5]">
                <div className="text-3xl mb-2">
                  {uploadingCover ? "⏳" : "🖼️"}
                </div>
                <div className="text-xs font-bold text-[#2c5e2e]">
                  {uploadingCover ? "Uploading..." : "Klik pilih cover"}
                </div>
                <div className="text-[10px] text-[#2c5e2e]/50 mt-1">
                  JPG / PNG — max 5 MB
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCover}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* KONTEN EDITOR */}
          <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
                ✍️ Konten (Markdown) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    kontenImageInputRef.current?.click()
                  }
                  disabled={uploadingImage}
                  className="text-[10px] bg-[#f0b429]/20 hover:bg-[#f0b429]/30 text-[#2c5e2e] font-bold px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                >
                  {uploadingImage ? "⏳ Upload..." : "🖼️ Insert Gambar"}
                </button>
                <input
                  ref={kontenImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadInlineImage}
                  className="hidden"
                />
              </div>
            </div>

            <textarea
              ref={kontenRef}
              value={konten}
              onChange={(e) => setKonten(e.target.value)}
              placeholder={`# Heading\n\nTulis paragraf pembuka di sini...\n\n## Sub Heading\n\n- List item 1\n- List item 2\n\n**Bold** dan *italic*\n\n> Blockquote buat highlight`}
              rows={20}
              className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-mono leading-relaxed resize-y"
            />

            {/* Toolbar help */}
            <div className="mt-2 bg-[#2c5e2e]/5 rounded-xl p-3">
              <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest mb-1.5">
                📖 Markdown Cheat Sheet
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-[#2c5e2e]/70 font-mono">
                <div># Heading 1</div>
                <div>## Heading 2</div>
                <div>**Bold**</div>
                <div>*italic*</div>
                <div>- Bullet list</div>
                <div>1. Number list</div>
                <div>[Link](url)</div>
                <div>![Image](url)</div>
                <div>{">"} Blockquote</div>
                <div>--- Divider</div>
              </div>
            </div>
          </div>

          {/* MOBILE PREVIEW TOGGLE */}
          <button
            type="button"
            onClick={() => setShowPreviewMobile(!showPreviewMobile)}
            className="lg:hidden w-full bg-[#2c5e2e]/10 hover:bg-[#2c5e2e]/20 text-[#2c5e2e] font-bold py-3 rounded-2xl transition-all"
          >
            {showPreviewMobile ? "✖️ Tutup Preview" : "👁️ Lihat Preview"}
          </button>
        </div>

        {/* ============ KANAN: PREVIEW ============ */}
        <div
          className={`${
            showPreviewMobile ? "block" : "hidden lg:block"
          } lg:sticky lg:top-44 lg:self-start lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto`}
        >
          <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 shadow-lg shadow-[#2c5e2e]/5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-[#2c5e2e]/10">
              <span className="text-lg">👁️</span>
              <div>
                <div className="font-bold text-[#2c5e2e] text-sm uppercase tracking-widest">
                  Live Preview
                </div>
                <div className="text-[10px] text-[#2c5e2e]/60">
                  Seperti yang dilihat pembaca
                </div>
              </div>
            </div>

            {judul && (
              <div className="mb-4">
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-[#f0b429]/20 text-[#2c5e2e] border border-[#f0b429]/50 mb-2">
                  {KATEGORI_OPTIONS.find((k) => k.value === kategori)?.emoji}{" "}
                  {KATEGORI_OPTIONS.find((k) => k.value === kategori)?.label}
                </span>
                <h1 className="text-2xl font-bold text-[#2c5e2e] leading-tight tracking-tight">
                  {judul}
                </h1>
                {ringkasan && (
                  <p className="text-sm text-[#2c5e2e]/70 mt-2 leading-relaxed">
                    {ringkasan}
                  </p>
                )}
                <div className="text-[10px] text-[#2c5e2e]/50 mt-3 flex gap-2">
                  <span>⏱️ {readingTime} menit</span>
                  <span>·</span>
                  <span>👁️ 0 views</span>
                </div>
              </div>
            )}

            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="Preview"
                className="w-full rounded-2xl mb-4 border-2 border-[#2c5e2e]/10"
              />
            )}

            {konten ? (
              <MarkdownRenderer konten={konten} />
            ) : (
              <div className="text-center py-12 text-[#2c5e2e]/40 italic text-sm">
                Mulai tulis untuk lihat preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
