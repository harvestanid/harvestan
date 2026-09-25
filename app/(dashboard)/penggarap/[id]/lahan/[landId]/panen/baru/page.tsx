import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
  const hasil_kg = parseFloat(formData.get("hasil_kg") as string);
  const harga_gabah = parseFloat(formData.get("harga_gabah") as string);
  const biaya_panen_per_kg = parseFloat(formData.get("biaya_panen_per_kg") as string) || 0;
  const biaya_tambahan = parseFloat(formData.get("biaya_tambahan") as string) || 0;
  const keterangan_biaya = (formData.get("keterangan_biaya") as string) || null;
  const bawa_penggarap = parseFloat(formData.get("bawa_penggarap") as string) || 0;
  const bawa_owner = parseFloat(formData.get("bawa_owner") as string) || 0;
  const bawa_lain = parseFloat(formData.get("bawa_lain") as string) || 0;
  const persen_owner = parseFloat(formData.get("persen_owner") as string) || 50;
  const catatan = (formData.get("catatan") as string) || null;

  const redirectBase = `/penggarap/${penggarap_id}/lahan/${land_id}`;

  if (!tanggal || isNaN(hasil_kg) || isNaN(harga_gabah)) {
    redirect(`${redirectBase}/panen/baru?error=Data+tidak+lengkap`);
  }

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
    catatan,
  });

  if (error) {
    redirect(`${redirectBase}/panen/baru?error=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectBase);
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

  const today = new Date().toISOString().split("T")[0];

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
          🌾 Input Panen
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

      <form action={tambahPanen} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
              defaultValue={today}
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
              step="0.01"
              min="0.01"
              required
              placeholder="Contoh: 3500"
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
              step="1"
              min="0"
              defaultValue="5000"
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
              step="1"
              min="0"
              defaultValue="400"
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
              step="1000"
              min="0"
              defaultValue="0"
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
            placeholder="Contoh: Sewa mesin, transport"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 Skema Bagi Hasil
          </label>
          <select
            name="persen_owner"
            defaultValue="50"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="50">50 : 50 (Owner : Penggarap)</option>
            <option value="60">60 : 40 (Owner : Penggarap)</option>
            <option value="70">70 : 30 (Owner : Penggarap)</option>
            <option value="100">100 : 0 (Owner garap sendiri)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Persen penggarap otomatis = 100 − persen owner
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              🌾 Penggarap bawa (Kg)
            </label>
            <input
              type="number"
              name="bawa_penggarap"
              step="1"
              min="0"
              defaultValue="0"
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
              step="1"
              min="0"
              defaultValue="0"
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
              step="1"
              min="0"
              defaultValue="0"
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan
          </label>
          <textarea
            name="catatan"
            rows={2}
            placeholder="Catatan tambahan (opsional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-900">
          <strong>💡 Auto-hitung:</strong> Profit bersih = (Hasil × Harga) − (Hasil × Biaya/kg) − Biaya tambahan.
          Dibagi ke owner & penggarap sesuai skema.
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            💾 Simpan Panen
          </button>
          <Link
            href={`/penggarap/${id}/lahan/${landId}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
