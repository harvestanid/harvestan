"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/supabase/queries/subscription-server";

type Props = {
  orders: Order[];
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_TABS = [
  { id: "pending", label: "⏳ Pending" },
  { id: "approved", label: "✅ Disetujui" },
  { id: "dikirim", label: "🚚 Dikirim" },
  { id: "selesai", label: "🎉 Selesai" },
  { id: "rejected", label: "❌ Ditolak" },
  { id: "expired", label: "⏰ Kadaluarsa" },
] as const;

export function PesananKlien({ orders }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = orders.filter((o) => o.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.order_code.toLowerCase().includes(q) ||
          o.user_nama.toLowerCase().includes(q) ||
          o.nama_penerima.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, tab, search]);

  async function handleApprove(code: string) {
    if (
      !confirm(
        `Approve pesanan ${code}?\n\nStok produk akan otomatis berkurang.`
      )
    )
      return;
    setLoading(code);
    try {
      const res = await fetch("/api/admin/order/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_code: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal approve"));
        return;
      }
      alert("✅ " + json.message);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(code: string) {
    const catatan = prompt(
      "Alasan tolak:",
      "Bukti transfer tidak valid"
    );
    if (catatan === null) return;
    setLoading(code);
    try {
      const res = await fetch("/api/admin/order/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_code: code, catatan }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal tolak"));
        return;
      }
      alert("✅ " + json.message);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(null);
    }
  }

  async function handleInputResi(code: string) {
    const resi = prompt("Nomor resi pengiriman:");
    if (!resi) return;
    const kurirResi = prompt("Nama kurir (JNE/J&T/SiCepat/dll):", "JNE") || "JNE";
    setLoading(code);
    try {
      const res = await fetch("/api/admin/order/resi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: code,
          resi,
          kurir_resi: kurirResi,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal simpan resi"));
        return;
      }
      alert("✅ " + json.message);
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(null);
    }
  }

  async function handleSelesai(code: string) {
    if (!confirm(`Tandai pesanan ${code} sebagai SELESAI?`)) return;
    setLoading(code);
    try {
      const res = await fetch("/api/admin/order/selesai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_code: code }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal"));
        return;
      }
      router.refresh();
    } catch (err: any) {
      alert("❌ " + (err.message || "Error"));
    } finally {
      setLoading(null);
    }
  }

  function handleCopyOrder(order: Order) {
    const items = (order.items || [])
      .map(
        (i) =>
          `- ${i.nama_produk} × ${i.qty} ${i.satuan}: ${formatRp(
            i.subtotal
          )}`
      )
      .join("\n");

    const text = `PESANAN ${order.order_code}

Pembeli: ${order.user_nama}
Email: ${order.user_email}

PENERIMA:
Nama: ${order.nama_penerima}
HP: ${order.no_hp}
Alamat: ${order.alamat}
${order.kota}, ${order.provinsi} ${order.kode_pos || ""}

PRODUK:
${items}

Subtotal: ${formatRp(order.subtotal)}
Ongkir: ${formatRp(order.ongkir)}
TOTAL: ${formatRp(order.total)}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert("✅ Info pesanan disalin"))
        .catch(() => alert("❌ Gagal menyalin"));
    }
  }

  function handleChatWA(order: Order) {
    const clean = order.no_hp.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const pesan = `Halo ${order.nama_penerima},

Pesanan Anda *${order.order_code}* sedang kami proses.

Terima kasih sudah belanja di Harvestan! 🌾`;
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
  }

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_TABS.forEach((t) => {
      counts[t.id] = orders.filter((o) => o.status === t.id).length;
    });
    return counts;
  }, [orders]);

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition ${
              tab === t.id
                ? "bg-green-700 text-white"
                : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {t.label} ({tabCounts[t.id] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cari kode / nama / penerima..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="text-xs text-gray-500 italic mt-2">
          {filtered.length} pesanan
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 italic text-sm">
            Belum ada pesanan di tab {tab}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="font-mono font-bold text-gray-900 text-sm">
                    {o.order_code}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTanggal(o.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600 text-lg">
                    {formatRp(o.total)}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">
                    {o.status}
                  </div>
                </div>
              </div>

              {/* Penerima */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs">
                <div className="font-bold text-gray-900 mb-1">
                  🚚 {o.nama_penerima} · {o.no_hp}
                </div>
                <div className="text-gray-600">
                  {o.alamat}, {o.kota}, {o.provinsi} {o.kode_pos}
                </div>
              </div>

              {/* Items */}
              <div className="mb-3 space-y-2">
                {(o.items || []).map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    {item.foto_url && (
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.foto_url}
                          alt={item.nama_produk}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate">
                        {item.nama_produk}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {formatRp(item.harga)} × {item.qty} {item.satuan}
                      </div>
                    </div>
                    <div className="font-bold text-xs">
                      {formatRp(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resi */}
              {o.resi && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs mb-3">
                  🚚 <strong>Resi:</strong> {o.resi} ({o.kurir_resi})
                </div>
              )}

              {/* Catatan */}
              {o.catatan && (
                <div className="text-xs text-gray-600 italic mb-3">
                  📝 {o.catatan}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopyOrder(o)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => handleChatWA(o)}
                  className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium px-3 py-2 rounded-lg"
                >
                  📱 Chat WA
                </button>

                {o.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(o.order_code)}
                      disabled={loading === o.order_code}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading === o.order_code ? "⏳" : "✅ Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(o.order_code)}
                      disabled={loading === o.order_code}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      ❌ Tolak
                    </button>
                  </>
                )}

                {o.status === "approved" && (
                  <button
                    onClick={() => handleInputResi(o.order_code)}
                    disabled={loading === o.order_code}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading === o.order_code ? "⏳" : "🚚 Input Resi"}
                  </button>
                )}

                {o.status === "dikirim" && (
                  <button
                    onClick={() => handleSelesai(o.order_code)}
                    disabled={loading === o.order_code}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {loading === o.order_code ? "⏳" : "🎉 Tandai Selesai"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
