import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { UkurContent } from "./ukur-content";

export const metadata = {
  title: "Ukur Lahan",
};

export default async function UkurLahanPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; landId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.isPremium && premium.isActive;

  const params = await searchParams;
  const mode = params.mode || "new";

  // Kalau bukan premium → tampilkan upgrade prompt
  if (!isPremiumActive) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            📍 Ukur Lahan GPS
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Fitur GPS Walking — Premium
          </h2>
          <p className="text-sm text-orange-800 mb-4 leading-relaxed max-w-md mx-auto">
            Ukur lahan Anda dengan GPS presisi — walking keliling lahan, sistem
            otomatis menghitung luas + polygon. Fitur ini membutuhkan Premium.
          </p>

          <div className="bg-white rounded-xl p-4 my-4 text-left max-w-md mx-auto">
            <div className="text-xs font-bold text-green-800 mb-2">
              ✨ Anda dapatkan dengan Premium:
            </div>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✅ GPS Walking (ukur lahan otomatis)</li>
              <li>✅ Polygon lahan di peta</li>
              <li>✅ Mini-map preview lahan</li>
              <li>✅ Koordinat GPS tersimpan</li>
            </ul>
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

  // Premium → tampilkan content
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          📍 Ukur Lahan GPS
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Tracking GPS untuk mengukur luas lahan otomatis
        </p>
      </div>

      <UkurContent mode={mode as "new" | "edit"} landId={params.landId} />
    </div>
  );
}
