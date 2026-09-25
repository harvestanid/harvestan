import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatKg(n: number) {
  return Math.round(n).toLocaleString("id-ID") + " Kg";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: penggaraps } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("user_id", user.id);

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", user.id);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("user_id", user.id)
    .order("tanggal", { ascending: false });

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id);

  const totalPenggarap = penggaraps?.length || 0;
  const totalLahan = lands?.length || 0;
  const totalLuas = (lands || []).reduce((s, l) => s + Number(l.luas), 0);
  const totalPanen = harvests?.length || 0;
  const totalHasilKg = (harvests || []).reduce(
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

  const hutangAktif = (debts || []).filter((d) => Number(d.sisa) > 0);
  const totalHutangAktif = hutangAktif.reduce((s, d) => s + Number(d.sisa), 0);

  const profitByPenggarap = new Map<string, { nama: string; profit: number }>();
  (harvests || []).forEach((h) => {
    const land = lands?.find((l) => l.id === h.land_id);
    if (!land) return;
    const p = penggaraps?.find((pg) => pg.id === land.penggarap_id);
    if (!p) return;
    const existing = profitByPenggarap.get(p.id) || {
      nama: p.nama,
      profit: 0,
    };
    existing.profit += Number(h.profit_owner || 0);
    profitByPenggarap.set(p.id, existing);
  });
  const topPenggarap = Array.from(profitByPenggarap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const now = new Date();
  const bulanLabels: string[] = [];
  const bulanData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
    bulanLabels.push(label);
    const total = (harvests || [])
      .filter((h) => {
        const hd = new Date(h.tanggal);
        return (
          hd.getFullYear() === d.getFullYear() &&
          hd.getMonth() === d.getMonth()
        );
      })
      .reduce((s, h) => s + Number(h.hasil_kg), 0);
    bulanData.push(total);
  }
  const maxBulan = Math.max(...bulanData, 1);

  type Aktivitas = {
    tipe: "panen" | "hutang";
    tanggal: string;
    deskripsi: string;
    nilai: number;
    penggarap: string;
  };
  const aktivitas: Aktivitas[] = [];

  (harvests || []).slice(0, 5).forEach((h) => {
    const land = lands?.find((l) => l.id === h.land_id);
    const p = penggaraps?.find((pg) => pg.id === land?.penggarap_id);
    aktivitas.push({
      tipe: "panen",
      tanggal: h.tanggal,
      deskripsi: `${KOMODITAS_LABEL[h.komoditas] || h.komoditas} ${formatKg(
        Number(h.hasil_kg)
      )}`,
      nilai: Number(h.hasil_kg),
      penggarap: p?.nama || "?",
    });
  });

  [...(debts || [])]
    .sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    )
    .slice(0, 5)
    .forEach((d) => {
      const p = penggaraps?.find((pg) => pg.id === d.penggarap_id);
      aktivitas.push({
        tipe: "hutang",
        tanggal: d.tanggal,
        deskripsi: d.keperluan || "Hutang baru",
        nilai: Number(d.jumlah),
        penggarap: p?.nama || "?",
      });
    });

  aktivitas.sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );
  const aktivitasTerbaru = aktivitas.slice(0, 5);

  const nama =
    user.user_metadata?.nama || user.email?.split("@")[0] || "Petani";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat datang, {nama}! 👋
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Ringkasan kebun & keuangan Anda
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">👨‍🌾</div>
          <div className="text-xs text-gray-500 font-medium">PENGGARAP</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalPenggarap}
          </div>
          <div className="text-xs text-gray-500">Orang</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">🗺️</div>
          <div className="text-xs text-gray-500 font-medium">LAHAN</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalLahan}
          </div>
          <div className="text-xs text-gray-500">
            {totalLuas.toFixed(2)} Ha total
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">🌾</div>
          <div className="text-xs text-gray-500 font-medium">PANEN</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {totalPanen}
          </div>
          <div className="text-xs text-gray-500">{formatKg(totalHasilKg)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs text-gray-500 font-medium">HUTANG AKTIF</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {hutangAktif.length}
          </div>
          <div className="text-xs text-gray-500">
            {formatRp(totalHutangAktif)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          💵 Profit Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-xs text-green-700 font-medium">
              👤 PROFIT OWNER
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {formatRp(totalProfitOwner)}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-xs text-orange-700 font-medium">
              👨‍🌾 PROFIT PENGGARAP
            </div>
            <div className="text-2xl font-bold text-orange-900 mt-1">
              {formatRp(totalProfitPenggarap)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          🏆 Top 5 Penggarap (by Profit Owner)
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{medal}</span>
                    <span className="font-medium text-gray-900">{p.nama}</span>
                  </div>
                  <span className="font-bold text-green-700">
                    {formatRp(p.profit)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📈 Produksi 6 Bulan Terakhir
        </h2>
        {totalHasilKg === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Belum ada data panen
          </p>
        ) : (
          <div className="space-y-3">
            {bulanLabels.map((label, i) => {
              const val = bulanData[i];
              const pct = (val / maxBulan) * 100;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium">{label}</span>
                    <span className="font-bold text-green-700">
                      {formatKg(val)}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📋 Aktivitas Terbaru
        </h2>
        {aktivitasTerbaru.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Belum ada aktivitas
          </p>
        ) : (
          <div className="space-y-2">
            {aktivitasTerbaru.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-xl">
                  {a.tipe === "panen" ? "🌾" : "💰"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {a.deskripsi}
                  </div>
                  <div className="text-xs text-gray-500">
                    {a.penggarap} &middot;{" "}
                    {new Date(a.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${
                    a.tipe === "panen" ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {a.tipe === "panen" ? formatKg(a.nilai) : formatRp(a.nilai)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
