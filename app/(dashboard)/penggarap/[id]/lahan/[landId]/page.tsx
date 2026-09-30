import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolAksiLahan } from "./tombol-aksi";
import PetaMiniWrapper from "@/components/peta-mini-wrapper";
import { CtaThreshold } from "@/components/cta-threshold";
import { BadgeTipeGarap } from "@/components/badge-tipe-garap";
import {
  getKategoriList,
  hitungProduktivitasPerKomoditas,
} from "@/lib/supabase/queries/kategori-server";

type MusimBreakdown = {
  musim: string;
  totalHasil: number;
  jmlPanen: number;
  produktivitas: number;
  panenList: { tanggal: string; hasil: number; prod: number }[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
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

  const filter = await getDataFilter(user.id);

  const { data: lahan } = await supabase
    .from("lands")
    .select("*")
    .eq("id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!lahan) redirect(`/penggarap/${id}`);

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama, kontak, is_self")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!penggarap) redirect("/penggarap");

  const { data: harvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("land_id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const kategoriList = await getKategoriList();

  const produktivitas = hitungProduktivitasPerKomoditas(
    harvests || [],
    [{ id: lahan.id, luas: Number(lahan.luas) }],
    kategoriList
  );

  const musimMap = new Map<string, MusimBreakdown>();
  (harvests || []).forEach((h) => {
    const kom = h.komoditas || "padi";
    if (kom !== "cabai_rawit" && kom !== "cabai") return;
    const musim = h.musim || "Tanpa Musim";
    if (!musimMap.has(musim)) {
      musimMap.set(musim, {
        musim,
        totalHasil: 0,
        jmlPanen: 0,
        produktivitas: 0,
        panenList: [],
      });
    }
    const m = musimMap.get(musim)!;
    m.totalHasil += Number(h.hasil_kg);
    m.jmlPanen += 1;
    m.panenList.push({
      tanggal: h.tanggal,
      hasil: Number(h.hasil_kg),
      prod: Number(h.hasil_kg) / Number(lahan.luas),
    });
  });

  const breakdownMusim: MusimBreakdown[] = Array.from(musimMap.values()).map(
    (m) => ({
      ...m,
      produktivitas: m.totalHasil / Number(lahan.luas),
    })
  );

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

  const tipeGarap = (lahan as any).tipe_garap || "bagi_hasil_owner";
  const namaOwnerExternal = (lahan as any).nama_owner_external || null;
  const isMandiri = tipeGarap === "mandiri";
  const isPenggarap = tipeGarap === "bagi_hasil_penggarap";

  const adaPolygon =
    lahan.polygon &&
    typeof lahan.polygon === "object" &&
    Array.isArray((lahan.polygon as any).coordinates) &&
    (lahan.polygon as any).coordinates[0]?.length >= 3;
  const adaKoordinat = !!lahan.lokasi_koordinat;
  const tampilkanPeta = adaPolygon || adaKoordinat;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {penggarap.nama}
        </Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">
            🗺️ {lahan.nama}
          </h1>
          <BadgeTipeGarap tipe={tipeGarap} />
          {isPenggarap && namaOwnerExternal && (
            <span className="text-[10px] bg-orange-100 border-2 border-orange-300 text-orange-800 rounded-full px-2.5 py-1 font-bold uppercase tracking-widest">
              👤 Owner: {namaOwnerExternal}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap.nama} &middot; {Number(lahan.luas).toFixed(2)} Ha
          {lahan.lokasi_koordinat && (
            <>
              {" "}
              &middot;{" "}
              <a
                href={`https://www.google.com/maps?q=${lahan.lokasi_koordinat}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                📍 {lahan.lokasi_koordinat}
              </a>
            </>
          )}
        </p>
      </div>

      {/* Info box untuk mode penggarap */}
      {isPenggarap && namaOwnerExternal && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="text-xs text-orange-800 leading-relaxed">
              <strong>Lahan ini bukan milikmu.</strong> Ini lahan garapan dari{" "}
              <strong>{namaOwnerExternal}</strong>. Profit dari lahan ini akan
              dibagi sesuai skema yang ditentukan.
            </div>
          </div>
        </div>
      )}

      {/* Info box untuk mode mandiri */}
      {isMandiri && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🌱</span>
            <div className="text-xs text-green-800 leading-relaxed">
              <strong>Lahan milik sendiri, digarap sendiri.</strong> Semua
              profit dari lahan ini <strong>100% untuk penggarap</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Mini-map */}
      {tampilkanPeta && (
        <div className="mb-6 relative z-0">
          <PetaMiniWrapper
            polygon={adaPolygon ? lahan.polygon : null}
            koordinat={lahan.lokasi_koordinat}
            luas={Number(lahan.luas)}
          />
        </div>
      )}

      {/* Tombol Aksi */}
      <div className="mb-6">
        <TombolAksiLahan
          landId={lahan.id}
          penggarapId={id}
          namaLahan={lahan.nama}
          luas={Number(lahan.luas)}
        />
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Total Panen</div>
          <div className="text-lg font-bold text-gray-900">
            {(harvests || []).length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Total Hasil</div>
          <div className="text-lg font-bold text-green-700">
            {totalHasil.toLocaleString("id-ID")} Kg
          </div>
        </div>
        {isMandiri ? (
          <div className="col-span-2 bg-[#2c5e2e]/5 border-2 border-[#2c5e2e]/30 rounded-xl p-3 text-center">
            <div className="text-[10px] text-[#2c5e2e] uppercase font-bold tracking-widest">
              🌱 Total Profit Penggarap
            </div>
            <div className="text-xl font-bold text-[#2c5e2e] mt-1">
              {formatRp(totalProfitPenggarap)}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase">
                Profit {isPenggarap ? "Owner Ext." : "Owner"}
              </div>
              <div className="text-sm font-bold text-green-700 break-words">
                {formatRp(totalProfitOwner)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase">
                Profit Penggarap
              </div>
              <div className="text-sm font-bold text-orange-700 break-words">
                {formatRp(totalProfitPenggarap)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Produktivitas per Komoditas */}
      {produktivitas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="font-bold text-gray-900">
              📊 Produktivitas per Komoditas
            </h2>
            <CtaThreshold />
          </div>
          <div className="space-y-3">
            {produktivitas.map((pk: any) => {
              const kat = pk.kategoriRata || pk.kategoriTerakhir;
              return (
                <div
                  key={pk.komoditas}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span className="font-bold text-gray-800">
                      {KOMODITAS_LABEL[pk.komoditas] || pk.komoditas}
                    </span>
                    {kat ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold border ${kat.bg} ${kat.color}`}
                      >
                        {kat.icon} {kat.label}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        (belum ada kategori)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Jml Panen</div>
                      <div className="font-bold text-gray-800">
                        {pk.jmlPanen}x
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Hasil</div>
                      <div className="font-bold text-gray-800">
                        {Number(pk.totalHasilKg).toLocaleString("id-ID")} Kg
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Rata-rata Prod.</div>
                      <div className="font-bold text-green-700">
                        {pk.produktivitasRata.toFixed(0)} Kg/Ha
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown per Musim Cabai */}
      {breakdownMusim.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-orange-300 rounded-xl p-5 mb-6">
          <h2 className="font-bold text-orange-900 mb-4">
            🌶️ Breakdown Panen Cabai per Musim
          </h2>
          <div className="space-y-3">
            {breakdownMusim.map((m) => (
              <div
                key={m.musim}
                className="bg-white rounded-lg p-3 border border-orange-200"
              >
                <div className="font-bold text-orange-900 text-sm mb-2">
                  🗓️ {m.musim}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <div className="text-gray-500">Jml Panen</div>
                    <div className="font-bold text-gray-800">
                      {m.jmlPanen}x
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Hasil</div>
                    <div className="font-bold text-gray-800">
                      {m.totalHasil.toLocaleString("id-ID")} Kg
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Produktivitas</div>
                    <div className="font-bold text-orange-700">
                      {m.produktivitas.toFixed(0)} Kg/Ha
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Panen */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-gray-900">
            📜 Riwayat Panen ({(harvests || []).length})
          </h2>
          <Link
            href={`/penggarap/${id}/lahan/${landId}/panen/baru`}
            className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            + Input Panen
          </Link>
        </div>

        {(harvests || []).length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic text-sm">
            Belum ada riwayat panen di lahan ini
          </div>
        ) : (
          <div className="space-y-2">
            {(harvests || []).map((h) => {
              const prod = Number(h.hasil_kg) / Number(lahan.luas);
              const adaPotongan = Number(h.potongan_hutang || 0) > 0;
              return (
                <Link
                  key={h.id}
                  href={`/penggarap/${id}/lahan/${landId}/panen/${h.id}`}
                  className="block bg-gray-50 hover:bg-green-50 rounded-lg p-3 border border-gray-200 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-800">
                        {KOMODITAS_LABEL[h.komoditas] || h.komoditas}
                      </span>
                      {h.musim && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                          🗓️ {h.musim}
                        </span>
                      )}
                      {adaPotongan && (
                        <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                          💸 Potong Hutang
                        </span>
                      )}
                      {isMandiri && (
                        <span className="text-[10px] bg-[#2c5e2e]/10 text-[#2c5e2e] px-2 py-0.5 rounded-full font-bold">
                          🌱 Full Penggarap
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(h.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className={`grid ${isMandiri ? "grid-cols-3" : "grid-cols-4"} gap-2 text-xs`}>
                    <div>
                      <div className="text-gray-500 text-[10px]">Hasil</div>
                      <div className="font-bold text-gray-800">
                        {Number(h.hasil_kg).toLocaleString("id-ID")} Kg
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[10px]">
                        Produktivitas
                      </div>
                      <div className="font-bold text-green-700">
                        {prod.toFixed(0)} Kg/Ha
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-[10px]">
                        Profit Bersih
                      </div>
                      <div className="font-bold text-blue-700 break-words">
                        {formatRp(Number(h.profit_bersih || 0))}
                      </div>
                    </div>
                    {!isMandiri && (
                      <div>
                        <div className="text-gray-500 text-[10px]">
                          Bagi Hasil
                        </div>
                        <div className="text-[10px] font-bold">
                          <span className="text-green-700">
                            👤 {formatRp(Number(h.profit_owner || 0))}
                          </span>
                          {" · "}
                          <span className="text-orange-700">
                            👨‍🌾 {formatRp(Number(h.profit_penggarap || 0))}
                          </span>
                        </div>
                      </div>
                    )}
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
