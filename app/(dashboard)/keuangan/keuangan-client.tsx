"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CtaThreshold } from "@/components/cta-threshold";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

const KOMODITAS_COLOR: Record<string, string> = {
  padi: "bg-green-500",
  jagung: "bg-yellow-500",
  kacang_tanah: "bg-purple-500",
  bawang_merah: "bg-red-500",
  cabai_rawit: "bg-red-700",
  cabai: "bg-red-700",
};

const KOMODITAS_BORDER: Record<string, string> = {
  padi: "border-green-300 bg-green-50",
  jagung: "border-yellow-300 bg-yellow-50",
  kacang_tanah: "border-purple-300 bg-purple-50",
  bawang_merah: "border-red-300 bg-red-50",
  cabai_rawit: "border-red-400 bg-red-50",
  cabai: "border-red-400 bg-red-50",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatKg(n: number) {
  return Math.round(n).toLocaleString("id-ID") + " Kg";
}

type Props = {
  penggaraps: { id: string; nama: string }[];
  lands: { id: string; penggarap_id: string; nama: string; luas: number }[];
  harvests: any[];
  debts: any[];
  musimCabaiList: { id: string; nama: string }[];
};

export function KeuanganClient({
  penggaraps,
  lands,
  harvests: allHarvests,
  debts,
  musimCabaiList,
}: Props) {
  const [filterTahun, setFilterTahun] = useState("");
  const [filterKomoditas, setFilterKomoditas] = useState("");
  const [filterMusim, setFilterMusim] = useState("");

  const tahunTersedia = useMemo(() => {
    const set = new Set<number>();
    allHarvests.forEach((h) => {
      set.add(new Date(h.tanggal).getFullYear());
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [allHarvests]);

  const komoditasTersedia = useMemo(() => {
    const set = new Set<string>();
    allHarvests.forEach((h) => set.add(h.komoditas || "padi"));
    const order = [
      "padi",
      "jagung",
      "kacang_tanah",
      "bawang_merah",
      "cabai_rawit",
      "cabai",
    ];
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [allHarvests]);

  const harvests = useMemo(() => {
    return allHarvests.filter((h) => {
      if (filterTahun) {
        const y = new Date(h.tanggal).getFullYear().toString();
        if (y !== filterTahun) return false;
      }
      if (filterKomoditas) {
        if ((h.komoditas || "padi") !== filterKomoditas) return false;
      }
      if (filterMusim) {
        if ((h.musim || "") !== filterMusim) return false;
      }
      return true;
    });
  }, [allHarvests, filterTahun, filterKomoditas, filterMusim]);

  const totalProfitOwner = harvests.reduce(
    (s, h) => s + Number(h.profit_owner || 0),
    0
  );
  const totalProfitPenggarap = harvests.reduce(
    (s, h) => s + Number(h.profit_penggarap || 0),
    0
  );
  const totalHasilKg = harvests.reduce((s, h) => s + Number(h.hasil_kg), 0);
  const totalPotonganHutang = harvests.reduce(
    (s, h) => s + Number(h.potongan_hutang || 0),
    0
  );

  const hutangAktif = debts.filter((d) => Number(d.sisa) > 0);
  const totalHutangAktif = hutangAktif.reduce((s, d) => s + Number(d.sisa), 0);

  const { bulanLabels, bulanOwner, bulanPenggarap, maxBulan } = useMemo(() => {
    const now = new Date();
    const labels: string[] = [];
    const ownerArr: number[] = [];
    const penggarapArr: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      labels.push(label);

      const bulanHarvests = harvests.filter((h) => {
        const hd = new Date(h.tanggal);
        return (
          hd.getFullYear() === d.getFullYear() &&
          hd.getMonth() === d.getMonth()
        );
      });

      ownerArr.push(
        bulanHarvests.reduce((s, h) => s + Number(h.profit_owner || 0), 0)
      );
      penggarapArr.push(
        bulanHarvests.reduce(
          (s, h) => s + Number(h.profit_penggarap || 0),
          0
        )
      );
    }

    const maxVal = Math.max(...ownerArr, ...penggarapArr, 1);

    return {
      bulanLabels: labels,
      bulanOwner: ownerArr,
      bulanPenggarap: penggarapArr,
      maxBulan: maxVal,
    };
  }, [harvests]);

  const topPenggarap = useMemo(() => {
    const profitByPenggarap = new Map<
      string,
      { nama: string; profit: number }
    >();
    harvests.forEach((h) => {
      const land = lands.find((l) => l.id === h.land_id);
      if (!land) return;
      const p = penggaraps.find((pg) => pg.id === land.penggarap_id);
      if (!p) return;
      const existing = profitByPenggarap.get(p.id) || {
        nama: p.nama,
        profit: 0,
      };
      existing.profit += Number(h.profit_owner || 0);
      profitByPenggarap.set(p.id, existing);
    });
    return Array.from(profitByPenggarap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [harvests, lands, penggaraps]);

  const statPerKomoditas = useMemo(() => {
    const map = new Map<
      string,
      {
        jmlPanen: number;
        jmlPenggarapSet: Set<string>;
        jmlLahanSet: Set<string>;
        totalLuasSet: Map<string, number>;
        totalHasilKg: number;
        totalPendapatan: number;
        totalBiayaPanen: number;
        totalBiayaTambahan: number;
        profitBersih: number;
        profitOwner: number;
        profitPenggarap: number;
        potonganHutang: number;
      }
    >();

    harvests.forEach((h) => {
      const kom = h.komoditas || "padi";
      const land = lands.find((l) => l.id === h.land_id);

      if (!map.has(kom)) {
        map.set(kom, {
          jmlPanen: 0,
          jmlPenggarapSet: new Set(),
          jmlLahanSet: new Set(),
          totalLuasSet: new Map(),
          totalHasilKg: 0,
          totalPendapatan: 0,
          totalBiayaPanen: 0,
          totalBiayaTambahan: 0,
          profitBersih: 0,
          profitOwner: 0,
          profitPenggarap: 0,
          potonganHutang: 0,
        });
      }

      const d = map.get(kom)!;
      d.jmlPanen += 1;
      d.totalHasilKg += Number(h.hasil_kg);
      d.totalPendapatan += Number(h.hasil_kg) * Number(h.harga_gabah || 0);
      d.totalBiayaPanen +=
        Number(h.hasil_kg) * Number(h.biaya_panen_per_kg || 0);
      d.totalBiayaTambahan += Number(h.biaya_tambahan || 0);
      d.profitBersih += Number(h.profit_bersih || 0);
      d.profitOwner += Number(h.profit_owner || 0);
      d.profitPenggarap += Number(h.profit_penggarap || 0);
      d.potonganHutang += Number(h.potongan_hutang || 0);

      if (land) {
        d.jmlLahanSet.add(land.id);
        d.totalLuasSet.set(land.id, Number(land.luas));
        if (land.penggarap_id) {
          d.jmlPenggarapSet.add(land.penggarap_id);
        }
      }
    });

    return Array.from(map.entries())
      .map(([kom, d]) => {
        const totalLuas = Array.from(d.totalLuasSet.values()).reduce(
          (s, l) => s + l,
          0
        );
        const produktivitas = totalLuas > 0 ? d.totalHasilKg / totalLuas : 0;
        return {
          komoditas: kom,
          jmlPanen: d.jmlPanen,
          jmlPenggarap: d.jmlPenggarapSet.size,
          jmlLahan: d.jmlLahanSet.size,
          totalLuas,
          totalHasilKg: d.totalHasilKg,
          totalPendapatan: d.totalPendapatan,
          totalBiayaPanen: d.totalBiayaPanen,
          totalBiayaTambahan: d.totalBiayaTambahan,
          profitBersih: d.profitBersih,
          profitOwner: d.profitOwner,
          profitPenggarap: d.profitPenggarap,
          potonganHutang: d.potonganHutang,
          produktivitas,
        };
      })
      .sort((a, b) => b.profitBersih - a.profitBersih);
  }, [harvests, lands]);

  const lahanList = useMemo(() => {
    const map = new Map<
      string,
      {
        lahanNama: string;
        penggarapNama: string;
        luas: number;
        komoditasSet: Set<string>;
        totalHasil: number;
        profitOwner: number;
        profitPenggarap: number;
      }
    >();
    harvests.forEach((h) => {
      const land = lands.find((l) => l.id === h.land_id);
      if (!land) return;
      const p = penggaraps.find((pg) => pg.id === land.penggarap_id);
      const key = land.id;
      const existing = map.get(key) || {
        lahanNama: land.nama,
        penggarapNama: p?.nama || "?",
        luas: Number(land.luas),
        komoditasSet: new Set<string>(),
        totalHasil: 0,
        profitOwner: 0,
        profitPenggarap: 0,
      };
      existing.komoditasSet.add(h.komoditas || "padi");
      existing.totalHasil += Number(h.hasil_kg);
      existing.profitOwner += Number(h.profit_owner || 0);
      existing.profitPenggarap += Number(h.profit_penggarap || 0);
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.profitOwner - a.profitOwner);
  }, [harvests, lands, penggaraps]);

  const adaFilterAktif = filterTahun || filterKomoditas || filterMusim;

  function resetFilter() {
    setFilterTahun("");
    setFilterKomoditas("");
    setFilterMusim("");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          💰 Keuangan & Laba
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Ringkasan profit, hutang, dan performa keuangan
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase">
              Tahun
            </label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Tahun</option>
              {tahunTersedia.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase">
              Komoditas
            </label>
            <select
              value={filterKomoditas}
              onChange={(e) => setFilterKomoditas(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Komoditas</option>
              {komoditasTersedia.map((k) => (
                <option key={k} value={k}>
                  {KOMODITAS_LABEL[k] || k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase">
              🗓️ Musim Cabai
            </label>
            <select
              value={filterMusim}
              onChange={(e) => setFilterMusim(e.target.value)}
              className="border border-orange-300 bg-orange-50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Semua Musim</option>
              {musimCabaiList.map((m) => (
                <option key={m.id} value={m.nama}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>

          {adaFilterAktif && (
            <button
              onClick={resetFilter}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              🔄 Reset Filter
            </button>
          )}

          <div className="text-xs text-gray-500 italic ml-auto">
            {harvests.length} dari {allHarvests.length} transaksi
          </div>
        </div>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-0">
          <div className="text-2xl mb-1">👤</div>
          <div className="text-xs text-gray-500 font-medium">PROFIT OWNER</div>
          <div className="text-base sm:text-lg font-bold text-green-700 mt-1 leading-tight break-words">
            {formatRp(totalProfitOwner)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-0">
          <div className="text-2xl mb-1">👨‍🌾</div>
          <div className="text-xs text-gray-500 font-medium">
            PROFIT PENGGARAP
          </div>
          <div className="text-base sm:text-lg font-bold text-orange-600 mt-1 leading-tight break-words">
            {formatRp(totalProfitPenggarap)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-0">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs text-gray-500 font-medium">HUTANG AKTIF</div>
          <div className="text-base sm:text-lg font-bold text-red-600 mt-1 leading-tight break-words">
            {formatRp(totalHutangAktif)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {hutangAktif.length} hutang
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-0">
          <div className="text-2xl mb-1">🌾</div>
          <div className="text-xs text-gray-500 font-medium">TOTAL PANEN</div>
          <div className="text-base sm:text-lg font-bold text-blue-600 mt-1 leading-tight break-words">
            {formatKg(totalHasilKg)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {harvests.length} transaksi
          </div>
        </div>
      </div>

      {/* STATISTIK PER KOMODITAS */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
              📊 Statistik per Komoditas
            </h2>
            <span className="text-xs text-gray-500 italic">
              Total panen & profit per komoditas (tidak digabung)
            </span>
          </div>
          <CtaThreshold />
        </div>

        {statPerKomoditas.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-6">
            Belum ada data panen
          </p>
        ) : (
          <div className="space-y-4">
            {statPerKomoditas.map((k) => {
              const borderClass =
                KOMODITAS_BORDER[k.komoditas] || "border-gray-300 bg-gray-50";
              const dotClass = KOMODITAS_COLOR[k.komoditas] || "bg-gray-500";
              return (
                <div
                  key={k.komoditas}
                  className={`border-2 rounded-xl p-4 ${borderClass}`}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                      <span className="font-bold text-gray-900 text-base">
                        {KOMODITAS_LABEL[k.komoditas] || k.komoditas}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-1 font-medium">
                      {k.jmlPanen} transaksi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                      <div className="text-gray-500">Penggarap</div>
                      <div className="font-bold text-gray-900 text-sm mt-0.5">
                        {k.jmlPenggarap}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                      <div className="text-gray-500">Lahan</div>
                      <div className="font-bold text-gray-900 text-sm mt-0.5">
                        {k.jmlLahan} ({k.totalLuas.toFixed(2)} Ha)
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                      <div className="text-gray-500">Total Hasil</div>
                      <div className="font-bold text-gray-900 text-sm mt-0.5">
                        {formatKg(k.totalHasilKg)}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                      <div className="text-gray-500">Produktivitas</div>
                      <div className="font-bold text-gray-900 text-sm mt-0.5">
                        {k.produktivitas.toFixed(0)} Kg/Ha
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200 gap-2">
                      <span className="text-gray-600 shrink-0">
                        Pendapatan Kotor
                      </span>
                      <span className="font-medium text-gray-800 text-right break-words">
                        {formatRp(k.totalPendapatan)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200 gap-2">
                      <span className="text-gray-600 shrink-0">
                        Biaya Panen
                      </span>
                      <span className="font-medium text-red-600 text-right break-words">
                        − {formatRp(k.totalBiayaPanen)}
                      </span>
                    </div>
                    {k.totalBiayaTambahan > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-200 gap-2">
                        <span className="text-gray-600 shrink-0">
                          Biaya Tambahan
                        </span>
                        <span className="font-medium text-red-600 text-right break-words">
                          − {formatRp(k.totalBiayaTambahan)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1.5 bg-white rounded px-2 border border-gray-200 font-bold gap-2">
                      <span className="text-green-800 shrink-0">
                        💵 Profit Bersih
                      </span>
                      <span className="text-green-700 text-right break-words">
                        {formatRp(k.profitBersih)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-green-100 rounded-lg p-2 text-center min-w-0">
                        <div className="text-green-700 font-medium">
                          👤 Owner
                        </div>
                        <div className="font-bold text-green-900 text-xs sm:text-sm mt-0.5 leading-tight break-words">
                          {formatRp(k.profitOwner)}
                        </div>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-2 text-center min-w-0">
                        <div className="text-orange-700 font-medium">
                          👨‍🌾 Penggarap
                        </div>
                        <div className="font-bold text-orange-900 text-xs sm:text-sm mt-0.5 leading-tight break-words">
                          {formatRp(k.profitPenggarap)}
                        </div>
                      </div>
                    </div>
                    {k.potonganHutang > 0 && (
                      <div className="flex justify-between py-1 text-red-700 mt-1 gap-2">
                        <span className="shrink-0">💸 Potongan Hutang</span>
                        <span className="font-bold text-right break-words">
                          − {formatRp(k.potonganHutang)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INFO POTONGAN HUTANG */}
      {totalPotonganHutang > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-medium text-blue-800">
              💸 Total potongan hutang dari panen:
            </div>
            <div className="font-bold text-blue-700 text-lg break-words">
              {formatRp(totalPotonganHutang)}
            </div>
          </div>
        </div>
      )}

      {/* CHART PROFIT BULANAN */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📈 Profit Bulanan (12 Bulan Terakhir)
        </h2>
        {totalProfitOwner + totalProfitPenggarap === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-6">
            Belum ada data profit
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {bulanLabels.map((label, i) => {
                const owner = bulanOwner[i];
                const penggarap = bulanPenggarap[i];
                const total = owner + penggarap;
                if (total === 0) return null;
                const pctOwner = (owner / maxBulan) * 100;
                const pctPenggarap = (penggarap / maxBulan) * 100;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1 gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="font-bold text-gray-700 text-right break-words">
                        {formatRp(total)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${pctOwner}%` }}
                        title={`Owner: ${formatRp(owner)}`}
                      />
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${pctPenggarap}%` }}
                        title={`Penggarap: ${formatRp(penggarap)}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5 gap-2">
                      <span className="truncate">
                        👤 Owner: {formatRp(owner)}
                      </span>
                      <span className="truncate text-right">
                        👨‍🌾 Penggarap: {formatRp(penggarap)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Owner</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span>Penggarap</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* TOP 5 PENGGARAP */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          🏆 Top 5 Penggarap by Profit Owner
        </h2>
        {topPenggarap.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Belum ada data profit
          </p>
        ) : (
          <div className="space-y-2">
            {topPenggarap.map((p, i) => {
              const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
              return (
                <Link
                  key={p.id}
                  href={`/penggarap/${p.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{medal}</span>
                    <span className="font-medium text-gray-900 truncate">
                      {p.nama}
                    </span>
                  </div>
                  <span className="font-bold text-green-700 text-right break-words shrink-0">
                    {formatRp(p.profit)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* PROFIT PER LAHAN */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          🗺️ Profit per Lahan
        </h2>
        {lahanList.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Belum ada data panen
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 text-xs text-gray-600 uppercase">
                    Lahan
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gray-600 uppercase">
                    Penggarap
                  </th>
                  <th className="text-right py-2 px-2 text-xs text-gray-600 uppercase">
                    Hasil (Kg)
                  </th>
                  <th className="text-right py-2 px-2 text-xs text-gray-600 uppercase">
                    Owner
                  </th>
                  <th className="text-right py-2 px-2 text-xs text-gray-600 uppercase">
                    Penggarap
                  </th>
                </tr>
              </thead>
              <tbody>
                {lahanList.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2">
                      <div className="font-medium text-gray-900">
                        {l.lahanNama}
                      </div>
                      <div className="text-xs text-gray-500">
                        {l.luas.toFixed(2)} Ha
                      </div>
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      {l.penggarapNama}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700">
                      {l.totalHasil.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-green-700 break-words">
                      {formatRp(l.profitOwner)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-orange-600 break-words">
                      {formatRp(l.profitPenggarap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
