"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SkemaBagiHasilV2 } from "@/components/skema-bagi-hasil-v2";

type Penggarap = {
  id: string;
  nama: string;
};

type Lahan = {
  id: string;
  nama: string;
  luas: number;
};

type LahanTerpilih = {
  id: string;
  nama: string;
  luas: number;
  checked: boolean;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
};

export function PanenMultiKlien() {
  const router = useRouter();
  const supabase = createClient();

  const [penggaraps, setPenggaraps] = useState<Penggarap[]>([]);
  const [lahanList, setLahanList] = useState<LahanTerpilih[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [penggarapId, setPenggarapId] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [komoditas, setKomoditas] = useState("padi");
  const [totalHasil, setTotalHasil] = useState("");
  const [hargaJual, setHargaJual] = useState("5000");
  const [biayaPanen, setBiayaPanen] = useState("400");
  const [biayaTambahan, setBiayaTambahan] = useState("");
  const [keteranganBiaya, setKeteranganBiaya] = useState("");
  const [persenOwner, setPersenOwner] = useState(50);
  const [catatan, setCatatan] = useState("");
  const [metode, setMetode] = useState<"equal" | "proportional">(
    "proportional"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("penggaraps")
        .select("id, nama")
        .eq("user_id", user.id)
        .eq("is_demo", false)
        .order("nama");

      setPenggaraps(data || []);
      setLoadingData(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadLahan() {
      if (!penggarapId) {
        setLahanList([]);
        return;
      }
      const { data } = await supabase
        .from("lands")
        .select("id, nama, luas")
        .eq("penggarap_id", penggarapId)
        .eq("is_demo", false)
        .order("nama");

      const list: LahanTerpilih[] = (data || []).map((l) => ({
        id: l.id,
        nama: l.nama,
        luas: Number(l.luas),
        checked: true,
      }));
      setLahanList(list);
    }
    loadLahan();
  }, [penggarapId]);

  function toggleLahan(id: string) {
    setLahanList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l))
    );
  }

  function toggleSemuaLahan(checked: boolean) {
    setLahanList((prev) => prev.map((l) => ({ ...l, checked })));
  }

  const lahanTerpilih = lahanList.filter((l) => l.checked);
  const totalLuas = lahanTerpilih.reduce((s, l) => s + l.luas, 0);
  const hasilKg = parseFloat(totalHasil) || 0;

  const previewPembagian = lahanTerpilih.map((l) => {
    const proporsi = totalLuas > 0 ? l.luas / totalLuas : 0;
    const hasil =
      metode === "proportional"
        ? hasilKg * proporsi
        : lahanTerpilih.length > 0
        ? hasilKg / lahanTerpilih.length
        : 0;
    return {
      id: l.id,
      nama: l.nama,
      luas: l.luas,
      proporsi,
      hasil,
      produktivitas: l.luas > 0 ? hasil / l.luas : 0,
    };
  });

  const harga = parseFloat(hargaJual) || 0;
  const biayaPerKg = parseFloat(biayaPanen) || 0;
  const biayaLain = parseFloat(biayaTambahan) || 0;
  const pendapatanTotal = hasilKg * harga;
  const biayaPanenTotal = hasilKg * biayaPerKg;
  const profitBersih = pendapatanTotal - biayaPanenTotal - biayaLain;
  const profitOwner = profitBersih * (persenOwner / 100);
  const profitPenggarap = profitBersih * ((100 - persenOwner) / 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSukses(null);

    if (!penggarapId) {
      setError("Pilih penggarap dulu");
      return;
    }
    if (lahanTerpilih.length === 0) {
      setError("Pilih minimal 1 lahan");
      return;
    }
    if (!hasilKg || hasilKg <= 0) {
      setError("Isi total hasil panen (Kg) dengan benar");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const penggarap = penggaraps.find((p) => p.id === penggarapId);
      const hasilPanen: any[] = [];

      for (const item of previewPembagian) {
        const proporsi = item.proporsi;
        const hasilLahan = item.hasil;

        const pendapatan = hasilLahan * harga;
        const biayaPanenLahan = hasilLahan * biayaPerKg;
        const biayaTambahanLahan = biayaLain * proporsi;
        const profitBersihLahan =
          pendapatan - biayaPanenLahan - biayaTambahanLahan;

        const profitOwnerLahan = profitBersihLahan * (persenOwner / 100);
        const profitPenggarapLahan =
          profitBersihLahan * ((100 - persenOwner) / 100);

        const { data: inserted, error: insertError } = await supabase
          .from("harvests")
          .insert({
            user_id: user.id,
            land_id: item.id,
            tanggal,
            komoditas,
            musim: null,
            hasil_kg: hasilLahan,
            harga_gabah: harga,
            harga_per_kg: harga,
            biaya_panen_per_kg: biayaPerKg,
            biaya_tambahan: biayaTambahanLahan,
            keterangan_biaya: keteranganBiaya || null,
            bawa_penggarap: 0,
            bawa_owner: 0,
            bawa_lain: 0,
            persen_owner: persenOwner,
            persen_penggarap: 100 - persenOwner,
            profit_bersih: profitBersihLahan,
            profit_owner: profitOwnerLahan,
            profit_penggarap: profitPenggarapLahan,
            potongan_hutang: 0,
            total_hutang_sebelum: 0,
            sisa_hutang_sesudah: 0,
            catatan: catatan || `[MULTI-LAHAN-${metode === "proportional" ? "Proporsional" : "Rata"}]`,
            is_demo: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(insertError.message);
        }

        hasilPanen.push(inserted);
      }

      setSukses({
        penggarap: penggarap?.nama || "?",
        jmlLahan: lahanTerpilih.length,
        totalHasil: hasilKg,
        profitBersih,
        profitOwner,
        profitPenggarap,
        hasilPanen,
      });

      setTimeout(() => {
        router.push(`/penggarap/${penggarapId}`);
        router.refresh();
      }, 3000);
    } catch (err: any) {
      setError("❌ " + (err.message || "Gagal menyimpan"));
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (penggaraps.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">👨‍🌾</div>
          <p className="text-yellow-800 font-medium mb-3">
            Belum ada penggarap
          </p>
          <p className="text-yellow-700 text-sm mb-4">
            Tambah penggarap dulu untuk mulai input panen multi-lahan
          </p>
          <a
            href="/penggarap/baru"
            className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2 rounded-lg transition"
          >
            + Tambah Penggarap
          </a>
        </div>
      </div>
    );
  }

  if (sukses) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6">
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-green-900 mb-2">
              Panen Multi-Lahan Berhasil!
            </h2>
            <p className="text-sm text-green-800">
              {sukses.jmlLahan} lahan untuk {sukses.penggarap}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Total Hasil</div>
                <div className="font-bold text-green-800">
                  {sukses.totalHasil.toLocaleString("id-ID")} Kg
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Profit Bersih</div>
                <div className="font-bold text-green-800">
                  {formatRp(sukses.profitBersih)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Profit Owner</div>
                <div className="font-bold text-blue-700">
                  {formatRp(sukses.profitOwner)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Profit Penggarap</div>
                <div className="font-bold text-orange-700">
                  {formatRp(sukses.profitPenggarap)}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-green-700 italic text-center">
            Redirect ke detail penggarap dalam 3 detik...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          📦 Input Panen Multi-Lahan
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Input satu kali untuk beberapa lahan sekaligus
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Penggarap <span className="text-red-500">*</span>
              </label>
              <select
                value={penggarapId}
                onChange={(e) => setPenggarapId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">-- Pilih Penggarap --</option>
                {penggaraps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Panen <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Komoditas <span className="text-red-500">*</span>
              </label>
              <select
                value={komoditas}
                onChange={(e) => setKomoditas(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                {Object.entries(KOMODITAS_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Hasil Panen (Kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalHasil}
                onChange={(e) => setTotalHasil(e.target.value)}
                placeholder="Total Kg semua lahan"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {penggarapId && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="font-bold text-gray-900">
                  🗺️ Pilih Lahan
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {lahanList.length} lahan · {lahanTerpilih.length} terpilih
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleSemuaLahan(true)}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 font-medium px-3 py-1.5 rounded-lg transition"
                >
                  ✓ Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => toggleSemuaLahan(false)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
                >
                  ✗ Hapus Semua
                </button>
              </div>
            </div>

            {lahanList.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm italic">
                Penggarap ini belum punya lahan
              </div>
            ) : (
              <div className="space-y-2">
                {lahanList.map((l) => (
                  <label
                    key={l.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      l.checked
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={l.checked}
                      onChange={() => toggleLahan(l.id)}
                      className="w-4 h-4 accent-green-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {l.nama}
                      </div>
                      <div className="text-xs text-gray-500">
                        {l.luas.toFixed(2)} Ha
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {lahanTerpilih.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  📊 Metode Pembagian
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetode("proportional")}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      metode === "proportional"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="font-bold text-sm">
                      📐 Proporsional Luas
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Sesuai perbandingan luas lahan
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetode("equal")}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      metode === "equal"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="font-bold text-sm">⚖️ Rata (Equal)</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Setiap lahan dapat sama
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {previewPembagian.length > 0 && totalLuas > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="font-bold text-blue-900 mb-3 text-sm">
              📊 Preview Pembagian Hasil
            </div>
            <div className="space-y-2">
              {previewPembagian.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg p-3 border border-blue-200"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {p.nama}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(p.proporsi * 100).toFixed(1)}% · {p.luas.toFixed(2)} Ha
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Hasil Panen</div>
                      <div className="font-bold text-blue-800">
                        {p.hasil.toLocaleString("id-ID")} Kg
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Produktivitas</div>
                      <div className="font-bold text-blue-800">
                        {p.produktivitas.toFixed(0)} Kg/Ha
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="font-bold text-gray-900">
            💰 Harga & Biaya
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Jual per Kg (Rp)
              </label>
              <input
                type="number"
                value={hargaJual}
                onChange={(e) => setHargaJual(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya Panen per Kg (Rp)
              </label>
              <input
                type="number"
                value={biayaPanen}
                onChange={(e) => setBiayaPanen(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya Tambahan (Rp)
              </label>
              <input
                type="number"
                value={biayaTambahan}
                onChange={(e) => setBiayaTambahan(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan Biaya
              </label>
              <input
                type="text"
                value={keteranganBiaya}
                onChange={(e) => setKeteranganBiaya(e.target.value)}
                placeholder="Opsional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <SkemaBagiHasilV2 onChange={setPersenOwner} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Opsional"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>

        {hasilKg > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-5">
            <div className="font-bold text-green-900 mb-3 text-sm">
              💵 Estimasi Total
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pendapatan Kotor</span>
                <span className="font-bold text-green-700">
                  {formatRp(pendapatanTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Panen</span>
                <span className="text-red-600">
                  − {formatRp(biayaPanenTotal)}
                </span>
              </div>
              {biayaLain > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Tambahan</span>
                  <span className="text-red-600">
                    − {formatRp(biayaLain)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-green-200">
                <span className="font-bold text-green-900">Profit Bersih</span>
                <span className="font-bold text-green-700 text-base">
                  {formatRp(profitBersih)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-white rounded-lg p-2 text-center border border-green-200">
                  <div className="text-[10px] text-green-700">
                    👤 Owner ({persenOwner}%)
                  </div>
                  <div className="font-bold text-green-800 text-sm">
                    {formatRp(profitOwner)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center border border-orange-200">
                  <div className="text-[10px] text-orange-700">
                    👨‍🌾 Penggarap ({100 - persenOwner}%)
                  </div>
                  <div className="font-bold text-orange-800 text-sm">
                    {formatRp(profitPenggarap)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || lahanTerpilih.length === 0 || hasilKg <= 0}
          className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base"
        >
          {loading ? "⏳ Menyimpan..." : `📦 Simpan Panen (${lahanTerpilih.length} lahan)`}
        </button>
      </form>
    </div>
  );
}
