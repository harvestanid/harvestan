"use client";

import { useState, useMemo } from "react";
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
  const [tab, setTab] = useState<
    "pending" | "approved" | "rejected" | "expired"
  >("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [search, setSearch] = useState("");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [showTesting, setShowTesting] = useState(true);

  const totalTesting = useMemo(
    () => invoices.filter((i) => i.is_testing).length,
    [invoices]
  );

  const filtered = useMemo(() => {
    let result = invoices.filter((i) => i.status === tab);

    if (!showTesting) {
      result = result.filter((i) => !i.is_testing);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.invoice_code.toLowerCase().includes(q) ||
          i.user_nama.toLowerCase().includes(q) ||
          i.user_email.toLowerCase().includes(q)
      );
    }

    if (tanggalDari) {
      const dari = new Date(tanggalDari).getTime();
      result = result.filter(
        (i) => new Date(i.created_at).getTime() >= dari
      );
    }

    if (tanggalSampai) {
      const sampai = new Date(tanggalSampai).getTime() + 24 * 60 * 60 * 1000;
      result = result.filter(
        (i) => new Date(i.created_at).getTime() <= sampai
      );
    }

    return result;
  }, [invoices, tab, search, tanggalDari, tanggalSampai, showTesting]);

  async function handleApprove(invoiceCode: string) {
    if (
      !confirm(
        `Approve invoice ${invoiceCode}?\n\nIni akan langsung mengaktifkan Premium user.`
      )
    ) {
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

      if (json.invoice?.whatsapp || json.invoice?.email) {
        const nomor = json.invoice.whatsapp || "";
        if (nomor) {
          setTimeout(() => {
            if (confirm("Buka WhatsApp user untuk kirim notif?")) {
              const pesan = `Halo ${json.invoice.nama}! 🎉

✅ Pembayaran kamu sudah kami terima
🧾 Invoice: ${invoiceCode}
💎 Status: PREMIUM AKTIF

Semua fitur Harvestan udah kebuka. Login ulang di harvestan.vercel.app untuk akses fitur premium.

Terima kasih sudah upgrade! 🌾`;
              const clean = nomor.replace(/[^0-9]/g, "").replace(/^0/, "62");
              window.open(
                `https://wa.me/${clean}?text=${encodeURIComponent(pesan)}`,
                "_blank"
              );
            }
          }, 500);
        }
      }

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

  async function handleToggleTesting(inv: Invoice) {
    const newVal = !inv.is_testing;

    const pesanConfirm = newVal
      ? `Tandai invoice ${inv.invoice_code} sebagai TESTING?\n\nInvoice ini TIDAK akan dihitung di revenue.`
      : `Hapus tanda testing dari invoice ${inv.invoice_code}?\n\nInvoice ini akan KEMBALI dihitung di revenue.`;

    if (!confirm(pesanConfirm)) return;

    setLoading(inv.invoice_code);
    try {
      const res = await fetch("/api/admin/invoice/toggle-testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_code: inv.invoice_code,
          is_testing: newVal,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal toggle testing"));
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

  async function handleDelete(inv: Invoice) {
    const konfirmasi = prompt(
      `⚠️ HAPUS PERMANEN invoice ${inv.invoice_code}?\n\n` +
        `User: ${inv.user_nama}\n` +
        `Nominal: ${formatRp(inv.nominal)}\n\n` +
        `Catatan: kalau user ini premium, statusnya TIDAK otomatis dicabut.\n` +
        `Cek dulu di /admin/subscriptions kalau mau cabut juga.\n\n` +
        `Ketik kode invoice untuk konfirmasi:`
    );

    if (konfirmasi === null) return;

    if (konfirmasi.trim() !== inv.invoice_code) {
      alert("❌ Kode invoice tidak cocok. Batal hapus.");
      return;
    }

    setLoading(inv.invoice_code);
    try {
      const res = await fetch("/api/admin/invoice/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "single",
          invoice_code: inv.invoice_code,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal hapus"));
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

  async function handleDeleteAllTesting() {
    if (totalTesting === 0) {
      alert("Tidak ada invoice testing");
      return;
    }

    const konfirmasi = prompt(
      `⚠️ HAPUS SEMUA invoice testing (${totalTesting} invoice)?\n\n` +
        `Semua invoice yang ditandai 🧪 TESTING akan dihapus permanen.\n\n` +
        `Ketik "HAPUS" untuk konfirmasi:`
    );

    if (konfirmasi === null) return;

    if (konfirmasi.trim().toUpperCase() !== "HAPUS") {
      alert("❌ Konfirmasi tidak cocok. Batal.");
      return;
    }

    setLoadingBulk(true);
    try {
      const res = await fetch("/api/admin/invoice/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "all_testing" }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal hapus testing"));
        return;
      }
      alert("✅ " + json.message);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown"));
    } finally {
      setLoadingBulk(false);
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

  function resetFilter() {
    setSearch("");
    setTanggalDari("");
    setTanggalSampai("");
  }

  const adaFilter = search || tanggalDari || tanggalSampai;

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
      
            {/* Action bar - Bulk hapus testing */}
            {totalTesting > 0 && (
              <div className="bg-[#f0b429]/15 border-2 border-[#f0b429]/40 rounded-2xl p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧪</span>
                  <div>
                    <div className="text-xs font-bold text-[#2c5e2e]">
                      {totalTesting} invoice testing
                    </div>
                    <div className="text-[10px] text-[#2c5e2e]/70">
                      Tidak dihitung revenue
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAllTesting}
                  disabled={loadingBulk}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loadingBulk ? "⏳ Menghapus..." : "🧹 Hapus Semua Testing"}
                </button>
              </div>
            )}
      
            {/* Filter & Search */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                    🔍 Cari
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kode / nama / email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                    📅 Dari
                  </label>
                  <input
                    type="date"
                    value={tanggalDari}
                    onChange={(e) => setTanggalDari(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase block mb-1">
                    📅 Sampai
                  </label>
                  <input
                    type="date"
                    value={tanggalSampai}
                    onChange={(e) => setTanggalSampai(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showTesting}
                    onChange={(e) => setShowTesting(e.target.checked)}
                    className="w-4 h-4 accent-[#2c5e2e]"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    Tampilkan invoice testing 🧪
                  </span>
                </label>
      
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 italic">
                    {filtered.length} invoice ditampilkan
                    {adaFilter && " (terfilter)"}
                  </span>
                  {adaFilter && (
                    <button
                      onClick={resetFilter}
                      className="text-xs text-red-600 hover:text-red-800 font-bold"
                    >
                      ✕ Reset Filter
                    </button>
                  )}
                </div>
              </div>
            </div>
      
            {/* List */}
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-3">
                  {adaFilter
                    ? "🔍"
                    : tab === "pending"
                    ? "📭"
                    : tab === "approved"
                    ? "✅"
                    : tab === "rejected"
                    ? "❌"
                    : "⏰"}
                </div>
                <p className="text-gray-500 italic text-sm">
                  {adaFilter
                    ? "Tidak ada invoice yang cocok dengan filter"
                    : `Belum ada invoice ${tab}`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className={`border-2 rounded-2xl p-4 ${
                      inv.is_testing
                        ? "bg-amber-50/40 border-amber-400"
                        : inv.status === "pending"
                        ? "bg-white border-amber-300"
                        : inv.status === "approved"
                        ? "bg-white border-emerald-300"
                        : inv.status === "rejected"
                        ? "bg-white border-red-300"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          {inv.is_testing && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#f0b429] text-[#2c5e2e] border border-[#f0b429] uppercase tracking-widest">
                              🧪 TESTING
                            </span>
                          )}
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
      
                    {inv.is_testing && (
                      <div className="text-xs p-2 rounded-lg mb-3 bg-[#f0b429]/15 border-2 border-[#f0b429]/40 text-[#2c5e2e]">
                        🧪 <strong>Invoice testing</strong> — tidak dihitung di
                        revenue total
                      </div>
                    )}
      
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
                      {inv.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(inv.invoice_code)}
                            disabled={loading === inv.invoice_code}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                          >
                            {loading === inv.invoice_code ? "⏳..." : "✅ Approve"}
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
                      {inv.status === "approved" && (
                        <button
                          onClick={() => handleToggleTesting(inv)}
                          disabled={loading === inv.invoice_code}
                          className={`text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                            inv.is_testing
                              ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              : "bg-[#f0b429] hover:bg-[#e6a617] text-[#2c5e2e]"
                          }`}
                        >
                          {loading === inv.invoice_code
                            ? "⏳..."
                            : inv.is_testing
                            ? "✔️ Unmark Testing"
                            : "🧪 Tandai Testing"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inv)}
                        disabled={loading === inv.invoice_code}
                        className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {loading === inv.invoice_code ? "⏳..." : "🗑️ Hapus"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }
