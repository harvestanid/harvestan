import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPenggarapList,
} from "@/lib/supabase/queries/penggarap-server";
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

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function PenggarapPage() {
  const penggaraps = await getPenggarapList();
  const kategoriList = await getKategoriList();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil semua lahan + harvests (untuk hitung produktivitas per komoditas)
  let allLands: { id: string; penggarap_id: string; luas: number }[] = [];
  let allHarvests: any[] = [];

  if (user && penggaraps.length > 0) {
    const { data: lands } = await supabase
      .from("lands")
      .select("id, penggarap_id, luas")
      .eq("user_id", user.id);
    allLands = lands || [];

    const { data: harvests } = await supabase
      .from("harvests")
      .select("id, land_id, komoditas, hasil_kg, tanggal")
      .eq("user_id", user.id);
    allHarvests = harvests || [];
  }

  // Group lands & harvests per penggarap
  const dataPerPenggarap = new Map<
    string,
    {
      totalLahan: number;
      totalLuas: number;
      produktivitas: ReturnType<typeof hitungProduktivitasPerKomoditas>;
    }
  >();

  penggaraps.forEach((p) => {
    const penggarapLands = allLands.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);
    const penggarapHarvests = allHarvests.filter((h) =>
      landIds.includes(h.land_id)
    );

    const produktivitas = hitungProduktivitasPerKomoditas(
      penggarapHarvests,
      penggarapLands,
      kategoriList
    );

    const totalLuas = penggarapLands.reduce(
      (s, l) => s + Number(l.luas),
      0
    );

    dataPerPenggarap.set(p.id, {
      totalLahan: penggarapLands.length,
      totalLuas,
      produktivitas,
    });
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👨‍🌾 Penggarap</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {penggaraps.length === 0
              ? "Belum ada penggarap. Tambahkan yang pertama!"
              : `${penggaraps.length} penggarap terdaftar`}
          </p>
        </div>
        <Link
          href="/penggarap/baru"
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-800 transition text-sm"
        >
          + Tambah Penggarap
        </Link>
      </div>

      {/* Empty state */}
      {penggaraps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-bold text-gray-900 mb-2">
            Belum ada penggarap
          </h3>
          <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
            Mulai kelola lahan dan bagi hasil dengan menambahkan penggarap
            pertama Anda.
          </p>
          <Link
            href="/penggarap/baru"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
          >
            + Tambah Penggarap Pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {penggaraps.map((p) => {
            const info = dataPerPenggarap.get(p.id);
            const produktivitas = info?.produktivitas || [];
            const topKomoditas = produktivitas.slice(0, 3);

            return (
              <Link
                key={p.id}
                href={`/penggarap/${p.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition block"
              >
                <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-lg text-gray-900">
                      👨‍🌾 {p.nama}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>
                        🗺️ {info?.totalLahan || 0} lahan &middot;{" "}
                        {(info?.totalLuas || 0).toFixed(2)} Ha
                      </span>
                      {p.kontak && <span>📞 {p.kontak}</span>}
                      {p.alamat && (
                        <span className="truncate">📍 {p.alamat}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-green-700 text-sm font-medium whitespace-nowrap">
                    Detail →
                  </div>
                </div>

                {/* Badge Kategori per Komoditas */}
                {topKomoditas.length > 0 ? (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                    {topKomoditas.map((pk) => {
                      const kat = pk.kategoriRata || pk.kategoriTerakhir;
                      return (
                        <div
                          key={pk.komoditas}
                          className="flex items-center justify-between flex-wrap gap-2 text-xs"
                        >
                          <span className="font-medium text-gray-700">
                            {KOMODITAS_LABEL[pk.komoditas] || pk.komoditas}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-mono">
                              {pk.produktivitasRata.toFixed(0)} Kg/Ha
                            </span>
                            {kat ? (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${kat.bg} ${kat.color}`}
                              >
                                {kat.icon} {kat.label}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">
                                (belum ada kategori)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {produktivitas.length > 3 && (
                      <div className="text-[10px] text-gray-400 italic">
                        +{produktivitas.length - 3} komoditas lain
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 italic">
                    Belum ada data panen
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
