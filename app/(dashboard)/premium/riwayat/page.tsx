import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserInvoices } from "@/lib/supabase/queries/subscription-server";

export const metadata = {
  title: "Riwayat Invoice",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggalJam(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function hitungSisaJam(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

export default async function RiwayatInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const invoices = await getUserInvoices(user.id);

  const total = invoices.length;
  const pending = invoices.filter((i) => i.status === "pending").length;
  const approved = invoices.filter((i) => i.status === "approved").length;
  const rejected = invoices.filter((i) => i.status === "rejected").length;
  const expired = invoices.filter((i) => i.status === "expired").length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/premium"
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke Premium
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          📜 Riwayat Invoice
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Semua invoice yang pernah Anda buat
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="text-[9px] text-gray-600 font-bold uppercase">
            Total
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">{total}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="text-[9px] text-amber-700 font-bold uppercase">
            Pending
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">
            {pending}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="text-[9px] text-emerald-700 font-bold uppercase">
            Approved
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1">
            {approved}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="text-[9px] text-red-700 font-bold uppercase">
            Rejected
          </div>
          <div className="text-xl font-bold text-red-900 mt-1">
            {rejected}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="text-[9px] text-gray-600 font-bold uppercase">
            Expired
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {expired}
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 italic text-sm">
            Belum ada invoice. Buat dulu di halaman Premium.
          </p>
          <Link
            href="/premium"
            className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-2 rounded-lg transition"
          >
            💎 Ke Halaman Premium
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isPending = inv.status === "pending";
            const sisaJam = isPending ? hitungSisaJam(inv.expires_at) : 0;

            return (
              <div
                key={inv.id}
                className={`border-2 rounded-2xl p-4 ${
                  inv.status === "approved"
                    ? "border-emerald-300 bg-emerald-50"
                    : inv.status === "rejected"
                    ? "border-red-300 bg-red-50"
                    : inv.status === "expired"
                    ? "border-gray-300 bg-gray-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">
                        {inv.status === "approved"
                          ? "✅"
                          : inv.status === "rejected"
                          ? "❌"
                          : inv.status === "expired"
                          ? "⏰"
                          : "⏳"}
                      </span>
                      <span className="font-mono font-bold text-gray-900">
                        {inv.invoice_code}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Dibuat: {formatTanggalJam(inv.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">
                      {formatRp(inv.nominal)}
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        inv.status === "approved"
                          ? "text-emerald-700"
                          : inv.status === "rejected"
                          ? "text-red-700"
                          : inv.status === "expired"
                          ? "text-gray-500"
                          : "text-amber-700"
                      }`}
                    >
                      {inv.status === "approved"
                        ? "Disetujui"
                        : inv.status === "rejected"
                        ? "Ditolak"
                        : inv.status === "expired"
                        ? "Kadaluarsa"
                        : "Menunggu Verifikasi"}
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="bg-white border border-amber-200 rounded-lg p-2 text-xs text-amber-800 mb-2">
                    ⏰ Invoice berlaku {sisaJam} jam lagi (
                    {formatTanggalJam(inv.expires_at)})
                  </div>
                )}

                {inv.status === "approved" && inv.approved_at && (
                  <div className="bg-white border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800 mb-2">
                    ✅ Disetujui pada {formatTanggalJam(inv.approved_at)}
                  </div>
                )}

                {inv.status === "rejected" && inv.catatan && (
                  <div className="bg-white border border-red-200 rounded-lg p-2 text-xs text-red-800">
                    <strong>Alasan ditolak:</strong> {inv.catatan}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
