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

// ===================================================
// SANITIZER: convert semua karakter ke ASCII aman
// ===================================================
function ascii(s: string): string {
  if (s === null || s === undefined) return "";
  return String(s)
    // Ganti karakter umum dengan padanan ASCII
    .replace(/[×✕✖]/g, "x")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[•·]/g, "-")
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[≠]/g, "!=")
    .replace(/[₹]/g, "Rp")
    // Hapus SEMUA karakter non-ASCII (termasuk emoji)
    .replace(/[^\x20-\x7E\n\r\t]/g, "")
    // Normalisasi spasi berlebih
    .replace(/\s+/g, " ")
    .trim();
}

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
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      let y = 0;

      // ========== KALKULASI SEMUA NILAI ==========
      const hasilKg = Number(panen.hasil_kg);
      const harga = Number(panen.harga_gabah);
      const biayaPanenPerKg = Number(panen.biaya_panen_per_kg);
      const biayaTambahan = Number(panen.biaya_tambahan || 0);
      const persenOwner = Number(panen.persen_owner);
      const persenPenggarap = Number(panen.persen_penggarap);
      const profitBersih = Number(panen.profit_bersih);

      const pendapatan = hasilKg * harga;
      const biayaPanenTotal = hasilKg * biayaPanenPerKg;
      const produktivitas =
        Number(lahan.luas) > 0 ? hasilKg / Number(lahan.luas) : 0;

      const profitOwnerMurni = profitBersih * (persenOwner / 100);
      const profitPenggarapMurni = profitBersih * (persenPenggarap / 100);

      const bawaPenggarap = Number(panen.bawa_penggarap || 0);
      const bawaOwner = Number(panen.bawa_owner || 0);
      const bawaLain = Number(panen.bawa_lain || 0);
      const nilaiBawaPenggarap = bawaPenggarap * harga;
      const nilaiBawaOwner = bawaOwner * harga;
      const nilaiBawaLain = bawaLain * harga;
      const adaBawaPulang =
        nilaiBawaPenggarap > 0 || nilaiBawaOwner > 0 || nilaiBawaLain > 0;

      const profitOwnerSetelahBawa =
        profitOwnerMurni +
        nilaiBawaPenggarap -
        nilaiBawaOwner -
        nilaiBawaLain * 0.5;
      const profitPenggarapSetelahBawa =
        profitPenggarapMurni -
        nilaiBawaPenggarap +
        nilaiBawaOwner -
        nilaiBawaLain * 0.5;

      const potonganHutang = Number(panen.potongan_hutang || 0);
      const totalHutangSebelum = Number(panen.total_hutang_sebelum || 0);
      const sisaHutangSesudah = Number(panen.sisa_hutang_sesudah || 0);

      const profitOwnerFinal = Number(panen.profit_owner);
      const profitPenggarapFinal = Number(panen.profit_penggarap);

      // ========== HELPER ==========
      function checkPageBreak(needed: number) {
        if (y + needed > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }
      }

      // Tulis teks dengan sanitizer
      function writeText(
        text: string,
        x: number,
        yPos: number,
        opts?: { align?: "left" | "center" | "right" }
      ) {
        const safe = ascii(text);
        if (opts?.align) {
          pdf.text(safe, x, yPos, { align: opts.align });
        } else {
          pdf.text(safe, x, yPos);
        }
      }

      // Section header
      function sectionHeader(title: string, color: [number, number, number]) {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(margin, y, contentWidth, 8, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        writeText(title.toUpperCase(), margin + 3, y + 5.5);

        y += 8;
      }

      // Row 2 kolom
      function row2(
        label: string,
        value: string,
        opts?: {
          bold?: boolean;
          labelColor?: [number, number, number];
          valueColor?: [number, number, number];
          indent?: number;
          fontSize?: number;
          bg?: [number, number, number];
          height?: number;
        }
      ) {
        const fs = opts?.fontSize || 9.5;
        const h = opts?.height || 7;
        const indent = opts?.indent || 0;

        if (opts?.bg) {
          pdf.setFillColor(opts.bg[0], opts.bg[1], opts.bg[2]);
          pdf.rect(margin, y, contentWidth, h, "F");
        }

        pdf.setFontSize(fs);
        pdf.setFont("helvetica", opts?.bold ? "bold" : "normal");

        const lc = opts?.labelColor || [70, 70, 70];
        pdf.setTextColor(lc[0], lc[1], lc[2]);
        writeText(label, margin + 3 + indent, y + h / 2 + 1);

        const vc = opts?.valueColor || [60, 60, 60];
        pdf.setTextColor(vc[0], vc[1], vc[2]);
        pdf.setFont("helvetica", "bold");
        writeText(value, pageWidth - margin - 3, y + h / 2 + 1, {
          align: "right",
        });

        y += h;
      }

      // Note
      function note(text: string, indent = 0) {
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(130, 130, 130);
        writeText(text, margin + 4 + indent, y + 2);
        y += 4;
      }

      // ========== HEADER ==========
      pdf.setFillColor(44, 94, 46);
      pdf.rect(0, 0, pageWidth, 32, "F");

      pdf.setFillColor(255, 193, 7);
      pdf.rect(0, 32, pageWidth, 1.5, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      writeText("INVOICE BAGI HASIL PANEN", pageWidth / 2, 13, {
        align: "center",
      });

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      writeText(
        "Harvestan - Sistem Manajemen Pertanian Digital",
        pageWidth / 2,
        20,
        { align: "center" }
      );

      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 235, 180);
      writeText(
        `No. INV-${panen.id.substring(0, 8).toUpperCase()}  |  Dicetak: ${new Date().toLocaleString("id-ID")}`,
        pageWidth / 2,
        27,
        { align: "center" }
      );

      y = 40;

      // ========== SECTION 1: DATA ==========
      checkPageBreak(45);
      sectionHeader("Data Penggarap & Lahan", [44, 94, 46]);

      pdf.setFillColor(245, 252, 245);
      pdf.setDrawColor(200, 230, 201);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, y, contentWidth, 22, "FD");

      const colLeft = margin + 4;
      const colRight = margin + contentWidth / 2 + 2;

      pdf.setFontSize(8.5);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      writeText("Nama Penggarap", colLeft, y + 5);
      writeText("Nama Lahan", colRight, y + 5);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      writeText(ascii(penggarap.nama), colLeft, y + 9.5);
      writeText(
        `${ascii(lahan.nama)} (${Number(lahan.luas).toFixed(2)} Ha)`,
        colRight,
        y + 9.5
      );

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      writeText("Kontak", colLeft, y + 14.5);
      writeText("Tanggal Panen", colRight, y + 14.5);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      writeText(ascii(penggarap.kontak || "-"), colLeft, y + 19);
      writeText(formatTanggal(panen.tanggal), colRight, y + 19);

      y += 26;

      // ========== SECTION 2: PRODUKSI ==========
      checkPageBreak(35);
      sectionHeader("Ringkasan Produksi", [52, 152, 219]);

      const cardW = (contentWidth - 4) / 3;
      const cardH = 18;

      const cards = [
        {
          label: "HASIL PANEN",
          value: `${hasilKg.toLocaleString("id-ID")} Kg`,
          bg: [232, 245, 233] as [number, number, number],
          border: [200, 230, 201] as [number, number, number],
          tc: [21, 87, 36] as [number, number, number],
        },
        {
          label: "HARGA / KG",
          value: formatRp(harga),
          bg: [232, 244, 253] as [number, number, number],
          border: [187, 222, 251] as [number, number, number],
          tc: [13, 71, 161] as [number, number, number],
        },
        {
          label: "PRODUKTIVITAS",
          value: `${produktivitas.toFixed(0)} Kg/Ha`,
          bg: [255, 248, 225] as [number, number, number],
          border: [255, 224, 130] as [number, number, number],
          tc: [180, 100, 20] as [number, number, number],
        },
      ];

      cards.forEach((c, i) => {
        const cx = margin + i * (cardW + 2);
        pdf.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
        pdf.setDrawColor(c.border[0], c.border[1], c.border[2]);
        pdf.setLineWidth(0.3);
        pdf.rect(cx, y, cardW, cardH, "FD");

        pdf.setFontSize(6.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(c.tc[0], c.tc[1], c.tc[2]);
        writeText(c.label, cx + cardW / 2, y + 5, { align: "center" });

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        writeText(c.value, cx + cardW / 2, y + 13, { align: "center" });
      });

      y += cardH + 5;

      // ========== SECTION 3: PERHITUNGAN ==========
      checkPageBreak(50);
      sectionHeader("Perhitungan Keuangan", [44, 94, 46]);

      pdf.setFillColor(232, 245, 233);
      pdf.rect(margin, y, contentWidth, 6.5, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      writeText("URAIAN", margin + 3, y + 4.2);
      writeText("JUMLAH", pageWidth - margin - 3, y + 4.2, {
        align: "right",
      });
      y += 6.5;

      row2(
        `Pendapatan Kotor (${hasilKg.toLocaleString("id-ID")} Kg x ${formatRp(harga)})`,
        formatRp(pendapatan),
        { bold: true, valueColor: [21, 87, 36] }
      );

      row2(
        `Biaya Panen (${hasilKg.toLocaleString("id-ID")} Kg x ${formatRp(biayaPanenPerKg)})`,
        `- ${formatRp(biayaPanenTotal)}`,
        {
          bg: [255, 251, 235],
          valueColor: [200, 40, 40],
        }
      );

      if (biayaTambahan > 0) {
        row2(
          `Biaya Tambahan${panen.keterangan_biaya ? ` (${ascii(panen.keterangan_biaya)})` : ""}`,
          `- ${formatRp(biayaTambahan)}`,
          {
            bg: [255, 251, 235],
            valueColor: [200, 40, 40],
          }
        );
      }

      pdf.setFillColor(212, 237, 218);
      pdf.rect(margin, y, contentWidth, 10, "F");
      pdf.setDrawColor(21, 87, 36);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, pageWidth - margin, y);
      pdf.line(margin, y + 10, pageWidth - margin, y + 10);

      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 87, 36);
      writeText("PROFIT BERSIH", margin + 3, y + 6.8);
      pdf.setFontSize(12);
      writeText(formatRp(profitBersih), pageWidth - margin - 3, y + 6.8, {
        align: "right",
      });

      y += 14;

      // ========== SECTION 4: BAGI HASIL DASAR ==========
      checkPageBreak(45);
      sectionHeader(
        `Bagi Hasil Dasar (${persenOwner}:${persenPenggarap})`,
        [52, 152, 219]
      );

      // Kartu Owner
      pdf.setFillColor(232, 245, 233);
      pdf.setDrawColor(200, 230, 201);
      pdf.setLineWidth(0.4);
      pdf.rect(margin, y, contentWidth, 14, "FD");

      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 87, 36);
      writeText(`OWNER (${persenOwner}%)`, margin + 3, y + 5);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 140, 100);
      writeText(
        `${persenOwner}% x ${formatRp(profitBersih)}`,
        margin + 3,
        y + 9
      );

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 87, 36);
      writeText(formatRp(profitOwnerMurni), pageWidth - margin - 3, y + 9, {
        align: "right",
      });

      y += 16;

      // Kartu Penggarap
      pdf.setFillColor(255, 243, 224);
      pdf.setDrawColor(255, 224, 178);
      pdf.setLineWidth(0.4);
      pdf.rect(margin, y, contentWidth, 14, "FD");

      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(230, 81, 0);
      writeText(`PENGGARAP (${persenPenggarap}%)`, margin + 3, y + 5);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(180, 120, 60);
      writeText(
        `${persenPenggarap}% x ${formatRp(profitBersih)}`,
        margin + 3,
        y + 9
      );

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(230, 81, 0);
      writeText(
        formatRp(profitPenggarapMurni),
        pageWidth - margin - 3,
        y + 9,
        { align: "right" }
      );

      y += 18;

      // ========== SECTION 5: PENYESUAIAN BAWA PULANG ==========
      if (adaBawaPulang) {
        checkPageBreak(60);
        sectionHeader("Penyesuaian Gabah Bawa Pulang", [230, 126, 34]);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(140, 100, 50);
        writeText(
          `Nilai gabah yang dibawa pulang dialihkan ke pihak lain (harga: ${formatRp(harga)}/Kg)`,
          margin + 2,
          y + 3
        );
        y += 6;

        if (nilaiBawaPenggarap > 0) {
          pdf.setFillColor(255, 248, 235);
          pdf.setDrawColor(255, 220, 180);
          pdf.setLineWidth(0.3);
          pdf.rect(margin, y, contentWidth, 16, "FD");

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(180, 90, 0);
          writeText(
            `Penggarap bawa pulang ${bawaPenggarap} Kg`,
            margin + 3,
            y + 5
          );

          pdf.setFontSize(7);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(140, 100, 50);
          writeText(
            `= ${bawaPenggarap} Kg x ${formatRp(harga)} = ${formatRp(nilaiBawaPenggarap)}`,
            margin + 3,
            y + 9
          );

          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(21, 87, 36);
          writeText(
            `Owner +${formatRp(nilaiBawaPenggarap)}`,
            pageWidth - margin - 3,
            y + 5.5,
            { align: "right" }
          );
          pdf.setTextColor(200, 40, 40);
          writeText(
            `Penggarap -${formatRp(nilaiBawaPenggarap)}`,
            pageWidth - margin - 3,
            y + 11,
            { align: "right" }
          );

          y += 18;
        }

        if (nilaiBawaOwner > 0) {
          pdf.setFillColor(255, 248, 235);
          pdf.setDrawColor(255, 220, 180);
          pdf.rect(margin, y, contentWidth, 16, "FD");

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(180, 90, 0);
          writeText(
            `Owner bawa pulang ${bawaOwner} Kg`,
            margin + 3,
            y + 5
          );

          pdf.setFontSize(7);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(140, 100, 50);
          writeText(
            `= ${bawaOwner} Kg x ${formatRp(harga)} = ${formatRp(nilaiBawaOwner)}`,
            margin + 3,
            y + 9
          );

          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(21, 87, 36);
          writeText(
            `Penggarap +${formatRp(nilaiBawaOwner)}`,
            pageWidth - margin - 3,
            y + 5.5,
            { align: "right" }
          );
          pdf.setTextColor(200, 40, 40);
          writeText(
            `Owner -${formatRp(nilaiBawaOwner)}`,
            pageWidth - margin - 3,
            y + 11,
            { align: "right" }
          );

          y += 18;
        }

        if (nilaiBawaLain > 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(margin, y, contentWidth, 16, "FD");

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(100, 100, 100);
          writeText(
            `Pihak lain bawa pulang ${bawaLain} Kg`,
            margin + 3,
            y + 5
          );

          pdf.setFontSize(7);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(120, 120, 120);
          writeText(
            `= ${bawaLain} Kg x ${formatRp(harga)} = ${formatRp(nilaiBawaLain)}`,
            margin + 3,
            y + 9
          );

          pdf.setFontSize(8.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(200, 40, 40);
          writeText(
            `Masing-masing -${formatRp(nilaiBawaLain * 0.5)}`,
            pageWidth - margin - 3,
            y + 8,
            { align: "right" }
          );

          y += 18;
        }

        checkPageBreak(30);
        pdf.setFillColor(255, 243, 224);
        pdf.setDrawColor(230, 126, 34);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, y, contentWidth, 20, "FD");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(180, 90, 0);
        writeText(
          "Profit Setelah Penyesuaian Bawa Pulang",
          margin + 3,
          y + 5
        );

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(150, 100, 50);
        writeText(
          "= Bagi hasil dasar + penyesuaian transfer nilai gabah",
          margin + 3,
          y + 9
        );

        pdf.setFontSize(9.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(21, 87, 36);
        writeText(
          `Owner: ${formatRp(profitOwnerSetelahBawa)}`,
          margin + 3,
          y + 15
        );

        pdf.setTextColor(230, 81, 0);
        writeText(
          `Penggarap: ${formatRp(profitPenggarapSetelahBawa)}`,
          pageWidth - margin - 3,
          y + 15,
          { align: "right" }
        );

        y += 24;
      }

      // ========== SECTION 6: POTONGAN HUTANG ==========
      if (potonganHutang > 0) {
        checkPageBreak(45);
        sectionHeader("Potongan Hutang Otomatis", [231, 76, 60]);

        pdf.setFillColor(253, 237, 237);
        pdf.setDrawColor(245, 183, 177);
        pdf.setLineWidth(0.4);
        pdf.rect(margin, y, contentWidth, 26, "FD");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(120, 50, 50);

        writeText("Hutang Sebelum", margin + 3, y + 6);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(60, 60, 60);
        writeText(
          formatRp(totalHutangSebelum),
          pageWidth - margin - 3,
          y + 6,
          { align: "right" }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(120, 50, 50);
        writeText("Dipotong dari Profit Penggarap", margin + 3, y + 12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(200, 40, 40);
        writeText(
          `- ${formatRp(potonganHutang)}`,
          pageWidth - margin - 3,
          y + 12,
          { align: "right" }
        );

        pdf.setDrawColor(230, 180, 180);
        pdf.setLineWidth(0.2);
        pdf.line(margin + 3, y + 16, pageWidth - margin - 3, y + 16);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(120, 50, 50);
        writeText("Sisa Hutang Setelah", margin + 3, y + 22);

        pdf.setFont("helvetica", "bold");
        if (sisaHutangSesudah > 0) {
          pdf.setTextColor(200, 40, 40);
          writeText(
            formatRp(sisaHutangSesudah),
            pageWidth - margin - 3,
            y + 22,
            { align: "right" }
          );
        } else {
          pdf.setTextColor(21, 87, 36);
          writeText("LUNAS", pageWidth - margin - 3, y + 22, {
            align: "right",
          });
        }

        y += 30;

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(140, 60, 60);
        writeText(
          "* Potongan hutang mengurangi profit penggarap & menambah profit owner",
          margin + 2,
          y
        );
        y += 6;
      }

      // ========== SECTION 7: TOTAL DITERIMA ==========
      checkPageBreak(45);

      const totalBoxH = 36;
      pdf.setFillColor(255, 252, 240);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(1);
      pdf.rect(margin, y, contentWidth, totalBoxH, "FD");

      pdf.setFillColor(44, 94, 46);
      pdf.rect(margin, y, contentWidth, 9, "F");
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      writeText("TOTAL DITERIMA (FINAL)", margin + 4, y + 6.3);

      // Baris Owner
      pdf.setFillColor(232, 245, 233);
      pdf.rect(margin + 2, y + 11, contentWidth - 4, 10, "F");
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(44, 94, 46);
      writeText("OWNER", margin + 5, y + 17.5);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 87, 36);
      writeText(
        formatRp(profitOwnerFinal),
        pageWidth - margin - 5,
        y + 17.5,
        { align: "right" }
      );

      // Baris Penggarap
      pdf.setFillColor(255, 243, 224);
      pdf.rect(margin + 2, y + 22, contentWidth - 4, 10, "F");
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(230, 126, 34);
      writeText("PENGGARAP", margin + 5, y + 28.5);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(230, 81, 0);
      writeText(
        formatRp(profitPenggarapFinal),
        pageWidth - margin - 5,
        y + 28.5,
        { align: "right" }
      );

      y += totalBoxH + 5;

      // ========== CATATAN ==========
      if (panen.catatan) {
        checkPageBreak(20);
        sectionHeader("Catatan", [120, 120, 120]);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(70, 70, 70);
        const safeCatatan = ascii(panen.catatan);
        const split = pdf.splitTextToSize(safeCatatan, contentWidth - 6);
        pdf.text(split, margin + 3, y + 3);
        y += split.length * 4 + 5;
      }

      // ========== TANDA TANGAN ==========
      if (y > 240) {
        pdf.addPage();
        y = margin;
      }

      y = Math.max(y, 235);

      const signWidth = 55;
      const signY = y + 8;

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.line(margin, signY - 3, pageWidth - margin, signY - 3);

      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);
      pdf.line(margin + 8, signY + 15, margin + 8 + signWidth, signY + 15);
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont("helvetica", "bold");
      writeText(ascii(penggarap.nama), margin + 8 + signWidth / 2, signY + 19.5, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(120, 120, 120);
      writeText("Penggarap", margin + 8 + signWidth / 2, signY + 23.5, {
        align: "center",
      });

      const signX = pageWidth - margin - 8 - signWidth;
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);
      pdf.line(signX, signY + 15, signX + signWidth, signY + 15);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 60, 60);
      writeText("Owner", signX + signWidth / 2, signY + 19.5, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(120, 120, 120);
      writeText("Pemilik Lahan", signX + signWidth / 2, signY + 23.5, {
        align: "center",
      });

      // ========== FOOTER ==========
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7.5);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont("helvetica", "italic");

        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        writeText(
          `Dicetak: ${new Date().toLocaleString("id-ID")}`,
          margin,
          pageHeight - 7
        );

        if (totalPages > 1) {
          writeText(
            `Halaman ${i} dari ${totalPages}`,
            pageWidth - margin,
            pageHeight - 7,
            { align: "right" }
          );
        } else {
          writeText(
            "Dokumen digital dari Harvestan",
            pageWidth - margin,
            pageHeight - 7,
            { align: "right" }
          );
        }
      }

      // ===== SAVE =====
      const filename = `Invoice_${penggarap.nama.replace(/\s+/g, "_")}_${panen.tanggal}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generate PDF:", err);
      alert("Gagal generate PDF. Coba lagi.");
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
        <>Membuat PDF...</>
      ) : (
        <>Download Invoice PDF (Bagi Hasil)</>
      )}
    </button>
  );
}
