"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Product } from "@/lib/supabase/queries/product-server";
import {
  KATEGORI_PRODUK,
  getKategoriLabel,
  getKategoriIcon,
} from "@/lib/katalog/kategori";

type Props = {
  products: Product[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function TokoKlien({ products }: Props) {
  const [kategori, setKategori] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "terbaru" | "termurah" | "termahal" | "terlaris" | "rating"
  >("terbaru");

  const filtered = useMemo(() => {
    let result = products;

    if (kategori !== "all") {
      result = result.filter((p) => p.kategori === kategori);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          (p.deskripsi || "").toLowerCase().includes(q) ||
          (p.sub_kategori || "").toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case "termurah":
        sorted.sort((a, b) => a.harga - b.harga);
        break;
      case "termahal":
        sorted.sort((a, b) => b.harga - a.harga);
        break;
      case "terlaris":
        sorted.sort((a, b) => b.total_terjual - a.total_terjual);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating_rata - a.rating_rata);
        break;
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
    }

    return sorted;
  }, [products, kategori, search, sortBy]);

  return (
    <>
      {/* ===== KATEGORI TAB ===== */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setKategori("all")}
          className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
            kategori === "all"
              ? "bg-[#2c5e2e] text-white shadow-lg shadow-[#2c5e2e]/30 scale-105"
              : "bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40"
          }`}
        >
          📦 Semua ({products.length})
        </button>
        {KATEGORI_PRODUK.map((k) => {
          const count = products.filter((p) => p.kategori === k.id).length;
          return (
            <button
              key={k.id}
              onClick={() => setKategori(k.id)}
              className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                kategori === k.id
                  ? "bg-[#2c5e2e] text-white shadow-lg shadow-[#2c5e2e]/30 scale-105"
                  : "bg-white hover:bg-[#f0b429]/10 text-[#2c5e2e] border-2 border-[#2c5e2e]/10 hover:border-[#f0b429]/40"
              }`}
            >
              {k.icon} {k.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ===== SEARCH + SORT ===== */}
      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-3xl p-5 mb-6 shadow-lg shadow-[#2c5e2e]/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              🔍 Cari Produk
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama produk..."
              className="w-full border-2 border-[#2c5e2e]/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent bg-[#faf9f5]/50 text-[#2c5e2e] transition"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest block mb-2">
              ↕️ Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border-2 border-[#2c5e2e]/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c5e2e] focus:border-transparent bg-[#faf9f5]/50 text-[#2c5e2e] transition"
            >
              <option value="terbaru">🆕 Terbaru</option>
              <option value="termurah">💰 Termurah</option>
              <option value="termahal">💎 Termahal</option>
              <option value="terlaris">🔥 Terlaris</option>
              <option value="rating">⭐ Rating Tertinggi</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-[#2c5e2e]/60 italic mt-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f0b429]" />
          {filtered.length} produk ditemukan
        </div>
      </div>

      {/* ===== GRID PRODUK ===== */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#2c5e2e]/15 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-[#2c5e2e]/60 italic text-sm">
            {products.length === 0
              ? "Belum ada produk tersedia. Cek lagi nanti ya."
              : "Tidak ada produk yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/toko/${p.id}`}
              className="group bg-white border-2 border-[#2c5e2e]/8 rounded-3xl overflow-hidden hover:border-[#f0b429]/50 hover:shadow-2xl hover:shadow-[#f0b429]/10 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="relative aspect-square bg-gradient-to-br from-[#faf9f5] to-[#f0b429]/10 overflow-hidden">
                {p.foto_urls && p.foto_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto_urls[0]}
                    alt={p.nama}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-[#2c5e2e]/30">
                    {getKategoriIcon(p.kategori)}
                  </div>
                )}
                {p.unggulan && (
                  <div className="absolute top-3 left-3 bg-[#f0b429] text-[#2c5e2e] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    ⭐ Unggulan
                  </div>
                )}
                {p.stok <= 0 && (
                  <div className="absolute inset-0 bg-[#2c5e2e]/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-bold text-xs uppercase tracking-widest">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-[10px] text-[#2c5e2e]/50 mb-1.5 uppercase tracking-widest font-bold">
                  {getKategoriIcon(p.kategori)} {getKategoriLabel(p.kategori)}
                </div>
                <h3 className="font-bold text-[#2c5e2e] text-sm line-clamp-2 mb-2 leading-snug min-h-[2.6em] tracking-tight">
                  {p.nama}
                </h3>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-bold text-[#2c5e2e] text-base tracking-tight">
                    {formatRp(p.harga)}
                  </span>
                  <span className="text-[10px] text-[#2c5e2e]/50">
                    /{p.satuan}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#2c5e2e]/60">
                  <span>Stok: {p.stok}</span>
                  {p.total_review > 0 ? (
                    <span className="flex items-center gap-1">
                      <span className="text-[#f0b429]">★</span>
                      {p.rating_rata.toFixed(1)} ({p.total_review})
                    </span>
                  ) : (
                    <span className="text-[#2c5e2e]/40 italic">
                      Belum ada review
                    </span>
                  )}
                </div>

                {p.total_terjual > 0 && (
                  <div className="text-[10px] text-[#f0b429] font-bold mt-1.5 uppercase tracking-widest">
                    🔥 {p.total_terjual} terjual
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
