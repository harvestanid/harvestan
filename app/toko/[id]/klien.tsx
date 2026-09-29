"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase/queries/product-server";
import {
  getKategoriLabel,
  getKategoriIcon,
} from "@/lib/katalog/kategori";

type Props = {
  product: Product;
  reviews: any[];
  relatedProducts: Product[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function DetailKlien({ product, reviews, relatedProducts }: Props) {
  const router = useRouter();
  const [fotoAktif, setFotoAktif] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const fotos = product.foto_urls || [];
  const stokAda = product.stok > 0;

  function handleBeli() {
    if (!stokAda) {
      alert("Maaf, stok habis.");
      return;
    }
    setLoading(true);
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.logged_in) {
          router.push(
            `/login?redirect=/toko/checkout/${product.id}?qty=${qty}`
          );
          return;
        }
        router.push(`/toko/checkout/${product.id}?qty=${qty}`);
      })
      .catch(() => {
        router.push(
          `/login?redirect=/toko/checkout/${product.id}?qty=${qty}`
        );
      })
      .finally(() => setLoading(false));
  }

  const ratingRata = product.rating_rata || 0;
  const totalReview = product.total_review || 0;

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6 bg-white rounded-2xl p-4 md:p-6 mb-6 border border-gray-200">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
            {fotos[fotoAktif] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotos[fotoAktif]}
                alt={product.nama}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">
                {getKategoriIcon(product.kategori)}
              </div>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {fotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setFotoAktif(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                    fotoAktif === i
                      ? "border-green-600"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${product.nama} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">
            {getKategoriIcon(product.kategori)}{" "}
            {getKategoriLabel(product.kategori)}
            {product.sub_kategori && ` · ${product.sub_kategori}`}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {product.nama}
          </h1>

          <div className="flex items-center gap-2 mb-4 text-sm">
            {totalReview > 0 ? (
              <>
                <span className="text-amber-500">
                  {"⭐".repeat(Math.round(ratingRata))}
                </span>
                <span className="font-bold text-gray-900">
                  {ratingRata.toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({totalReview} review)
                </span>
                {product.total_terjual > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-orange-600 font-bold">
                      🔥 {product.total_terjual} terjual
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400 italic">
                Belum ada review
              </span>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold text-green-700">
                {formatRp(product.harga)}
              </span>
              <span className="text-sm text-gray-600">
                / {product.satuan}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ⚖️ Berat: {product.berat_gram} gram / {product.satuan}
            </div>
          </div>

          <div className="mb-4">
            {stokAda ? (
              <div className="text-sm">
                <span className="text-gray-600">Stok tersedia:</span>{" "}
                <span className="font-bold text-green-700">
                  {product.stok} {product.satuan}
                </span>
              </div>
            ) : (
              <div className="text-sm font-bold text-red-600">
                ⚠️ Stok habis
              </div>
            )}
          </div>

          {stokAda && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Jumlah:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.max(
                        1,
                        Math.min(product.stok, Number(e.target.value) || 1)
                      )
                    )
                  }
                  className="w-16 text-center border-none outline-none py-2 font-bold"
                />
                <button
                  onClick={() =>
                    setQty(Math.min(product.stok, qty + 1))
                  }
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {product.satuan}
              </span>
            </div>
          )}

          <button
            onClick={handleBeli}
            disabled={!stokAda || loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading
              ? "⏳ Memproses..."
              : stokAda
              ? `🛒 Beli Sekarang (${qty} ${product.satuan})`
              : "❌ Stok Habis"}
          </button>

          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Pembayaran via transfer bank BCA · Kirim bukti via WhatsApp
          </p>
        </div>
      </div>

      {product.deskripsi && (
        <div className="bg-white rounded-2xl p-5 md:p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            📝 Deskripsi Produk
          </h2>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {product.deskripsi}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 md:p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          ⭐ Review ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-6">
            Belum ada review untuk produk ini
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="border border-gray-200 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {r.user_nama}
                    </span>
                    <span className="text-amber-500 text-xs">
                      {"⭐".repeat(r.rating)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {r.komentar && (
                  <p className="text-sm text-gray-700 mt-1">
                    {r.komentar}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            📦 Produk Serupa
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/toko/${p.id}`}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
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
                <div className="p-2">
                  <h3 className="font-bold text-xs text-gray-900 line-clamp-2 mb-1">
                    {p.nama}
                  </h3>
                  <div className="text-green-700 font-bold text-xs">
                    {formatRp(p.harga)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
