"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase/queries/product-server";
import { getKategoriIcon } from "@/lib/katalog/kategori";

type ShippingRate = {
  id: string;
  provinsi: string;
  ongkir_per_kg: number;
  estimasi_hari: string | null;
};

type Props = {
  product: Product;
  initialQty: number;
  shippingRates: ShippingRate[];
  userEmail: string;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function CheckoutKlien({
  product,
  initialQty,
  shippingRates,
  userEmail,
}: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(initialQty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nama_penerima: "",
    no_hp: "",
    provinsi: "",
    kota: "",
    alamat: "",
    kode_pos: "",
    catatan: "",
  });

  const subtotal = product.harga * qty;
  const beratTotalGram = (product.berat_gram || 1000) * qty;
  const beratTotalKg = Math.max(1, Math.ceil(beratTotalGram / 1000));

  const ongkir = useMemo(() => {
    if (!form.provinsi) return 0;
    const rate = shippingRates.find((s) => s.provinsi === form.provinsi);
    if (!rate) return 0;
    return rate.ongkir_per_kg * beratTotalKg;
  }, [form.provinsi, shippingRates, beratTotalKg]);

  const estimasi = useMemo(() => {
    if (!form.provinsi) return "-";
    const rate = shippingRates.find((s) => s.provinsi === form.provinsi);
    return rate?.estimasi_hari || "-";
  }, [form.provinsi, shippingRates]);

  const total = subtotal + ongkir;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nama_penerima.trim()) {
      setError("Nama penerima wajib diisi");
      return;
    }
    if (!form.no_hp.trim()) {
      setError("Nomor HP wajib diisi");
      return;
    }
    if (!form.provinsi) {
      setError("Provinsi wajib dipilih");
      return;
    }
    if (!form.kota.trim()) {
      setError("Kota/kabupaten wajib diisi");
      return;
    }
    if (!form.alamat.trim()) {
      setError("Alamat lengkap wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          qty,
          ...form,
          ongkir,
          subtotal,
          total,
          berat_kg: beratTotalKg,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal buat pesanan");
        return;
      }

      router.push(`/toko/pesanan/${json.order.order_code}`);
    } catch (err: any) {
      setError("Error: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          📦 Produk
        </h2>
        <div className="flex gap-3">
          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
            {product.foto_urls && product.foto_urls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.foto_urls[0]}
                alt={product.nama}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                {getKategoriIcon(product.kategori)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">
              {product.nama}
            </h3>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatRp(product.harga)} / {product.satuan}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-600">Jumlah:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
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
                  className="w-14 text-center border-none outline-none py-1 font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQty(Math.min(product.stok, qty + 1))
                  }
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {product.satuan}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase">
          🚚 Data Penerima
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nama Penerima *
            </label>
            <input
              type="text"
              value={form.nama_penerima}
              onChange={(e) =>
                setForm({ ...form, nama_penerima: e.target.value })
              }
              placeholder="Nama lengkap"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              No HP/WA *
            </label>
            <input
              type="text"
              value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
              placeholder="08xxx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Provinsi *
          </label>
          <select
            value={form.provinsi}
            onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">-- Pilih Provinsi --</option>
            {shippingRates.map((s) => (
              <option key={s.id} value={s.provinsi}>
                {s.provinsi} — {formatRp(s.ongkir_per_kg)}/kg
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Kota/Kabupaten *
            </label>
            <input
              type="text"
              value={form.kota}
              onChange={(e) => setForm({ ...form, kota: e.target.value })}
              placeholder="Contoh: Sidoarjo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Kode Pos
            </label>
            <input
              type="text"
              value={form.kode_pos}
              onChange={(e) =>
                setForm({ ...form, kode_pos: e.target.value })
              }
              placeholder="61200"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Alamat Lengkap *
          </label>
          <textarea
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            placeholder="Jalan, nomor rumah, RT/RW, desa, kecamatan, patokan..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Catatan (opsional)
          </label>
          <textarea
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            placeholder="Catatan untuk penjual..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          💰 Ringkasan
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {product.nama} × {qty} {product.satuan}
            </span>
            <span className="font-bold">{formatRp(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Berat total</span>
            <span>{beratTotalKg} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              Ongkir {form.provinsi ? `(${form.provinsi})` : ""}
            </span>
            <span className="font-bold">
              {ongkir > 0 ? formatRp(ongkir) : "-"}
            </span>
          </div>
          {estimasi !== "-" && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Estimasi tiba</span>
              <span>{estimasi}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-baseline">
            <span className="font-bold text-gray-900">Total Bayar</span>
            <span className="text-xl font-bold text-orange-600">
              {formatRp(total)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl transition shadow-lg disabled:opacity-50 text-base"
      >
        {loading ? "⏳ Membuat Pesanan..." : "🧾 Buat Pesanan"}
      </button>

      <p className="text-[10px] text-gray-500 text-center">
        Setelah klik, kamu akan dapat invoice + info transfer BCA
      </p>
    </form>
  );
}
