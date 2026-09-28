import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolDownloadInvoiceMusim } from "./tombol-download-invoice-musim";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatKg(n: number) {
  return Math.round(n).toLocaleString("id-ID") + " Kg";
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function DetailMusimPage({
  params,
}: {
  params: Promise<{ id: string; landId: string; musim: string }>;
}) {
  const { id, landId, musim: musimEncoded } = await params;
  const musim = decodeURIComponent(musimEncoded);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama, alamat, kontak")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!penggarap) notFound();

  const { data: lahan } = await supabase
    .from("lands")
    .select("id, nama, luas")
    .eq("id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!lahan) notFound();

  // Ambil semua panen cabai di musim ini
  const { data: panenListRaw } = await supabase
    .from("harvests")
    .select("*")
    .eq("land_id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .eq("musim", musim)
    .order("tanggal", { ascending: true });

  const panenList = panenListRaw || [];

  if (panenList.length === 0) notFound();

  const luasLahan = Number(lahan.luas);

  // Hitung total
  const totalHasil = panenList.reduce((s, h) => s + Number(h.hasil_kg), 0);
  const totalPendapatan = panenList.reduce(
    (s, h) => s + Number(h.hasil_kg) * Number(h.harga_gabah),
    0
  );
  const totalBiayaPanen = panenList.reduce(
    (s, h) => s + Number(h.hasil_kg) * Number(h.biaya_panen_per_kg),
    0
  );
  const totalBiayaTambahan = panenList.reduce(
    (s, h) => s + Number(h.biaya_tambahan || 0),
    0
  );
  const totalProfitBersih = panenList.reduce(
    (s, h) => s + Number(h.profit_bersih || 0),
    0
  );
  const totalProfitOwner = panenList.reduce(
    (s, h) => s + Number(h.profit_owner || 0),
    0
  );
  const totalProfitPenggarap = panenList.reduce(
    (s, h) => s + Number(h.profit_penggarap || 0),
    0
  );
  const totalPotonganHutang = panenList.reduce(
    (s, h) => s + Number(h.potongan_hutang || 0),
    0
  );

  const produktivitas = luasLahan > 0 ? totalHasil / luasLahan : 0;

  // ✅ Hitung profit SEBELUM potong hutang
  const totalProfitOwnerSebelum = totalProfitOwner - totalPotonganHutang;
  const totalProfitPenggarapSebelum = totalProfitPenggarap + totalPotonganHutang;

  // Status hutang akhir musim
  const panenTerakhir = panenList[panenList.length - 1];
  const sisaHutangAkhir = Number(panenTerakhir?.sisa_hutang_sesudah || 0);
  const lunas = sisaHutangAkhir <= 0 && totalPotonganHutang > 0;

  // Data untuk invoice PDF
  const invoiceData = {
    penggarap: {
      nama: penggarap.nama,
      alamat: penggarap.alamat,
      kontak: penggarap.kontak,
    },
    lahan: { nama: lahan.nama, luas: luasLahan },
    musim,
    panenList: panenList.map((h) => ({
      tanggal: h.tanggal,
      hasilKg: Number(h.hasil_kg),
      hargaGabah: Number(h.harga_gabah),
      profitBersih: Number(h.profit_bersih || 0),
      profitOwner: Number(h.profit_owner || 0),
      profitPenggarap: Number(h.profit_penggarap || 0),
      potonganHutang: Number(h.potongan_hutang || 0),
      persenOwner: Number(h.persen_owner || 50),
      persenPenggarap: Number(h.persen_penggarap || 50),
      produktivitas: luasLahan > 0 ? Number(h.hasil_kg) / luasLahan : 0,
    })),
    totals: {
      totalHasil,
      totalPendapatan,
      totalBiayaPanen,
      totalBiayaTambahan,
      totalProfitBersih,
      totalProfitOwner,
      totalProfitPenggarap,
      totalPotonganHutang,
      totalProfitOwnerSebelum,
      totalProfitPenggarapSebelum,
      produktivitas,
      sisaHutangAkhir,
      lunas,
    },
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}/lahan/${landId}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {lahan.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🌶️ {musim}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap.nama} &middot; {lahan.nama} ({luasLahan.toFixed(2)} Ha)
        </p>
      </div>

      {/* Tombol Download Invoice */}
      <div className="mb-4">
        <TombolDownloadInvoiceMusim data={invoiceData} />
      </div>

      {/* Ringkasan */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-orange-900 mb-4 text-lg">
          📊 Ringkasan Musim
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
            <div className="text-[10px] text-gray-500 uppercase">
              Total Panen
            </div>
            <div className="font-bold text-gray-900 text-lg">
              {panenList.length}x
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
            <div className="text-[10px] text-gray-500 uppercase">
              Total Hasil
            </div>
            <div className="font-bold text-green-700 text-lg">
              {formatKg(totalHasil)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
            <div className="text-[10px] text-gray-500 uppercase">
              Produktivitas
            </div>
            <div className="font-bold text-orange-700 text-lg">
              {produktivitas.toFixed(0)} Kg/Ha
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
            <div className="text-[10px] text-gray-500 uppercase">
              Profit Bersih
            </div>
            <div className="font-bold text-blue-700 text-sm">
              {formatRp(totalProfitBersih)}
            </div>
          </div>
        </div>

        {/* Keuangan */}
        <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-2 text-sm">
          <div className="flex justify-between gap-2 flex-wrap">
            <span className="text-gray-600">Pendapatan Kotor</span>
            <span className="font-medium break-all">
              {formatRp(totalPendapatan)}
            </span>
          </div>
          <div className="flex justify-between gap-2 flex-wrap">
            <span className="text-gray-600">Biaya Panen</span>
            <span className="text-red-600 break-all">
              − {formatRp(totalBiayaPanen)}
            </span>
          </div>
          {totalBiayaTambahan > 0 && (
            <div className="flex justify-between gap-2 flex-wrap">
              <span className="text-gray-600">Biaya Tambahan</span>
              <span className="text-red-600 break-all">
                − {formatRp(totalBiayaTambahan)}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2 flex-wrap pt-2 border-t border-gray-200 font-bold">
            <span className="text-green-800">💰 Profit Bersih</span>
            <span className="text-green-700 break-all text-lg">
              {formatRp(totalProfitBersih)}
            </span>
          </div>
        </div>
      </div>

      {/* Bagi Hasil — SEBELUM & SESUDAH Potong Hutang */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-base">
          💰 Bagi Hasil Musim
        </h2>

        {/* SEBELUM potong hutang */}
        {totalPotonganHutang > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 font-bold uppercase mb-2">
              Sebelum Potong Hutang
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-100 rounded-lg p-3 text-center min-w-0">
                <div className="text-xs text-gray-700 font-medium">
                  👤 Owner
                </div>
                <div className="font-bold text-gray-800 text-sm mt-1 break-all leading-tight">
                  {formatRp(totalProfitOwnerSebelum)}
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center min-w-0">
                <div className="text-xs text-gray-700 font-medium">
                  👨‍🌾 Penggarap
                </div>
                <div className="font-bold text-gray-800 text-sm mt-1 break-all leading-tight">
                  {formatRp(totalProfitPenggarapSebelum)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Potongan hutang */}
        {totalPotonganHutang > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
            <div className="flex justify-between gap-2 flex-wrap">
              <span className="text-red-800 font-medium">
                💸 Total Potong Hutang Musim
              </span>
              <span className="font-bold text-red-700 break-all">
                − {formatRp(totalPotonganHutang)}
              </span>
            </div>
            <div className="text-[10px] text-red-600 italic mt-1">
              Potongan diambil dari profit penggarap, dialihkan ke owner
            </div>
          </div>
        )}

        {/* SESUDAH potong hutang */}
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase mb-2">
            {totalPotonganHutang > 0
              ? "✅ Setelah Potong Hutang (Final)"
              : "✅ Bagi Hasil Final"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center min-w-0">
              <div className="text-xs text-green-800 font-medium">
                👤 OWNER
              </div>
              <div className="font-bold text-green-900 text-base mt-1 break-all leading-tight">
                {formatRp(totalProfitOwner)}
              </div>
            </div>
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center min-w-0">
              <div className="text-xs text-orange-800 font-medium">
                👨‍🌾 PENGGARAP
              </div>
              <div className="font-bold text-orange-900 text-base mt-1 break-all leading-tight">
                {formatRp(totalProfitPenggarap)}
              </div>
            </div>
          </div>
        </div>

        {/* Status Hutang */}
        <div
          className={`mt-4 rounded-lg p-3 text-center text-sm font-bold border-2 ${
            lunas
              ? "bg-green-100 border-green-300 text-green-900"
              : "bg-amber-100 border-amber-300 text-amber-900"
          }`}
        >
          {lunas ? "🎉 HUTANG LUNAS DI MUSIM INI" : `⚠️ Sisa Hutang: ${formatRp(sisaHutangAkhir)}`}
        </div>
      </div>

      {/* Tabel Detail 12 Panen */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-4">
          📅 Detail Panen ({panenList.length}x)
        </h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-2 text-gray-600 uppercase">
                  #
                </th>
                <th className="text-left py-2 px-2 text-gray-600 uppercase">
                  Tanggal
                </th>
                <th className="text-right py-2 px-2 text-gray-600 uppercase">
                  Hasil
                </th>
                <th className="text-right py-2 px-2 text-gray-600 uppercase">
                  Prod.
                </th>
                <th className="text-right py-2 px-2 text-gray-600 uppercase">
                  Profit Bersih
                </th>
                <th className="text-right py-2 px-2 text-gray-600 uppercase">
                  Owner
                </th>
                <th className="text-right py-2 px-2 text-gray-600 uppercase">
                  Penggarap
                </th>
                <th className="text-right py-2 px-2 text-gray-600 uppercase">
                  Potong Hutang
                </th>
              </tr>
            </thead>
            <tbody>
              {panenList.map((h, idx) => {
                const prod =
                  luasLahan > 0 ? Number(h.hasil_kg) / luasLahan : 0;
                const potong = Number(h.potongan_hutang || 0);
                const sisaHutang = Number(h.sisa_hutang_sesudah || 0);
                const lunasDiSini = potong > 0 && sisaHutang <= 0;

                return (
                  <tr
                    key={h.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2 font-medium text-gray-700">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-gray-700">
                      <Link
                        href={`/penggarap/${id}/lahan/${landId}/panen/${h.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {formatTanggal(h.tanggal)}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700">
                      {Number(h.hasil_kg).toLocaleString("id-ID")} Kg
                    </td>
                    <td className="py-2 px-2 text-right text-green-700 font-mono">
                      {prod.toFixed(0)} Kg/Ha
                    </td>
                    <td className="py-2 px-2 text-right text-blue-700">
                      {formatRp(Number(h.profit_bersih || 0))}
                    </td>
                    <td className="py-2 px-2 text-right text-green-700">
                      {formatRp(Number(h.profit_owner || 0))}
                    </td>
                    <td className="py-2 px-2 text-right text-orange-700">
                      {formatRp(Number(h.profit_penggarap || 0))}
                    </td>
                    <td className="py-2 px-2 text-right text-red-700">
                      {potong > 0 ? (
                        <div>
                          − {formatRp(potong)}
                          {lunasDiSini && (
                            <div className="text-[9px] text-green-700 font-bold">
                              🎉 LUNAS
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Baris TOTAL */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="py-2 px-2" colSpan={2}>
                  TOTAL
                </td>
                <td className="py-2 px-2 text-right">
                  {totalHasil.toLocaleString("id-ID")} Kg
                </td>
                <td className="py-2 px-2 text-right text-green-700 font-mono">
                  {produktivitas.toFixed(0)} Kg/Ha
                </td>
                <td className="py-2 px-2 text-right text-blue-700">
                  {formatRp(totalProfitBersih)}
                </td>
                <td className="py-2 px-2 text-right text-green-700">
                  {formatRp(totalProfitOwner)}
                </td>
                <td className="py-2 px-2 text-right text-orange-700">
                  {formatRp(totalProfitPenggarap)}
                </td>
                <td className="py-2 px-2 text-right text-red-700">
                  − {formatRp(totalPotonganHutang)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
