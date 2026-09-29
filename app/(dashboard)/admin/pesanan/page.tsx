import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getOrdersList,
  getOrderStats,
} from "@/lib/supabase/queries/subscription-server";
import { PesananKlien } from "./klien";

export const metadata = {
  title: "Pesanan Admin",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function AdminPesananPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const orders = await getOrdersList();
  const stats = await getOrderStats();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          📦 Pesanan Masuk
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Kelola pesanan toko — approve, kirim, input resi
        </p>
      </div>

      {/* Revenue */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <div className="text-xs font-bold uppercase opacity-80 mb-2">
          💰 Revenue Toko
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-80">Bulan Ini</div>
            <div className="text-2xl font-bold mt-1">
              {formatRp(stats.revenue_this_month)}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-80">Total Semua</div>
            <div className="text-2xl font-bold mt-1">
              {formatRp(stats.revenue_total)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-[10px] text-amber-700 font-bold uppercase">
            Pending
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {stats.total_pending}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-[10px] text-emerald-700 font-bold uppercase">
            Perlu Dikirim
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">
            {stats.total_approved}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-[10px] text-blue-700 font-bold uppercase">
            Dikirim
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {stats.total_dikirim}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-[10px] text-green-700 font-bold uppercase">
            Selesai
          </div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {stats.total_selesai}
          </div>
        </div>
      </div>

      <PesananKlien orders={orders} />
    </div>
  );
}
