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

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function PanenMultiPage() {
  const router = useRouter();
  const supabase = createClient();

  const [penggaraps, setPenggaraps] = useState<Penggarap[]>([]);
  const [lands, setLands] = useState<Lahan[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [penggarapId, setPenggarapId] = useState("");
  const [namaPenggarap, setNamaPenggarap] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [komoditas, setKomoditas] = useState("padi");
  const [selectedLands, setSelectedLands] = useState<string[]>([]);

  const [totalHasil, setTotalHasil] = useState(0);
  const [hargaGabah, setHargaGabah] = useState(5000);
  const [biayaPanen, setBiayaPanen] = useState(400);
  const [biayaTambahan, setBiayaTambahan] = useState(0);
  const [keteranganBiaya, setKeteranganBiaya] = useState("");
  const [catatan, setCatatan] = useState("");

  const [persenOwner, setPersenOwner] = useState(50);

  const [sedangProses, setSedangProses] = useState(false);

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
        .order("nama");

      setPenggaraps(data || []);
      setLoadingData(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadLands() {
      if (!penggarapId) {
        setLands([]);
        setSelectedLands([]);
        return;
      }
      const { data } = await supabase
        .from("lands")
        .select("id, nama, luas")
        .eq("penggarap_id", penggarapId)
        .order("nama");
      setLands(data || []);
      // Auto-select semua lahan
      setSelectedLands((data || []).map((l) => l.id));
    }
    loadLands();
  }, [penggarapId]);

  function handlePenggarapChange(id: string) {
    setPenggarapId(id);
    const p = penggaraps.find((x) => x.id === id);
    setNamaPenggarap(p?.nama || "");
  }

  function toggleLand(landId: string) {
    setSelectedLands((prev) =>
      prev.includes(landId)
        ? prev.filter((id) => id !== landId)
        : [...prev, landId]
    );
  }

  function toggleAllLands() {
    if (selectedLands.length === lands.length) {
      setSelectedLands([]);
    } else {
      setSelectedLands(lands.map((l) => l.id));
    }
  }

  // Hitung total luas lahan terpilih
  const totalLuasTerpilih = lands
    .filter((l) => selectedLands.includes(l.id))
    .reduce((s, l) => s + Number(l.luas), 0);

  // Hitung pembagian per lahan
  const pembagianPerLahan = lands
    .filter((l) => selectedLands.includes(l.id))
    .map((l) => {
      const proporsi =
        totalLuasTerpilih > 0 ? Number(l.luas) / totalLuasTerpilih : 0;
      const hasil = totalHasil * proporsi;
      return {
        lahan: l,
        proporsi,
        hasil,
      };
    });

  async function handleProses() {
    if (!penggarapId) {
      alert("❌ Pilih penggarap dulu");
      return;
    }
    if (selectedLands.length === 0) {
      alert("❌ Pilih minimal 1 lahan");
      return;
    }
    if (totalHasil <= 0) {
      alert("❌ Total hasil panen harus lebih dari 0");
      return;
    }
    if (hargaGabah <= 0) {
      alert("❌ Harga per kg harus lebih dari 0");
      return;
    }

    const konfirmasi =
      `Proses Panen Multi-Lahan?\n\n` +
      `Penggarap: ${namaPenggarap}\n` +
      `Tanggal: ${tanggal}\n` +
      `Komoditas: ${komoditas}\n` +
      `Jumlah Lahan: ${selectedLands.length}\n` +
      `Total Hasil: ${totalHasil.toFixed(0)} Kg\n` +
      `Total Luas: ${totalLuasTerpilih.toFixed(2)} Ha\n` +
      `Skema: ${persenOwner}:${100 - persenOwner}\n\n` +
      `${pembagianPerLahan
        .map(
          (p) =>
            `• ${p.lahan.nama} (${p.lahan.luas} Ha): ${p.hasil.toFixed(0)} Kg`
        )
        .join("\n")}`;

    if (!confirm(konfirmasi)) return;

    setSedangProses(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const persenPenggarap = 100 - persenOwner;

      // Ambil hutang penggarap (hanya untuk lahan pertama)
      const { data: hutangList } = await supabase
        .from("debts")
        .select("*")
        .eq("penggarap_id", penggarapId)
        .eq("user_id", user.id)
        .gt("sisa", 0)
        .order("tanggal", { ascending: true });

      const totalHutangSebelum = (hutangList || []).reduce(
        (s, h) => s + Number(h.sisa || 0),
        0
      );

      let hutangSudahDipotong = false;
      let potonganLogGlobal: any[] = [];

      // Loop tiap lahan
      for (let i = 0; i < pembagianPerLahan.length; i++) {
        const p = pembagianPerLahan[i];
        const lahan = p.lahan;
        const hasilKg = p.hasil;

        // Hitung profit
        const pendapatan = hasilKg * hargaGabah;
        const totalBiaya = hasilKg * biayaPanen + (i === 0 ? biayaTambahan : 0);
        const profitBersih = pendapatan - totalBiaya;

        let profitOwner = 0;
        let profitPenggarap = 0;
        if (profitBersih > 0) {
          profitOwner = profitBersih * (persenOwner / 100);
          profitPenggarap = profitBersih * (persenPenggarap / 100);
        }

        // Potong hutang HANYA di lahan pertama
        let potonganHutang = 0;
        let profitPenggarapFinal = profitPenggarap;
        let profitOwnerFinal = profitOwner;
        const potonganLog: any[] = [];

        if (
          i === 0 &&
          !hutangSudahDipotong &&
          totalHutangSebelum > 0 &&
          profitPenggarap > 0
        ) {
          let sisaPotong = Math.min(profitPenggarap, totalHutangSebelum);
          potonganHutang = sisaPotong;
          const waktuPotong = new Date().toISOString();

          for (const h of hutangList || []) {
            if (sisaPotong <= 0) break;
            const sisaHutang = Number(h.sisa);
            const bayar = Math.min(sisaHutang, sisaPotong);
            const sisaBaru = sisaHutang - bayar;
            const dibayarBaru = Number(h.dibayar || 0) + bayar;

            const logEntry = {
              aksi: "potong_panen_multi",
              waktu: waktuPotong,
              jumlah: bayar,
              sisa_sebelum: sisaHutang,
              sisa_sesudah: sisaBaru,
              keterangan: `Potong otomatis dari panen multi-lahan (lahan: ${lahan.nama})`,
            };

            const logLama = Array.isArray(h.log_perubahan)
              ? h.log_perubahan
              : [];
            const logBaru = [...logLama, logEntry];

            await supabase
              .from("debts")
              .update({
                dibayar: dibayarBaru,
                sisa: sisaBaru,
                log_perubahan: logBaru,
              })
              .eq("id", h.id);

            potonganLog.push({
              debt_id: h.id,
              jumlah_dipotong: bayar,
              tanggal_hutang: h.tanggal,
              keperluan: h.keperluan || null,
              waktu_potong: waktuPotong,
              aksi: "potong",
            });

            sisaPotong -= bayar;
          }

          profitPenggarapFinal = profitPenggarap - potonganHutang;
          profitOwnerFinal = profitOwner + potonganHutang;
          hutangSudahDipotong = true;
          potonganLogGlobal = potonganLog;
        }

        // Hitung sisa hutang sesudah (hanya untuk lahan pertama)
        const totalHutangSesudah =
          i === 0
            ? Math.max(0, totalHutangSebelum - potonganHutang)
            : totalHutangSebelum;

        // Insert panen
        const { error } = await supabase.from("harvests").insert({
          user_id: user.id,
          land_id: lahan.id,
          tanggal,
          komoditas,
          musim: null,
          hasil_kg: hasilKg,
          harga_gabah: hargaGabah,
          harga_per_kg: hargaGabah,
          biaya_panen_per_kg: biayaPanen,
          biaya_tambahan: i === 0 ? biayaTambahan : 0,
          keterangan_biaya: i === 0 ? keteranganBiaya || null : null,
          bawa_penggarap: 0,
          bawa_owner: 0,
          bawa_lain: 0,
          persen_owner: persenOwner,
          persen_penggarap: persenPenggarap,
          profit_bersih: profitBersih,
          profit_owner: profitOwnerFinal,
          profit_penggarap: profitPenggarapFinal,
          potongan_hutang: potonganHutang,
          potongan_hutang_log: potonganLog,
          total_hutang_sebelum: i === 0 ? totalHutangSebelum : totalHutangSesudah,
          sisa_hutang_sesudah: totalHutangSesudah,
          catatan: `[MULTI-LAHAN] Total ${totalHasil.toFixed(
            0
          )} Kg dari ${selectedLands.length} lahan. Lahan ini: ${lahan.nama} (${lahan.luas} Ha). ${catatan || ""}`.trim(),
        });

        if (error) {
          console.error(`Error insert panen lahan ${lahan.nama}:`, error);
          throw error;
        }
      }

      // Sukses
      alert(
        `✅ Berhasil input panen multi-lahan!\n\n` +
          `${pembagianPerLahan.length} lahan tercatat.\n` +
          `Total ${totalHasil.toFixed(0)} Kg.\n\n` +
          (hutangSudahDipotong
            ? `💸 Potong hutang: Rp ${potonganLogGlobal
                .reduce((s, l) => s + l.jumlah_dipotong, 0)
                .toLocaleString("id-ID")}\n`
            : "") +
          `Redirect ke halaman penggarap...`
      );

      // Reset form
      setTotalHasil(0);
      setBiayaTambahan(0);
      setKeteranganBiaya("");
      setCatatan("");
      setPersenOwner(50);

      // Redirect ke halaman penggarap
      router.push(`/penggarap/${penggarapId}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error proses panen multi:", err);
      alert("❌ Gagal: " + (err.message || "Unknown error"));
    } finally {
      setSedangProses(false);
    }
  }

  if (loadingData) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  const persenPenggarap = 100 - persenOwner;
  const profitBersihGlobal =
    totalHasil * hargaGabah - (totalHasil * biayaPanen + biayaTambahan);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          🌾 Panen Multi-Lahan
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Gabung panen dari beberapa lahan sekaligus — otomatis dibagi
          proporsional berdasarkan luas
        </p>
      </div>

      {penggaraps.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">👨‍🌾</div>
          <p className="text-yellow-800 font-medium mb-3">Belum ada penggarap</p>
          <p className="text-yellow-700 text-sm mb-4">
            Tambah penggarap dulu untuk mulai input panen
          </p>
          <a
            href="/penggarap/baru"
            className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2 rounded-lg transition"
          >
            + Tambah Penggarap
          </a>
        </div>
      ) : (
        <>
          {/* ===== FORM INFO ===== */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penggarap <span className="text-red-500">*</span>
                </label>
                <select
                  value={penggarapId}
                  onChange={(e) => handlePenggarapChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Komoditas <span className="text-red-500">*</span>
                </label>
                <select
                  value={komoditas}
                  onChange={(e) => setKomoditas(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="padi">🌾 Padi</option>
                  <option value="jagung">🌽 Jagung</option>
                  <option value="kacang_tanah">🥜 Kacang Tanah</option>
                  <option value="bawang_merah">🧅 Bawang Merah</option>
                  <option value="cabai_rawit">🌶️ Cabai Rawit</option>
                </select>
              </div>
            </div>
          </div>

          {/* ===== PILIH LAHAN ===== */}
          {lands.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Pilih Lahan ({selectedLands.length}/{lands.length} dipilih)
                </label>
                <button
                  onClick={toggleAllLands}
                  className="text-xs text-green-700 hover:text-green-800 font-medium"
                >
                  {selectedLands.length === lands.length
                    ? "⬜ Uncheck Semua"
                    : "✅ Pilih Semua"}
                </button>
              </div>

              <div className="space-y-2">
                {lands.map((l) => (
                  <label
                    key={l.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border-2 ${
                      selectedLands.includes(l.id)
                        ? "bg-green-50 border-green-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLands.includes(l.id)}
                      onChange={() => toggleLand(l.id)}
                      className="w-5 h-5 accent-green-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        🗺️ {l.nama}
                      </div>
                      <div className="text-xs text-gray-600">
                        {Number(l.luas).toFixed(2)} Ha
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
                📏 Total luas terpilih:{" "}
                <strong>{totalLuasTerpilih.toFixed(2)} Ha</strong>
              </div>
            </div>
          )}

          {/* ===== INPUT HASIL ===== */}
          {selectedLands.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Hasil Panen (Kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={totalHasil === 0 ? "" : totalHasil}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTotalHasil(v === "" ? 0 : parseFloat(v) || 0);
                    }}
                    placeholder="Contoh: 4500"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total dari <strong>semua lahan terpilih</strong>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga per Kg (Rp)
                  </label>
                  <input
                    type="number"
                    value={hargaGabah === 0 ? "" : hargaGabah}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHargaGabah(v === "" ? 0 : parseFloat(v) || 0);
                    }}
                    placeholder="5000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biaya Panen per Kg (Rp)
                  </label>
                  <input
                    type="number"
                    value={biayaPanen === 0 ? "" : biayaPanen}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBiayaPanen(v === "" ? 0 : parseFloat(v) || 0);
                    }}
                    placeholder="400"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biaya Tambahan (Rp){" "}
                    <span className="text-[10px] text-gray-400">
                      (hanya di lahan pertama)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={biayaTambahan === 0 ? "" : biayaTambahan}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBiayaTambahan(v === "" ? 0 : parseFloat(v) || 0);
                    }}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan Biaya Tambahan
                  </label>
                  <input
                    type="text"
                    value={keteranganBiaya}
                    onChange={(e) => setKeteranganBiaya(e.target.value)}
                    placeholder="Contoh: Sewa mesin, transport"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Preview Pembagian */}
              {totalHasil > 0 && totalLuasTerpilih > 0 && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                  <h3 className="font-bold text-green-900 text-sm mb-3">
                    📊 Preview Pembagian Hasil
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-green-300">
                          <th className="text-left py-2 font-bold text-green-800">
                            Lahan
                          </th>
                          <th className="text-right py-2 font-bold text-green-800">
                            Luas (Ha)
                          </th>
                          <th className="text-right py-2 font-bold text-green-800">
                            Proporsi
                          </th>
                          <th className="text-right py-2 font-bold text-green-800">
                            Hasil (Kg)
                          </th>
                          <th className="text-right py-2 font-bold text-green-800">
                            Produktivitas
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pembagianPerLahan.map((p) => (
                          <tr
                            key={p.lahan.id}
                            className="border-b border-green-200"
                          >
                            <td className="py-2 text-gray-800 font-medium">
                              {p.lahan.nama}
                            </td>
                            <td className="py-2 text-right text-gray-700">
                              {Number(p.lahan.luas).toFixed(2)}
                            </td>
                            <td className="py-2 text-right text-gray-700">
                              {(p.proporsi * 100).toFixed(1)}%
                            </td>
                            <td className="py-2 text-right font-bold text-green-800">
                              {p.hasil.toFixed(0)}
                            </td>
                            <td className="py-2 text-right text-gray-600">
                              {(p.hasil / Number(p.lahan.luas)).toFixed(0)}{" "}
                              Kg/Ha
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-green-400 bg-green-100">
                          <td className="py-2 font-bold text-green-900">
                            TOTAL
                          </td>
                          <td className="py-2 text-right font-bold text-green-900">
                            {totalLuasTerpilih.toFixed(2)}
                          </td>
                          <td className="py-2 text-right font-bold text-green-900">
                            100%
                          </td>
                          <td className="py-2 text-right font-bold text-green-900">
                            {totalHasil.toFixed(0)}
                          </td>
                          <td className="py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Skema Bagi Hasil */}
              <div className="pt-2 border-t">
                <SkemaBagiHasilV2 onChange={setPersenOwner} />
              </div>

              {/* Preview Profit */}
              {totalHasil > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                  <div className="font-bold text-yellow-900 mb-2">
                    💰 Estimasi Profit
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded p-2 border border-yellow-200">
                      <div className="text-[10px] text-gray-500">
                        Profit Bersih
                      </div>
                      <div className="font-bold text-gray-900 mt-0.5">
                        {formatRp(profitBersihGlobal)}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2 border border-yellow-200">
                      <div className="text-[10px] text-green-700">
                        Owner ({persenOwner}%)
                      </div>
                      <div className="font-bold text-green-800 mt-0.5">
                        {formatRp(profitBersihGlobal * (persenOwner / 100))}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2 border border-yellow-200">
                      <div className="text-[10px] text-orange-700">
                        Penggarap ({persenPenggarap}%)
                      </div>
                      <div className="font-bold text-orange-800 mt-0.5">
                        {formatRp(
                          profitBersihGlobal * (persenPenggarap / 100)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>ℹ️ Info:</strong> Panen akan dicatat sebagai{" "}
                <strong>{selectedLands.length} record</strong> (satu per lahan).
                Potong hutang otomatis <strong>hanya di lahan pertama</strong>{" "}
                biar tidak dobel.
              </div>

              <button
                onClick={handleProses}
                disabled={sedangProses}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 text-lg"
              >
                {sedangProses
                  ? "⏳ Memproses..."
                  : `🌾 Proses Panen (${pembagianPerLahan.length} Lahan)`}
              </button>
            </div>
          )}

          {penggarapId && lands.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-yellow-800 font-medium mb-2">
                {namaPenggarap} belum punya lahan
              </p>
              <a
                href={`/penggarap/${penggarapId}/lahan/baru`}
                className="inline-block bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2 rounded-lg transition"
              >
                + Tambah Lahan
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
