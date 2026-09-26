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

type SakInput = {
  bobot: number;
  jumlah: number;
  pribadi: boolean;
};

type Sesi = {
  id: number;
  sak: SakInput[];
};

type SesiDetail = {
  nomor: number;
  sakList: { nomor: number; bobot: number; jumlah: number; pribadi: boolean }[];
  subtotalBobot: number;
  subtotalSak: number;
  subtotalDijual: number;
  subtotalPribadi: number;
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function buatSakKosong(): SakInput[] {
  return Array(5)
    .fill(null)
    .map(() => ({ bobot: 0, jumlah: 0, pribadi: false }));
}

export default function GabahPage() {
  const router = useRouter();
  const supabase = createClient();

  const [penggaraps, setPenggaraps] = useState<Penggarap[]>([]);
  const [lands, setLands] = useState<Lahan[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [penggarapId, setPenggarapId] = useState("");
  const [landId, setLandId] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [namaPenggarap, setNamaPenggarap] = useState("");
  const [namaLahan, setNamaLahan] = useState("");
  const [luasLahan, setLuasLahan] = useState(0);
  const [hargaJual, setHargaJual] = useState(5000);
  const [hargaVendor, setHargaVendor] = useState(400);
  const [persenOwner, setPersenOwner] = useState(50);

  const [sesi, setSesi] = useState<Sesi[]>([
    { id: 1, sak: buatSakKosong() },
  ]);
  const [nextSesiId, setNextSesiId] = useState(2);

  const [hasil, setHasil] = useState<{
    totalBobot: number;
    totalJumlah: number;
    bobotDijual: number;
    bobotPribadi: number;
    totalHarga: number;
    biayaVendor: number;
    profitBersih: number;
    produktivitas: number;
    sesiDetails: SesiDetail[];
  } | null>(null);

  const [sedangKirim, setSedangKirim] = useState(false);

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
        return;
      }
      const { data } = await supabase
        .from("lands")
        .select("id, nama, luas")
        .eq("penggarap_id", penggarapId)
        .order("nama");
      setLands(data || []);
    }
    loadLands();
  }, [penggarapId]);

  function handlePenggarapChange(id: string) {
    setPenggarapId(id);
    setLandId("");
    const p = penggaraps.find((x) => x.id === id);
    setNamaPenggarap(p?.nama || "");
    setNamaLahan("");
    setLuasLahan(0);
  }

  function handleLahanChange(id: string) {
    setLandId(id);
    const l = lands.find((x) => x.id === id);
    setNamaLahan(l?.nama || "");
    setLuasLahan(l?.luas || 0);
  }

  function tambahSesi() {
    setSesi([...sesi, { id: nextSesiId, sak: buatSakKosong() }]);
    setNextSesiId(nextSesiId + 1);
  }

  function hapusSesi(id: number) {
    if (sesi.length <= 1) {
      alert("Minimal 1 sesi");
      return;
    }
    if (!confirm(`Hapus Sesi Timbang ini? Data yang sudah diisi akan hilang.`))
      return;
    setSesi(sesi.filter((s) => s.id !== id));
  }

  function resetSesi(id: number) {
    if (!confirm(`Reset Sesi Timbang ini? Semua isian akan dikosongkan.`)) return;
    setSesi(
      sesi.map((s) => (s.id === id ? { ...s, sak: buatSakKosong() } : s))
    );
  }

  function updateSak(
    sesiId: number,
    sakIndex: number,
    field: keyof SakInput,
    value: any
  ) {
    setSesi(
      sesi.map((s) => {
        if (s.id !== sesiId) return s;
        const newSak = [...s.sak];
        newSak[sakIndex] = { ...newSak[sakIndex], [field]: value };
        if (field === "bobot" && value > 0 && newSak[sakIndex].jumlah === 0) {
          newSak[sakIndex].jumlah = 2;
        }
        return { ...s, sak: newSak };
      })
    );
  }

  function hitungTotal() {
    let totalBobot = 0;
    let totalJumlah = 0;
    let bobotDijual = 0;
    let bobotPribadi = 0;
    const sesiDetails: SesiDetail[] = [];

    sesi.forEach((s, idx) => {
      let subBobot = 0;
      let subSak = 0;
      let subDijual = 0;
      let subPribadi = 0;
      const sakList: SesiDetail["sakList"] = [];

      s.sak.forEach((sak, sakIdx) => {
        const bobot = Number(sak.bobot) || 0;
        const jumlah = Number(sak.jumlah) || 0;

        if (bobot > 0 || jumlah > 0) {
          sakList.push({
            nomor: sakIdx + 1,
            bobot,
            jumlah,
            pribadi: sak.pribadi,
          });
        }

        totalBobot += bobot;
        totalJumlah += jumlah;
        subBobot += bobot;
        subSak += jumlah;

        if (sak.pribadi) {
          bobotPribadi += bobot;
          subPribadi += bobot;
        } else {
          bobotDijual += bobot;
          subDijual += bobot;
        }
      });

      sesiDetails.push({
        nomor: idx + 1,
        sakList,
        subtotalBobot: subBobot,
        subtotalSak: subSak,
        subtotalDijual: subDijual,
        subtotalPribadi: subPribadi,
      });
    });

    const totalHarga = bobotDijual * hargaJual;
    const biayaVendor = totalBobot * hargaVendor;
    const profitBersih = totalHarga - biayaVendor;
    const produktivitas = luasLahan > 0 ? totalBobot / luasLahan : 0;

    setHasil({
      totalBobot,
      totalJumlah,
      bobotDijual,
      bobotPribadi,
      totalHarga,
      biayaVendor,
      profitBersih,
      produktivitas,
      sesiDetails,
    });

    setTimeout(() => {
      document
        .getElementById("hasil-gabah")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function kirimKeDatabase() {
    if (!penggarapId || !landId) {
      alert("❌ Pilih penggarap & lahan dulu");
      return;
    }
    if (!hasil || hasil.totalBobot <= 0) {
      alert("❌ Hitung total dulu (belum ada data)");
      return;
    }

    const persenPenggarap = 100 - persenOwner;

    const konfirmasi =
      `Kirim hasil penimbangan ke Database?\n\n` +
      `Penggarap: ${namaPenggarap}\n` +
      `Lahan: ${namaLahan}\n` +
      `Tanggal: ${tanggal}\n` +
      `Total Bobot: ${hasil.totalBobot.toFixed(0)} Kg\n` +
      `Total Sak: ${hasil.totalJumlah}\n` +
      `Skema Bagi Hasil: ${persenOwner}:${persenPenggarap}\n\n` +
      `Data akan masuk sebagai PANEN PADI.\n` +
      `Profit akan dihitung otomatis.`;

    if (!confirm(konfirmasi)) return;

    setSedangKirim(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const hasilKg = hasil.totalBobot;
      const harga = hargaJual;
      const biayaPanen = hargaVendor;

      const pendapatan = hasilKg * harga;
      const totalBiaya = hasilKg * biayaPanen;
      const profitBersih = pendapatan - totalBiaya;
      const profitOwner = profitBersih * (persenOwner / 100);
      const profitPenggarap = profitBersih * (persenPenggarap / 100);

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

      let potonganHutang = 0;
      let profitPenggarapFinal = profitPenggarap;
      let profitOwnerFinal = profitOwner;
      const potonganLog: any[] = [];

      if (totalHutangSebelum > 0 && profitPenggarap > 0) {
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
            aksi: "potong_gabah",
            waktu: waktuPotong,
            jumlah: bayar,
            sisa_sebelum: sisaHutang,
            sisa_sesudah: sisaBaru,
            keterangan: "Potong otomatis dari penimbangan gabah",
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
      }

      const totalHutangSesudah = Math.max(
        0,
        totalHutangSebelum - potonganHutang
      );

      const { error } = await supabase.from("harvests").insert({
        user_id: user.id,
        land_id: landId,
        tanggal,
        komoditas: "padi",
        musim: null,
        hasil_kg: hasilKg,
        harga_gabah: harga,
        harga_per_kg: harga,
        biaya_panen_per_kg: biayaPanen,
        biaya_tambahan: 0,
        keterangan_biaya: null,
        bawa_penggarap: hasil.bobotPribadi,
        bawa_owner: 0,
        bawa_lain: 0,
        persen_owner: persenOwner,
        persen_penggarap: persenPenggarap,
        profit_bersih: profitBersih,
        profit_owner: profitOwnerFinal,
        profit_penggarap: profitPenggarapFinal,
        potongan_hutang: potonganHutang,
        potongan_hutang_log: potonganLog,
        total_hutang_sebelum: totalHutangSebelum,
        sisa_hutang_sesudah: totalHutangSesudah,
        catatan: `[DARI GABAH] ${hasil.totalJumlah} sak, ${sesi.length} sesi timbang, skema ${persenOwner}:${persenPenggarap}`,
      });

      if (error) throw error;

      let pesanSukses = `✅ Berhasil dikirim ke Database!\n\nTotal: ${hasilKg.toFixed(0)} Kg\nSkema: ${persenOwner}:${persenPenggarap}\nProfit Bersih: ${formatRp(profitBersih)}`;
      if (potonganHutang > 0) {
        pesanSukses += `\n\n💸 Potong Hutang Otomatis: ${formatRp(potonganHutang)}`;
        if (totalHutangSesudah === 0) {
          pesanSukses += `\n🎉 HUTANG LUNAS!`;
        } else {
          pesanSukses += `\n📉 Sisa Hutang: ${formatRp(totalHutangSesudah)}`;
        }
      }

      alert(pesanSukses);

      setHasil(null);
      setSesi([{ id: 1, sak: buatSakKosong() }]);
      setNextSesiId(2);
      setPersenOwner(50);

      router.push(`/penggarap/${penggarapId}/lahan/${landId}`);
    } catch (err: any) {
      console.error("Error kirim gabah:", err);
      alert("❌ Gagal kirim: " + (err.message || "Unknown error"));
    } finally {
      setSedangKirim(false);
    }
  }

  async function saveAsImage() {
    const element = document.getElementById("hasil-gabah");
    if (!element) return;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `Penimbangan_Gabah_${namaPenggarap}_${tanggal}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal simpan gambar:", err);
      alert("⚠️ Gagal simpan gambar. Coba screenshot manual dari browser ya.");
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

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          ⚖️ Penimbangan Gabah
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Catat hasil panen per sesi timbang — otomatis jadi data panen
        </p>
      </div>

      {penggaraps.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-center">
          <div className="text-4xl mb-2">👨‍🌾</div>
          <p className="text-yellow-800 font-medium mb-3">Belum ada penggarap</p>
          <p className="text-yellow-700 text-sm mb-4">
            Tambah penggarap dulu untuk mulai menimbang gabah
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
                  Lahan <span className="text-red-500">*</span>
                </label>
                <select
                  value={landId}
                  onChange={(e) => handleLahanChange(e.target.value)}
                  disabled={!penggarapId}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">-- Pilih Lahan --</option>
                  {lands.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nama} ({l.luas} Ha)
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Luas Lahan
                </label>
                <div className="w-full bg-gray-100 rounded-lg px-3 py-2 text-gray-700">
                  {luasLahan > 0 ? `${luasLahan} Ha` : "-"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💰 Harga Jual per Kg (Rp)
                </label>
                <input
                  type="number"
                  value={hargaJual === 0 ? "" : hargaJual}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setHargaJual(v === "" ? 0 : parseFloat(v) || 0);
                  }}
                  placeholder="5000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🔧 Biaya Vendor per Kg (Rp)
                </label>
                <input
                  type="number"
                  value={hargaVendor === 0 ? "" : hargaVendor}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setHargaVendor(v === "" ? 0 : parseFloat(v) || 0);
                  }}
                  placeholder="400"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* ===== SKEMA BAGI HASIL ===== */}
            <div className="pt-2 border-t">
              <SkemaBagiHasilV2 onChange={setPersenOwner} />
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {sesi.map((s, sesiIdx) => (
              <div
                key={s.id}
                className="bg-white border-2 border-green-200 rounded-xl p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-green-600" />

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 gap-2 flex-wrap">
                  <div className="font-bold text-green-800">
                    ⚖️ Sesi Timbang {sesiIdx + 1}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resetSesi(s.id)}
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                    >
                      🔄 Reset Sesi
                    </button>
                    {sesi.length > 1 && (
                      <button
                        onClick={() => hapusSesi(s.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Hapus Sesi
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {s.sak.map((sak, sakIdx) => (
                    <div
                      key={sakIdx}
                      className={`border-2 rounded-lg p-3 ${
                        sak.pribadi
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700">
                          Sak {sakIdx + 1}
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sak.pribadi}
                            onChange={(e) =>
                              updateSak(
                                s.id,
                                sakIdx,
                                "pribadi",
                                e.target.checked
                              )
                            }
                            className="w-3.5 h-3.5 accent-orange-600"
                          />
                          <span className="text-[10px] text-gray-600">
                            Pribadi
                          </span>
                        </label>
                      </div>

                      <label className="block text-[10px] text-gray-500 mb-0.5">
                        Bobot (kg)
                      </label>
                      <input
                        type="number"
                        value={sak.bobot || ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateSak(
                            s.id,
                            sakIdx,
                            "bobot",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />

                      <label className="block text-[10px] text-gray-500 mb-0.5">
                        Jml Sak
                      </label>
                      <input
                        type="number"
                        value={sak.jumlah || ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          updateSak(
                            s.id,
                            sakIdx,
                            "jumlah",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <button
              onClick={tambahSesi}
              className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              ➕ Tambah Sesi Timbang
            </button>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={hitungTotal}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-8 py-3 rounded-xl transition text-lg shadow-md"
            >
              🧮 Hitung Total
            </button>
          </div>

          {hasil && (
            <div
              id="hasil-gabah"
              className="bg-white border-2 border-green-300 rounded-2xl p-6 mb-6"
            >
              <div className="border-b-2 border-green-200 pb-3 mb-4">
                <h2 className="text-xl font-bold text-green-800">
                  🌾 Hasil Penimbangan Gabah
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {namaPenggarap} &middot; {namaLahan} ({luasLahan} Ha) &middot;{" "}
                  {new Date(tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  💰 Skema Bagi Hasil:{" "}
                  <strong>
                    {persenOwner}:{persenPenggarap}
                  </strong>{" "}
                  (Owner : Penggarap)
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-700 font-medium">
                    TOTAL BOBOT
                  </div>
                  <div className="text-xl font-bold text-green-900 mt-1">
                    {hasil.totalBobot.toFixed(0)} Kg
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-700 font-medium">
                    TOTAL SAK
                  </div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {hasil.totalJumlah}
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-yellow-700 font-medium">
                    DIJUAL
                  </div>
                  <div className="text-xl font-bold text-yellow-900 mt-1">
                    {hasil.bobotDijual.toFixed(0)} Kg
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-orange-700 font-medium">
                    PRIBADI
                  </div>
                  <div className="text-xl font-bold text-orange-900 mt-1">
                    {hasil.bobotPribadi.toFixed(0)} Kg
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
                  📋 Rincian Per Sesi Timbang
                </h3>
                <div className="space-y-3">
                  {hasil.sesiDetails.map((sd) => (
                    <div
                      key={sd.nomor}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="font-bold text-sm text-green-800">
                          ⚖️ Sesi {sd.nomor}
                        </div>
                        <div className="text-xs text-gray-600">
                          Subtotal:{" "}
                          <strong className="text-green-700">
                            {sd.subtotalBobot.toFixed(0)} Kg
                          </strong>{" "}
                          / <strong>{sd.subtotalSak} sak</strong>
                        </div>
                      </div>

                      {sd.sakList.length > 0 ? (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-600 border-b border-gray-300">
                              <th className="text-left py-1 font-medium">Sak</th>
                              <th className="text-right py-1 font-medium">
                                Bobot (Kg)
                              </th>
                              <th className="text-right py-1 font-medium">
                                Jml
                              </th>
                              <th className="text-center py-1 font-medium">
                                Ket
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sd.sakList.map((sk) => (
                              <tr
                                key={sk.nomor}
                                className="border-b border-gray-100"
                              >
                                <td className="py-1 text-gray-700">
                                  Sak {sk.nomor}
                                </td>
                                <td className="py-1 text-right font-mono text-gray-900">
                                  {sk.bobot.toFixed(0)}
                                </td>
                                <td className="py-1 text-right font-mono text-gray-600">
                                  {sk.jumlah}
                                </td>
                                <td className="py-1 text-center">
                                  {sk.pribadi ? (
                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                      Pribadi
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                      Jual
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-xs text-gray-400 italic text-center py-1">
                          (tidak ada data)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-800 mb-2 pb-1 border-b border-gray-200">
                  🧮 Rincian Perhitungan
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Bobot Dijual × Harga/Kg
                    </span>
                    <span className="font-mono text-gray-800">
                      {hasil.bobotDijual.toFixed(0)} Kg × {formatRp(hargaJual)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600 font-medium">
                      = Total Harga Jual
                    </span>
                    <span className="font-bold text-green-700">
                      {formatRp(hasil.totalHarga)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-gray-600">
                      Total Bobot × Biaya Vendor
                    </span>
                    <span className="font-mono text-gray-800">
                      {hasil.totalBobot.toFixed(0)} Kg × {formatRp(hargaVendor)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600 font-medium">
                      = Total Biaya Vendor
                    </span>
                    <span className="font-bold text-red-600">
                      − {formatRp(hasil.biayaVendor)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 bg-green-50 -mx-4 px-4 py-3 rounded">
                    <span className="font-bold text-green-800">
                      💵 PROFIT BERSIH
                    </span>
                    <span className="font-bold text-green-700 text-base">
                      {formatRp(hasil.profitBersih)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-600 mb-2 font-medium">
                      Pembagian ({persenOwner}:{persenPenggarap})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                        <div className="text-[10px] text-green-700 font-medium">
                          👤 OWNER ({persenOwner}%)
                        </div>
                        <div className="font-bold text-green-900 text-sm mt-1">
                          {formatRp(hasil.profitBersih * (persenOwner / 100))}
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded p-2 text-center">
                        <div className="text-[10px] text-orange-700 font-medium">
                          👨‍🌾 PENGGARAP ({persenPenggarap}%)
                        </div>
                        <div className="font-bold text-orange-900 text-sm mt-1">
                          {formatRp(
                            hasil.profitBersih * (persenPenggarap / 100)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {hasil.bobotPribadi > 0 && (
                    <div className="flex justify-between pt-2 text-xs text-orange-700 bg-orange-50 -mx-4 px-4 py-2 rounded">
                      <span>🏠 Gabah untuk pribadi</span>
                      <span className="font-bold">
                        {hasil.bobotPribadi.toFixed(0)} Kg (tidak dijual)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {hasil.produktivitas > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mb-5">
                  📊 <strong>Produktivitas:</strong>{" "}
                  {hasil.produktivitas.toFixed(2)} Kg/Ha (
                  {hasil.totalBobot.toFixed(0)} Kg ÷ {luasLahan} Ha)
                </div>
              )}

              <div className="flex gap-3 flex-wrap justify-center pt-2 border-t border-gray-200 pt-4">
                <button
                  onClick={kirimKeDatabase}
                  disabled={sedangKirim}
                  className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-lg transition disabled:opacity-50"
                >
                  {sedangKirim
                    ? "⏳ Mengirim..."
                    : "📤 Kirim ke Database (Buat Panen)"}
                </button>
                <button
                  onClick={saveAsImage}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-6 py-3 rounded-lg transition"
                >
                  📸 Simpan Gambar
                </button>
              </div>

              <div className="text-center text-[10px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
                Dicetak dari Harvestan &middot;{" "}
                {new Date().toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
