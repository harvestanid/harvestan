"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function KatalogKlien({ products }: Props) {
  const router = useRouter();
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = products;

    if (kategoriFilter !== "all") {
      result = result.filter((p) => p.kategori === kategoriFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          (p.deskripsi || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, kategoriFilter, statusFilter, search]);

  async function handleDelete(id: string, nama: string) {
    if (
      !confirm(
        `Hapus produk "${nama}"?\n\nTindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    setLoading(id);
    try {
      const res = await fetch(`/api/products/delete?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal hapus"));
        return;
      }
      alert("✅ Produk dihapus");
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(null);
    }
  }

  async function handleToggleStatus(
    id: string,
    currentStatus: Product["status"]
  ) {
    const newStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";
    setLoading(id);
    try {
      const res = await fetch(`/api/products/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal update"));
        return;
      }
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(null);
    }
  }

  const stats = useMemo(() => {
    return {
      total: products.length,
      aktif: products.filter((p) => p.status === "aktif").length,
      nonaktif: products.filter((p) => p.status === "nonaktif").length,
      sold_out: products.filter((p) => p.status === "sold_out").length,
    };
  }, [products]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] text-gray-600 font-bold uppercase">
            Total
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-[10px] text-emerald-700 font-bold uppercase">
            Aktif
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">
            {stats.aktif}
          </div>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
          <div className="text-[10px] text-gray-600 font-bold uppercase">
            Nonaktif
          </div>
          <div className="text-2xl font-bold text-gray-700 mt-1">
            {stats.nonaktif}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-[10px] text-red-700 font-bold uppercase">
            Sold Out
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {stats.sold_out}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
              🔍 Cari
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
              🏷️ Kategori
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Semua</option>
              {KATEGORI_PRODUK.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.icon} {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
              📊 Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-500 italic">
          {filtered.length} dari {products.length} produk
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-500 italic text-sm">
            {products.length === 0
              ? "Belum ada produk. Klik '+ Tambah Produk' untuk mulai."
              : "Tidak ada produk yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 flex-wrap"
            >
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                {p.foto_urls && p.foto_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto_urls[0]}
                    alt={p.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {getKategoriIcon(p.kategori)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-gray-900">{p.nama}</h3>
                  {p.unggulan && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      ⭐ UNGGULAN
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      p.status === "aktif"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "sold_out"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {getKategoriIcon(p.kategori)} {getKategoriLabel(p.kategori)}
                  {p.sub_kategori && ` · ${p.sub_kategori}`}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700">
                  <span>
                    💰 <strong>{formatRp(p.harga)}</strong>/{p.satuan}
                  </span>
                  <span>
                    📊 Stok: <strong>{p.stok}</strong> {p.satuan}
                  </span>
                  <span>⚖️ {p.berat_gram}gr</span>
                  <span>🛒 Terjual: {p.total_terjual}</span>
                  {p.total_review > 0 && (
                    <span>
                      ⭐ {p.rating_rata.toFixed(1)} ({p.total_review})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <Link
                  href={`/admin/katalog/${p.id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition text-center"
                >
                  ✏️ Edit
                </Link>
                <Link
                  href={`/toko/${p.id}`}
                  target="_blank"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition text-center"
                >
                  👁️ Preview
                </Link>
                <button
                  onClick={() => handleToggleStatus(p.id, p.status)}
                  disabled={loading === p.id}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {p.status === "aktif" ? "🚫 Nonaktifkan" : "✅ Aktifkan"}
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.nama)}
                  disabled={loading === p.id}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading === p.id ? "⏳" : "🗑️ Hapus"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
