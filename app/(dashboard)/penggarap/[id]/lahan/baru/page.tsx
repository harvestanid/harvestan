import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  canUserInput,
  checkPremiumStatus,
} from "@/lib/supabase/queries/subscription-server";
import { FormLahanBaru } from "./form-client";

export const metadata = {
  title: "Tambah Lahan",
};

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
    .select("id, nama, is_self")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!penggarap) redirect("/penggarap");

  const check = await canUserInput(user.id, "lahan");
  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.effectivePremium;

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
                href={`/ukur-lahan?penggarapId=${id}&mode=new`}
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

      <FormLahanBaru
        penggarapId={id}
        isSelf={penggarap.is_self || false}
        gpsNama={gps_nama || ""}
        gpsLuas={gps_luas || ""}
        gpsKoordinat={gps_koordinat || ""}
        gpsPolygon={gps_polygon || ""}
      />
    </div>
  );
}
