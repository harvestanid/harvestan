import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TombolAksiLahan } from "./tombol-aksi";
import PetaMiniWrapper from "@/components/peta-mini-wrapper";
import {
  getKategoriList,
  hitungProduktivitasPerKomoditas,
} from "@/lib/supabase/queries/kategori-server";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
};

const KOMODITAS_COLOR: Record<string, string> = {
  padi: "bg-green-100 text-green-800",
  jagung: "bg-yellow-100 text-yellow-800",
  kacang_tanah: "bg-purple-100 text-purple-800",
  bawang_merah: "bg-red-100 text-red-800",
  cabai_rawit: "bg-red-200 text-red-900",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type MusimBreakdown = {
  musim: string;
  panenList: any[];
  totalHasil: number;
  jmlPanen: number;
  totalProfitOwner: number;
  totalProfitPenggarap: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  produktivitas: number;
};

export default async function DetailLahanPage({
  params,
}: {
  params: Promise<{ id: string; landId: string }>;
}) {
  const { id, landId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lahan, error } = await supabase
    .from("lands")
    .select("*")
    .eq("id", landId)
    .single();

  if (error || !lahan) {
    redirect(`/penggarap/${id}`);
  }

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .single();

  const { data: panenList } = await supabase
    .from("harvests")
    .select("*")
    .eq("land_id", landId)
    .order("tanggal", { ascending: false });

  const panen = panenList || [];

  const kategoriList = await getKategoriList();

  const totalHasil = panen.reduce((s, p) => s + Number(p.hasil_kg), 0);
  const totalProfitOwner = panen.reduce(
    (s, p) => s + Number(p.profit_owner || 0),
    0
  );

  const produktivitasPerKom = hitungProduktivitasPerKomoditas(
    panen,
    [{ id: lahan.id, luas: Number(lahan.luas) }],
    kategoriList
  );

  // ===== Breakdown per musim untuk cabai rawit =====
  const cabaiPanen = panen.filter(
    (p) => (p.komoditas || "padi") === "cabai_rawit"
  );

  const musimMap = new Map<string, any[]>();
  cabaiPanen.forEach((p) => {
    const musimNama = p.musim || "Tanpa Musim";
    if (!musimMap.has(musimNama)) {
      musimMap.set(musimNama, []);
    }
    musimMap.get(musimNama)!.push(p);
  });

  const breakdownMusim: MusimBreakdown[] = Array.from(musimMap.entries())
    .map(([musim, list]) => {
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );
      const total = list.reduce((s, p) => s + Number(p.hasil_kg), 0);
      return {
        musim,
        panenList: [...list].sort(
          (a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        ),
        totalHasil: total,
        jmlPanen: list.length,
        totalProfitOwner: list.reduce(
          (s, p) => s + Number(p.profit_owner || 0),
          0
        ),
        totalProfitPenggarap: list.reduce(
          (s, p) => s + Number(p.profit_penggarap || 0),
          0
        ),
        tanggalMulai: sorted[0]?.tanggal || "",
        tanggalSelesai: sorted[sorted.length - 1]?.tanggal || "",
        produktivitas: Number(lahan.luas) > 0 ? total / Number(lahan.luas) : 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.tanggalMulai).getTime() -
        new Date(a.tanggalMulai).getTime()
    );

  const gpsUrl = lahan.lokasi_koordinat
    ? `https://www.google.com/maps?q=${lahan.lokasi_koordinat.replace(/\s/g, "")}`
    : null;

  const hasPolygon =
    lahan.polygon &&
    typeof lahan.polygon === "object" &&
    Array.isArray(lahan.polygon?.coordinates);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {penggarap?.nama || "Penggarap"}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🗺️ {lahan.nama}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Nama Lahan
            </p>
            <p className="font-semibold text-gray-800 mt-1">{lahan.nama}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Luas
            </p>
            <p className="font-semibold text-gray-800 mt-1">
              {Number(lahan.luas).toFixed(3)} Ha
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Koordinat GPS
          </p>
          {lahan.lokasi_koordinat ? (
            <a
              href={gpsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-mono hover:bg-blue-100"
            >
              📍 {lahan.lokasi_koordinat}
            </a>
          ) : (
            <p className="text-gray-400 italic mt-1 text-sm">
              Belum ada koordinat
            </p>
          )}
        </div>

        {hasPolygon && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                🗺️ Preview Peta Lahan
              </p>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                📍 GPS Walking
              </span>
            </div>
            <PetaMiniWrapper polygon={lahan.polygon} luas={Number(lahan.luas)} />
          </div>
        )}

        <div className="pt-4 border-t">
          <TombolAksiLahan
            landId={lahan.id}
            penggarapId={id}
            nama={lahan.nama}
            luas={lahan.luas}
            lokasiKoordinat={lahan.lokasi_koordinat || ""}
          />
        </div>
      </div>

      {panen.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium">Total Panen</p>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {panen.length}x
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700 font-medium">Total Hasil</p>
            <p className="text-lg font-bold text-green-900 mt-1">
              {totalHasil.toLocaleString("id-ID")} Kg
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-700 font-medium">
              Total Komoditas
            </p>
            <p className="text-lg font-bold text-purple-900 mt-1">
              {produktivitasPerKom.length}x
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700 font-medium">Profit Owner</p>
            <p className="text-lg font-bold text-orange-900 mt-1">
              {formatRp(totalProfitOwner)}
            </p>
          </div>
        </div>
      )}

      {/* ===== BREAKDOWN MUSIM CABAI ===== */}
      {breakdownMusim.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-orange-300 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-orange-900 text-lg">
                🌶️ Cabai Rawit — Per Musim
              </h2>
              <p className="text-xs text-orange-700 mt-0.5">
                Cabai dipanen bertahap — total {breakdownMusim.length} musim
                tercatat
              </p>
            </div>
            <span className="text-[10px] bg-orange-200 text-orange-900 px-2 py-1 rounded-full font-bold">
              📊 {cabaiPanen.length}x panen
            </span>
          </div>

          <div className="space-y-3">
            {breakdownMusim.map((b) => (
              <div
                key={b.musim}
                className="bg-white rounded-lg border-2 border-orange-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-bold text-orange-900 text-sm flex items-center gap-2">
                      🗓️ {b.musim}
                    </div>
                    <div className="text-xs text-orange-700">
                      {b.jmlPanen}x panen
                    </div>
                  </div>
                  {b.tanggalMulai && (
                    <div className="text-[10px] text-orange-700 mt-1">
                      📅 {formatTanggal(b.tanggalMulai)} —{" "}
                      {formatTanggal(b.tanggalSelesai)}
                    </div>
                  )}
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-green-700 font-medium">
                      TOTAL HASIL
                    </div>
                    <div className="font-bold text-green-900 text-sm mt-0.5">
                      {b.totalHasil.toLocaleString("id-ID")} Kg
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-blue-700 font-medium">
                      PRODUKTIVITAS
                    </div>
                    <div className="font-bold text-blue-900 text-sm mt-0.5">
                      {b.produktivitas.toFixed(0)} Kg/Ha
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-emerald-700 font-medium">
                      PROFIT OWNER
                    </div>
                    <div className="font-bold text-emerald-900 text-[11px] mt-0.5">
                      {formatRp(b.totalProfitOwner)}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-orange-700 font-medium">
                      PROFIT PENGGARAP
                    </div>
                    <div className="font-bold text-orange-900 text-[11px] mt-0.5">
                      {formatRp(b.totalProfitPenggarap)}
                    </div>
                  </div>
                </div>

                <details className="border-t border-orange-200">
                  <summary className="px-4 py-2 text-xs font-medium text-orange-700 cursor-pointer hover:bg-orange-50 select-none">
                    📋 Lihat Detail {b.jmlPanen} Panen di Musim Ini
                  </summary>
                  <div className="p-3 bg-orange-50 border-t border-orange-200">
                    <div className="space-y-1.5">
                      {b.panenList.map((p) => (
                        <Link
                          key={p.id}
                          href={`/penggarap/${id}/lahan/${landId}/panen/${p.id}`}
                          className="block bg-white border border-orange-200 rounded-lg p-2.5 hover:border-orange-400 transition"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-900">
                              📅 {formatTanggal(p.tanggal)}
                            </span>
                            <span className="font-bold text-orange-700">
                              {Number(p.hasil_kg).toLocaleString("id-ID")} Kg
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                            <span>
                              {Number(p.hasil_kg) / Number(lahan.luas) >
                              0
                                ? (
                                    Number(p.hasil_kg) / Number(lahan.luas)
                                  ).toFixed(0)
                                : 0}{" "}
                              Kg/Ha
                            </span>
                            <span>
                              💰 {p.persen_owner}:{p.persen_penggarap}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-white border-2 border-orange-300 rounded-lg p-3">
            <div className="text-xs font-bold text-orange-900 mb-2">
              📊 Total Semua Musim Cabai
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-[10px] text-gray-500">
                  TOTAL HASIL
                </div>
                <div className="font-bold text-orange-700">
                  {breakdownMusim
                    .reduce((s, b) => s + b.totalHasil, 0)
                    .toLocaleString("id-ID")}{" "}
                  Kg
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-500">
                  TOTAL PANEN
                </div>
                <div className="font-bold text-orange-700">
                  {cabaiPanen.length}x
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUKTIVITAS PER KOMODITAS ===== */}
      {produktivitasPerKom.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wide">
            📊 Produktivitas per Komoditas
          </h2>
          <p className="text-xs text-gray-500 mb-4 italic">
            Setiap komoditas dihitung terpisah (tidak dicampur)
          </p>

          <div className="space-y-3">
            {produktivitasPerKom.map((pk) => {
              const katRata = pk.kategoriRata;
              const katTerakhir = pk.kategoriTerakhir;

              return (
                <div
                  key={pk.komoditas}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="font-bold text-gray-800">
                      {KOMODITAS_LABEL[pk.komoditas] || pk.komoditas}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pk.jmlPanen}x panen ·{" "}
                      {pk.totalHasilKg.toLocaleString("id-ID")} Kg
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Rata-rata
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900">
                          {pk.produktivitasRata.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-500">Kg/Ha</span>
                      </div>
                      {katRata ? (
                        <div
                          className={`mt-2 text-[10px] px-2 py-1 rounded-full font-bold border inline-block ${katRata.bg} ${katRata.color}`}
                        >
                          {katRata.icon} {katRata.label}
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-gray-400 italic">
                          Belum ada kategori
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Panen Terakhir
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900">
                          {pk.produktivitasTerakhir.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-500">Kg/Ha</span>
                      </div>
                      {katTerakhir ? (
                        <div
                          className={`mt-2 text-[10px] px-2 py-1 rounded-full font-bold border inline-block ${katTerakhir.bg} ${katTerakhir.color}`}
                        >
                          {katTerakhir.icon} {katTerakhir.label}
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-gray-400 italic">
                          Belum ada kategori
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== RIWAYAT PANEN ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            🌾 Riwayat Panen ({panen.length})
          </h2>
          <Link
            href={`/penggarap/${id}/lahan/${landId}/panen/baru`}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition"
          >
            + Tambah Panen
          </Link>
        </div>

        {panen.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🌾</div>
            <h3 className="font-bold text-gray-900 mb-2">Belum ada panen</h3>
            <p className="text-gray-600 text-sm mb-6">
              Catat hasil panen dari lahan ini untuk melihat produktivitas &
              profit
            </p>
            <Link
              href={`/penggarap/${id}/lahan/${landId}/panen/baru`}
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
            >
              + Tambah Panen Pertama
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {panen.map((p) => {
              const kom = p.komoditas || "padi";
              const prod = Number(p.hasil_kg) / Number(lahan.luas);
              const komColor =
                KOMODITAS_COLOR[kom] || "bg-gray-100 text-gray-800";

              const kat = produktivitasPerKom.find(
                (pk) => pk.komoditas === kom
              );
              const infoKat = kat?.kategoriTerakhir;

              return (
                <Link
                  key={p.id}
                  href={`/penggarap/${id}/lahan/${landId}/panen/${p.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition block"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        📅 {formatTanggal(p.tanggal)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${komColor}`}
                      >
                        {KOMODITAS_LABEL[kom] || kom}
                      </span>
                      {p.musim && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                          🗓️ {p.musim}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        💰 {p.persen_owner}:{p.persen_penggarap}
                      </span>
                      {infoKat && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${infoKat.bg} ${infoKat.color}`}
                        >
                          {infoKat.icon} {infoKat.label}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-green-700">
                      {Number(p.hasil_kg).toLocaleString("id-ID")} Kg
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">Produktivitas</span>
                      <div className="font-medium text-gray-800">
                        {prod.toFixed(0)} Kg/Ha
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Profit Owner</span>
                      <div className="font-medium text-green-700">
                        {formatRp(Number(p.profit_owner || 0))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Profit Penggarap</span>
                      <div className="font-medium text-orange-700">
                        {formatRp(Number(p.profit_penggarap || 0))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
