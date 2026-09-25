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

const KOMODITAS_COLOR: Record<string, string> = {
  padi: "bg-green-500",
  jagung: "bg-yellow-500",
  kacang_tanah: "bg-purple-500",
  bawang_merah: "bg-red-500",
  cabai_rawit: "bg-red-700",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatKg(n: number) {
  return Math.round(n).toLocaleString("id-ID") + " Kg";
}

export default async function KeuanganPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil semua data
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

  // Statistik Utama
  const totalProfitOwner = (harvests || []).reduce(
    (s, h) => s + Number(h.profit_owner || 0),
    0
  );
  const totalProfitPenggarap = (harvests || []).reduce(
    (s, h) => s + Number(h.profit_penggarap || 0),
    0
  );
  const totalHasilKg = (harvests || []).reduce(
    (s, h) => s + Number(h.hasil_kg),
    0
  );
  const totalPotonganHutang = (harvests || []).reduce(
    (s, h) => s + Number(h.potongan_hutang || 0),
    0
  );

  const hutangAktif = (debts || []).filter((d) => Number(d.sisa) > 0);
  const totalHutangAktif = hutangAktif.reduce((s, d) => s + Number(d.sisa), 0);

  // Profit Bulanan (12 bulan terakhir)
  const now = new Date();
  const bulanLabels: string[] = [];
  const bulanOwner: number[] = [];
  const bulanPenggarap: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    });
    bulanLabels.push(label);

    const bulanHarvests = (harvests || []).filter((h) => {
      const hd = new Date(h.tanggal);
      return (
        hd.getFullYear() === d.getFullYear() &&
        hd.getMonth() === d.getMonth()
      );
    });

    bulanOwner.push(
      bulanHarvests.reduce((s, h) => s + Number(h.profit_owner || 0), 0)
    );
    bulanPenggarap.push(
      bulanHarvests.reduce((s, h) => s + Number(h.profit_penggarap || 0), 0)
    );
  }
  const maxBulan = Math.max(...bulanOwner, ...bulanPenggarap, 1);

  // Top 5 Penggarap by Profit Owner
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

  // Profit per Komoditas
  const profitByKomoditas = new Map<
    string,
    { hasilKg: number; profitOwner: number; profitPenggarap: number }
  >();
  (harvests || []).forEach((h) => {
    const kom = h.komoditas || "padi";
    const existing = profitByKomoditas.get(kom) || {
      hasilKg: 0,
      profitOwner: 0,
      profitPenggarap: 0,
    };
    existing.hasilKg += Number(h.hasil_kg);
    existing.profitOwner += Number(h.profit_owner || 0);
    existing.profitPenggarap += Number(h.profit_penggarap || 0);
    profitByKomoditas.set(kom, existing);
  });
  const komoditasList = Array.from(profitByKomoditas.entries())
    .map(([kom, data]) => ({ kom, ...data }))
    .sort((a, b) => b.profitOwner - a.profitOwner);

  // Profit per Lahan
  const profitByLahan = new Map<
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
  (harvests || []).forEach((h) => {
    const land = lands?.find((l) => l.id === h.land_id);
    if (!land) return;
    const p = penggaraps?.find((pg) => pg.id === land.penggarap_id);
    const key = land.id;
    const existing = profitByLahan.get(key) || {
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
    profitByLahan.set(key, existing);
  });
  const lahanList = Array.from(profitByLahan.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.profitOwner - a.profitOwner);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">💰 Keuangan & Laba</h1>
        <p className="text-gray-600 text-sm mt-1">
          Ringkasan profit, hutang, dan performa keuangan
        </p>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">👤</div>
          <div className="text-xs text-gray-500 font-medium">PROFIT OWNER</div>
          <div className="text-xl font-bold text-green-700 mt-1">
            {formatRp(totalProfitOwner)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">👨‍🌾</div>
          <div className="text-xs text-gray-500 font-medium">
            PROFIT PENGGARAP
          </div>
          <div className="text-xl font-bold text-orange-600 mt-1">
            {formatRp(totalProfitPenggarap)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs text-gray-500 font-medium">HUTANG AKTIF</div>
          <div className="text-xl font-bold text-red-600 mt-1">
            {formatRp(totalHutangAktif)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {hutangAktif.length} hutang
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl mb-1">🌾</div>
          <div className="text-xs text-gray-500 font-medium">TOTAL PANEN</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {formatKg(totalHasilKg)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {harvests?.length || 0} transaksi
          </div>
        </div>
      </div>

      {/* Info Potongan Hutang */}
      {totalPotonganHutang > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-medium text-blue-800">
              💸 Total potongan hutang dari panen:
            </div>
            <div className="font-bold text-blue-700 text-lg">
              {formatRp(totalPotonganHutang)}
            </div>
          </div>
        </div>
      )}

      {/* Chart Profit Bulanan */}
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
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-medium">{label}</span>
                      <span className="font-bold text-gray-700">
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
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                      <span>👤 Owner: {formatRp(owner)}</span>
                      <span>👨‍🌾 Penggarap: {formatRp(penggarap)}</span>
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

      {/* Top 5 Penggarap */}
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

      {/* Profit per Komoditas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          🏷️ Profit per Komoditas
        </h2>
        {komoditasList.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">
            Belum ada data panen
          </p>
        ) : (
          <div className="space-y-3">
            {komoditasList.map((k) => {
              const total = k.profitOwner + k.profitPenggarap;
              const colorClass =
                KOMODITAS_COLOR[k.kom] || "bg-gray-500";
              return (
                <div key={k.kom} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${colorClass}`}
                      />
                      <span className="font-medium text-gray-900">
                        {KOMODITAS_LABEL[k.kom] || k.kom}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {formatKg(k.hasilKg)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-100 rounded p-2">
                      <div className="text-green-700 font-medium">
                        👤 Owner
                      </div>
                      <div className="font-bold text-green-900 mt-0.5">
                        {formatRp(k.profitOwner)}
                      </div>
                    </div>
                    <div className="bg-orange-100 rounded p-2">
                      <div className="text-orange-700 font-medium">
                        👨‍🌾 Penggarap
                      </div>
                      <div className="font-bold text-orange-900 mt-0.5">
                        {formatRp(k.profitPenggarap)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profit per Lahan */}
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
                    <td className="py-2 px-2 text-right font-bold text-green-700">
                      {formatRp(l.profitOwner)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-orange-600">
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
