import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  canUserInput,
  checkPremiumStatus,
} from "@/lib/supabase/queries/subscription-server";

async function tambahLahan(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const penggarap_id = formData.get("penggarap_id") as string;
  const nama = formData.get("nama") as string;
  const luas = parseFloat(formData.get("luas") as string);
  const lokasi_koordinat = formData.get("lokasi_koordinat") as string;
  const polygonStr = formData.get("polygon") as string;

  if (!penggarap_id || !nama || isNaN(luas)) {
    redirect(`/penggarap/${penggarap_id}/lahan/baru?error=Data+tidak+lengkap`);
  }

  // ⚠️ VALIDASI PREMIUM — server-side double check
  const check = await canUserInput(user.id, "lahan");
  if (!check.allowed) {
    redirect(
      `/penggarap/${penggarap_id}/lahan/baru?error=${encodeURIComponent(
        check.reason || "Limit lahan tercapai"
      )}`
    );
  }

  let polygon = null;
  if (polygonStr) {
    try {
      polygon = JSON.parse(polygonStr);
    } catch (e) {
      polygon = null;
    }
  }

  const { error } = await supabase.from("lands").insert({
    user_id: user.id,
    penggarap_id,
    nama,
    luas,
    lokasi_koordinat: lokasi_koordinat || null,
    polygon,
  });

  if (error) {
    redirect(
      `/penggarap/${penggarap_id}/lahan/baru?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/penggarap/${penggarap_id}`);
}

export default async function TambahLahanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    gps_nama?: string;
    gps_luas?: string;
    gps_koordinat?: string;
    gps_polygon?: string;
  }>;
}) {
  const { id } = await params;
  const { error, gps_nama, gps_luas, gps_koordinat, gps_polygon } =
    await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: penggarap } = await supabase
    .from("penggaraps")
    .select("id, nama")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!penggarap) redirect("/penggarap");

  // Cek limit lahan
  const check = await canUserInput(user.id, "lahan");
  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.isPremium && premium.isActive;

  // Kalau tidak boleh → halaman locked
  if (!check.allowed) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/penggarap/${id}`}
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke {penggarap.nama}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            🗺️ Tambah Lahan
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Limit Lahan Tercapai
          </h2>
          <p className="text-sm text-orange-800 mb-4 leading-relaxed max-w-md mx-auto">
            {check.reason}
          </p>

          <div className="bg-white rounded-xl p-4 my-4 inline-block border border-orange-200">
            <div className="text-xs text-gray-500 mb-1">Lahan Anda</div>
            <div className="text-3xl font-bold text-orange-700">
              {check.currentCount} / {check.maxCount}
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
              🎬 Lihat Demo Dulu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasGPSData = !!(gps_nama && gps_luas);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {penggarap.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🗺️ Tambah Lahan Baru
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Untuk penggarap: <strong>{penggarap.nama}</strong>
        </p>
      </div>

      {/* Info limit untuk free tier */}
      {!isPremiumActive &&
        check.maxCount !== undefined &&
        check.currentCount !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-800">
            💡 Anda menggunakan paket <strong>Gratis</strong>:{" "}
            <strong>
              {check.currentCount} / {check.maxCount}
            </strong>{" "}
            lahan terpakai.
          </div>
        )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {hasGPSData && (
        <div className="bg-green-50 border-2 border-green-300 text-green-800 p-3 rounded-lg mb-4 text-sm">
          ✅ Data dari GPS Walking sudah terisi otomatis. Cek & sesuaikan kalau
          perlu.
        </div>
      )}

      {/* Link ke GPS Walking — hanya untuk premium */}
      {isPremiumActive ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">📍</div>
            <div className="flex-1">
              <div className="font-bold text-yellow-900 text-sm mb-1">
                Ukur Lahan dengan GPS Walking
              </div>
              <p className="text-xs text-yellow-800 mb-2">
                Alternatif input manual. Jalan keliling lahan → luas &
                koordinat otomatis terhitung.
              </p>
              <p className="text-[11px] text-yellow-700 mb-3">
                ⚠️ Cocok untuk lahan &gt;0.5 Ha &middot; Tidak cocok &lt;0.1 Ha
              </p>
              <Link
                href={`/ukur-lahan?penggarap_id=${id}&return=lahan-baru`}
                className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
              >
                📍 Buka GPS Walking
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">🔒</div>
            <div className="flex-1">
              <div className="font-bold text-orange-900 text-sm mb-1">
                GPS Walking — Fitur Premium
              </div>
              <p className="text-xs text-orange-800 mb-3">
                Ukur lahan dengan GPS presisi. Input manual tetap gratis untuk
                paket Free.
              </p>
              <Link
                href="/premium"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
              >
                💎 Upgrade untuk Unlock
              </Link>
            </div>
          </div>
        </div>
      )}

      <form
        action={tambahLahan}
        className="bg-white rounded-xl shadow-sm p-6 space-y-4"
      >
        <input type="hidden" name="penggarap_id" value={id} />
        {gps_polygon && (
          <input type="hidden" name="polygon" value={gps_polygon} />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lahan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nama"
            required
            defaultValue={gps_nama || ""}
            placeholder="Contoh: Sawah Utama, Kebun Belakang"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Luas (Hektar) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="luas"
            step="0.001"
            min="0.001"
            required
            defaultValue={gps_luas || ""}
            placeholder="Contoh: 1.5"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Koordinat GPS (opsional)
          </label>
          <input
            type="text"
            name="lokasi_koordinat"
            defaultValue={gps_koordinat || ""}
            placeholder="Contoh: -6.994303,112.174348"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            📍 Format: latitude,longitude (bisa copy dari Google Maps)
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            💾 Simpan Lahan
          </button>
          <Link
            href={`/penggarap/${id}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
