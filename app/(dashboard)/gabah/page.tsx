import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { GabahKlien } from "./klien";

export const metadata = {
  title: "Penimbangan Gabah",
};

export default async function GabahPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const premium = await checkPremiumStatus(user.id);

  // Gabah HANYA unlock kalau premium asli (demo TIDAK unlock)
  const isPremiumReal = premium.isPremium && premium.isActive;

  if (!isPremiumReal) {
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
            ⚖️ Penimbangan Gabah
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Penimbangan Gabah — Premium
          </h2>
          <p className="text-sm text-orange-800 mb-4 leading-relaxed max-w-md mx-auto">
            Catat hasil timbang per sesi, gabah bawa pulang, dan kirim
            otomatis ke database. Fitur lengkap untuk petani serius.
          </p>

          <div className="bg-white rounded-xl p-4 my-4 text-left max-w-md mx-auto border border-green-200">
            <div className="text-xs font-bold text-green-800 mb-2">
              ✨ Fitur Penimbangan Gabah:
            </div>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✅ Multi sesi timbang (Sak 1-5)</li>
              <li>✅ Auto-hitung bobot & jumlah sak</li>
              <li>✅ Gabah bawa pulang + pengalihan profit</li>
              <li>✅ Kirim otomatis ke database panen</li>
              <li>✅ Export hasil timbang jadi gambar</li>
            </ul>
          </div>

          {premium.isDemoActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 my-4 text-xs text-blue-800 max-w-md mx-auto">
              ℹ️ Fitur ini <strong>tidak termasuk</strong> dalam demo. Hanya
              tersedia untuk pengguna Premium.
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link
              href="/premium"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg"
            >
              💎 Upgrade — Rp 59.000
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl transition"
            >
              ← Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <GabahKlien />;
}
