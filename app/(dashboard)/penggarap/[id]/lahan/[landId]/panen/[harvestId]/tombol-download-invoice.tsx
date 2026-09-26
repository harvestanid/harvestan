"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

type Panen = {
  id: string;
  tanggal: string;
  komoditas: string | null;
  musim: string | null;
  hasil_kg: number;
  harga_gabah: number;
  biaya_panen_per_kg: number;
  biaya_tambahan: number | null;
  keterangan_biaya: string | null;
  bawa_penggarap: number | null;
  bawa_owner: number | null;
  bawa_lain: number | null;
  persen_owner: number;
  persen_penggarap: number;
  profit_bersih: number;
  profit_owner: number;
  profit_penggarap: number;
  potongan_hutang: number;
  total_hutang_sebelum: number;
  sisa_hutang_sesudah: number;
  catatan: string | null;
};

type Penggarap = {
  nama: string;
  alamat: string | null;
  kontak: string | null;
};

type Lahan = {
  nama: string;
  luas: number;
};

type Props = {
  panen: Panen;
  penggarap: Penggarap;
  lahan: Lahan;
};

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "Padi",
  jagung: "Jagung",
  kacang_tanah: "Kacang Tanah",
  bawang_merah: "Bawang Merah",
  cabai_rawit: "Cabai Rawit",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TombolDownloadInvoice({ panen, penggarap, lahan }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      let y = margin;

      // ===== HEADER =====
      pdf.setFillColor(44, 94, 46);
      pdf.rect(0, 0, pageWidth, 32, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE BAGI HASIL PANEN", pageWidth / 2, 14, {
        align: "center",
      });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Harvestan - Sistem Manajemen Pertanian", pageWidth / 2, 22, {
        align: "center",
      });

      pdf.setFontSize(8);
      pdf.text(
        `No: INV-${panen.id.substring(0, 8).toUpperCase()}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );

      y = 42;

      // ===== INFO PENGGARAP & LAHAN =====
      pdf.setTextColor(44, 94, 46);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("DATA PANEN", margin, y);
      pdf.setDrawColor(44, 94, 46);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y + 1.5, margin + 40, y + 1.5);

      y += 7;

      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      // Kiri: penggarap
      pdf.setFont("helvetica", "bold");
      pdf.text("Penggarap:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(penggarap.nama, margin + 25, y);

      // Kanan: lahan
      pdf.setFont("helvetica", "bold");
      pdf.text("Lahan:", margin + 100, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${lahan.nama} (${Number(lahan.luas).toFixed(2)} Ha)`, margin + 120, y);

      y += 6;

      pdf.setFont("helvetica", "bold");
      pdf.text("Kontak:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(penggarap.kontak || "-", margin + 25, y);

      pdf.setFont("helvetica", "bold");
      pdf.text("Tanggal:", margin + 100, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(formatTanggal(panen.tanggal), margin + 120, y);

      y += 6;

      pdf.setFont("helvetica", "bold");
      pdf.text("Alamat:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(penggarap.alamat || "-", margin + 25, y);

      pdf.setFont("helvetica", "bold");
      pdf.text("Komoditas:", margin + 100, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        KOMODITAS_LABEL[panen.komoditas || "padi"] || panen.komoditas || "-",
        margin + 120,
        y
      );

      y += 6;

      if (panen.musim) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Musim:", margin + 100, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(panen.musim, margin + 120, y);
        y += 6;
      }

      y += 4;

      // ===== PERHITUNGAN =====
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      pdf.setTextColor(44, 94, 46);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("PERHITUNGAN PANEN", margin, y);
      y += 6;

      // Tabel perhitungan
      const pendapatan = Number(panen.hasil_kg) * Number(panen.harga_gabah);
      const biayaPanenTotal =
        Number(panen.hasil_kg) * Number(panen.biaya_panen_per_kg);
      const biayaTambahan = Number(panen.biaya_tambahan || 0);

      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const lineHeight = 6;
      const leftCol = margin;
      const rightCol = pageWidth - margin;

      function row(label: string, value: string, opts?: { bold?: boolean; color?: [number, number, number] }) {
        pdf.setFont("helvetica", opts?.bold ? "bold" : "normal");
        if (opts?.color) {
          pdf.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
        } else {
          pdf.setTextColor(60, 60, 60);
        }
        pdf.text(label, leftCol, y);
        pdf.text(value, rightCol, y, { align: "right" });
        y += lineHeight;
      }

      row(
        `Hasil Panen (${Number(panen.hasil_kg).toLocaleString("id-ID")} Kg × ${formatRp(panen.harga_gabah)})`,
        formatRp(pendapatan)
      );
      row(
        `Biaya Panen (${Number(panen.hasil_kg).toLocaleString("id-ID")} Kg × ${formatRp(panen.biaya_panen_per_kg)})`,
        "− " + formatRp(biayaPanenTotal),
        { color: [200, 40, 40] }
      );

      if (biayaTambahan > 0) {
        row(
          `Biaya Tambahan${panen.keterangan_biaya ? " (" + panen.keterangan_biaya + ")" : ""}`,
          "− " + formatRp(biayaTambahan),
          { color: [200, 40, 40] }
        );
      }

      // Garis + profit bersih
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 3;

      pdf.setFillColor(232, 245, 233);
      pdf.rect(margin, y - 1, contentWidth, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(21, 87, 36);
      pdf.text("PROFIT BERSIH", leftCol + 2, y + 5);
      pdf.text(formatRp(Number(panen.profit_bersih)), rightCol - 2, y + 5, {
        align: "right",
      });
      y += 12;

      // ===== BAGI HASIL =====
      pdf.setTextColor(44, 94, 46);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `BAGI HASIL (${panen.persen_owner}:${panen.persen_penggarap})`,
        margin,
        y
      );
      y += 6;

      pdf.setFontSize(10);

      const persenOwner = Number(panen.persen_owner);
      const persenPenggarap = Number(panen.persen_penggarap);
      const profitBersih = Number(panen.profit_bersih);
      const profitOwnerMurni = profitBersih * (persenOwner / 100);
      const profitPenggarapMurni = profitBersih * (persenPenggarap / 100);

      row(
        `Owner (${persenOwner}% × ${formatRp(profitBersih)})`,
        formatRp(profitOwnerMurni),
        { bold: true }
      );
      row(
        `Penggarap (${persenPenggarap}% × ${formatRp(profitBersih)})`,
        formatRp(profitPenggarapMurni),
        { bold: true }
      );

      // ===== POTONGAN HUTANG =====
      const potonganHutang = Number(panen.potongan_hutang || 0);
      const totalHutangSebelum = Number(panen.total_hutang_sebelum || 0);
      const sisaHutangSesudah = Number(panen.sisa_hutang_sesudah || 0);

      if (potonganHutang > 0) {
        y += 4;
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 5;

        pdf.setTextColor(200, 40, 40);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("POTONGAN HUTANG OTOMATIS", margin, y);
        y += 6;

        pdf.setFontSize(10);
        row(
          `Hutang Sebelum`,
          formatRp(totalHutangSebelum),
          { color: [100, 100, 100] }
        );
        row(
          `Dipotong dari Profit Penggarap`,
          "− " + formatRp(potonganHutang),
          { color: [200, 40, 40], bold: true }
        );
        row(
          `Sisa Hutang Setelah`,
          sisaHutangSesudah > 0 ? formatRp(sisaHutangSesudah) : "LUNAS",
          {
            color: sisaHutangSesudah > 0 ? [200, 40, 40] : [39, 174, 96],
            bold: true,
          }
        );
      }

      // ===== TOTAL DITERIMA =====
      y += 4;
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      pdf.setFillColor(255, 248, 225);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, y - 2, contentWidth, 12, "FD");

      pdf.setTextColor(21, 87, 36);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL DITERIMA", leftCol + 2, y + 6);

      const profitOwnerFinal = Number(panen.profit_owner);
      const profitPenggarapFinal = Number(panen.profit_penggarap);

      // Owner
      pdf.text(
        `Owner: ${formatRp(profitOwnerFinal)}`,
        leftCol + 2,
        y + 12 + 2
      );
      // Penggarap
      pdf.text(
        `Penggarap: ${formatRp(profitPenggarapFinal)}`,
        rightCol - 2,
        y + 12 + 2,
        { align: "right" }
      );

      y += 20;

      // ===== BAGI HASIL GABAH (kalau ada) =====
      const bawaPenggarap = Number(panen.bawa_penggarap || 0);
      const bawaOwner = Number(panen.bawa_owner || 0);
      const bawaLain = Number(panen.bawa_lain || 0);

      if (bawaPenggarap > 0 || bawaOwner > 0 || bawaLain > 0) {
        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("GABAH DIBAWA PULANG", margin, y);
        y += 6;

        pdf.setFontSize(10);
        if (bawaPenggarap > 0) {
          row(
            `Penggarap: ${bawaPenggarap} Kg (${formatRp(bawaPenggarap * Number(panen.harga_gabah))})`,
            "Owner + / Penggarap −"
          );
        }
        if (bawaOwner > 0) {
          row(
            `Owner: ${bawaOwner} Kg (${formatRp(bawaOwner * Number(panen.harga_gabah))})`,
            "Penggarap + / Owner −"
          );
        }
        if (bawaLain > 0) {
          row(
            `Lainnya: ${bawaLain} Kg (${formatRp(bawaLain * Number(panen.harga_gabah))})`,
            "Masing-masing −"
          );
        }
        y += 4;
      }

      // ===== CATATAN =====
      if (panen.catatan) {
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        pdf.text("Catatan:", margin, y);
        pdf.setFont("helvetica", "normal");
        const split = pdf.splitTextToSize(panen.catatan, contentWidth);
        pdf.text(split, margin + 18, y);
        y += split.length * 5 + 4;
      }

      // ===== TANDA TANGAN =====
      // Cek space, kalau tidak cukup tambah halaman
      if (y > 230) {
        pdf.addPage();
        y = 30;
      }

      y = Math.max(y, 230);

      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);

      const signWidth = 50;
      const signY = y + 20;

      // Tanda tangan penggarap
      pdf.line(margin + 10, signY, margin + 10 + signWidth, signY);
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont("helvetica", "bold");
      pdf.text(penggarap.nama, margin + 10 + signWidth / 2, signY + 5, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("Penggarap", margin + 10 + signWidth / 2, signY + 10, {
        align: "center",
      });

      // Tanda tangan owner
      const signX = pageWidth - margin - 10 - signWidth;
      pdf.line(signX, signY, signX + signWidth, signY);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Owner", signX + signWidth / 2, signY + 5, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("Pemilik Lahan", signX + signWidth / 2, signY + 10, {
        align: "center",
      });

      // ===== FOOTER =====
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
        margin,
        pageHeight - 10
      );
      pdf.text(
        `Dokumen digital dari Harvestan`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );

      // ===== SAVE =====
      const filename = `Invoice_Panen_${penggarap.nama.replace(/\s+/g, "_")}_${panen.tanggal}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generate PDF:", err);
      alert("❌ Gagal generate PDF. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
    >
      {loading ? (
        <>⏳ Membuat PDF...</>
      ) : (
        <>📄 Download Invoice PDF (Bagi Hasil)</>
      )}
    </button>
  );
}
