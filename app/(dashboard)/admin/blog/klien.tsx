"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Article = {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string;
  cover_url: string | null;
  kategori: string;
  tags: string[] | null;
  status: "draft" | "published";
  is_featured: boolean;
  views: number;
  reading_time: number;
  author_nama: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  articles: Article[];
};

const KATEGORI_LABEL: Record<string, string> = {
  panduan: "📗 Panduan Tanam",
  harga: "💰 Harga & Pasar",
  hama: "🐛 Hama & Penyakit",
  bisnis: "📈 Bisnis Tani",
  teknologi: "💻 Teknologi",
  kisah: "📖 Kisah Sukses",
};

function formatTanggal(t: string | null) {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function BlogAdminKlien({ articles }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterKategori, setFilterKategori] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterKategori && a.kategori !== filterKategori) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.judul.toLowerCase().includes(q) &&
          !a.slug.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [articles, filterStatus, filterKategori, search]);

  async function handleDelete(a: Article) {
    if (
      !confirm(
        `Hapus artikel "${a.judul}"?\n\nArtikel akan dihapus permanen.`
      )
    )
      return;

    setDeletingId(a.id);

    try {
      // Hapus cover dari storage (kalau ada)
      if (a.cover_url) {
        try {
          const url = new URL(a.cover_url);
          const pathParts = url.pathname.split("/blog-images/");
          if (pathParts[1]) {
            await supabase.storage
              .from("blog-images")
              .remove([decodeURIComponent(pathParts[1])]);
          }
        } catch (e) {
          console.error("Gagal hapus cover:", e);
        }
      }

      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", a.id);

      if (error) throw new Error(error.message);

      router.refresh();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("❌ Gagal hapus: " + (err.message || "Unknown"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleStatus(a: Article) {
    const newStatus = a.status === "published" ? "draft" : "published";
    const published_at =
      newStatus === "published" && !a.published_at
        ? new Date().toISOString()
        : a.published_at;

    const { error } = await supabase
      .from("articles")
      .update({
        status: newStatus,
        published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id);

    if (error) {
      alert("❌ Gagal ubah status: " + error.message);
      return;
    }
    router.refresh();
  }

  async function handleToggleFeatured(a: Article) {
    const { error } = await supabase
      .from("articles")
      .update({
        is_featured: !a.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id);

    if (error) {
      alert("❌ Gagal ubah featured: " + error.message);
      return;
    }
    router.refresh();
  }

  const adaFilterAktif = filterStatus || filterKategori || search;

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cari judul / slug..."
            className="flex-1 min-w-[180px] border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          >
            <option value="">Semua Status</option>
            <option value="published">✅ Published</option>
            <option value="draft">📄 Draft</option>
          </select>

          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="border-2 border-[#2c5e2e]/20 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
          >
            <option value="">Semua Kategori</option>
            {Object.entries(KATEGORI_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {adaFilterAktif && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterKategori("");
              }}
              className="bg-[#2c5e2e]/10 hover:bg-[#2c5e2e]/20 text-[#2c5e2e] text-xs font-bold px-4 py-2 rounded-full transition-all"
            >
              🔄 Reset
            </button>
          )}

          <div className="text-xs text-[#2c5e2e]/60 italic ml-auto">
            {filtered.length} dari {articles.length}
          </div>
        </div>
      </div>

      {/* LIST */}
      {articles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4 opacity-40">📝</div>
          <h3 className="font-bold text-[#2c5e2e] mb-2">Belum ada artikel</h3>
          <p className="text-[#2c5e2e]/60 text-sm mb-6 max-w-md mx-auto">
            Mulai tulis artikel pertama untuk SEO.
          </p>
          <Link
            href="/admin/blog/baru"
            className="inline-block bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-[1.02] shadow-md"
          >
            + Tulis Artikel
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-8 text-center">
          <div className="text-4xl mb-2 opacity-40">🔍</div>
          <p className="text-[#2c5e2e]/60 text-sm">
            Gak ada artikel yang cocok dengan filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40 rounded-3xl p-4 transition-all"
            >
              <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
                {/* Cover */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-[#2c5e2e]/5 flex-shrink-0 border border-[#2c5e2e]/10">
                  {a.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.cover_url}
                      alt={a.judul}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">
                      📄
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border ${
                        a.status === "published"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-yellow-100 text-yellow-800 border-yellow-300"
                      }`}
                    >
                      {a.status === "published" ? "✅ Published" : "📄 Draft"}
                    </span>
                    {a.is_featured && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-[#f0b429] text-[#2c5e2e] border border-[#f0b429]">
                        ⭐ Featured
                      </span>
                    )}
                    <span className="text-[10px] text-[#2c5e2e]/60 font-bold">
                      {KATEGORI_LABEL[a.kategori] || a.kategori}
                    </span>
                  </div>

                  <Link
                    href={`/admin/blog/${a.id}/edit`}
                    className="font-bold text-[#2c5e2e] text-base line-clamp-2 hover:text-[#f0b429] transition-colors"
                  >
                    {a.judul}
                  </Link>

                  <div className="text-[10px] text-[#2c5e2e]/50 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="truncate">/blog/{a.slug}</span>
                    <span>·</span>
                    <span>👁️ {a.views || 0}</span>
                    <span>·</span>
                    <span>⏱️ {a.reading_time}m</span>
                    <span>·</span>
                    <span>
                      📅{" "}
                      {a.status === "published"
                        ? formatTanggal(a.published_at)
                        : `Dibuat ${formatTanggal(a.created_at)}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0 w-full md:w-auto md:min-w-[120px]">
                  {a.status === "published" && (
                    <a
                      href={`/blog/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-[#2c5e2e]/5 hover:bg-[#2c5e2e]/10 text-[#2c5e2e] font-bold py-1.5 px-3 rounded-full text-center transition-all"
                    >
                      👁️ Lihat
                    </a>
                  )}

                  <Link
                    href={`/admin/blog/${a.id}/edit`}
                    className="text-[10px] bg-[#f0b429]/20 hover:bg-[#f0b429]/30 text-[#2c5e2e] font-bold py-1.5 px-3 rounded-full text-center transition-all"
                  >
                    ✏️ Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(a)}
                    className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-1.5 px-3 rounded-full transition-all"
                  >
                    {a.status === "published" ? "↩️ Draft" : "🚀 Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(a)}
                    className={`text-[10px] font-bold py-1.5 px-3 rounded-full transition-all ${
                      a.is_featured
                        ? "bg-[#f0b429] text-[#2c5e2e] hover:bg-[#e6a617]"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {a.is_featured ? "⭐ Unpin" : "⭐ Pin"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    disabled={deletingId === a.id}
                    className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 font-bold py-1.5 px-3 rounded-full transition-all disabled:opacity-50"
                  >
                    {deletingId === a.id ? "⏳..." : "🗑️ Hapus"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
