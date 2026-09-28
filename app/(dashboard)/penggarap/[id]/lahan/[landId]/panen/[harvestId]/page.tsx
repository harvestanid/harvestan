import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolAksiPanen } from "./tombol-aksi";
import { TombolDownloadInvoice } from "./tombol-download-invoice";

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

export default async function DetailPanenPage({
  params,
}: {
  params: Promise<{ id: string; landId: string; harvestId: string }>;
}) {
  const { id, landId, harvestId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: panen } = await supabase
    .from("harvests")
    .select("*")
    .eq("id", harvestId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!panen) redirect(`/penggarap/${id}/lahan/${landId}`);

  const { data: lahan } = await supabase
    .from("lands")
    .select("id, nama, luas")
    .eq("id", landId)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama, alamat, kontak")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  const potonganHutang = Number(panen.potongan_hutang || 0);
  const totalHutangSebelum = Number(panen.total_hutang_sebelum || 0);
  const sisaHutangSesudah = Number(panen.sisa_hutang_sesudah || 0);

  const persenOwner = Number(panen.persen_owner || 50);
  const persenPenggarap = Number(panen.persen_penggarap || 50);
  const profitBersih = Number(panen.profit_bersih || 0);

  const profitOwnerMurni = profitBersih * (persenOwner / 100);
  const profitPenggarapMurni = profitBersih * (persenPenggarap / 100);

  const profitOwnerFinal = Number(panen.profit_owner || 0);
  const profitPenggarapFinal = Number(panen.profit_penggarap || 0);

  // ===== PENYESUAIAN GABAH BAWA PULANG =====
  const bawaPenggarap = Number(panen.bawa_penggarap || 0);
  const bawaOwner = Number(panen.bawa_owner || 0);
  const bawaLain = Number(panen.bawa_lain || 0);
  const harga = Number(panen.harga_gabah || 0);

  const nilaiBawaPenggarap = bawaPenggarap * harga;
  const nilaiBawaOwner = bawaOwner * harga;
  const nilaiBawaLain = bawaLain * harga;
  const adaBawaPulang =
    nilaiBawaPenggarap > 0 || nilaiBawaOwner > 0 || nilaiBawaLain > 0;

  const profitOwnerSetelahBawa =
    profitOwnerMurni +
    nilaiBawaPenggarap -
    nilaiBawaOwner -
    nilaiBawaLain * 0.5;
  const profitPenggarapSetelahBawa =
    profitPenggarapMurni -
    nilaiBawaPenggarap +
    nilaiBawaOwner -
    nilaiBawaLain * 0.5;

  const log = Array.isArray(panen.potongan_hutang_log)
    ? panen.potongan_hutang_log
    : [];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}/lahan/${landId}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {lahan?.nama || "Lahan"}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🌾 Detail Panen
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap?.nama} &middot; {lahan?.nama}
        </p>
      </div>

      {/* TOMBOL DOWNLOAD PDF */}
      <div className="mb-4">
        <TombolDownloadInvoice
          panen={panen}
          penggarap={penggarap || { nama: "?", alamat: null, kontak: null }}
          lahan={lahan || { nama: "?", luas: 0 }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Tanggal</p>
            <p className="font-semibold mt-1">
              {new Date(panen.tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Komoditas</p>
            <p className="font-semibold mt-1">
              {KOMODITAS_LABEL[panen.komoditas] || panen.komoditas}
            </p>
            {panen.musim && (
              <p className="text-xs text-orange-600 font-medium mt-0.5">
                🗓️ Musim: {panen.musim}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase">Hasil</p>
            <p className="font-bold text-lg text-green-700 mt-1 break-words">
              {Number(panen.hasil_kg).toLocaleString("id-ID")} Kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Harga/Kg</p>
            <p className="font-semibold mt-1 break-words">
              {formatRp(panen.harga_gabah)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Produktivitas</p>
            <p className="font-semibold mt-1 break-words">
              {lahan && Number(lahan.luas) > 0
                ? (Number(panen.hasil_kg) / Number(lahan.luas)).toFixed(0)
                : "-"}{" "}
              Kg/Ha
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 uppercase mb-2">Perhitungan</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Pendapatan kotor:</div>
            <div className="text-right font-medium break-words">
              {formatRp(Number(panen.hasil_kg) * Number(panen.harga_gabah))}
            </div>
            <div>Biaya panen:</div>
            <div className="text-right text-red-600 break-words">
              −{" "}
              {formatRp(
                Number(panen.hasil_kg) * Number(panen.biaya_panen_per_kg)
              )}
            </div>
            {Number(panen.biaya_tambahan) > 0 && (
              <>
                <div>
                  Biaya tambahan{" "}
                  {panen.keterangan_biaya
                    ? `(${panen.keterangan_biaya})`
                    : ""}
                  :
                </div>
                <div className="text-right text-red-600 break-words">
                  − {formatRp(Number(panen.biaya_tambahan))}
                </div>
              </>
            )}
            <div className="font-bold pt-2 border-t col-span-2 flex justify-between gap-2 flex-wrap">
              <span>💰 Profit Bersih:</span>
              <span className="text-green-700 text-lg break-words">
                {formatRp(profitBersih)}
              </span>
            </div>
          </div>
        </div>

        {/* ===== BAGI HASIL DASAR ===== */}
        <div className="pt-4 border-t bg-gray-50 -mx-6 px-6 py-4">
          <p className="text-xs text-gray-500 uppercase mb-1">
            🧮 Bagi Hasil Dasar
          </p>
          <p className="text-[10px] text-gray-400 mb-3 italic">
            Skema: {persenOwner}:{persenPenggarap} dari profit bersih{" "}
            {formatRp(profitBersih)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-100 rounded-lg p-3 text-center min-w-0">
              <p className="text-xs text-green-800 font-medium">
                👤 OWNER ({persenOwner}%)
              </p>
              <p className="font-bold text-green-900 text-base mt-1 leading-tight break-words">
                {formatRp(profitOwnerMurni)}
              </p>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-center min-w-0">
              <p className="text-xs text-orange-800 font-medium">
                👨‍🌾 PENGGARAP ({persenPenggarap}%)
              </p>
              <p className="font-bold text-orange-900 text-base mt-1 leading-tight break-words">
                {formatRp(profitPenggarapMurni)}
              </p>
            </div>
          </div>
        </div>

        {/* ===== PENYESUAIAN GABAH BAWA PULANG ===== */}
        {adaBawaPulang && (
          <div className="pt-4 border-t">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <p className="text-sm text-orange-800 uppercase font-bold mb-2">
                🏠 Penyesuaian Gabah Bawa Pulang
              </p>
              <p className="text-[10px] text-orange-600 italic mb-3">
                Nilai gabah yang dibawa pulang dialihkan ke pihak lain (harga:{" "}
                {formatRp(harga)}/Kg)
              </p>

              <div className="space-y-2 text-sm mb-4">
                {nilaiBawaPenggarap > 0 && (
                  <div className="bg-white rounded-lg p-2.5 border border-orange-200">
                    <div className="flex justify-between font-medium text-orange-900 gap-2 flex-wrap">
                      <span>
                        👨‍🌾 Penggarap bawa {bawaPenggarap} Kg
                      </span>
                      <span className="font-mono break-words">
                        {formatRp(nilaiBawaPenggarap)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      → Owner{" "}
                      <span className="text-green-700 font-bold">
                        +{formatRp(nilaiBawaPenggarap)}
                      </span>
                      {" · "}
                      Penggarap{" "}
                      <span className="text-red-600 font-bold">
                        −{formatRp(nilaiBawaPenggarap)}
                      </span>
                    </div>
                  </div>
                )}
                {nilaiBawaOwner > 0 && (
                  <div className="bg-white rounded-lg p-2.5 border border-orange-200">
                    <div className="flex justify-between font-medium text-orange-900 gap-2 flex-wrap">
                      <span>👤 Owner bawa {bawaOwner} Kg</span>
                      <span className="font-mono break-words">
                        {formatRp(nilaiBawaOwner)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      → Penggarap{" "}
                      <span className="text-green-700 font-bold">
                        +{formatRp(nilaiBawaOwner)}
                      </span>
                      {" · "}
                      Owner{" "}
                      <span className="text-red-600 font-bold">
                        −{formatRp(nilaiBawaOwner)}
                      </span>
                    </div>
                  </div>
                )}
                {nilaiBawaLain > 0 && (
                  <div className="bg-white rounded-lg p-2.5 border border-orange-200">
                    <div className="flex justify-between font-medium text-orange-900 gap-2 flex-wrap">
                      <span>📦 Lainnya {bawaLain} Kg</span>
                      <span className="font-mono break-words">
                        {formatRp(nilaiBawaLain)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      → Masing-masing{" "}
                      <span className="text-red-600 font-bold">
                        −{formatRp(nilaiBawaLain * 0.5)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border-2 border-orange-300">
                <p className="text-xs font-bold text-orange-800 uppercase mb-2">
                  📊 Profit Setelah Penyesuaian Bawa Pulang
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center min-w-0">
                    <p className="text-xs text-green-800">👤 OWNER</p>
                    <p className="font-bold text-green-900 text-base break-words leading-tight">
                      {formatRp(profitOwnerSetelahBawa)}
                    </p>
                    <p className="text-[10px] text-gray-500 break-words">
                      {formatRp(profitOwnerMurni)} +{" "}
                      {formatRp(nilaiBawaPenggarap)} −{" "}
                      {formatRp(nilaiBawaOwner + nilaiBawaLain * 0.5)}
                    </p>
                  </div>
                  <div className="text-center min-w-0">
                    <p className="text-xs text-orange-800">👨‍🌾 PENGGARAP</p>
                    <p className="font-bold text-orange-900 text-base break-words leading-tight">
                      {formatRp(profitPenggarapSetelahBawa)}
                    </p>
                    <p className="text-[10px] text-gray-500 break-words">
                      {formatRp(profitPenggarapMurni)} −{" "}
                      {formatRp(nilaiBawaPenggarap)} +{" "}
                      {formatRp(nilaiBawaOwner)} −{" "}
                      {formatRp(nilaiBawaLain * 0.5)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== POTONGAN HUTANG (#8 highlight) ===== */}
        {potonganHutang > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <p className="text-sm text-red-700 uppercase font-bold">
                  💸 Potongan Hutang Otomatis
                </p>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  FITUR UNGGULAN
                </span>
              </div>

              <p className="text-[11px] text-red-700 italic mb-3">
                Profit penggarap otomatis dipotong untuk bayar hutang — owner
                menerima penggantinya.
              </p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between gap-2 flex-wrap">
                  <span className="text-gray-600">Hutang sebelum:</span>
                  <span className="font-medium break-words">
                    {formatRp(totalHutangSebelum)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 flex-wrap">
                  <span className="text-gray-600">
                    Dipotong dari profit penggarap:
                  </span>
                  <span className="font-bold text-red-600 break-words">
                    − {formatRp(potonganHutang)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t gap-2 flex-wrap">
                  <span className="text-gray-600 font-medium">
                    Sisa hutang:
                  </span>
                  <span
                    className={`font-bold break-words ${
                      sisaHutangSesudah > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {sisaHutangSesudah > 0
                      ? formatRp(sisaHutangSesudah)
                      : "LUNAS ✅"}
                  </span>
                </div>
              </div>

              <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                <p className="text-xs font-bold text-green-800 uppercase mb-2">
                  ✅ Total Diterima (Final)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200 min-w-0">
                    <p className="text-xs text-green-800 font-medium">
                      👤 OWNER
                    </p>
                    <p className="font-bold text-green-900 text-base mt-1 leading-tight break-words">
                      {formatRp(profitOwnerFinal)}
                    </p>
                    <p className="text-[10px] text-green-700 mt-1 break-words">
                      = {formatRp(profitOwnerSetelahBawa)} +{" "}
                      {formatRp(potonganHutang)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 min-w-0">
                    <p className="text-xs text-orange-800 font-medium">
                      👨‍🌾 PENGGARAP
                    </p>
                    <p className="font-bold text-orange-900 text-base mt-1 leading-tight break-words">
                      {formatRp(profitPenggarapFinal)}
                    </p>
                    <p className="text-[10px] text-orange-700 mt-1 break-words">
                      = {formatRp(profitPenggarapSetelahBawa)} −{" "}
                      {formatRp(potonganHutang)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-red-700 mt-3 italic">
                💡 Potongan hutang mengurangi profit penggarap dan menambah
                profit owner (karena hutang dibayar ke owner).
              </p>
            </div>
          </div>
        )}

        {/* ===== TOTAL FINAL TANPA POTONG HUTANG ===== */}
        {potonganHutang === 0 && (
          <div className="pt-4 border-t">
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <p className="text-xs font-bold text-green-800 uppercase mb-2">
                ✅ Total Diterima
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-green-200 min-w-0">
                  <p className="text-xs text-green-800 font-medium">👤 OWNER</p>
                  <p className="font-bold text-green-900 text-base mt-1 leading-tight break-words">
                    {formatRp(profitOwnerFinal)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-orange-200 min-w-0">
                  <p className="text-xs text-orange-800 font-medium">
                    👨‍🌾 PENGGARAP
                  </p>
                  <p className="font-bold text-orange-900 text-base mt-1 leading-tight break-words">
                    {formatRp(profitPenggarapFinal)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== INFO JIKA PUNYA HUTANG TAPI TIDAK DIPOTONG ===== */}
        {potonganHutang === 0 && totalHutangSebelum > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💡</span>
                <strong>Peluang Potong Hutang Otomatis</strong>
              </div>
              Saat panen ini, <strong>{penggarap?.nama}</strong> masih punya
              hutang <strong>{formatRp(totalHutangSebelum)}</strong> yang{" "}
              <strong>belum dipotong</strong>. Edit panen ini untuk mengaktifkan
              potong hutang otomatis.
            </div>
          </div>
        )}

        {/* ===== RIWAYAT PERUBAHAN HUTANG ===== */}
        {log.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 uppercase mb-3">
              📜 Riwayat Perubahan Hutang ({log.length})
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {log
                .slice()
                .reverse()
                .map((entry: any, i: number) => {
                  if (entry.aksi === "edit") {
                    return (
                      <div
                        key={i}
                        className="bg-blue-50 rounded-lg p-3 text-xs border border-blue-200"
                      >
                        <div className="font-bold text-blue-800 flex justify-between flex-wrap gap-1">
                          <span>✏️ Edit Panen</span>
                          <span className="text-blue-600 font-normal">
                            {new Date(entry.waktu).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="mt-2 text-blue-900">
                          Potongan lama:{" "}
                          <strong>
                            {formatRp(Number(entry.potongan_lama))}
                          </strong>{" "}
                          → Potongan baru:{" "}
                          <strong>
                            {formatRp(Number(entry.potongan_baru))}
                          </strong>
                        </div>
                        {entry.revert_log && entry.revert_log.length > 0 && (
                          <div className="mt-1 text-blue-700">
                            ↩️ Revert {entry.revert_log.length} hutang (
                            {formatRp(
                              entry.revert_log.reduce(
                                (s: number, r: any) =>
                                  s + Number(r.jumlah_direvert || 0),
                                0
                              )
                            )}
                            )
                          </div>
                        )}
                        {entry.potong_baru_log &&
                          entry.potong_baru_log.length > 0 && (
                            <div className="mt-0.5 text-red-700">
                              💸 Potong ulang {entry.potong_baru_log.length}{" "}
                              hutang
                            </div>
                          )}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={i}
                      className="bg-red-50 rounded-lg p-2.5 text-xs border border-red-200"
                    >
                      <div className="font-bold text-red-800 flex justify-between flex-wrap gap-1">
                        <span>💸 Potong Hutang</span>
                        <span className="text-red-600 font-normal">
                          {new Date(entry.waktu_potong).toLocaleString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <div className="mt-1 text-red-900">
                        Hutang {entry.tanggal_hutang}
                        {entry.keperluan ? ` (${entry.keperluan})` : ""} —{" "}
                        <strong>
                          {formatRp(Number(entry.jumlah_dipotong))}
                        </strong>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {panen.catatan && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 uppercase">Catatan</p>
            <p className="text-sm mt-1 text-gray-700">{panen.catatan}</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <TombolAksiPanen
            harvestId={panen.id}
            penggarapId={id}
            landId={landId}
            potonganHutang={potonganHutang}
          />
        </div>
      </div>
    </div>
  );
}
