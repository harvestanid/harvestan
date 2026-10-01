import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { KalkulatorKlien } from "./klien";

export const metadata = {
  title: "Kalkulator Pupuk",
};

export default async function KalkulatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Strict premium — demo & user biasa tidak dapat akses
  const status = await checkPremiumStatus(user.id);
  const isPremiumAsli = status.isPremium && status.isActive;

  if (!isPremiumAsli) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-green-700 hover:text-green-800 text-sm font-medium"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div className="bg-white border-2 border-amber-300 rounded-3xl p-8 md:p-12 text-center">
          <div className="text-6xl mb-5">🔒</div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Kalkulator Pupuk — Premium
          </h1>

          <p className="text-gray-600 text-sm md:text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Hitung kebutuhan pupuk sesuai komoditas & luas lahan Anda. Mode
            presisi pakai hasil analisis tanah — dosis disesuaikan status hara
            (N/P/K). Plus jadwal pemupukan & panduan mencampur pupuk.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left max-w-lg mx-auto mb-6">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">
              ✨ Fitur Kalkulator Pupuk:
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">
                  ✓
                </span>
                <span>Mode Standar & Presisi (berdasarkan analisis tanah)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">
                  ✓
                </span>
                <span>Dosis otomatis per komoditas & luas lahan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">
                  ✓
                </span>
                <span>Jadwal pemupukan split (2-3x) + custom</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">
                  ✓
                </span>
                <span>Panduan mencampur pupuk biar rata</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">
                  ✓
                </span>
                <span>Dosis dolomit menyesuaikan pH tanah</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">
                  ✓
                </span>
                <span>Estimasi kebutuhan benih</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-800 max-w-lg mx-auto mb-6 leading-relaxed">
            ℹ️ Fitur ini <strong>tidak termasuk dalam demo</strong>. Hanya
            tersedia untuk pengguna Premium.
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e] font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105 shadow-lg"
            >
              💎 Upgrade — Rp 59.000
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-full transition-all hover:scale-105"
            >
              ← Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Ambil SEMUA lahan user
  const { data: lands } = await supabase
    .from("lands")
    .select("id, nama, luas")
    .eq("user_id", user.id)
    .order("nama");

  // Ambil daftar pupuk aktif
  const { data: pupuks } = await supabase
    .from("fertilizers")
    .select("*")
    .eq("is_active", true)
    .order("urutan")
    .order("nama");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          🧪 Kalkulator Pupuk
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Hitung kebutuhan pupuk & benih sesuai luas lahan dan komoditas
        </p>
      </div>

      <KalkulatorKlien lands={lands || []} pupuks={pupuks || []} />
    </div>
  );
}
