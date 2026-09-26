import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPenggarapById,
  getLandsByPenggarap,
} from "@/lib/supabase/queries/penggarap-server";
import { getHutangByPenggarap } from "@/lib/supabase/queries/hutang-server";
import TombolAksiPenggarap from "./tombol-aksi";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function DetailPenggarapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const penggarap = await getPenggarapById(id);

  if (!penggarap) notFound();

  const lands = await getLandsByPenggarap(id);
  const totalLuas = lands.reduce((sum, l) => sum + Number(l.luas), 0);

  const hutangList = await getHutangByPenggarap(id);
  const totalHutang = hutangList.reduce(
    (sum, h) => sum + Number(h.sisa || 0),
    0
  );
  const jumlahHutangAktif = hutangList.filter((h) => Number(h.sisa) > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/penggarap"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Kembali ke Penggarap
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👨‍🌾 {penggarap.nama}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {lands.length} lahan &middot; {totalLuas.toFixed(2)} Ha total
            {hutangList.length > 0 && (
              <>
                {" "}
                &middot;{" "}
                <span
                  className={
                    totalHutang > 0
                      ? "text-red-600 font-medium"
                      : "text-green-600 font-medium"
                  }
                >
                  {totalHutang > 0
                    ? `Hutang ${formatRp(totalHutang)}`
                    : "Lunas ✅"}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TombolAksiPenggarap
            penggarap={penggarap}
            totalLuas={totalLuas}
            landsCount={lands.length}
          />
          <a
            href={`/api/export-pdf?penggarap_id=${id}`}
            download
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2 rounded-lg transition text-sm"
          >
            📄 Laporan PDF
          </a>
        </div>
      </div>

      {/* Info Penggarap */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
          📋 Data Penggarap
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs mb-1">Kontak</div>
            <div className="font-medium text-gray-900">
              {penggarap.kontak || "-"}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Usia</div>
            <div className="font-medium text-gray-900">
              {penggarap.usia ? `${penggarap.usia} tahun` : "-"}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-gray-500 text-xs mb-1">Alamat</div>
            <div className="font-medium text-gray-900">
              {penggarap.alamat || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Lahan */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            🗺️ Daftar Lahan ({lands.length})
          </h2>
          <Link
            href={`/penggarap/${id}/lahan/baru`}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition"
          >
            + Tambah Lahan
          </Link>
        </div>

        {lands.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="font-bold text-gray-900 mb-2">Belum ada lahan</h3>
            <p className="text-gray-600 text-sm mb-6">
              Tambahkan lahan yang dikelola oleh {penggarap.nama}
            </p>
            <Link
              href={`/penggarap/${id}/lahan/baru`}
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition"
            >
              + Tambah Lahan Pertama
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {lands.map((land) => (
              <Link
                key={land.id}
                href={`/penggarap/${id}/lahan/${land.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition block"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">
                      🗺️ {land.nama}
                    </div>
                    {land.lokasi_koordinat && (
                      <div className="text-xs text-blue-600 mt-1 font-mono">
                        📍 {land.lokasi_koordinat}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700">
                      {Number(land.luas).toFixed(2)} Ha
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Hutang */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">
            💰 Hutang ({hutangList.length})
          </h2>
          <Link
            href={`/penggarap/${id}/hutang/baru`}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
          >
            + Tambah Hutang
          </Link>
        </div>

        {hutangList.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-gray-600 text-sm">
              Belum ada hutang tercatat untuk {penggarap.nama}
            </p>
          </div>
        ) : (
          <>
            {jumlahHutangAktif > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm font-medium text-red-800">
                    ⚠️ {jumlahHutangAktif} hutang aktif
                  </div>
                  <div className="font-bold text-red-700 text-lg">
                    {formatRp(totalHutang)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {hutangList.map((h) => {
                const sisa = Number(h.sisa || 0);
                const lunas = sisa <= 0;
                return (
                  <Link
                    key={h.id}
                    href={`/penggarap/${id}/hutang/${h.id}`}
                    className={`bg-white border rounded-xl p-4 hover:border-red-400 transition block ${
                      lunas ? "border-green-200 opacity-75" : "border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                          <span>
                            📅{" "}
                            {new Date(h.tanggal).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {lunas ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              ✅ LUNAS
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                              ⚠️ AKTIF
                            </span>
                          )}
                        </div>
                        {h.keperluan && (
                          <div className="text-xs text-gray-600 mt-1">
                            📝 {h.keperluan}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            lunas ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {formatRp(sisa)}
                        </div>
                        {!lunas && Number(h.dibayar) > 0 && (
                          <div className="text-xs text-gray-500">
                            dari {formatRp(Number(h.jumlah))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
