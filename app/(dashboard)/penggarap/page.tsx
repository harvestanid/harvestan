import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { getPenggarapList } from "@/lib/supabase/queries/penggarap-server";
import {
  getKategoriList,
  hitungProduktivitasPerKomoditas,
} from "@/lib/supabase/queries/kategori-server";
import { CtaThreshold } from "@/components/cta-threshold";
import { PenggarapKlien } from "./klien";

export const metadata = {
  title: "Penggarap",
};

function normalisasiKomoditas(kom: string | null | undefined): string {
  if (!kom) return "padi";
  if (kom === "cabai") return "cabai_rawit";
  return kom;
}

export default async function PenggarapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const penggaraps = await getPenggarapList(filter.is_demo);
  const kategoriList = await getKategoriList();

  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const { data: allHarvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const allLands = lands || [];
  const harvestsData = allHarvests || [];

  const penggarapLengkap = penggaraps.map((p) => {
    const penggarapLands = allLands.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);
    const penggarapHarvests = harvestsData.filter((h) =>
      landIds.includes(h.land_id)
    );

    const produktivitas = hitungProduktivitasPerKomoditas(
      penggarapHarvests,
      penggarapLands,
      kategoriList
    );

    const totalLuas = penggarapLands.reduce((s, l) => s + Number(l.luas), 0);

    // Komoditas yang ditanam penggarap (unique)
    const komoditasSetGlobal = new Set<string>();
    penggarapHarvests.forEach((h) =>
      komoditasSetGlobal.add(normalisasiKomoditas(h.komoditas))
    );
    const komoditasDitanam = Array.from(komoditasSetGlobal);

    const lahanList = penggarapLands.map((l) => {
      const lahanHarvests = penggarapHarvests
        .filter((h) => h.land_id === l.id)
        .sort(
          (a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

      const totalHasilLahan = lahanHarvests.reduce(
        (s, h) => s + Number(h.hasil_kg),
        0
      );

      const rataProduktivitas =
        lahanHarvests.length > 0 && Number(l.luas) > 0
          ? totalHasilLahan / Number(l.luas) / lahanHarvests.length
          : 0;

      const komoditasSet = new Set<string>();
      lahanHarvests.forEach((h) =>
        komoditasSet.add(normalisasiKomoditas(h.komoditas))
      );

      // Hitung jml panen per komoditas (cabai per musim, lain per panen)
      const perKomoditas: Record<
        string,
        { jml: number; totalHasilKg: number }
      > = {};
      const musimCabaiSet = new Set<string>();

      lahanHarvests.forEach((h) => {
        const kom = normalisasiKomoditas(h.komoditas);
        if (!perKomoditas[kom]) perKomoditas[kom] = { jml: 0, totalHasilKg: 0 };

        if (kom === "cabai_rawit") {
          const musim = h.musim || "Tanpa Musim";
          if (!musimCabaiSet.has(musim)) {
            musimCabaiSet.add(musim);
            perKomoditas[kom].jml += 1;
          }
          perKomoditas[kom].totalHasilKg += Number(h.hasil_kg);
        } else {
          perKomoditas[kom].jml += 1;
          perKomoditas[kom].totalHasilKg += Number(h.hasil_kg);
        }
      });

      const komoditasRingkas = Object.entries(perKomoditas).map(
        ([kom, d]) => ({
          komoditas: kom,
          jml: d.jml,
          isPerMusim: kom === "cabai_rawit",
          totalHasilKg: d.totalHasilKg,
        })
      );

      // Group per tahun
      const perTahun: Record<
        number,
        {
          komoditasSet: Set<string>;
          totalHasilKg: number;
          jmlPanenRaw: number;
          jmlMusim: number;
          profitOwner: number;
          profitPenggarap: number;
        }
      > = {};
      const musimSetGlobal = new Set<string>();

      lahanHarvests.forEach((h) => {
        const tahun = new Date(h.tanggal).getFullYear();
        const kom = normalisasiKomoditas(h.komoditas);

        if (!perTahun[tahun]) {
          perTahun[tahun] = {
            komoditasSet: new Set(),
            totalHasilKg: 0,
            jmlPanenRaw: 0,
            jmlMusim: 0,
            profitOwner: 0,
            profitPenggarap: 0,
          };
        }
        const t = perTahun[tahun];
        t.komoditasSet.add(kom);
        t.totalHasilKg += Number(h.hasil_kg);
        t.jmlPanenRaw += 1;
        t.profitOwner += Number(h.profit_owner || 0);
        t.profitPenggarap += Number(h.profit_penggarap || 0);

        const musimKey =
          kom === "cabai_rawit"
            ? `${h.musim || "Tanpa Musim"}`
            : `${kom}-${h.tanggal.slice(0, 7)}`;
        const musimGlobalKey = `${tahun}-${musimKey}`;
        if (!musimSetGlobal.has(musimGlobalKey)) {
          musimSetGlobal.add(musimGlobalKey);
          t.jmlMusim += 1;
        }
      });

      const tahunRingkas = Object.entries(perTahun)
        .map(([tahun, d]) => ({
          tahun: parseInt(tahun),
          komoditasList: Array.from(d.komoditasSet),
          totalHasilKg: d.totalHasilKg,
          jmlPanenRaw: d.jmlPanenRaw,
          jmlMusim: d.jmlMusim,
          profitOwner: d.profitOwner,
          profitPenggarap: d.profitPenggarap,
        }))
        .sort((a, b) => b.tahun - a.tahun);

      return {
        id: l.id,
        nama: l.nama,
        luas: Number(l.luas),
        lokasi_koordinat: null,
        jmlPanen: lahanHarvests.length,
        totalHasilKg: totalHasilLahan,
        rataProduktivitas,
        komoditasList: Array.from(komoditasSet),
        komoditasRingkas,
        tahunRingkas,
        riwayatPanen: lahanHarvests.map((h) => ({
          id: h.id,
          tanggal: h.tanggal,
          komoditas: normalisasiKomoditas(h.komoditas),
          musim: h.musim || null,
          hasilKg: Number(h.hasil_kg),
          hargaGabah: Number(h.harga_gabah),
          profitBersih: Number(h.profit_bersih || 0),
          profitOwner: Number(h.profit_owner || 0),
          profitPenggarap: Number(h.profit_penggarap || 0),
          potonganHutang: Number(h.potongan_hutang || 0),
          sisaHutangSesudah: Number(h.sisa_hutang_sesudah || 0),
          totalHutangSebelum: Number(h.total_hutang_sebelum || 0),
          persenOwner: Number(h.persen_owner || 50),
          persenPenggarap: Number(h.persen_penggarap || 50),
        })),
      };
    });

    return {
      id: p.id,
      nama: p.nama,
      kontak: p.kontak || null,
      alamat: p.alamat || null,
      totalLahan: penggarapLands.length,
      totalLuas,
      jmlPanen: penggarapHarvests.length,
      komoditasDitanam,
      produktivitas: produktivitas.map((pk: any) => {
        const kat = pk.kategoriRata || pk.kategoriTerakhir;
        return {
          komoditas: pk.komoditas,
          produktivitasRata: pk.produktivitasRata,
          jmlPanen: pk.jmlPanen,
          totalHasilKg: pk.totalHasilKg,
          kategori: kat
            ? { label: kat.label, icon: kat.icon, color: kat.color }
            : null,
        };
      }),
      lahanList,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              👨‍🌾 Penggarap
            </h1>
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

        {penggaraps.length > 0 && (
          <div className="mt-3">
            <CtaThreshold variant="card" />
          </div>
        )}
      </div>

      {penggarapLengkap.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="font-bold text-gray-900 mb-2">Belum ada penggarap</h3>
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
        <PenggarapKlien penggarapLengkap={penggarapLengkap} />
      )}
    </div>
  );
}
