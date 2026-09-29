import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPendingInvoices } from "@/lib/supabase/queries/subscription-server";
import { InvoiceKlien } from "./klien";

export const metadata = {
  title: "Invoice Admin",
};

const ADMIN_EMAIL = "harvestan.id@gmail.com";

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

  const pending = invoices.filter((i) => i.status === "pending");
  const approved = invoices.filter((i) => i.status === "approved");
  const rejected = invoices.filter((i) => i.status === "rejected");
  const expired = invoices.filter((i) => i.status === "expired");

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-[10px] text-amber-700 font-bold uppercase">
            Pending
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {pending.length}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-[10px] text-emerald-700 font-bold uppercase">
            Approved
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">
            {approved.length}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-[10px] text-red-700 font-bold uppercase">
            Rejected
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {rejected.length}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] text-gray-700 font-bold uppercase">
            Expired
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {expired.length}
          </div>
        </div>
      </div>

      <InvoiceKlien invoices={invoices} />
    </div>
  );
}
