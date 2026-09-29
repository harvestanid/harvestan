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
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setKategori("all")}
          className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition ${
            kategori === "all"
              ? "bg-green-700 text-white"
              : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
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
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition ${
                kategori === k.id
                  ? "bg-green-700 text-white"
                  : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {k.icon} {k.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
              🔍 Cari Produk
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama produk..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
              ↕️ Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="terbaru">🆕 Terbaru</option>
              <option value="termurah">💰 Termurah</option>
              <option value="termahal">💎 Termahal</option>
              <option value="terlaris">🔥 Terlaris</option>
              <option value="rating">⭐ Rating Tertinggi</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-500 italic mt-2">
          {filtered.length} produk ditemukan
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-500 italic text-sm">
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
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {p.foto_urls && p.foto_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto_urls[0]}
                    alt={p.nama}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {getKategoriIcon(p.kategori)}
                  </div>
                )}
                {p.unggulan && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    ⭐ UNGGULAN
                  </div>
                )}
                {p.stok <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="text-[10px] text-gray-500 mb-1">
                  {getKategoriIcon(p.kategori)} {getKategoriLabel(p.kategori)}
                </div>
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1.5 leading-tight min-h-[2.4em]">
                  {p.nama}
                </h3>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-bold text-green-700 text-base">
                    {formatRp(p.harga)}
                  </span>
                  <span className="text-xs text-gray-500">/{p.satuan}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>Stok: {p.stok}</span>
                  {p.total_review > 0 ? (
                    <span>
                      ⭐ {p.rating_rata.toFixed(1)} ({p.total_review})
                    </span>
                  ) : (
                    <span className="text-gray-400">Belum ada review</span>
                  )}
                </div>

                {p.total_terjual > 0 && (
                  <div className="text-[10px] text-orange-600 font-bold mt-1">
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
