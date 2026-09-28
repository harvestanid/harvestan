"use client";

import { useState } from "react";

type PanenItem = {
  tanggal: string;
  hasilKg: number;
  hargaGabah: number;
  profitBersih: number;
  profitOwner: number;
  profitPenggarap: number;
  potonganHutang: number;
  persenOwner: number;
  persenPenggarap: number;
  produktivitas: number;
};

type Props = {
  data: {
    penggarap: { nama: string; alamat: string | null; kontak: string | null };
    lahan: { nama: string; luas: number };
    musim: string;
    panenList: PanenItem[];
    totals: {
      totalHasil: number;
      totalPendapatan: number;
      totalBiayaPanen: number;
      totalBiayaTambahan: number;
      totalProfitBersih: number;
      totalProfitOwner: number;
      totalProfitPenggarap: number;
      totalPotonganHutang: number;
      totalProfitOwnerSebelum: number;
      totalProfitPenggarapSebelum: number;
      produktivitas: number;
      sisaHutangAkhir: number;
      lunas: boolean;
    };
  };
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TombolDownloadInvoiceMusim({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/export-pdf-musim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        alert("❌ Gagal generate PDF");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${data.musim.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    } catch (err: any) {
      alert("❌ Error: " + (err.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
    >
      {loading
        ? "⏳ Membuat Invoice..."
        : `🧾 Download Invoice PDF (${data.panenList.length} Panen)`}
    </button>
  );
}
