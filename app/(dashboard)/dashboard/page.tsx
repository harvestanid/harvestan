import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDataFilter } from "@/lib/demo/demo-mode";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

const KOMODITAS_COLOR: Record<string, string> = {
  padi: "bg-green-100 text-green-800 border-green-300",
  jagung: "bg-yellow-100 text-yellow-800 border-yellow-300",
  kacang_tanah: "bg-purple-100 text-purple-800 border-purple-300",
  bawang_merah: "bg-red-100 text-red-800 border-red-300",
  cabai_rawit: "bg-orange-100 text-orange-800 border-orange-300",
  cabai: "bg-orange-100 text-orange-800 border-orange-300",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatRingkas(n: number): string {
  if (n >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1) + " M";
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + " jt";
  if (n >= 1_000) return "Rp " + (n / 1_000).toFixed(0) + " rb";
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: penggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama, kontak, alamat")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("nama");

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  // ===== HITUNG STATISTIK =====
  const totalPenggarap = penggaraps?.length || 0;
  const totalLahan = lands?.length || 0;
  const totalLuas = (lands || []).reduce((s, l) => s + Number(l.luas), 0);
  const totalPanen = harvests?.length || 0;
  const totalHasil = (harvests || []).reduce(
    (s, h) => s + Number(h.hasil_kg),
    0
  );
  const totalProfitOwner = (harvests || []).reduce(
    (s, h) => s + Number(h.profit_owner || 0),
    0
  );
  const totalProfitPenggarap = (harvests || []).reduce(
    (s, h) => s + Number(h.profit_penggarap || 0),
    0
  );
  const totalHutang = (debts || []).reduce((s, d) => {
    const sisa = d.sisa !== undefined ? Number(d.sisa) : Number(d.jumlah);
    return s + (sisa > 0 ? sisa : 0);
  }, 0);

  const totalBawaPenggarap = (harvests || []).reduce(
    (s, h) => s + Number(h.bawa_penggarap || 0),
    0
  );
  const totalBawaOwner = (harvests || []).reduce(
    (s, h) => s + Number(h.bawa_owner || 0),
    0
  );

  // ===== TOP 5 PENGGARAP =====
  type StatPenggarap = {
    id: string;
    nama: string;
    totalHasil: number;
    totalProfit: number;
    jmlPanen: number;
  };

  const statsPenggarap: StatPenggarap[] = [];

  (penggaraps || []).forEach((p) => {
    const penggarapLands = (lands || []).filter(
      (l) => l.penggarap_id === p.id
    );
    const landIds = penggarapLands.map((l) => l.id);
    const penggarapHarvests = (harvests || []).filter((h) =>
      landIds.includes(h.land_id)
    );

    const totalHasilP = penggarapHarvests.reduce(
      (s, h) => s + Number(h.hasil_kg),
      0
    );
    const totalProfitP = penggarapHarvests.reduce(
      (s, h) =>
        s + Number(h.profit_owner || 0) + Number(h.profit_penggarap || 0),
      0
    );

    statsPenggarap.push({
      id: p.id,
      nama: p.nama,
      totalHasil: totalHasilP,
      totalProfit: totalProfitP,
      jmlPanen: penggarapHarvests.length,
    });
  });

  statsPenggarap.sort((a, b) => b.totalProfit - a.totalProfit);
  const top5 = statsPenggarap.slice(0, 5);

  // ===== KOMPOSISI KOMODITAS =====
  const komoditasData: Record<string, { hasil: number; jml: number }> = {};
  (harvests || []).forEach((h) => {
    const kom = h.komoditas || "padi";
    if (!komoditasData[kom]) komoditasData[kom] = { hasil: 0, jml: 0 };
    komoditasData[kom].hasil += Number(h.hasil_kg);
    komoditasData[kom].jml += 1;
  });

  const komoditasList = Object.entries(komoditasData)
    .map(([kom, val]) => ({ komoditas: kom, ...val }))
    .sort((a, b) => b.hasil - a.hasil);

  // ===== PANEN TERBARU =====
  const panenTerbaru = (harvests || []).slice(0, 5).map((h) => {
    const land = (lands || []).find((l) => l.id === h.land_id);
    const penggarap = (penggaraps || []).find(
      (p) => p.id === land?.penggarap_id
    );
    return {
      ...h,
      namaLahan: land?.nama || "?",
      luasLahan: Number(land?.luas || 0),
      namaPenggarap: penggarap?.nama || "?",
    };
  });

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat datang, {user.email?.split("@")[0]}! 👋
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Ringkasan kebun & keuangan Anda
        </p>
      </div>

      {/* ===== STATISTIK UTAMA ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">👨‍🌾</div>
          <div className="text-[10px] text-gray-500 font-medium uppercase">
            Penggarap
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalPenggarap}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">orang</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">🗺️</div>
          <div className="text-[10px] text-gray-500 font-medium uppercase">
            Lahan
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalLahan}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {totalLuas.toFixed(2)} Ha total
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">🌾</div>
          <div className="text-[10px] text-gray-500 font-medium uppercase">
            Panen
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalPanen}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {totalHasil.toLocaleString("id-ID")} Kg
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-[10px] text-gray-500 font-medium uppercase">
            Hutang Aktif
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              totalHutang > 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatRingkas(totalHutang)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {formatRp(totalHutang)}
          </div>
        </div>
      </div>

      {/* ===== PROFIT SUMMARY ===== */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-5 mb-6">
        <div className="text-xs font-bold text-green-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          💵 Profit Summary
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border-2 border-green-300">
            <div className="text-[10px] text-green-700 font-bold uppercase mb-1">
              👤 Owner
            </div>
            <div className="text-xl font-bold text-green-800">
              {formatRingkas(totalProfitOwner)}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              {formatRp(totalProfitOwner)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-orange-300">
            <div className="text-[10px] text-orange-700 font-bold uppercase mb-1">
              👨‍🌾 Penggarap
            </div>
            <div className="text-xl font-bold text-orange-800">
              {formatRingkas(totalProfitPenggarap)}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              {formatRp(totalProfitPenggarap)}
            </div>
          </div>
        </div>

        {(totalBawaPenggarap > 0 || totalBawaOwner > 0) && (
          <div className="mt-4 pt-4 border-t border-green-200 text-xs text-green-800">
            <div className="font-bold mb-1">🏠 Gabah Dibawa Pulang:</div>
            {totalBawaPenggarap > 0 && (
              <div className="flex justify-between">
                <span>Penggarap</span>
                <span className="font-bold">
                  {totalBawaPenggarap.toLocaleString("id-ID")} Kg
                </span>
              </div>
            )}
            {totalBawaOwner > 0 && (
              <div className="flex justify-between">
                <span>Owner</span>
                <span className="font-bold">
                  {totalBawaOwner.toLocaleString("id-ID")} Kg
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== KOMPOSISI KOMODITAS ===== */}
      {komoditasList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="font-bold text-gray-900 mb-4">
            🏷️ Komposisi Komoditas
          </div>
          <div className="space-y-3">
            {komoditasList.map((k) => {
              const percent =
                totalHasil > 0 ? (k.hasil / totalHasil) * 100 : 0;
              return (
                <div key={k.komoditas}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">
                      {KOMODITAS_LABEL[k.komoditas] || k.komoditas}
                    </span>
                    <span className="text-gray-600">
                      {k.hasil.toLocaleString("id-ID")} Kg ({k.jml} panen) ·{" "}
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        k.komoditas === "padi"
                          ? "bg-green-500"
                          : k.komoditas === "jagung"
                          ? "bg-yellow-500"
                          : k.komoditas === "kacang_tanah"
                          ? "bg-purple-500"
                          : k.komoditas === "bawang_merah"
                          ? "bg-red-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TOP 5 PENGGARAP ===== */}
      {top5.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="font-bold text-gray-900 mb-4 flex items-center justify-between flex-wrap gap-2">
            <span>🏆 Top 5 Penggarap</span>
            <Link
              href="/penggarap"
              className="text-xs text-green-700 hover:text-green-800 font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            {top5.map((p, idx) => (
              <Link
                key={p.id}
                href={`/penggarap/${p.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition border border-gray-100"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-2xl flex-shrink-0">
                    {idx === 0
                      ? "🥇"
                      : idx === 1
                      ? "🥈"
                      : idx === 2
                      ? "🥉"
                      : `${idx + 1}.`}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">
                      {p.nama}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {p.jmlPanen}x panen ·{" "}
                      {p.totalHasil.toLocaleString("id-ID")} Kg
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-green-700 text-sm">
                    {formatRingkas(p.totalProfit)}
                  </div>
                  <div className="text-[10px] text-gray-500">Total Profit</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== PANEN TERBARU (#1 — updated) ===== */}
      {panenTerbaru.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="font-bold text-gray-900 mb-4 flex items-center justify-between flex-wrap gap-2">
            <span>📅 Panen Terbaru</span>
            <Link
              href="/keuangan"
              className="text-xs text-green-700 hover:text-green-800 font-medium"
            >
              Lihat Keuangan →
            </Link>
          </div>
          <div className="space-y-3">
            {panenTerbaru.map((h) => {
              const kom = h.komoditas || "padi";
              const colorClass =
                KOMODITAS_COLOR[kom] ||
                "bg-gray-100 text-gray-800 border-gray-300";
              const persenOwner = Number(h.persen_owner || 50);
              const persenPenggarap = Number(h.persen_penggarap || 50);

              return (
                <div
                  key={h.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2"
                >
                  {/* Header: komoditas + hasil */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${colorClass}`}
                      >
                        {KOMODITAS_LABEL[kom] || kom}
                      </span>
                      <div className="text-xs text-gray-700 min-w-0">
                        <div className="font-medium truncate">
                          {h.namaPenggarap}
                        </div>
                        <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-2">
                          <span>🗺️ {h.namaLahan}</span>
                          {h.luasLahan > 0 && (
                            <span>📏 {h.luasLahan.toFixed(2)} Ha</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900 text-base">
                        {Number(h.hasil_kg).toLocaleString("id-ID")} Kg
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {new Date(h.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Rincian bagi profit */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center min-w-0">
                      <div className="text-[10px] text-green-800 font-medium">
                        👤 Owner ({persenOwner}%)
                      </div>
                      <div className="font-bold text-green-900 text-xs mt-0.5 break-words leading-tight">
                        {formatRp(Number(h.profit_owner || 0))}
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center min-w-0">
                      <div className="text-[10px] text-orange-800 font-medium">
                        👨‍🌾 Penggarap ({persenPenggarap}%)
                      </div>
                      <div className="font-bold text-orange-900 text-xs mt-0.5 break-words leading-tight">
                        {formatRp(Number(h.profit_penggarap || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/penggarap/baru"
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-4 text-center hover:from-green-600 hover:to-green-700 transition shadow-md hover:shadow-lg"
        >
          <div className="text-3xl mb-1">+</div>
          <div className="text-xs font-bold">Tambah Penggarap</div>
        </Link>
        <Link
          href="/panen-multi"
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl p-4 text-center hover:from-yellow-600 hover:to-yellow-700 transition shadow-md hover:shadow-lg"
        >
          <div className="text-3xl mb-1">🌾</div>
          <div className="text-xs font-bold">Input Panen</div>
        </Link>
        <Link
          href="/keuangan"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg"
        >
          <div className="text-3xl mb-1">💰</div>
          <div className="text-xs font-bold">Keuangan</div>
        </Link>
        <Link
          href="/grafik"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-4 text-center hover:from-purple-600 hover:to-purple-700 transition shadow-md hover:shadow-lg"
        >
          <div className="text-3xl mb-1">📊</div>
          <div className="text-xs font-bold">Grafik</div>
        </Link>
      </div>
    </div>
  );
}
