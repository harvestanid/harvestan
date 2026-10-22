import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { LaporanClient } from "./klien";

export default async function LaporanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.effectivePremium;

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
            📄 Laporan & Evaluasi
          </h1>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-3">
            Laporan & Evaluasi — Premium
          </h2>
          <p className="text-sm text-orange-800 mb-4 leading-relaxed max-w-md mx-auto">
            Generate laporan tahunan/5 tahunan untuk evaluasi & pendampingan penggarap.
          </p>

          <div className="bg-white rounded-xl p-4 my-4 text-left max-w-md mx-auto border border-green-200">
            <div className="text-xs font-bold text-green-800 mb-2">
              ✨ Fitur Laporan:
            </div>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✅ Laporan Tahunan & 5 Tahunan</li>
              <li>✅ Ringkasan profit owner & penggarap</li>
              <li>✅ Ringkasan hutang per penggarap</li>
              <li>✅ Rekomendasi produktivitas</li>
              <li>✅ Download PDF</li>
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
              className="bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-6 py-3 rounded-xl transition shadow-md"
            >
              🎬 Coba Mode Demo
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

  // Ambil filter: user_id + is_demo
  const filter = await getDataFilter(user.id);

  const { data: harvests } = await supabase
    .from("harvests")
    .select("tanggal")
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo);

  const tahunSet = new Set<number>();
  (harvests || []).forEach((h) => {
    tahunSet.add(new Date(h.tanggal).getFullYear());
  });
  const tahunTersedia = Array.from(tahunSet).sort((a, b) => b - a);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          📄 Laporan & Evaluasi
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Generate laporan tahunan/5 tahunan untuk evaluasi & pendampingan
          penggarap
        </p>
      </div>

      <LaporanClient tahunTersedia={tahunTersedia} />
    </div>
  );
}
