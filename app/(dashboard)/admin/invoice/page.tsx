import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getPendingInvoices,
  getInvoiceStats,
} from "@/lib/supabase/queries/subscription-server";
import { InvoiceKlien } from "./klien";

export const metadata = {
  title: "Invoice Admin",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default async function AdminInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const invoices = await getPendingInvoices();
  const stats = await getInvoiceStats();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          🧾 Invoice Admin
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Kelola invoice transfer bank — approve atau tolak
        </p>
      </div>

      {/* STATISTIK REVENUE */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <div className="text-xs font-bold uppercase opacity-80 mb-2">
          💰 Revenue
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs opacity-80">Bulan Ini</div>
            <div className="text-2xl font-bold mt-1">
              {formatRp(stats.revenue_this_month)}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-80">Tahun Ini</div>
            <div className="text-2xl font-bold mt-1">
              {formatRp(stats.revenue_this_year)}
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

      {/* STATISTIK INVOICE */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] text-gray-600 font-bold uppercase">
            Total Invoice
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.total_invoices}
          </div>
        </div>
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
            Approved
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">
            {stats.total_approved}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-[10px] text-red-700 font-bold uppercase">
            Rejected
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {stats.total_rejected}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="text-[10px] text-purple-700 font-bold uppercase">
            Premium Users
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {stats.premium_users}
          </div>
        </div>
      </div>

      <InvoiceKlien invoices={invoices} />
    </div>
  );
}
