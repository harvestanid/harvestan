"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/supabase/queries/product-server";
import { getKategoriIcon } from "@/lib/katalog/kategori";

type Props = {
  product: Product;
  initialQty: number;
  userEmail: string;
};

type KotaOption = {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
};

type OngkirOption = {
  kurir: string;
  kurir_label: string;
  layanan: string;
  layanan_label: string;
  deskripsi: string;
  biaya: number;
  estimasi: string;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function ikonLayanan(layanan: string): string {
  const l = layanan.toLowerCase();
  if (l.includes("kargo") || l.includes("cargo")) return "🏗️";
  if (l.includes("yes") || l.includes("ons") || l.includes("express")) return "⚡";
  if (l.includes("reg") || l.includes("reguler")) return "🚚";
  if (l.includes("jtr") || l.includes("trucking")) return "🚛";
  return "📦";
}

function isKargo(layanan: string): boolean {
  const l = layanan.toLowerCase();
  return l.includes("kargo") || l.includes("cargo") || l.includes("jtr") || l.includes("trucking");
}

export function CheckoutKlien({ product, initialQty, userEmail }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(initialQty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nama_penerima: "",
    no_hp: "",
    kota: "",
    alamat: "",
    kode_pos: "",
    catatan: "",
  });

  // Kota search
  const [kotaSearch, setKotaSearch] = useState("");
  const [kotaResults, setKotaResults] = useState<KotaOption[]>([]);
  const [kotaLoading, setKotaLoading] = useState(false);
  const [kotaSelected, setKotaSelected] = useState<KotaOption | null>(null);
  const [showKotaDropdown, setShowKotaDropdown] = useState(false);

  // Ongkir
  const [opsiOngkir, setOpsiOngkir] = useState<OngkirOption[]>([]);
  const [ongkirLoading, setOngkirLoading] = useState(false);
  const [ongkirError, setOngkirError] = useState("");
  const [selectedOngkirIdx, setSelectedOngkirIdx] = useState<number>(-1);

  const subtotal = product.harga * qty;
  const beratTotalGram = (product.berat_gram || 1000) * qty;
  const beratTotalKg = Math.max(1, Math.ceil(beratTotalGram / 1000));

  // ============================================================
  // Search kota (debounced)
  // ============================================================
  useEffect(() => {
    if (kotaSearch.trim().length < 3) {
      setKotaResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setKotaLoading(true);
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "search", search: kotaSearch }),
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setKotaResults(json.data.slice(0, 10));
          setShowKotaDropdown(true);
        }
      } catch (err) {
        console.error("Search kota error:", err);
      } finally {
        setKotaLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [kotaSearch]);

  // ============================================================
  // Fetch ongkir saat kota + berat berubah
  // ============================================================
  useEffect(() => {
    if (!kotaSelected) {
      setOpsiOngkir([]);
      setSelectedOngkirIdx(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setOngkirLoading(true);
      setOngkirError("");
      setOpsiOngkir([]);
      setSelectedOngkirIdx(-1);

      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cost",
            destination: kotaSelected.id,
            weight: beratTotalGram,
          }),
        });
        const json = await res.json();

        if (!res.ok) {
          setOngkirError(json.error || "Gagal hitung ongkir");
          return;
        }

        const opts: OngkirOption[] = json.data || [];
        setOpsiOngkir(opts);

        if (opts.length > 0) {
          setSelectedOngkirIdx(0); // auto-pilih termurah
        }
      } catch (err: any) {
        setOngkirError(err.message || "Error");
      } finally {
        setOngkirLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [kotaSelected, beratTotalGram]);

  const selectedOngkir =
    selectedOngkirIdx >= 0 ? opsiOngkir[selectedOngkirIdx] : null;

  const ongkir = selectedOngkir?.biaya || 0;
  const total = subtotal + ongkir;

  // Cek kargo lebih murah dari reguler
  const termurah = opsiOngkir[0];
  const termurahReguler = opsiOngkir.find((o) => !isKargo(o.layanan));
  const kargoLebihMurah =
    termurah &&
    isKargo(termurah.layanan) &&
    termurahReguler &&
    termurah.biaya < termurahReguler.biaya;

  function handlePilihKota(k: KotaOption) {
    setKotaSelected(k);
    setKotaSearch(k.label);
    setShowKotaDropdown(false);
    setForm((f) => ({
      ...f,
      kota: `${k.district_name}, ${k.city_name}`,
      kode_pos: k.zip_code,
    }));
  }

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
    if (!kotaSelected) {
      setError("Pilih kota/kecamatan tujuan dulu");
      return;
    }
    if (!form.alamat.trim()) {
      setError("Alamat lengkap wajib diisi");
      return;
    }
    if (!selectedOngkir) {
      setError("Pilih metode pengiriman dulu");
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
          nama_penerima: form.nama_penerima,
          no_hp: form.no_hp,
          alamat: form.alamat,
          kota: kotaSelected.city_name,
          provinsi: kotaSelected.province_name,
          kode_pos: form.kode_pos,
          catatan: form.catatan,
          ongkir,
          subtotal,
          total,
          berat_kg: beratTotalKg,
          kurir: selectedOngkir.kurir,
          layanan_kurir: selectedOngkir.layanan_label,
          estimasi_hari: selectedOngkir.estimasi,
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

      {/* PRODUK */}
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
            <h3 className="font-bold text-gray-900 text-sm">{product.nama}</h3>
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
                  onClick={() => setQty(Math.min(product.stok, qty + 1))}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-500">{product.satuan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA PENERIMA */}
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

        {/* KOTA SEARCH */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Kota/Kecamatan Tujuan *
          </label>
          <input
            type="text"
            value={kotaSearch}
            onChange={(e) => {
              setKotaSearch(e.target.value);
              setKotaSelected(null);
              setShowKotaDropdown(true);
            }}
            onFocus={() => {
              if (kotaResults.length > 0) setShowKotaDropdown(true);
            }}
            placeholder="Ketik nama kecamatan (min 3 huruf)... contoh: baturetno"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {kotaLoading && (
            <div className="absolute right-3 top-8 text-xs text-gray-400">
              ⏳ Mencari...
            </div>
          )}

          {showKotaDropdown && kotaResults.length > 0 && !kotaSelected && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {kotaResults.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => handlePilihKota(k)}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 text-xs border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-bold text-gray-800">{k.label}</div>
                  <div className="text-[10px] text-gray-500">
                    Kec. {k.subdistrict_name}, {k.city_name},{" "}
                    {k.province_name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {kotaSelected && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800">
              ✅ {kotaSelected.label}
            </div>
          )}
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

      {/* ONGKIR */}
      {kotaSelected && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase">
              🚚 Metode Pengiriman
            </h2>
            {termurah && opsiOngkir.length > 0 && (
              <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                💚 Termurah: {termurah.kurir_label} {termurah.layanan_label}
              </span>
            )}
          </div>

          {ongkirLoading && (
            <div className="text-center py-6 text-sm text-gray-500">
              ⏳ Menghitung ongkir...
            </div>
          )}

          {ongkirError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ⚠️ {ongkirError}
            </div>
          )}

          {!ongkirLoading && !ongkirError && opsiOngkir.length === 0 && (
            <div className="text-center py-6 text-sm text-gray-500">
              Tidak ada kurir tersedia untuk rute ini
            </div>
          )}

          {!ongkirLoading && opsiOngkir.length > 0 && (
            <div className="space-y-2">
              {opsiOngkir.map((o, idx) => {
                const aktif = selectedOngkirIdx === idx;
                const termurahIdx = idx === 0;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOngkirIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition ${
                      aktif
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="text-2xl flex-shrink-0">
                          {ikonLayanan(o.layanan)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-gray-900">
                              {o.kurir_label}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {o.layanan_label}
                            </span>
                            {termurahIdx && (
                              <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded">
                                TERMURAH
                              </span>
                            )}
                            {isKargo(o.layanan) && (
                              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                KARGO
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {o.deskripsi && `${o.deskripsi} · `}
                            Estimasi {o.estimasi}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-sm text-gray-900">
                          {formatRp(o.biaya)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {kargoLebihMurah && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800">
              💡 <strong>Kargo lebih murah</strong> untuk berat {beratTotalKg}{" "}
              kg. Hemat {formatRp((termurahReguler?.biaya || 0) - (termurah?.biaya || 0))}.
            </div>
          )}
        </div>
      )}

      {/* RINGKASAN */}
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
              Ongkir{" "}
              {selectedOngkir
                ? `(${selectedOngkir.kurir_label} ${selectedOngkir.layanan_label})`
                : ""}
            </span>
            <span className="font-bold">
              {ongkir > 0 ? formatRp(ongkir) : "-"}
            </span>
          </div>
          {selectedOngkir && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Estimasi tiba</span>
              <span>{selectedOngkir.estimasi}</span>
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
        disabled={loading || !selectedOngkir}
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
