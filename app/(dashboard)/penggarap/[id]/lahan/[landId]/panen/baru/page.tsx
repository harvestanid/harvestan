import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FormPanenFields } from "./form-client";

async function tambahPanen(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const penggarap_id = formData.get("penggarap_id") as string;
  const land_id = formData.get("land_id") as string;
  const tanggal = formData.get("tanggal") as string;
  const komoditas = (formData.get("komoditas") as string) || "padi";
  const musim = (formData.get("musim") as string) || null;

  const { canUserInput } = await import(
    "@/lib/supabase/queries/subscription-server"
  );
  const check = await canUserInput(user.id, "panen");
  if (!check.allowed) {
    redirect(
      `/penggarap/${penggarap_id}/lahan/${land_id}/panen/baru?error=${encodeURIComponent(
        check.reason || "Limit panen tercapai"
      )}`
    );
  }

  const hasil_kg = parseFloat(formData.get("hasil_kg") as string);
  const harga_gabah = parseFloat(formData.get("harga_gabah") as string);
  const biaya_panen_per_kg = parseFloat(
    formData.get("biaya_panen_per_kg") as string
  );
  const biaya_tambahan = parseFloat(
    (formData.get("biaya_tambahan") as string) || "0"
  );
  const keterangan_biaya =
    (formData.get("keterangan_biaya") as string) || null;
  const bawa_penggarap = parseFloat(
    (formData.get("bawa_penggarap") as string) || "0"
  );
  const bawa_owner = parseFloat(
    (formData.get("bawa_owner") as string) || "0"
  );
  const bawa_lain = parseFloat(
    (formData.get("bawa_lain") as string) || "0"
  );
  const persen_owner = parseFloat(
    (formData.get("persen_owner") as string) || "50"
  );
  const persen_penggarap = 100 - persen_owner;
  const catatan = (formData.get("catatan") as string) || null;
  const potong_hutang = formData.get("potong_hutang") === "on";

  if (!tanggal || isNaN(hasil_kg) || isNaN(harga_gabah)) {
    redirect(
      `/penggarap/${penggarap_id}/lahan/${land_id}/panen/baru?error=Data+tidak+lengkap`
    );
  }

  const pendapatan = hasil_kg * harga_gabah;
  const biaya_panen = hasil_kg * biaya_panen_per_kg;
  const total_biaya = biaya_panen + biaya_tambahan;
  const profit_bersih = pendapatan - total_biaya;

  let profit_owner = profit_bersih * (persen_owner / 100);
  let profit_penggarap = profit_bersih * (persen_penggarap / 100);

  const nilai_bawa_penggarap = bawa_penggarap * harga_gabah;
  const nilai_bawa_owner = bawa_owner * harga_gabah;
  const nilai_bawa_lain = bawa_lain * harga_gabah;

  profit_owner += nilai_bawa_penggarap;
  profit_penggarap -= nilai_bawa_penggarap;
  profit_penggarap += nilai_bawa_owner;
  profit_owner -= nilai_bawa_owner;
  profit_owner -= nilai_bawa_lain * 0.5;
  profit_penggarap -= nilai_bawa_lain * 0.5;

  let potongan_hutang = 0;
  let potongan_log: any[] = [];
  let total_hutang_sebelum = 0;
  let sisa_hutang_sesudah = 0;

  const { data: hutangList } = await supabase
    .from("debts")
    .select("*")
    .eq("penggarap_id", penggarap_id)
    .eq("user_id", user.id)
    .gt("sisa", 0)
    .order("tanggal", { ascending: true });

  total_hutang_sebelum = (hutangList || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  if (potong_hutang && total_hutang_sebelum > 0 && profit_penggarap > 0) {
    let sisaPotong = Math.min(profit_penggarap, total_hutang_sebelum);
    potongan_hutang = sisaPotong;
    const waktuPotong = new Date().toISOString();

    for (const h of hutangList || []) {
      if (sisaPotong <= 0) break;
      const sisaHutang = Number(h.sisa);
      const bayar = Math.min(sisaHutang, sisaPotong);
      const sisaBaru = sisaHutang - bayar;
      const dibayarBaru = Number(h.dibayar || 0) + bayar;

      const logEntry = {
        aksi: "potong_panen",
        waktu: waktuPotong,
        jumlah: bayar,
        sisa_sebelum: sisaHutang,
        sisa_sesudah: sisaBaru,
        keterangan: "Potong otomatis dari input panen",
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

      potongan_log.push({
        debt_id: h.id,
        jumlah_dipotong: bayar,
        tanggal_hutang: h.tanggal,
        keperluan: h.keperluan || null,
        waktu_potong: waktuPotong,
        aksi: "potong",
      });

      sisaPotong -= bayar;
    }

    profit_penggarap -= potongan_hutang;
    profit_owner += potongan_hutang;
    sisa_hutang_sesudah = Math.max(0, total_hutang_sebelum - potongan_hutang);
  } else {
    sisa_hutang_sesudah = total_hutang_sebelum;
  }

  const { error } = await supabase.from("harvests").insert({
    user_id: user.id,
    land_id,
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
    profit_owner,
    profit_penggarap,
    potongan_hutang,
    potongan_hutang_log: potongan_log,
    total_hutang_sebelum,
    sisa_hutang_sesudah,
    catatan,
  });

  if (error) {
    redirect(
      `/penggarap/${penggarap_id}/lahan/${land_id}/panen/baru?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/penggarap/${penggarap_id}/lahan/${land_id}`);
}

export default async function TambahPanenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; landId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, landId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { canUserInput } = await import(
    "@/lib/supabase/queries/subscription-server"
  );
  const checkPanen = await canUserInput(user.id, "panen");

  if (!checkPanen.allowed) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/penggarap/${id}/lahan/${landId}`}
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke Lahan
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            🌾 Tambah Panen
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Limit Panen Tercapai
          </h2>
          <p className="text-sm text-orange-800 mb-4 leading-relaxed max-w-md mx-auto">
            {checkPanen.reason}
          </p>

          <div className="bg-white rounded-xl p-4 my-4 inline-block border border-orange-200">
            <div className="text-xs text-gray-500 mb-1">Panen Anda</div>
            <div className="text-3xl font-bold text-orange-700">
              {checkPanen.currentCount} / {checkPanen.maxCount}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link
              href="/premium"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              💎 Upgrade — Rp 59.000
            </Link>
            <Link
              href="/demo"
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium px-6 py-3 rounded-xl transition border border-blue-200"
            >
              🎬 Lihat Demo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama, is_self")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!penggarap) redirect("/penggarap");

  const { data: lahan } = await supabase
    .from("lands")
    .select(
      "id, nama, luas, tipe_garap, nama_owner_external, persen_owner_default, persen_penggarap_default"
    )
    .eq("id", landId)
    .eq("user_id", user.id)
    .single();

  if (!lahan) redirect(`/penggarap/${id}`);

  const { data: musimList } = await supabase
    .from("musim_cabai")
    .select("id, nama, tanggal_mulai, tanggal_selesai")
    .eq("user_id", user.id)
    .order("nama");

  const { data: hutangAktif } = await supabase
    .from("debts")
    .select("id, sisa, tanggal, keperluan")
    .eq("penggarap_id", id)
    .eq("user_id", user.id)
    .gt("sisa", 0)
    .order("tanggal", { ascending: true });

  const totalHutang = (hutangAktif || []).reduce(
    (s, h) => s + Number(h.sisa || 0),
    0
  );

  const tipeGarap = (lahan as any).tipe_garap || "bagi_hasil_owner";
  const namaOwnerExternal = (lahan as any).nama_owner_external || null;
  const persenOwnerDefault = Number(
    (lahan as any).persen_owner_default || 50
  );
  const persenPenggarapDefault = Number(
    (lahan as any).persen_penggarap_default || 50
  );

  const isMandiri = tipeGarap === "mandiri";
  const isPenggarap = tipeGarap === "bagi_hasil_penggarap";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}/lahan/${landId}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {lahan.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🌾 Input Panen Baru
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {penggarap.nama} &middot; {lahan.nama} ({lahan.luas} Ha)
        </p>
      </div>

      {/* Info tipe garap */}
      {isMandiri && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🌱</span>
            <div className="text-xs text-green-800 leading-relaxed">
              <strong>Garap Sendiri</strong> — semua profit panen ini{" "}
              <strong>100% untuk penggarap</strong>. Field bagi hasil
              disembunyikan.
            </div>
          </div>
        </div>
      )}

      {isPenggarap && namaOwnerExternal && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="text-xs text-orange-800 leading-relaxed">
              Lahan ini milik <strong>{namaOwnerExternal}</strong>. Profit akan
              dibagi sesuai skema.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {totalHutang > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">💰</div>
            <div className="flex-1">
              <div className="font-bold text-red-900 text-sm mb-1">
                Hutang Aktif: Rp {totalHutang.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-red-800">
                Akan otomatis dipotong dari profit penggarap kalau dicentang
                di form di bawah.
              </p>
            </div>
          </div>
        </div>
      )}

      <form
        action={tambahPanen}
        className="bg-white rounded-xl shadow-sm p-6 space-y-5"
      >
        <input type="hidden" name="penggarap_id" value={id} />
        <input type="hidden" name="land_id" value={landId} />

        <FormPanenFields
          hargaDefault={5000}
          biayaDefault={400}
          totalHutang={totalHutang}
          musimList={musimList || []}
          tipeGarap={tipeGarap}
          namaOwnerExternal={namaOwnerExternal}
          persenOwnerDefault={persenOwnerDefault}
          persenPenggarapDefault={persenPenggarapDefault}
        />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-3 rounded-lg transition flex-1"
          >
            💾 Simpan Panen
          </button>
          <Link
            href={`/penggarap/${id}/lahan/${landId}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
