import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolAksiPanen } from "./tombol-aksi";
import { TombolDownloadInvoice } from "./tombol-download-invoice";
import { TombolSharePanen } from "@/components/tombol-share-panen";

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
    .select("id, nama, luas, polygon, lokasi_koordinat")
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

  const { data: hutangAktifSekarang } = await supabase
    .from("debts")
    .select("id, sisa")
    .eq("penggarap_id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .gt("sisa", 0);

  const adaHutangSekarang = (hutangAktifSekarang || []).length > 0;
  const totalHutangSekarang = (hutangAktifSekarang || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  const log = Array.isArray(panen.potongan_hutang_log)
    ? panen.potongan_hutang_log
    : [];

  const luasLahan = Number(lahan?.luas || 0);
  const hasilKg = Number(panen.hasil_kg || 0);
  const produktivitas = luasLahan > 0 ? hasilKg / luasLahan : 0;

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

      <div className="mb-4 flex flex-wrap gap-2">
        <TombolSharePanen
          komoditas={panen.komoditas || "padi"}
          komoditasLabel={
            KOMODITAS_LABEL[panen.komoditas] || panen.komoditas || "Padi"
          }
          hasilKg={hasilKg}
          luasHa={luasLahan}
          produktivitas={produktivitas}
          hargaJual={harga}
          tanggal={panen.tanggal}
          namaPenggarap={penggarap?.nama || null}
          namaLahan={lahan?.nama || null}
          profitOwner={profitOwnerFinal}
          profitPenggarap={profitPenggarapFinal}
          polygon={(lahan?.polygon as any) || null}
          koordinat={lahan?.lokasi_koordinat || null}
        />
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

        {/* BAGI HASIL DASAR */}
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
              <p className="font-bold text-green-900 text-sm mt-1 leading-tight break-all">
                {formatRp(profitOwnerMurni)}
              </p>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-center min-w-0">
              <p className="text-xs text-orange-800 font-medium">
                👨‍🌾 PENGGARAP ({persenPenggarap}%)
              </p>
              <p className="font-bold text-orange-900 text-sm mt-1 leading-tight break-all">
                {formatRp(profitPenggarapMurni)}
              </p>
            </div>
          </div>
        </div>

        {/* PENYESUAIAN GABAH BAWA PULANG */}
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
                      <span className="font-mono break-all">
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
                      <span className="font-mono break-all">
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
                      <span className="font-mono break-all">
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
                    <p className="font-bold text-green-900 text-sm break-all leading-tight">
                      {formatRp(profitOwnerSetelahBawa)}
                    </p>
                  </div>
                  <div className="text-center min-w-0">
                    <p className="text-xs text-orange-800">👨‍🌾 PENGGARAP</p>
                    <p className="font-bold text-orange-900 text-sm break-all leading-tight">
                      {formatRp(profitPenggarapSetelahBawa)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ POTONG HUTANG — SELALU TAMPIL */}
        <div className="pt-4 border-t">
          <div
            className={`border-2 rounded-xl p-4 ${
              potonganHutang > 0
                ? "bg-red-50 border-red-300"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p
                className={`text-sm uppercase font-bold ${
                  potonganHutang > 0 ? "text-red-700" : "text-blue-700"
                }`}
              >
                💸 Potong Hutang Otomatis
              </p>
              {potonganHutang > 0 ? (
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                  FITUR UNGGULAN
                </span>
              ) : (
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                  FITUR PREMIUM
                </span>
              )}
            </div>

            {potonganHutang > 0 ? (
              <>
                <p className="text-[11px] text-red-700 italic mb-3">
                  Profit penggarap otomatis dipotong untuk bayar hutang — owner
                  menerima penggantinya.
                </p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <span className="text-gray-600">Hutang sebelum:</span>
                    <span className="font-medium break-all">
                      {formatRp(totalHutangSebelum)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 flex-wrap">
                    <span className="text-gray-600">
                      Dipotong dari profit penggarap:
                    </span>
                    <span className="font-bold text-red-600 break-all">
                      − {formatRp(potonganHutang)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t gap-2 flex-wrap">
                    <span className="text-gray-600 font-medium">
                      Sisa hutang:
                    </span>
                    <span
                      className={`font-bold break-all ${
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
                      <p className="font-bold text-green-900 text-sm mt-1 leading-tight break-all">
                        {formatRp(profitOwnerFinal)}
                      </p>
                      <p className="text-[10px] text-green-700 mt-1 break-all">
                        = {formatRp(profitOwnerSetelahBawa)} +{" "}
                        {formatRp(potonganHutang)}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 min-w-0">
                      <p className="text-xs text-orange-800 font-medium">
                        👨‍🌾 PENGGARAP
                      </p>
                      <p className="font-bold text-orange-900 text-sm mt-1 leading-tight break-all">
                        {formatRp(profitPenggarapFinal)}
                      </p>
                      <p className="text-[10px] text-orange-700 mt-1 break-all">
                        = {formatRp(profitPenggarapSetelahBawa)} −{" "}
                        {formatRp(potonganHutang)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : adaHutangSekarang || totalHutangSebelum > 0 ? (
              <>
                <p className="text-[11px] text-blue-700 italic mb-3">
                  Panen ini <strong>tidak</strong> memotong hutang. Tapi
                  penggarap masih punya hutang aktif yang bisa dipotong
                  otomatis.
                </p>

                <div className="bg-white rounded-lg p-3 border border-blue-200 mb-3">
                  <div className="flex justify-between gap-2 text-sm flex-wrap">
                    <span className="text-gray-600">
                      Hutang aktif saat ini:
                    </span>
                    <span className="font-bold text-red-600 break-all">
                      {formatRp(totalHutangSekarang || totalHutangSebelum)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-blue-800">
                  💡 <strong>Cara aktifkan:</strong> Klik{" "}
                  <strong>Edit Panen</strong> di bawah → centang{" "}
                  <strong>"Potong Hutang Otomatis"</strong> → simpan.
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] text-blue-700 italic mb-3">
                  Fitur ini akan{" "}
                  <strong>otomatis memotong hutang penggarap</strong> dari hasil
                  panen kalau penggarap punya hutang aktif.
                </p>

                <div className="bg-white rounded-lg p-3 border border-green-200 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 text-lg">✅</span>
                    <span className="text-green-800 font-medium">
                      {penggarap?.nama} tidak punya hutang aktif saat ini
                    </span>
                  </div>
                </div>

                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-bold">💡 Cara kerja fitur:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Penggarap punya hutang (misal beli pupuk)</li>
                    <li>Saat panen, profit penggarap otomatis dipotong</li>
                    <li>Hutang berkurang, owner terima pengganti</li>
                    <li>Tidak perlu bayar manual lagi ✅</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIWAYAT PERUBAHAN HUTANG */}
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
                            {entry.waktu
                              ? new Date(entry.waktu).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div className="mt-2 text-blue-900">
                          Potongan lama:{" "}
                          <strong>
                            {formatRp(Number(entry.potongan_lama || 0))}
                          </strong>{" "}
                          → Potongan baru:{" "}
                          <strong>
                            {formatRp(Number(entry.potongan_baru || 0))}
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
                      </div>
                    );
                  }
                  const jumlah =
                    entry.jumlah !== undefined
                      ? Number(entry.jumlah)
                      : entry.jumlah_dipotong !== undefined
                      ? Number(entry.jumlah_dipotong)
                      : 0;

                  const tanggalHutang = entry.tanggal_hutang || "-";
                  const keperluan = entry.keperluan || "";

                  return (
                    <div
                      key={i}
                      className="bg-red-50 rounded-lg p-2.5 text-xs border border-red-200"
                    >
                      <div className="font-bold text-red-800 flex justify-between flex-wrap gap-1">
                        <span>💸 Potong Hutang</span>
                        <span className="text-red-600 font-normal">
                          {entry.waktu_potong
                            ? new Date(entry.waktu_potong).toLocaleString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "-"}
                        </span>
                      </div>
                      <div className="mt-1 text-red-900">
                        Hutang {tanggalHutang}
                        {keperluan ? ` (${keperluan})` : ""} —{" "}
                        <strong>{formatRp(jumlah)}</strong>
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
