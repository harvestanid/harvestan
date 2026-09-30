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
  padi: "bg-[#2c5e2e]/10 text-[#2c5e2e] border-[#2c5e2e]/30",
  jagung: "bg-[#f0b429]/15 text-[#2c5e2e] border-[#f0b429]/40",
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

function getUsername(user: any): string {
  if (!user) return "User";
  const meta = user.user_metadata || {};
  if (meta.username) return meta.username;
  if (meta.nama) return meta.nama;
  if (meta.full_name) return meta.full_name;
  if (user.email) return user.email.split("@")[0];
  return "User";
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
    .select("id, nama, kontak, alamat, is_self")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("nama");

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas, tipe_garap")
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

  // ===================================================
  // HITUNG "PROFIT SAYA" — bedasarkan tipe garap per lahan
  // ===================================================
  const profitSayaBreakdown = {
    mandiri: 0,
    bagi_hasil_owner: 0,
    bagi_hasil_penggarap: 0,
  };

  (harvests || []).forEach((h) => {
    const land = (lands || []).find((l) => l.id === h.land_id);
    if (!land) return;

    const tipeGarap = (land as any).tipe_garap || "bagi_hasil_owner";

    if (tipeGarap === "mandiri") {
      profitSayaBreakdown.mandiri += Number(h.profit_penggarap || 0);
    } else if (tipeGarap === "bagi_hasil_owner") {
      profitSayaBreakdown.bagi_hasil_owner += Number(h.profit_owner || 0);
    } else if (tipeGarap === "bagi_hasil_penggarap") {
      profitSayaBreakdown.bagi_hasil_penggarap += Number(
        h.profit_penggarap || 0
      );
    }
  });

  const totalProfitSaya =
    profitSayaBreakdown.mandiri +
    profitSayaBreakdown.bagi_hasil_owner +
    profitSayaBreakdown.bagi_hasil_penggarap;

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
      tipeGarap: (land as any)?.tipe_garap || "bagi_hasil_owner",
    };
  });

  const username = getUsername(user);
  const adaProfitSaya = totalProfitSaya > 0;

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-[#2c5e2e]/8 p-6 md:p-8 shadow-lg shadow-[#2c5e2e]/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#f0b429]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#2c5e2e] font-bold mb-3 px-3 py-1.5 bg-[#f0b429]/15 rounded-full">
            Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#2c5e2e] tracking-tighter">
            Selamat datang, {username}! 👋
          </h1>
          <p className="text-[#2c5e2e]/60 text-sm mt-2">
            Ringkasan kebun & keuangan Anda
          </p>
        </div>
      </div>

      {/* ===== CARD PROFIT SAYA (HANYA kalau ada) ===== */}
      {adaProfitSaya && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f0b429] via-orange-400 to-[#f0b429] rounded-3xl p-6 md:p-8 shadow-2xl shadow-[#f0b429]/30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2c5e2e]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-2xl">💎</span>
              <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-[0.25em]">
                Profit Saya (Total)
              </div>
            </div>

            <div className="text-3xl md:text-4xl font-bold text-[#2c5e2e] tracking-tighter mb-1">
              {formatRingkas(totalProfitSaya)}
            </div>
            <div className="text-xs text-[#2c5e2e]/70 font-semibold mb-4 break-all">
              {formatRp(totalProfitSaya)}
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4 pt-4 border-t border-[#2c5e2e]/20">
              <div className="bg-white/30 backdrop-blur rounded-2xl p-3 text-center min-w-0">
                <div className="text-[9px] text-[#2c5e2e] font-bold uppercase tracking-widest mb-1 leading-tight">
                  🌱 Mandiri
                </div>
                <div className="font-bold text-[#2c5e2e] text-xs md:text-sm tracking-tight break-words leading-tight">
                  {formatRingkas(profitSayaBreakdown.mandiri)}
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur rounded-2xl p-3 text-center min-w-0">
                <div className="text-[9px] text-[#2c5e2e] font-bold uppercase tracking-widest mb-1 leading-tight">
                  👤 Sbg Owner
                </div>
                <div className="font-bold text-[#2c5e2e] text-xs md:text-sm tracking-tight break-words leading-tight">
                  {formatRingkas(profitSayaBreakdown.bagi_hasil_owner)}
                </div>
              </div>
              <div className="bg-white/30 backdrop-blur rounded-2xl p-3 text-center min-w-0">
                <div className="text-[9px] text-[#2c5e2e] font-bold uppercase tracking-widest mb-1 leading-tight">
                  👨‍🌾 Sbg Penggarap
                </div>
                <div className="font-bold text-[#2c5e2e] text-xs md:text-sm tracking-tight break-words leading-tight">
                  {formatRingkas(profitSayaBreakdown.bagi_hasil_penggarap)}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#2c5e2e]/70 mt-3 italic leading-relaxed">
              💡 Profit yang <strong>kamu terima</strong> dari semua lahan —
              baik lahan sendiri, sebagai owner, maupun sebagai penggarap.
            </p>
          </div>
        </div>
      )}

      {/* ===== STATISTIK ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: "👨‍🌾",
            label: "Penggarap",
            value: totalPenggarap,
            sub: "orang",
            color: "from-[#2c5e2e]/10 to-[#4a8f3f]/5",
            border: "border-[#2c5e2e]/15",
            textColor: "text-[#2c5e2e]",
          },
          {
            icon: "🗺️",
            label: "Lahan",
            value: totalLahan,
            sub: `${totalLuas.toFixed(2)} Ha total`,
            color: "from-blue-50 to-blue-50/30",
            border: "border-blue-200/50",
            textColor: "text-blue-900",
          },
          {
            icon: "🌾",
            label: "Panen",
            value: totalPanen,
            sub: `${totalHasil.toLocaleString("id-ID")} Kg`,
            color: "from-[#f0b429]/15 to-[#f0b429]/5",
            border: "border-[#f0b429]/30",
            textColor: "text-[#2c5e2e]",
          },
          {
            icon: "💰",
            label: "Hutang Aktif",
            value: formatRingkas(totalHutang),
            sub: formatRp(totalHutang),
            color:
              totalHutang > 0
                ? "from-red-50 to-red-50/30"
                : "from-gray-50 to-gray-50/30",
            border:
              totalHutang > 0 ? "border-red-200/50" : "border-gray-200/50",
            textColor: totalHutang > 0 ? "text-red-700" : "text-gray-800",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-3xl p-4 md:p-5 transition-all hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="text-2xl md:text-3xl mb-2">{s.icon}</div>
            <div className="text-[10px] font-bold text-[#2c5e2e]/60 uppercase tracking-widest mb-1">
              {s.label}
            </div>
            <div
              className={`text-xl md:text-2xl font-bold ${s.textColor} tracking-tight`}
            >
              {s.value}
            </div>
            <div className="text-[10px] text-[#2c5e2e]/50 mt-1 font-medium">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ===== PROFIT SUMMARY (global) ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2c5e2e] via-[#1f4521] to-[#2c5e2e] rounded-3xl p-6 md:p-8 shadow-2xl shadow-[#2c5e2e]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f0b429]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4a8f3f]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="text-[10px] font-bold text-[#f0b429] uppercase tracking-[0.25em] mb-4">
            💵 Profit Summary (Semua Pihak)
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="text-[10px] text-[#f0b429] font-bold uppercase tracking-widest mb-1">
                👤 Semua Owner
              </div>
              <div className="text-lg md:text-2xl font-bold text-white tracking-tight">
                {formatRingkas(totalProfitOwner)}
              </div>
              <div className="text-[10px] text-white/60 mt-1 break-all">
                {formatRp(totalProfitOwner)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="text-[10px] text-[#f0b429] font-bold uppercase tracking-widest mb-1">
                👨‍🌾 Semua Penggarap
              </div>
              <div className="text-lg md:text-2xl font-bold text-white tracking-tight">
                {formatRingkas(totalProfitPenggarap)}
              </div>
              <div className="text-[10px] text-white/60 mt-1 break-all">
                {formatRp(totalProfitPenggarap)}
              </div>
            </div>
          </div>

          {(totalBawaPenggarap > 0 || totalBawaOwner > 0) && (
            <div className="mt-4 pt-4 border-t border-white/15 text-xs text-white/80">
              <div className="font-bold mb-2 text-[#f0b429] uppercase tracking-widest text-[10px]">
                🏠 Gabah Dibawa Pulang
              </div>
              {totalBawaPenggarap > 0 && (
                <div className="flex justify-between">
                  <span>Penggarap</span>
                  <span className="font-bold text-white">
                    {totalBawaPenggarap.toLocaleString("id-ID")} Kg
                  </span>
                </div>
              )}
              {totalBawaOwner > 0 && (
                <div className="flex justify-between mt-1">
                  <span>Owner</span>
                  <span className="font-bold text-white">
                    {totalBawaOwner.toLocaleString("id-ID")} Kg
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== KOMPOSISI KOMODITAS ===== */}
      {komoditasList.length > 0 && (
        <div className="bg-white border border-[#2c5e2e]/8 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">🏷️</span>
            <span className="font-bold text-[#2c5e2e] tracking-tight">
              Komposisi Komoditas
            </span>
          </div>
          <div className="space-y-4">
            {komoditasList.map((k) => {
              const percent =
                totalHasil > 0 ? (k.hasil / totalHasil) * 100 : 0;
              const barColor =
                k.komoditas === "padi"
                  ? "bg-[#2c5e2e]"
                  : k.komoditas === "jagung"
                  ? "bg-[#f0b429]"
                  : k.komoditas === "kacang_tanah"
                  ? "bg-purple-500"
                  : k.komoditas === "bawang_merah"
                  ? "bg-red-500"
                  : "bg-orange-500";
              return (
                <div key={k.komoditas}>
                  <div className="flex justify-between text-xs mb-1.5 flex-wrap gap-2">
                    <span className="font-bold text-[#2c5e2e]">
                      {KOMODITAS_LABEL[k.komoditas] || k.komoditas}
                    </span>
                    <span className="text-[#2c5e2e]/60">
                      {k.hasil.toLocaleString("id-ID")} Kg ({k.jml} panen) ·{" "}
                      <span className="font-bold text-[#2c5e2e]">
                        {percent.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#f0b429]/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
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
        <div className="bg-white border border-[#2c5e2e]/8 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="font-bold text-[#2c5e2e] tracking-tight">
                Top 5 Penggarap
              </span>
            </div>
            <Link
              href="/penggarap"
              className="text-xs text-[#2c5e2e] hover:text-[#f0b429] font-bold transition-colors"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            {top5.map((p, idx) => (
              <Link
                key={p.id}
                href={`/penggarap/${p.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-[#faf9f5] hover:bg-[#f0b429]/10 rounded-2xl transition-all border border-[#2c5e2e]/8 hover:border-[#f0b429]/40 group"
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
                    <div className="font-bold text-[#2c5e2e] text-sm truncate">
                      {p.nama}
                    </div>
                    <div className="text-[10px] text-[#2c5e2e]/60">
                      {p.jmlPanen}x panen ·{" "}
                      {p.totalHasil.toLocaleString("id-ID")} Kg
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-[#2c5e2e] text-sm group-hover:text-[#f0b429] transition-colors">
                    {formatRingkas(p.totalProfit)}
                  </div>
                  <div className="text-[10px] text-[#2c5e2e]/50">
                    Total Profit
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== PANEN TERBARU ===== */}
      {panenTerbaru.length > 0 && (
        <div className="bg-white border border-[#2c5e2e]/8 rounded-3xl p-5 md:p-6 shadow-lg shadow-[#2c5e2e]/5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="font-bold text-[#2c5e2e] tracking-tight">
                Panen Terbaru
              </span>
            </div>
            <Link
              href="/keuangan"
              className="text-xs text-[#2c5e2e] hover:text-[#f0b429] font-bold transition-colors"
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
              const isMandiri = h.tipeGarap === "mandiri";

              return (
                <div
                  key={h.id}
                  className="p-4 bg-[#faf9f5] rounded-2xl border border-[#2c5e2e]/8 space-y-3 hover:border-[#f0b429]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${colorClass} uppercase tracking-widest`}
                      >
                        {KOMODITAS_LABEL[kom] || kom}
                      </span>
                      {isMandiri && (
                        <span className="text-[9px] bg-[#2c5e2e]/10 border border-[#2c5e2e]/30 text-[#2c5e2e] rounded-full px-2 py-0.5 font-bold uppercase tracking-widest">
                          🌱 Mandiri
                        </span>
                      )}
                      <div className="text-xs text-[#2c5e2e] min-w-0">
                        <div className="font-bold truncate">
                          {h.namaPenggarap}
                        </div>
                        <div className="text-[10px] text-[#2c5e2e]/60 flex flex-wrap gap-x-2">
                          <span>🗺️ {h.namaLahan}</span>
                          {h.luasLahan > 0 && (
                            <span>📏 {h.luasLahan.toFixed(2)} Ha</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-[#2c5e2e] text-base tracking-tight">
                        {Number(h.hasil_kg).toLocaleString("id-ID")} Kg
                      </div>
                      <div className="text-[10px] text-[#2c5e2e]/60">
                        {new Date(h.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {isMandiri ? (
                    <div className="pt-3 border-t border-[#2c5e2e]/10">
                      <div className="bg-[#2c5e2e]/5 border border-[#2c5e2e]/20 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] text-[#2c5e2e] font-bold uppercase tracking-widest">
                          🌱 Profit Penggarap (100%)
                        </div>
                        <div className="font-bold text-[#2c5e2e] text-sm mt-1 break-words">
                          {formatRp(Number(h.profit_penggarap || 0))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#2c5e2e]/10">
                      <div className="bg-[#2c5e2e]/5 border border-[#2c5e2e]/15 rounded-xl p-2.5 text-center min-w-0">
                        <div className="text-[10px] text-[#2c5e2e] font-bold uppercase tracking-widest">
                          👤 Owner ({persenOwner}%)
                        </div>
                        <div className="font-bold text-[#2c5e2e] text-xs mt-1 break-words leading-tight">
                          {formatRp(Number(h.profit_owner || 0))}
                        </div>
                      </div>
                      <div className="bg-[#f0b429]/10 border border-[#f0b429]/30 rounded-xl p-2.5 text-center min-w-0">
                        <div className="text-[10px] text-[#2c5e2e] font-bold uppercase tracking-widest">
                          👨‍🌾 Penggarap ({persenPenggarap}%)
                        </div>
                        <div className="font-bold text-[#2c5e2e] text-xs mt-1 break-words leading-tight">
                          {formatRp(Number(h.profit_penggarap || 0))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            href: "/penggarap/baru",
            icon: "➕",
            label: "Tambah Penggarap",
            bg: "bg-[#2c5e2e]",
            hover: "hover:bg-[#1f4521]",
          },
          {
            href: "/panen-multi",
            icon: "🌾",
            label: "Input Panen",
            bg: "bg-[#f0b429]",
            hover: "hover:bg-[#e6a617]",
            text: "text-[#2c5e2e]",
          },
          {
            href: "/keuangan",
            icon: "💰",
            label: "Keuangan",
            bg: "bg-blue-600",
            hover: "hover:bg-blue-700",
          },
          {
            href: "/grafik",
            icon: "📊",
            label: "Grafik",
            bg: "bg-purple-600",
            hover: "hover:bg-purple-700",
          },
        ].map((a, i) => (
          <Link
            key={i}
            href={a.href}
            className={`${a.bg} ${a.hover} ${
              a.text || "text-white"
            } rounded-3xl p-5 text-center transition-all shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1`}
          >
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="text-xs font-bold">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
