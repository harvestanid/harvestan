"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CtaThreshold } from "@/components/cta-threshold";
import {
  siapkanDataPerTanggal,
  siapkanKinerjaPenggarap,
  siapkanDataPerPenggarap,
  siapkanDataMultiKomoditas,
  getKomoditasDenganData,
  KOMODITAS_COLOR,
  KOMODITAS_LABEL,
  type HarvestRaw,
  type LandRaw,
  type PenggarapRaw,
} from "@/lib/utils/grafik-helpers";

type Props = {
  penggaraps: PenggarapRaw[];
  lands: LandRaw[];
  harvests: HarvestRaw[];
};

const WARNA_PALET: string[] = [
  "#2c5e2e", "#ff8c42", "#4a90e2", "#e24a4a", "#9b59b6",
  "#f1c40f", "#e67e22", "#1abc9c", "#e84393", "#34495e",
  "#27ae60", "#8e44ad", "#16a085", "#c0392b", "#2980b9",
];

function getWarnaPenggarap(index: number): string {
  return WARNA_PALET[index % WARNA_PALET.length];
}

export function GrafikClient({ penggaraps, lands, harvests }: Props) {
  const [filterPenggarap, setFilterPenggarap] = useState<string>("");
  const [komoditasKinerja, setKomoditasKinerja] = useState<string>("");
  const [penggarapDetail, setPenggarapDetail] = useState<string>("");
  const [komoditasDetail, setKomoditasDetail] = useState<string>("");
  const [filterProduktivitasPenggarap, setFilterProduktivitasPenggarap] =
    useState<string>("");

  const dataPerTanggal = useMemo(
    () => siapkanDataPerTanggal(harvests, lands, filterPenggarap || null),
    [harvests, lands, filterPenggarap]
  );

  const dataProduktivitasFiltered = useMemo(
    () =>
      siapkanDataPerTanggal(
        harvests,
        lands,
        filterProduktivitasPenggarap || null
      ),
    [harvests, lands, filterProduktivitasPenggarap]
  );

  const komoditasTersedia = useMemo(
    () =>
      getKomoditasDenganData(
        harvests,
        filterPenggarap || null,
        filterPenggarap ? lands : undefined
      ),
    [harvests, lands, filterPenggarap]
  );

  const komoditasProduktivitasTersedia = useMemo(
    () =>
      getKomoditasDenganData(
        harvests,
        filterProduktivitasPenggarap || null,
        filterProduktivitasPenggarap ? lands : undefined
      ),
    [harvests, lands, filterProduktivitasPenggarap]
  );

  useMemo(() => {
    if (!komoditasKinerja && komoditasTersedia.length > 0) {
      setKomoditasKinerja(komoditasTersedia[0]);
    }
  }, [komoditasTersedia]);

  useMemo(() => {
    if (!penggarapDetail && penggaraps.length > 0) {
      setPenggarapDetail(penggaraps[0].id);
    }
  }, [penggaraps]);

  const dataKinerja = useMemo(
    () =>
      komoditasKinerja
        ? siapkanKinerjaPenggarap(harvests, lands, penggaraps, komoditasKinerja)
        : [],
    [harvests, lands, penggaraps, komoditasKinerja]
  );

  const dataDetail = useMemo(
    () =>
      penggarapDetail
        ? siapkanDataPerPenggarap(
            harvests,
            lands,
            penggarapDetail,
            komoditasDetail || null
          )
        : [],
    [harvests, lands, penggarapDetail, komoditasDetail]
  );

  // ✅ Multi-komoditas: baris per baris
  const dataMultiProduksi = useMemo(
    () =>
      penggarapDetail && !komoditasDetail
        ? siapkanDataMultiKomoditas(harvests, lands, penggarapDetail, "produksi")
        : [],
    [harvests, lands, penggarapDetail, komoditasDetail]
  );

  const dataMultiProduktivitas = useMemo(
    () =>
      penggarapDetail && !komoditasDetail
        ? siapkanDataMultiKomoditas(
            harvests,
            lands,
            penggarapDetail,
            "produktivitas"
          )
        : [],
    [harvests, lands, penggarapDetail, komoditasDetail]
  );

  const komoditasPenggarapDetail = useMemo(() => {
    if (!penggarapDetail) return [];
    return getKomoditasDenganData(harvests, penggarapDetail, lands);
  }, [harvests, lands, penggarapDetail]);

  // Daftar komoditas unik dari data multi
  const komoditasMultiList = useMemo(() => {
    const set = new Set<string>();
    dataMultiProduksi.forEach((d) => set.add(d.komoditas));
    return Array.from(set).sort((a, b) => {
      const order = ["padi", "jagung", "kacang_tanah", "bawang_merah", "cabai_rawit"];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [dataMultiProduksi]);

  const adaData = harvests.length > 0;

  const statsKinerja = useMemo(() => {
    if (dataKinerja.length === 0) return { min: 0, max: 0, avg: 0, total: 0 };
    const values = dataKinerja.map((d: any) => d.rataProduktivitas);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg =
      values.reduce((s: number, v: number) => s + v, 0) / values.length;
    return { min, max, avg, total: dataKinerja.length };
  }, [dataKinerja]);

  if (!adaData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="font-bold text-gray-900 mb-2">Belum ada data panen</h3>
        <p className="text-gray-600 text-sm">
          Tambahkan data panen dulu untuk melihat grafik.
        </p>
      </div>
    );
  }

  const modeMulti = !komoditasDetail && penggarapDetail;

  return (
    <div className="space-y-6">
      {/* FILTER GLOBAL */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Filter Penggarap:
            </label>
            <select
              value={filterPenggarap}
              onChange={(e) => setFilterPenggarap(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Penggarap</option>
              {penggaraps.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500 italic">
            {komoditasTersedia.length} komoditas dengan data
          </div>
        </div>
      </div>

      {/* GRAFIK 1: PRODUKSI PER KOMODITAS */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="font-bold text-gray-900 text-lg">
            📈 Produksi Panen per Komoditas
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Grafik garis produksi (Kg) — cabai per musim, lainnya per panen
          </p>
        </div>
        {komoditasTersedia.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic text-sm">
            Belum ada data
          </div>
        ) : (
          <div className="space-y-6">
            {komoditasTersedia.map((kom) => {
              const data = dataPerTanggal[kom] || [];
              return (
                <div key={kom}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: KOMODITAS_COLOR[kom] || "#666" }}
                    />
                    <span className="font-medium text-gray-800 text-sm">
                      {KOMODITAS_LABEL[kom] || kom}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({data.length} {kom === "cabai_rawit" ? "musim" : "panen"})
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={data}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="tanggalLabel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.toLocaleString("id-ID")} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString("id-ID")} Kg`, "Produksi"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="produksi"
                          stroke={KOMODITAS_COLOR[kom] || "#666"}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: KOMODITAS_COLOR[kom] || "#666" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GRAFIK 2: PRODUKTIVITAS PER KOMODITAS */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="mb-4 flex items-start justify-between flex-wrap gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-lg">
              ⚡ Produktivitas Panen per Komoditas
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Grafik garis produktivitas (Kg/Ha) — cabai per musim, lainnya per panen
            </p>
          </div>
          <CtaThreshold />
        </div>

        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-green-800">🎯 Filter Penggarap:</label>
          <select
            value={filterProduktivitasPenggarap}
            onChange={(e) => setFilterProduktivitasPenggarap(e.target.value)}
            className="border border-green-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Semua Penggarap</option>
            {penggaraps.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
          {filterProduktivitasPenggarap && (
            <button
              onClick={() => setFilterProduktivitasPenggarap("")}
              className="text-xs text-green-700 hover:text-green-900 font-medium underline"
            >
              Reset
            </button>
          )}
          <span className="text-[10px] text-green-700 italic ml-auto">
            💡 Pilih penggarap untuk grafik lebih bersih
          </span>
        </div>

        {komoditasProduktivitasTersedia.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic text-sm">
            {filterProduktivitasPenggarap ? "Penggarap ini belum ada data panen" : "Belum ada data"}
          </div>
        ) : (
          <div className="space-y-6">
            {komoditasProduktivitasTersedia.map((kom) => {
              const data = dataProduktivitasFiltered[kom] || [];
              return (
                <div key={kom}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: KOMODITAS_COLOR[kom] || "#666" }}
                    />
                    <span className="font-medium text-gray-800 text-sm">
                      {KOMODITAS_LABEL[kom] || kom}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({data.length} {kom === "cabai_rawit" ? "musim" : "panen"})
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={data}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="tanggalLabel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.toLocaleString("id-ID")} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString("id-ID")} Kg/Ha`, "Produktivitas"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="produktivitas"
                          stroke={KOMODITAS_COLOR[kom] || "#666"}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: KOMODITAS_COLOR[kom] || "#666" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GRAFIK 3: KINERJA PENGGARAP */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">🏆 Kinerja Penggarap</h2>
            <p className="text-xs text-gray-500 mt-1">
              Rata-rata produktivitas per penggarap (Kg/Ha) — warna beda per penggarap
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Komoditas:</label>
            <select
              value={komoditasKinerja}
              onChange={(e) => setKomoditasKinerja(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {komoditasTersedia.map((k) => (
                <option key={k} value={k}>{KOMODITAS_LABEL[k] || k}</option>
              ))}
            </select>
          </div>
        </div>

        {dataKinerja.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic text-sm">
            Belum ada penggarap dengan data untuk komoditas ini
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center overflow-hidden">
                <div className="text-[10px] text-gray-500 font-medium truncate">PENGGARAP</div>
                <div className="text-base font-bold text-gray-900">{statsKinerja.total}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center overflow-hidden">
                <div className="text-[10px] text-red-600 font-medium truncate">TERENDAH</div>
                <div className="text-base font-bold text-red-900">{Math.round(statsKinerja.min).toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center overflow-hidden">
                <div className="text-[10px] text-blue-600 font-medium truncate">RATA-RATA</div>
                <div className="text-base font-bold text-blue-900">{Math.round(statsKinerja.avg).toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center overflow-hidden">
                <div className="text-[10px] text-green-600 font-medium truncate">TERTINGGI</div>
                <div className="text-base font-bold text-green-900">{Math.round(statsKinerja.max).toLocaleString("id-ID")}</div>
              </div>
            </div>

            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={dataKinerja} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nama" tick={{ fontSize: 11 }} stroke="#9ca3af" angle={-30} textAnchor="end" interval={0} height={70} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => Math.round(v).toLocaleString("id-ID")} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: any, name: any) => {
                      if (name === "rataProduktivitas") {
                        return [`${Math.round(Number(value)).toLocaleString("id-ID")} Kg/Ha`, "Rata-rata Produktivitas"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label: any, payload: any) => {
                      const d = payload?.[0]?.payload;
                      if (d) return `${d.nama} — ${d.jmlPanen}x panen (${Number(d.totalHasilKg).toLocaleString("id-ID")} Kg)`;
                      return label;
                    }}
                  />
                  <Bar dataKey="rataProduktivitas" radius={[8, 8, 0, 0]}>
                    {dataKinerja.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getWarnaPenggarap(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-[11px] font-medium text-gray-500 uppercase mb-2">Keterangan Warna</div>
              <div className="flex flex-wrap gap-2">
                {dataKinerja.map((d: any, i: number) => (
                  <div
                    key={d.penggarapId || i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: getWarnaPenggarap(i) + "20",
                      border: `1px solid ${getWarnaPenggarap(i)}`,
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getWarnaPenggarap(i) }} />
                    <span className="text-gray-800 font-medium">{d.nama}</span>
                    <span className="text-gray-500 text-[10px]">
                      ({Math.round(Number(d.rataProduktivitas)).toLocaleString("id-ID")})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* GRAFIK 4: DETAIL PER PENGGARAP */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              📊 Detail Produksi & Produktivitas Penggarap
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cabai per musim. Mode "Semua Komoditas" = multiple garis
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={penggarapDetail}
              onChange={(e) => {
                setPenggarapDetail(e.target.value);
                setKomoditasDetail("");
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {penggaraps.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
            <select
              value={komoditasDetail}
              onChange={(e) => setKomoditasDetail(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Komoditas</option>
              {komoditasPenggarapDetail.map((k) => (
                <option key={k} value={k}>{KOMODITAS_LABEL[k] || k}</option>
              ))}
            </select>
          </div>
        </div>

        {modeMulti ? (
          komoditasMultiList.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic text-sm">
              Belum ada data untuk penggarap ini
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chart Produksi — Multi Line */}
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">
                  📈 Produksi (Kg) — per Komoditas
                </div>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        scale="time"
                        tick={{ fontSize: 11 }}
                        stroke="#9ca3af"
                        tickFormatter={(ts) =>
                          new Date(ts).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })
                        }
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#9ca3af"
                        tickFormatter={(v) => v.toLocaleString("id-ID")}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        labelFormatter={(ts) =>
                          new Date(Number(ts)).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        }
                        formatter={(value: any, name: any) => [
                          `${Number(value).toLocaleString("id-ID")} Kg`,
                          KOMODITAS_LABEL[name] || name,
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value: any) => KOMODITAS_LABEL[value] || value}
                      />
                      {komoditasMultiList.map((kom) => (
                        <Line
                          key={kom}
                          data={dataMultiProduksi.filter((d) => d.komoditas === kom)}
                          type="monotone"
                          dataKey="nilai"
                          name={kom}
                          stroke={KOMODITAS_COLOR[kom] || "#666"}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: KOMODITAS_COLOR[kom] || "#666" }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart Produktivitas — Multi Line */}
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">
                  ⚡ Produktivitas (Kg/Ha) — per Komoditas
                </div>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        scale="time"
                        tick={{ fontSize: 11 }}
                        stroke="#9ca3af"
                        tickFormatter={(ts) =>
                          new Date(ts).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })
                        }
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#9ca3af"
                        tickFormatter={(v) => v.toLocaleString("id-ID")}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        labelFormatter={(ts) =>
                          new Date(Number(ts)).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        }
                        formatter={(value: any, name: any) => [
                          `${Number(value).toLocaleString("id-ID")} Kg/Ha`,
                          KOMODITAS_LABEL[name] || name,
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value: any) => KOMODITAS_LABEL[value] || value}
                      />
                      {komoditasMultiList.map((kom) => (
                        <Line
                          key={kom}
                          data={dataMultiProduktivitas.filter((d) => d.komoditas === kom)}
                          type="monotone"
                          dataKey="nilai"
                          name={kom}
                          stroke={KOMODITAS_COLOR[kom] || "#666"}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: KOMODITAS_COLOR[kom] || "#666" }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            {komoditasDetail === "cabai_rawit" && (
              <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-800">
                🌶️ <strong>Mode cabai:</strong> Data di-aggregate per <strong>musim tanam</strong> — titik di tanggal akhir musim.
              </div>
            )}

            {dataDetail.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic text-sm">
                Belum ada data untuk filter ini
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-medium text-gray-800 mb-2">
                    📈 Produksi (Kg)
                    {komoditasDetail === "cabai_rawit" && (
                      <span className="text-xs text-orange-600 ml-2">— per musim</span>
                    )}
                  </div>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <LineChart data={dataDetail} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="tanggalLabel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.toLocaleString("id-ID")} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString("id-ID")} Kg`, "Produksi"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="produksi"
                          stroke={KOMODITAS_COLOR[komoditasDetail] || "#27ae60"}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-800 mb-2">
                    ⚡ Produktivitas (Kg/Ha)
                    {komoditasDetail === "cabai_rawit" && (
                      <span className="text-xs text-orange-600 ml-2">— per musim</span>
                    )}
                  </div>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <LineChart data={dataDetail} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="tanggalLabel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.toLocaleString("id-ID")} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          formatter={(value: any) => [`${Number(value).toLocaleString("id-ID")} Kg/Ha`, "Produktivitas"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="produktivitas"
                          stroke={KOMODITAS_COLOR[komoditasDetail] || "#f39c12"}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
