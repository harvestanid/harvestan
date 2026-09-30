"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Article = {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string;
  cover_url: string | null;
  kategori: string;
  tags: string[] | null;
  author_nama: string;
  reading_time: number;
  views: number;
  published_at: string;
};

type Props = {
  articles: Article[];
};

const KATEGORI_CONFIG: Record<
  string,
  { label: string; emoji: string; warna: string }
> = {
  panduan: {
    label: "Panduan Tanam",
    emoji: "📗",
    warna: "bg-green-100 text-green-800 border-green-300",
  },
  harga: {
    label: "Harga & Pasar",
    emoji: "💰",
    warna: "bg-[#f0b429]/20 text-[#2c5e2e] border-[#f0b429]/50",
  },
  hama: {
    label: "Hama & Penyakit",
    emoji: "🐛",
    warna: "bg-red-100 text-red-800 border-red-300",
  },
  bisnis: {
    label: "Bisnis Tani",
    emoji: "📈",
    warna: "bg-blue-100 text-blue-800 border-blue-300",
  },
  teknologi: {
    label: "Teknologi",
    emoji: "💻",
    warna: "bg-purple-100 text-purple-800 border-purple-300",
  },
  kisah: {
    label: "Kisah Sukses",
    emoji: "📖",
    warna: "bg-orange-100 text-orange-800 border-orange-300",
  },
};

function formatTanggal(t: string) {
  try {
    return new Date(t).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function getKategoriInfo(kat: string) {
  return (
    KATEGORI_CONFIG[kat] || {
      label: kat,
      emoji: "📄",
      warna: "bg-gray-100 text-gray-800 border-gray-300",
    }
  );
}

export function BlogKlien({ articles }: Props) {
  const [filterKategori, setFilterKategori] = useState("");
  const [search, setSearch] = useState("");

  const kategoriTersedia = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => set.add(a.kategori));
    return Array.from(set);
  }, [articles]);

  const featured = useMemo(
    () => articles.find((a) => a.tags?.includes("featured")) || articles[0],
    [articles]
  );

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (filterKategori && a.kategori !== filterKategori) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.judul.toLowerCase().includes(q) &&
          !a.ringkasan.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [articles, filterKategori, search]);

  if (articles.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-12 md:p-16 text-center">
        <div className="text-6xl mb-4 opacity-40">📝</div>
        <h3 className="font-bold text-[#2c5e2e] mb-2 text-lg">
          Belum ada artikel
        </h3>
        <p className="text-[#2c5e2e]/60 text-sm max-w-md mx-auto">
          Kami sedang menyiapkan artikel-artikel bermanfaat untuk petani
          Indonesia. Cek lagi nanti ya!
        </p>
      </div>
    );
  }

  const listTanpaFeatured =
    !filterKategori && !search
      ? filtered.filter((a) => a.id !== featured?.id)
      : filtered;

  return (
    <div className="space-y-8">
      {/* ===== FILTER BAR ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-4 shadow-lg shadow-[#2c5e2e]/5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Cari artikel..."
              className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterKategori("")}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                !filterKategori
                  ? "bg-[#2c5e2e] text-white border-[#2c5e2e]"
                  : "bg-white text-[#2c5e2e] border-[#2c5e2e]/20 hover:border-[#f0b429]"
              }`}
            >
              Semua
            </button>
            {kategoriTersedia.map((kat) => {
              const info = getKategoriInfo(kat);
              const aktif = filterKategori === kat;
              return (
                <button
                  key={kat}
                  type="button"
                  onClick={() => setFilterKategori(kat)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                    aktif
                      ? `${info.warna}`
                      : "bg-white text-[#2c5e2e] border-[#2c5e2e]/20 hover:border-[#f0b429]"
                  }`}
                >
                  {info.emoji} {info.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== FEATURED ARTICLE (kalau gak ada filter) ===== */}
      {featured && !filterKategori && !search && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group block bg-white border-2 border-[#2c5e2e]/10 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-[#2c5e2e]/10 transition-all hover:-translate-y-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto bg-gradient-to-br from-[#2c5e2e]/10 to-[#f0b429]/10 overflow-hidden">
              {featured.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.cover_url}
                  alt={featured.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl opacity-40">
                  {getKategoriInfo(featured.kategori).emoji}
                </div>
              )}
              <div className="absolute top-4 left-4 bg-[#f0b429] text-[#2c5e2e] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                ⭐ Featured
              </div>
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <span
                className={`inline-block self-start text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest mb-3 ${
                  getKategoriInfo(featured.kategori).warna
                }`}
              >
                {getKategoriInfo(featured.kategori).emoji}{" "}
                {getKategoriInfo(featured.kategori).label}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] tracking-tight leading-tight mb-3 group-hover:text-[#f0b429] transition-colors">
                {featured.judul}
              </h2>
              <p className="text-sm text-[#2c5e2e]/70 leading-relaxed mb-4 line-clamp-3">
                {featured.ringkasan}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#2c5e2e]/60 flex-wrap">
                <span>✍️ {featured.author_nama}</span>
                <span>·</span>
                <span>📅 {formatTanggal(featured.published_at)}</span>
                <span>·</span>
                <span>⏱️ {featured.reading_time} menit</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ===== GRID ARTIKEL ===== */}
      {listTanpaFeatured.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/20 rounded-3xl p-12 text-center">
          <div className="text-4xl mb-2 opacity-40">🔍</div>
          <p className="text-[#2c5e2e]/60 text-sm">
            Gak ada artikel yang cocok dengan filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listTanpaFeatured.map((a) => {
            const info = getKategoriInfo(a.kategori);
            return (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="group bg-white border-2 border-[#2c5e2e]/10 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-[#2c5e2e]/10 transition-all hover:-translate-y-1 flex flex-col"
              >
                <div className="relative aspect-[16/10] bg-gradient-to-br from-[#2c5e2e]/10 to-[#f0b429]/10 overflow-hidden">
                  {a.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.cover_url}
                      alt={a.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
                      {info.emoji}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span
                    className={`inline-block self-start text-[10px] px-2.5 py-1 rounded-full font-bold border-2 uppercase tracking-widest mb-3 ${info.warna}`}
                  >
                    {info.emoji} {info.label}
                  </span>
                  <h3 className="font-bold text-[#2c5e2e] text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#f0b429] transition-colors">
                    {a.judul}
                  </h3>
                  <p className="text-xs text-[#2c5e2e]/60 leading-relaxed mb-4 line-clamp-3 flex-1">
                    {a.ringkasan}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#2c5e2e]/50 pt-3 border-t border-[#2c5e2e]/10">
                    <span>📅 {formatTanggal(a.published_at)}</span>
                    <span>⏱️ {a.reading_time} menit</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
