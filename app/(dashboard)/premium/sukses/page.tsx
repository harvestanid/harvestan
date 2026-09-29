import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";

export const metadata = {
  title: "Pembayaran Sukses",
};

type Props = {
  searchParams: Promise<{ order_id?: string }>;
};

export default async function SuksesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const orderId = params.order_id || null;

  const status = await checkPremiumStatus(user.id);
  const isPremiumActive = status.isPremium && status.isActive;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-300 max-w-lg w-full p-8 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-emerald-900 mb-3">
          Pembayaran Sukses!
        </h1>

        {isPremiumActive ? (
          <>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              Selamat! Akun Anda sekarang <strong>Premium</strong>.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Semua fitur Harvestan sudah terbuka. Silakan cek di halaman
              Dashboard.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              Pembayaran Anda sedang kami proses.
            </p>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Kadang butuh 10-30 detik untuk aktivasi. Kalau dalam 1 menit
              belum aktif, klik tombol cek status di bawah.
            </p>
          </>
        )}

        {orderId && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-left">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
              Order ID
            </div>
            <div className="text-xs font-mono text-gray-800 break-all">
              {orderId}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="block w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition"
          >
            🏠 Ke Dashboard
          </Link>
          <Link
            href="/penggarap"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 rounded-xl transition"
          >
            👨‍🌾 Mulai Input Penggarap
          </Link>
          {!isPremiumActive && orderId && (
            <a
              href={`/api/mayar/status?order_id=${orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium py-2.5 rounded-xl transition border border-amber-200"
            >
              🔄 Cek Status Pembayaran
            </a>
          )}
        </div>

        <p className="text-[10px] text-gray-400 mt-6 italic">
          Struk pembayaran dikirim ke email Anda oleh Mayar
        </p>
      </div>
    </div>
  );
}
