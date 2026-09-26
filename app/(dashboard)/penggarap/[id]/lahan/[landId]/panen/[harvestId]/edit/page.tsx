import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SkemaBagiHasilV2 } from "@/components/skema-bagi-hasil-v2";

async function editPanen(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const harvest_id = formData.get("harvest_id") as string;
  const penggarap_id = formData.get("penggarap_id") as string;
  const land_id = formData.get("land_id") as string;
  const tanggal = formData.get("tanggal") as string;
  const komoditas = (formData.get("komoditas") as string) || "padi";
  const musim = (formData.get("musim") as string) || null;
  const hasil_kg = parseFloat(formData.get("hasil_kg") as string);
  const harga_gabah = parseFloat(formData.get("harga_gabah") as string);
  const biaya_panen_per_kg =
    parseFloat(formData.get("biaya_panen_per_kg") as string) || 0;
  const biaya_tambahan =
    parseFloat(formData.get("biaya_tambahan") as string) || 0;
  const keterangan_biaya = (formData.get("keterangan_biaya") as string) || null;
  const bawa_penggarap =
    parseFloat(formData.get("bawa_penggarap") as string) || 0;
  const bawa_owner = parseFloat(formData.get("bawa_owner") as string) || 0;
  const bawa_lain = parseFloat(formData.get("bawa_lain") as string) || 0;
  const persen_owner = parseFloat(formData.get("persen_owner") as string) || 50;
  const catatan = (formData.get("catatan") as string) || null;
  const potongHutang = formData.get("potong_hutang") === "on";

  const redirectBase = `/penggarap/${penggarap_id}/lahan/${land_id}`;
  const editBase = `${redirectBase}/panen/${harvest_id}`;

  if (!tanggal || isNaN(hasil_kg) || isNaN(harga_gabah)) {
    redirect(`${editBase}/edit?error=Data+tidak+lengkap`);
  }

  if (persen_owner < 0 || persen_owner > 100) {
    redirect(`${editBase}/edit?error=Persen+owner+harus+0-100`);
  }

  // Ambil data panen LAMA
  const { data: panenLama } = await supabase
    .from("harvests")
    .select("*")
    .eq("id", harvest_id)
    .single();

  if (!panenLama) {
    redirect(redirectBase);
  }

  const potonganHutangLama = Number(panenLama.potongan_hutang || 0);
  const wasPotongHutang = potonganHutangLama > 0;

  // ========== STEP 1: REVERT potongan hutang lama (kalau ada) ==========
  const revertLog: Array<{
    debt_id: string;
    jumlah_direvert: number;
    waktu_revert: string;
    aksi: string;
  }> = [];

  if (wasPotongHutang) {
    const { data: hutangList } = await supabase
      .from("debts")
      .select("*")
      .eq("penggarap_id", penggarap_id)
      .eq("user_id", user.id)
      .order("tanggal", { ascending: false });

    let sisaRevert = potonganHutangLama;
    const waktuRevert = new Date().toISOString();

    for (const h of hutangList || []) {
      if (sisaRevert <= 0) break;

      const dibayarLama = Number(h.dibayar || 0);
      const sisaLama = Number(h.sisa || 0);
      const revertAmount = Math.min(dibayarLama, sisaRevert);

      if (revertAmount <= 0) continue;

      const logEntry = {
        aksi: "revert_edit_panen",
        waktu: waktuRevert,
        jumlah: revertAmount,
        sisa_sebelum: sisaLama,
        sisa_sesudah: sisaLama + revertAmount,
        keterangan: "Revert karena edit panen",
      };

      const logLama = Array.isArray(h.log_perubahan) ? h.log_perubahan : [];
      const logBaru = [...logLama, logEntry];

      await supabase
        .from("debts")
        .update({
          dibayar: dibayarLama - revertAmount,
          sisa: sisaLama + revertAmount,
          log_perubahan: logBaru,
        })
        .eq("id", h.id);

      revertLog.push({
        debt_id: h.id,
        jumlah_direvert: revertAmount,
        waktu_revert: waktuRevert,
        aksi: "revert",
      });

      sisaRevert -= revertAmount;
    }
  }

  // ========== STEP 2: HITUNG PROFIT BARU ==========
  const persen_penggarap = 100 - persen_owner;
  const pendapatan = hasil_kg * harga_gabah;
  const totalBiaya = hasil_kg * biaya_panen_per_kg + biaya_tambahan;
  const profit_bersih = pendapatan - totalBiaya;

  let profit_owner = 0;
  let profit_penggarap = 0;
  if (profit_bersih > 0) {
    profit_owner = profit_bersih * (persen_owner / 100);
    profit_penggarap = profit_bersih * (persen_penggarap / 100);
  }

  const { data: hutangAktifSekarang } = await supabase
    .from("debts")
    .select("*")
    .eq("penggarap_id", penggarap_id)
    .eq("user_id", user.id)
    .gt("sisa", 0)
    .order("tanggal", { ascending: true });

  const totalHutangSebelum = (hutangAktifSekarang || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  let potonganHutangBaru = 0;
  let profitPenggarapFinal = profit_penggarap;
  let profitOwnerFinal = profit_owner;
  const potonganLogBaru: Array<{
    debt_id: string;
    jumlah_dipotong: number;
    tanggal_hutang: string;
    keperluan: string | null;
    waktu_potong: string;
    aksi: string;
  }> = [];

  if (potongHutang && totalHutangSebelum > 0 && profit_penggarap > 0) {
    let sisaPotong = Math.min(profit_penggarap, totalHutangSebelum);
    potonganHutangBaru = sisaPotong;
    const waktuPotong = new Date().toISOString();

    for (const h of hutangAktifSekarang || []) {
      if (sisaPotong <= 0) break;
      const sisaHutang = Number(h.sisa);
      const bayar = Math.min(sisaHutang, sisaPotong);
      const sisaBaru = sisaHutang - bayar;
      const dibayarBaru = Number(h.dibayar || 0) + bayar;

      const logEntry = {
        aksi: "potong_edit_panen",
        waktu: waktuPotong,
        jumlah: bayar,
        sisa_sebelum: sisaHutang,
        sisa_sesudah: sisaBaru,
        keterangan: "Potong otomatis setelah edit panen",
      };

      const logLama = Array.isArray(h.log_perubahan) ? h.log_perubahan : [];
      const logBaru = [...logLama, logEntry];

      await supabase
        .from("debts")
        .update({
          dibayar: dibayarBaru,
          sisa: sisaBaru,
          log_perubahan: logBaru,
        })
        .eq("id", h.id);

      potonganLogBaru.push({
        debt_id: h.id,
        jumlah_dipotong: bayar,
        tanggal_hutang: h.tanggal,
        keperluan: h.keperluan || null,
        waktu_potong: waktuPotong,
        aksi: "potong_ulang",
      });

      sisaPotong -= bayar;
    }

    profitPenggarapFinal = profit_penggarap - potonganHutangBaru;
    profitOwnerFinal = profit_owner + potonganHutangBaru;
  }

  const totalHutangSesudah = Math.max(
    0,
    totalHutangSebelum - potonganHutangBaru
  );

  // Log panen
  const panenLogLama = Array.isArray(panenLama.potongan_hutang_log)
    ? panenLama.potongan_hutang_log
    : [];

  const logEntry = {
    aksi: "edit",
    waktu: new Date().toISOString(),
    revert_log: revertLog,
    potong_baru_log: potonganLogBaru,
    potongan_lama: potonganHutangLama,
    potongan_baru: potonganHutangBaru,
    user_centang: potongHutang,
  };

  const panenLogBaru = [...panenLogLama, logEntry];

  const { error } = await supabase
    .from("harvests")
    .update({
      tanggal,
      komoditas,
      musim,
      hasil_kg,
      harga_gabah,
      harga_per_kg: harga_gabah,
      biaya_panen_per_kg,
      biaya_tambahan,
      keterangan_biaya,
      bawa_penggarap,
      bawa_owner,
      bawa_lain,
      persen_owner,
      persen_penggarap,
      profit_bersih,
      profit_owner: profitOwnerFinal,
      profit_penggarap: profitPenggarapFinal,
      potongan_hutang: potonganHutangBaru,
      potongan_hutang_log: panenLogBaru,
      total_hutang_sebelum: totalHutangSebelum,
      sisa_hutang_sesudah: totalHutangSesudah,
      catatan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", harvest_id);

  if (error) {
    redirect(`${editBase}/edit?error=${encodeURIComponent(error.message)}`);
  }

  redirect(editBase);
}

export default async function EditPanenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; landId: string; harvestId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, landId, harvestId } = await params;
  const { error } = await searchParams;

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

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .single();

  const { data: lahan } = await supabase
    .from("lands")
    .select("id, nama, luas")
    .eq("id", landId)
    .single();

  if (!penggarap || !lahan) redirect(`/penggarap/${id}`);

  const { data: hutangAktif } = await supabase
    .from("debts")
    .select("*")
    .eq("penggarap_id", id)
    .eq("user_id", user.id)
    .gt("sisa", 0)
    .order("tanggal", { ascending: true });

  const totalHutangAktif = (hutangAktif || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  const potonganHutangLama = Number(panen.potongan_hutang || 0);
  const wasPotongHutang = potonganHutangLama > 0;

  function formatRp(n: number) {
    return "Rp " + Math.round(n).toLocaleString("id-ID");
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}/lahan/${landId}/panen/${harvestId}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Detail Panen
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          ✏️ Edit Panen
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap.nama} &middot; {lahan.nama} ({lahan.luas} Ha)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {wasPotongHutang && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800">
          ℹ️ Panen ini sebelumnya memotong hutang{" "}
          <strong>{formatRp(potonganHutangLama)}</strong>.
          <br />
          Ubah centang di bawah untuk menyesuaikan.
        </div>
      )}

      {totalHutangAktif > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-bold text-red-800 text-sm">
                ⚠️ {penggarap.nama} punya hutang aktif
              </div>
              <div className="text-xs text-red-700 mt-1">
                Total: <strong>{formatRp(totalHutangAktif)}</strong> (
                {hutangAktif?.length} hutang)
              </div>
            </div>
          </div>
        </div>
      )}

      <form
        action={editPanen}
        className="bg-white rounded-xl shadow-sm p-6 space-y-4"
      >
        <input type="hidden" name="harvest_id" value={harvestId} />
        <input type="hidden" name="penggarap_id" value={id} />
        <input type="hidden" name="land_id" value={landId} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal"
              defaultValue={panen.tanggal}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Komoditas <span className="text-red-500">*</span>
            </label>
            <select
              name="komoditas"
              defaultValue={panen.komoditas || "padi"}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="padi">🌾 Padi</option>
              <option value="jagung">🌽 Jagung</option>
              <option value="kacang_tanah">🥜 Kacang Tanah</option>
              <option value="bawang_merah">🧅 Bawang Merah</option>
              <option value="cabai_rawit">🌶️ Cabai Rawit</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasil Panen (Kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="hasil_kg"
              step="any"
              min="0.01"
              defaultValue={panen.hasil_kg}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga per Kg (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="harga_gabah"
              step="any"
              min="0"
              defaultValue={panen.harga_gabah}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biaya Panen per Kg (Rp)
            </label>
            <input
              type="number"
              name="biaya_panen_per_kg"
              step="any"
              min="0"
              defaultValue={panen.biaya_panen_per_kg}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biaya Tambahan (Rp)
            </label>
            <input
              type="number"
              name="biaya_tambahan"
              step="any"
              min="0"
              defaultValue={panen.biaya_tambahan || 0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keterangan Biaya Tambahan
          </label>
          <input
            type="text"
            name="keterangan_biaya"
            defaultValue={panen.keterangan_biaya || ""}
            placeholder="Contoh: Sewa mesin, transport"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* ===== SKEMA BAGI HASIL (PAKAI KOMPONEN BARU) ===== */}
        <SkemaBagiHasilV2 />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              🌾 Penggarap bawa (Kg)
            </label>
            <input
              type="number"
              name="bawa_penggarap"
              step="any"
              min="0"
              defaultValue={panen.bawa_penggarap || 0}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              🏠 Owner bawa (Kg)
            </label>
            <input
              type="number"
              name="bawa_owner"
              step="any"
              min="0"
              defaultValue={panen.bawa_owner || 0}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              📦 Lainnya (Kg)
            </label>
            <input
              type="number"
              name="bawa_lain"
              step="any"
              min="0"
              defaultValue={panen.bawa_lain || 0}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
        </div>

        {(totalHutangAktif > 0 || wasPotongHutang) && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="potong_hutang"
                defaultChecked={wasPotongHutang}
                className="mt-1 w-5 h-5 accent-red-600"
              />
              <div className="flex-1">
                <div className="font-bold text-yellow-900 text-sm">
                  💸 Potong Hutang dari Profit Penggarap
                </div>
                <div className="text-xs text-yellow-800 mt-1">
                  {totalHutangAktif > 0 ? (
                    <>
                      Otomatis potong profit penggarap sebesar{" "}
                      <strong>{formatRp(totalHutangAktif)}</strong> (atau
                      sampai profit habis).
                    </>
                  ) : (
                    <>
                      Saat ini <strong>tidak ada hutang aktif</strong>.
                      Centang jika Anda ingin tetap coba potong.
                    </>
                  )}
                </div>
                {hutangAktif && hutangAktif.length > 0 && (
                  <div className="mt-2 text-xs bg-white rounded-lg p-2 border border-yellow-200">
                    <div className="font-medium text-gray-700 mb-1">
                      Hutang yang akan dipotong:
                    </div>
                    {hutangAktif.map((h) => (
                      <div
                        key={h.id}
                        className="flex justify-between text-gray-600 py-0.5"
                      >
                        <span>
                          📅{" "}
                          {new Date(h.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {h.keperluan ? ` — ${h.keperluan}` : ""}
                        </span>
                        <span className="font-bold text-red-600">
                          {formatRp(Number(h.sisa))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {wasPotongHutang && (
                  <div className="mt-2 text-[11px] text-orange-700 bg-orange-50 rounded p-1.5 border border-orange-200">
                    ⚠️ Panen ini sebelumnya memotong{" "}
                    {formatRp(potonganHutangLama)}. Uncheck untuk{" "}
                    <strong>mengembalikan</strong> potongan tersebut.
                  </div>
                )}
              </div>
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan
          </label>
          <textarea
            name="catatan"
            rows={2}
            defaultValue={panen.catatan || ""}
            placeholder="Catatan tambahan (opsional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-900">
          <strong>💡 Cara kerja:</strong>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>
              <strong>Centang</strong>: potong hutang dari profit penggarap
              baru
            </li>
            <li>
              <strong>Uncheck</strong>: kembalikan hutang yang pernah dipotong
              panen ini
            </li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            💾 Simpan Perubahan
          </button>
          <Link
            href={`/penggarap/${id}/lahan/${landId}/panen/${harvestId}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
