import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import TombolAksiPenggarap from "./tombol-aksi";

export const metadata = {
  title: "Detail Penggarap",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DetailPenggarapPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("*")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!penggarap) notFound();

  const { data: lands } = await supabase
    .from("lands")
    .select("*")
    .eq("penggarap_id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const landIds = (lands || []).map((l) => l.id);

  let harvests: any[] = [];
  if (landIds.length > 0) {
    const { data } = await supabase
      .from("harvests")
      .select("*")
      .in("land_id", landIds)
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);
    harvests = data || [];
  }

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .eq("penggarap_id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const totalLuas = (lands || []).reduce((s, l) => s + Number(l.luas), 0);
  const totalHasil = harvests.reduce((s, h) => s + Number(h.hasil_kg), 0);
  const totalProfitOwner = harvests.reduce(
    (s, h) => s + Number(h.profit_owner || 0),
    0
  );
  const totalProfitPenggarap = harvests.reduce(
    (s, h) => s + Number(h.profit_penggarap || 0),
    0
  );

  const hutangAktif = (debts || []).filter((d) => Number(d.sisa) > 0);
  const totalHutangAktif = hutangAktif.reduce(
    (s, d) => s + Number(d.sisa),
    0
  );

  function formatRp(n: number) {
    return "Rp " + Math.round(n).toLocaleString("id-ID");
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/penggarap"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Daftar Penggarap
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          👨‍🌾 {penggarap.nama}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Detail penggarap dan akses fitur terkait
        </p>
      </div>

      {/* Info Penggarap */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          📋 Data Penggarap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Kontak</div>
            <div className="font-medium">{penggarap.kontak || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Alamat</div>
            <div className="font-medium">{penggarap.alamat || "-"}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Usia</div>
            <div className="font-medium">{penggarap.usia || "-"} tahun</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Total Luas</div>
            <div className="font-medium">{totalLuas.toFixed(2)} Ha</div>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">
            Lahan
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {lands?.length || 0}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase">
            Panen
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {harvests.length}x
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-[10px] text-green-700 font-bold uppercase">
            Profit Owner
          </div>
          <div className="text-base font-bold text-green-900 mt-1 break-all">
            {formatRp(totalProfitOwner)}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-[10px] text-orange-700 font-bold uppercase">
            Profit Penggarap
          </div>
          <div className="text-base font-bold text-orange-900 mt-1 break-all">
            {formatRp(totalProfitPenggarap)}
          </div>
        </div>
      </div>

      {/* Hutang Aktif */}
      {hutangAktif.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-bold text-red-700 uppercase mb-1">
            🔴 Hutang Aktif ({hutangAktif.length})
          </div>
          <div className="text-2xl font-bold text-red-900">
            {formatRp(totalHutangAktif)}
          </div>
        </div>
      )}

      {/* Tombol Aksi */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          ⚡ Aksi Cepat
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/penggarap/${id}/lahan/baru`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Tambah Lahan
          </Link>
          <Link
            href={`/penggarap/${id}/hutang/baru`}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Tambah Hutang
          </Link>
          <Link
            href={`/penggarap/${id}/transfer`}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            🔄 Transfer Lahan
          </Link>
          <a
            href={`/api/export-pdf?penggarap_id=${id}`}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            📄 PDF Laporan
          </a>
        </div>
      </div>

      {/* Daftar Lahan */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase mb-3">
          🗺️ Daftar Lahan ({lands?.length || 0})
        </h2>
        {!lands || lands.length === 0 ? (
          <div className="text-center py-6 text-gray-400 italic text-sm">
            Belum ada lahan. Tambah lahan dulu.
          </div>
        ) : (
          <div className="space-y-2">
            {lands.map((l) => {
              const lahanHarvests = harvests.filter(
                (h) => h.land_id === l.id
              );
              const totalHasilLahan = lahanHarvests.reduce(
                (s, h) => s + Number(h.hasil_kg),
                0
              );
              return (
                <Link
                  key={l.id}
                  href={`/penggarap/${id}/lahan/${l.id}`}
                  className="block bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        🗺️ {l.nama}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3">
                        <span>📏 {Number(l.luas).toFixed(2)} Ha</span>
                        <span>🌾 {lahanHarvests.length}x panen</span>
                        <span>
                          📊 {Math.round(totalHasilLahan).toLocaleString("id-ID")} Kg
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-400 text-lg">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol Aksi Hapus/Edit */}
      <TombolAksiPenggarap
        penggarap={{
          id: penggarap.id,
          nama: penggarap.nama,
          alamat: penggarap.alamat,
          usia: penggarap.usia,
          kontak: penggarap.kontak,
        }}
        totalLuas={totalLuas}
        landsCount={lands?.length || 0}
      />
    </div>
  );
}
