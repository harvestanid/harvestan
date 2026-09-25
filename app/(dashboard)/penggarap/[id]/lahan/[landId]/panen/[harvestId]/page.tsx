import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TombolAksiPanen } from "./tombol-aksi";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
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

  const { data: panen } = await supabase
    .from("harvests")
    .select("*")
    .eq("id", harvestId)
    .single();

  if (!panen) redirect(`/penggarap/${id}/lahan/${landId}`);

  const { data: lahan } = await supabase
    .from("lands")
    .select("id, nama, luas")
    .eq("id", landId)
    .single();

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .single();

  const potonganHutang = Number(panen.potongan_hutang || 0);
  const totalHutangSebelum = Number(panen.total_hutang_sebelum || 0);
  const sisaHutangSesudah = Number(panen.sisa_hutang_sesudah || 0);

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
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase">Hasil</p>
            <p className="font-bold text-lg text-green-700 mt-1">
              {Number(panen.hasil_kg).toLocaleString("id-ID")} Kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Harga/Kg</p>
            <p className="font-semibold mt-1">{formatRp(panen.harga_gabah)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Produktivitas</p>
            <p className="font-semibold mt-1">
              {lahan
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
            <div className="text-right font-medium">
              {formatRp(Number(panen.hasil_kg) * Number(panen.harga_gabah))}
            </div>
            <div>Biaya panen:</div>
            <div className="text-right text-red-600">
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
                <div className="text-right text-red-600">
                  − {formatRp(Number(panen.biaya_tambahan))}
                </div>
              </>
            )}
            <div className="font-bold pt-2 border-t col-span-2 flex justify-between">
              <span>💰 Profit Bersih:</span>
              <span className="text-green-700 text-lg">
                {formatRp(Number(panen.profit_bersih))}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t bg-gray-50 -mx-6 px-6 py-4">
          <p className="text-xs text-gray-500 uppercase mb-2">Bagi Hasil</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-100 rounded-lg p-3 text-center">
              <p className="text-xs text-green-800 font-medium">
                👤 OWNER ({panen.persen_owner}%)
              </p>
              <p className="font-bold text-green-900 text-lg mt-1">
                {formatRp(Number(panen.profit_owner))}
              </p>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-800 font-medium">
                👨‍🌾 PENGGARAP ({panen.persen_penggarap}%)
              </p>
              <p className="font-bold text-orange-900 text-lg mt-1">
                {formatRp(Number(panen.profit_penggarap))}
              </p>
            </div>
          </div>
        </div>

        {/* Potongan Hutang */}
        {potonganHutang > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-700 uppercase font-bold mb-2">
                💸 Potongan Hutang Otomatis
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hutang sebelum:</span>
                  <span className="font-medium">
                    {formatRp(totalHutangSebelum)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dipotong dari profit:</span>
                  <span className="font-bold text-red-600">
                    − {formatRp(potonganHutang)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600 font-medium">
                    Sisa hutang:
                  </span>
                  <span
                    className={`font-bold ${
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
              <p className="text-xs text-red-700 mt-2 italic">
                Potongan ini mengurangi profit penggarap dan menambah profit
                owner (karena hutang dibayar ke owner).
              </p>
            </div>
          </div>
        )}

        {potonganHutang === 0 && totalHutangSebelum > 0 && (
          <div className="pt-4 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              ℹ️ Saat panen ini, {penggarap?.nama} masih punya hutang{" "}
              <strong>{formatRp(totalHutangSebelum)}</strong> (tidak dipotong).
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
          />
        </div>
      </div>
    </div>
  );
}
