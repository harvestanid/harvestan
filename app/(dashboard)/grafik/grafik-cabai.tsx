"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type HarvestRaw = {
  id: string;
  land_id: string;
  tanggal: string;
  komoditas: string | null;
  hasil_kg: number | string;
};

type LandRaw = {
  id: string;
  penggarap_id: string;
  nama: string;
  luas: number | string;
};

type MusimData = {
  musim: string;
  totalHasil: number;
  totalLuasUnik: number;
  jmlPanen: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  produktivitas: number;
};

type Props = {
  harvests: HarvestRaw[];
  lands: LandRaw[];
  mode: "produksi" | "produktivitas";
};

// ===== HELPER: Hitung breakdown per musim cabai =====
function hitungBreakdownMusim(
  harvests: HarvestRaw[],
  lands: LandRaw[]
): MusimData[] {
  const cabaiHarvests = harvests.filter(
    (h) => (h.komoditas || "padi") === "cabai_rawit"
  );

  const musimMap = new Map<
    string,
    {
      panenList: HarvestRaw[];
      luasSet: Set<number>;
    }
  >();

  cabaiHarvests.forEach((h) => {
    const musimNama = (h as any).musim || "Tanpa Musim";
    const land = lands.find((l) => l.id === h.land_id);
    const luas = land ? Number(land.luas) : 0;

    if (!musimMap.has(musimNama)) {
      musimMap.set(musimNama, { panenList: [], luasSet: new Set() });
    }
    const entry = musimMap.get(musimNama)!;
    entry.panenList.push(h);
    if (luas > 0) entry.luasSet.add(luas);
  });

  const result: MusimData[] = [];

  musimMap.forEach((data, musim) => {
    const sorted = [...data.panenList].sort(
      (a, b) =>
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    const totalHasil = data.panenList.reduce(
      (s, h) => s + Number(h.hasil_kg),
      0
    );

    // Asumsi 1 lahan = 1 luas, ambil max luas (kalau ada overlap)
    const totalLuasUnik = Math.max(...Array.from(data.luasSet), 0);

    result.push({
      musim,
      totalHasil,
      totalLuasUnik,
      jmlPanen: data.panenList.length,
      tanggalMulai: sorted[0]?.tanggal || "",
      tanggalSelesai: sorted[sorted.length - 1]?.tanggal || "",
      produktivitas:
        totalLuasUnik > 0 ? totalHasil / totalLuasUnik : 0,
    });
  });

  return result.sort(
    (a, b) =>
      new Date(a.tanggalMulai).getTime() -
      new Date(b.tanggalMulai).getTime()
  );
}

function formatTanggal(t: string) {
  if (!t) return "-";
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function GrafikCabai({ harvests, lands, mode }: Props) {
  const breakdown = hitungBreakdownMusim(harvests, lands);

  if (breakdown.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-center py-12 text-gray-400 italic text-sm">
          Belum ada data panen cabai rawit
        </div>
      </div>
    );
  }

  const chartData = breakdown.map((b) => ({
    musim: b.musim,
    totalHasil: b.totalHasil,
    produktivitas: b.produktivitas,
  }));

  const chartTitle =
    mode === "produksi"
      ? "📊 Total Hasil per Musim (Kg)"
      : "⚡ Produktivitas per Musim (Kg/Ha)";

  const dataKey = mode === "produksi" ? "totalHasil" : "produktivitas";
  const barColor = mode === "produksi" ? "#c0392b" : "#ff8c42";

  const yLabel = mode === "produksi" ? "Kg" : "Kg/Ha";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 text-base">
          🌶️ {chartTitle}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Cabai rawit dipanen bertahap — total {breakdown.length} musim
        </p>
      </div>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="musim"
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              angle={-30}
              textAnchor="end"
              interval={0}
              height={70}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              tickFormatter={(v) => v.toLocaleString("id-ID")}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              formatter={(value: any) => [
                `${Number(value).toLocaleString("id-ID")} ${yLabel}`,
                mode === "produksi" ? "Total Hasil" : "Produktivitas",
              ]}
              labelFormatter={(label: any, payload: any) => {
                const d = payload?.[0]?.payload;
                if (d) {
                  const b = breakdown.find((x) => x.musim === d.musim);
                  if (b) {
                    return `${d.musim} — ${b.jmlPanen}x panen (${formatTanggal(
                      b.tanggalMulai
                    )} - ${formatTanggal(b.tanggalSelesai)})`;
                  }
                }
                return label;
              }}
            />
            <Bar dataKey={dataKey} fill={barColor} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail per musim */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <div className="text-xs font-bold text-gray-700 mb-2">
          📋 Detail Per Musim
        </div>
        <div className="space-y-1.5">
          {breakdown.map((b) => (
            <div
              key={b.musim}
              className="flex items-center justify-between text-xs bg-orange-50 border border-orange-200 rounded-lg px-3 py-2"
            >
              <span className="font-medium text-orange-900">
                🗓️ {b.musim}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">
                  {b.jmlPanen}x panen
                </span>
                <span className="font-bold text-orange-700">
                  {b.totalHasil.toLocaleString("id-ID")} Kg
                </span>
                <span className="font-bold text-green-700">
                  {b.produktivitas.toFixed(0)} Kg/Ha
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
