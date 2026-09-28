import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { getPenggarapList } from "@/lib/supabase/queries/penggarap-server";
import {
  getKategoriList,
  hitungProduktivitasPerKomoditas,
} from "@/lib/supabase/queries/kategori-server";
import { PenggarapKlien } from "./klien";

export const metadata = {
  title: "Penggarap",
};

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
};

export default async function PenggarapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const penggaraps = await getPenggarapList(filter.is_demo);
  const kategoriList = await getKategoriList();

  // Ambil semua lahan
  const { data: lands } = await supabase
    .from("lands")
    .select("id, penggarap_id, nama, luas")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  // Ambil semua harvests
  const { data: allHarvests } = await supabase
    .from("harvests")
    .select("*")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .order("tanggal", { ascending: false });

  const allLands = lands || [];
  const harvestsData = allHarvests || [];

  // Untuk setiap penggarap, siapkan data lengkap:
  // - totalLahan, totalLuas
  // - produktivitas per komoditas
  // - daftar lahan dengan riwayat panen
  const penggarapLengkap = penggaraps.map((p) => {
    const penggarapLands = allLands.filter((l) => l.penggarap_id === p.id);
    const landIds = penggarapLands.map((l) => l.id);
    const penggarapHarvests = harvestsData.filter((h) =>
      landIds.includes(h.land_id)
    );

    // Produktivitas per komoditas
    const produktivitas = hitungProduktivitasPerKomoditas(
      penggarapHarvests,
      penggarapLands,
      kategoriList
    );

    const totalLuas = penggarapLands.reduce((s, l) => s + Number(l.luas), 0);

    // Daftar lahan dengan riwayat panen
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

      // Produktivitas rata-rata per lahan (semua komoditas di lahan itu)
      const rataProduktivitas =
        lahanHarvests.length > 0 && Number(l.luas) > 0
          ? totalHasilLahan / Number(l.luas) / lahanHarvests.length
          : 0;

      // Komoditas unik di lahan ini
      const komoditasSet = new Set<string>();
      lahanHarvests.forEach((h) => komoditasSet.add(h.komoditas || "padi"));

      return {
        id: l.id,
        nama: l.nama,
        luas: Number(l.luas),
        lokasi_koordinat: null,
        jmlPanen: lahanHarvests.length,
        totalHasilKg: totalHasilLahan,
        rataProduktivitas,
        komoditasList: Array.from(komoditasSet),
        riwayatPanen: lahanHarvests.slice(0, 10).map((h) => ({
          id: h.id,
          tanggal: h.tanggal,
          komoditas: h.komoditas || "padi",
          musim: h.musim || null,
          hasilKg: Number(h.hasil_kg),
          hargaGabah: Number(h.harga_gabah),
          profitBersih: Number(h.profit_bersih || 0),
          profitOwner: Number(h.profit_owner || 0),
          profitPenggarap: Number(h.profit_penggarap || 0),
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
