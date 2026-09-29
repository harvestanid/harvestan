import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Pembayaran Gagal",
};

type Props = {
  searchParams: Promise<{ order_id?: string; pending?: string }>;
};

export default async function GagalPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const orderId = params.order_id || null;
  const isPending = params.pending === "1";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl shadow-xl border-2 max-w-lg w-full p-8 text-center ${
          isPending ? "border-amber-300" : "border-red-300"
        }`}
      >
        <div className="text-7xl mb-4">{isPending ? "⏳" : "❌"}</div>
        <h1
          className={`text-2xl font-bold mb-3 ${
            isPending ? "text-amber-900" : "text-red-900"
          }`}
        >
          {isPending ? "Menunggu Pembayaran" : "Pembayaran Gagal"}
        </h1>

        {isPending ? (
          <>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              Anda belum menyelesaikan pembayaran.
            </p>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Silakan coba bayar lagi lewat halaman Premium. Kalau sudah bayar
              tapi status belum berubah, tunggu 1-2 menit lalu refresh.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              Pembayaran tidak berhasil.
            </p>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Uang Anda tidak terpotong. Silakan coba lagi dengan metode
              pembayaran lain.
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
            href="/premium"
            className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition"
          >
            🔄 Coba Bayar Lagi
          </Link>
          <Link
            href="/premium-gratis"
            className="block w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium py-2.5 rounded-xl transition border border-emerald-200"
          >
            🎁 Coba Premium Gratis (Barter)
          </Link>
          <Link
            href="/dashboard"
            className="block w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <p className="text-[10px] text-gray-400 mt-6 italic">
          Butuh bantuan? Hubungi kami via halaman Bantuan
        </p>
      </div>
    </div>
  );
}
