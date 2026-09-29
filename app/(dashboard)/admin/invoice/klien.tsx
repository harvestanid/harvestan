"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/supabase/queries/subscription-server";

type Props = {
  invoices: Invoice[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggalJam(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function InvoiceKlien({ invoices }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "expired">("pending");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = invoices.filter((i) => i.status === tab);

  async function handleApprove(invoiceCode: string) {
    if (!confirm(`Approve invoice ${invoiceCode}?\n\nIni akan langsung mengaktifkan Premium user.`)) {
      return;
    }
    setLoading(invoiceCode);
    try {
      const res = await fetch("/api/admin/invoice/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_code: invoiceCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal approve"));
        return;
      }
      alert("✅ " + json.message);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown"));
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(invoiceCode: string) {
    const catatan = prompt(
      "Alasan tolak (opsional):",
      "Bukti transfer tidak valid / nominal tidak sesuai"
    );
    if (catatan === null) return;

    setLoading(invoiceCode);
    try {
      const res = await fetch("/api/admin/invoice/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_code: invoiceCode,
          catatan: catatan || "Ditolak oleh admin",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal tolak"));
        return;
      }
      alert("✅ " + json.message);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown"));
    } finally {
      setLoading(null);
    }
  }

  function handleCopyInvoice(invoice: Invoice) {
    const text = `Invoice: ${invoice.invoice_code}
Nama: ${invoice.user_nama}
Email: ${invoice.user_email}
Nominal: ${formatRp(invoice.nominal)}
Dibuat: ${formatTanggalJam(invoice.created_at)}`;
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert("✅ Info invoice disalin"))
        .catch(() => alert("❌ Gagal menyalin"));
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(
          [
            { id: "pending" as const, label: "⏳ Pending" },
            { id: "approved" as const, label: "✅ Approved" },
            { id: "rejected" as const, label: "❌ Rejected" },
            { id: "expired" as const, label: "⏰ Expired" },
          ]
        ).map((t) => {
          const count = invoices.filter((i) => i.status === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                tab === t.id
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">
            {tab === "pending"
              ? "📭"
              : tab === "approved"
              ? "✅"
              : tab === "rejected"
              ? "❌"
              : "⏰"}
          </div>
          <p className="text-gray-500 italic text-sm">
            Belum ada invoice {tab}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className={`bg-white border-2 rounded-2xl p-4 ${
                inv.status === "pending"
                  ? "border-amber-300"
                  : inv.status === "approved"
                  ? "border-emerald-300"
                  : inv.status === "rejected"
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {inv.invoice_code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        inv.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : inv.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : inv.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    👤 {inv.user_nama}
                  </div>
                  <div className="text-xs text-gray-500">
                    📧 {inv.user_email}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gray-900">
                    {formatRp(inv.nominal)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Dibuat: {formatTanggalJam(inv.created_at)}
                  </div>
                  {inv.status === "pending" && (
                    <div className="text-[10px] text-orange-600 font-bold mt-0.5">
                      Exp: {formatTanggalJam(inv.expires_at)}
                    </div>
                  )}
                  {inv.approved_at && (
                    <div className="text-[10px] text-emerald-600 mt-0.5">
                      Approved: {formatTanggalJam(inv.approved_at)}
                    </div>
                  )}
                </div>
              </div>

              {inv.catatan && (
                <div
                  className={`text-xs p-2 rounded-lg mb-3 ${
                    inv.status === "rejected"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-gray-50 text-gray-700 border border-gray-200"
                  }`}
                >
                  📝 {inv.catatan}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopyInvoice(inv)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition"
                >
                  📋 Copy Info
                </button>
                <a
                  href={`https://wa.me/62${inv.user_email
                    .split("@")[0]
                    .replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium px-3 py-2 rounded-lg transition"
                >
                  📱 Chat WA
                </a>
                {inv.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(inv.invoice_code)}
                      disabled={loading === inv.invoice_code}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {loading === inv.invoice_code
                        ? "⏳..."
                        : "✅ Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(inv.invoice_code)}
                      disabled={loading === inv.invoice_code}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {loading === inv.invoice_code ? "⏳..." : "❌ Tolak"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
