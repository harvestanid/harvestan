import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getUserPremiumRequests,
  hasPendingRequest,
} from "@/lib/supabase/queries/premium-server";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";
import { PremiumGratisKlien } from "./klien";

export const metadata = {
  title: "Premium Gratis",
  description:
    "Dapatkan Premium Harvestan gratis dengan bantu promosikan ke petani Indonesia",
};

export default async function PremiumGratisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const requests = await getUserPremiumRequests(user.id);
  const hasPending = await hasPendingRequest(user.id);
  const premium = await checkPremiumStatus(user.id);
  const isPremiumActive = premium.isPremium && premium.isActive;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/demo"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          🎁 Premium Gratis
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Dapatkan akses premium 1 tahun GRATIS dengan bantu promosikan
          Harvestan
        </p>
      </div>

      {/* Kalau sudah premium */}
      {isPremiumActive && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 mb-6 text-center">
          <div className="text-5xl mb-3">💎</div>
          <h2 className="text-xl font-bold text-green-900 mb-2">
            Anda Sudah Premium!
          </h2>
          <p className="text-sm text-green-800">
            Nikmati semua fitur Harvestan tanpa batasan.
          </p>
        </div>
      )}

      {/* Info card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl mb-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">🎁</div>
          <div className="font-bold text-xl md:text-2xl mb-2">
            Premium Gratis 1 Tahun
          </div>
          <p className="text-sm text-white/95 max-w-lg mx-auto">
            Bantu sebarkan Harvestan ke petani Indonesia. Dapatkan akses
            Premium GRATIS sebagai tanda terima kasih!
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur rounded-xl p-4">
          <div className="font-bold text-sm mb-3">📋 Syarat (pilih salah satu):</div>
          <ul className="text-xs space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                1
              </span>
              <span>
                <strong>Social Media</strong>: Follow IG + TikTok + FB + X
                kami, lalu post tentang Harvestan dengan{" "}
                <strong>minimal 50 like</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white text-purple-700 font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px]">
                2
              </span>
              <span>
                <strong>Referral</strong>: Ajak 5 teman petani daftar
                Harvestan pakai link referral Anda
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Client component — form + riwayat */}
      <PremiumGratisKlien
        requests={requests}
        hasPending={hasPending}
        isPremiumActive={isPremiumActive}
      />
    </div>
  );
}
