import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

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

type RequestBody = {
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

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatKg(n: number) {
  return Math.round(n).toLocaleString("id-ID") + " Kg";
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { penggarap, lahan, musim, panenList, totals } = body;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    // ===== HEADER =====
    pdf.setFillColor(192, 57, 43);
    pdf.rect(0, 0, pageWidth, 26, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE BAGI HASIL MUSIM", pageWidth / 2, 11, {
      align: "center",
    });

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Harvestan - Sistem Manajemen Pertanian | ${musim}`,
      pageWidth / 2,
      19,
      { align: "center" }
    );

    y = 32;

    // ===== INFO PENGGARAP & LAHAN =====
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y, contentWidth, 20, "F");
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, y, contentWidth, 20);

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Penggarap:", margin + 3, y + 5);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.nama, margin + 30, y + 5);

    pdf.setFont("helvetica", "bold");
    pdf.text("Lahan:", margin + 100, y + 5);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${lahan.nama} (${lahan.luas.toFixed(2)} Ha)`, margin + 120, y + 5);

    pdf.setFont("helvetica", "bold");
    pdf.text("Kontak:", margin + 3, y + 11);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.kontak || "-", margin + 30, y + 11);

    pdf.setFont("helvetica", "bold");
    pdf.text("Alamat:", margin + 100, y + 11);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.alamat || "-", margin + 120, y + 11);

    pdf.setFont("helvetica", "bold");
    pdf.text("Musim:", margin + 3, y + 17);
    pdf.setFont("helvetica", "normal");
    pdf.text(musim, margin + 30, y + 17);

    pdf.setFont("helvetica", "bold");
    pdf.text("Jml Panen:", margin + 100, y + 17);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${panenList.length}x`, margin + 120, y + 17);

    y += 25;

    // ===== RINGKASAN PRODUKSI =====
    pdf.setFillColor(192, 57, 43);
    pdf.rect(margin, y, contentWidth, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("RINGKASAN PRODUKSI", margin + 2, y + 4);
    y += 8;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    const rowH = 6;
    const colWidth = contentWidth / 3;

    // Row 1
    pdf.setFillColor(250, 250, 250);
    pdf.rect(margin, y, contentWidth, rowH, "F");
    pdf.text("Total Hasil Panen", margin + 2, y + 4);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatKg(totals.totalHasil), margin + colWidth * 2 - 2, y + 4, {
      align: "right",
    });
    y += rowH;

    pdf.setFont("helvetica", "normal");
    pdf.text("Produktivitas", margin + 2, y + 4);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `${totals.produktivitas.toFixed(0)} Kg/Ha`,
      margin + colWidth * 2 - 2,
      y + 4,
      { align: "right" }
    );
    y += rowH;

    pdf.setFont("helvetica", "normal");
    pdf.text("Pendapatan Kotor", margin + 2, y + 4);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatRp(totals.totalPendapatan), margin + colWidth * 2 - 2, y + 4, {
      align: "right",
    });
    y += rowH;

    pdf.setFont("helvetica", "normal");
    pdf.text("Biaya Panen", margin + 2, y + 4);
    pdf.setTextColor(192, 57, 43);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `- ${formatRp(totals.totalBiayaPanen)}`,
      margin + colWidth * 2 - 2,
      y + 4,
      { align: "right" }
    );
    pdf.setTextColor(60, 60, 60);
    y += rowH;

    if (totals.totalBiayaTambahan > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.text("Biaya Tambahan", margin + 2, y + 4);
      pdf.setTextColor(192, 57, 43);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `- ${formatRp(totals.totalBiayaTambahan)}`,
        margin + colWidth * 2 - 2,
        y + 4,
        { align: "right" }
      );
      pdf.setTextColor(60, 60, 60);
      y += rowH;
    }

    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, y, contentWidth, rowH + 1, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(21, 87, 36);
    pdf.text("PROFIT BERSIH", margin + 2, y + 4.5);
    pdf.text(
      formatRp(totals.totalProfitBersih),
      margin + colWidth * 2 - 2,
      y + 4.5,
      { align: "right" }
    );
    y += rowH + 3;

    // ===== BAGI HASIL =====
    pdf.setFillColor(41, 128, 185);
    pdf.rect(margin, y, contentWidth, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("BAGI HASIL MUSIM", margin + 2, y + 4);
    y += 8;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    // Sebelum potong hutang
    if (totals.totalPotonganHutang > 0) {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(margin, y, contentWidth, rowH, "F");
      pdf.setFont("helvetica", "bold");
      pdf.text("SEBELUM POTONG HUTANG", margin + 2, y + 4);
      y += rowH;

      pdf.setFont("helvetica", "normal");
      pdf.text("Owner", margin + 4, y + 4);
      pdf.text(
        formatRp(totals.totalProfitOwnerSebelum),
        margin + colWidth * 2 - 2,
        y + 4,
        { align: "right" }
      );
      y += rowH;

      pdf.text("Penggarap", margin + 4, y + 4);
      pdf.text(
        formatRp(totals.totalProfitPenggarapSebelum),
        margin + colWidth * 2 - 2,
        y + 4,
        { align: "right" }
      );
      y += rowH;

      pdf.setFillColor(255, 235, 235);
      pdf.rect(margin, y, contentWidth, rowH, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(192, 57, 43);
      pdf.text("Potong Hutang", margin + 2, y + 4);
      pdf.text(
        `- ${formatRp(totals.totalPotonganHutang)}`,
        margin + colWidth * 2 - 2,
        y + 4,
        { align: "right" }
      );
      pdf.setTextColor(60, 60, 60);
      y += rowH + 1;
    }

    // SESUDAH potong hutang — FINAL
    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, y, contentWidth, 10, "F");
    pdf.setDrawColor(200, 230, 201);
    pdf.rect(margin, y, contentWidth, 10);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(21, 87, 36);
    pdf.text("TOTAL DITERIMA OWNER", margin + 2, y + 6);
    pdf.text(
      formatRp(totals.totalProfitOwner),
      margin + colWidth * 2 - 2,
      y + 6,
      { align: "right" }
    );
    y += 11;

    pdf.setFillColor(255, 243, 224);
    pdf.rect(margin, y, contentWidth, 10, "F");
    pdf.setDrawColor(255, 224, 178);
    pdf.rect(margin, y, contentWidth, 10);
    pdf.setTextColor(230, 81, 0);
    pdf.text("TOTAL DITERIMA PENGGARAP", margin + 2, y + 6);
    pdf.text(
      formatRp(totals.totalProfitPenggarap),
      margin + colWidth * 2 - 2,
      y + 6,
      { align: "right" }
    );
    y += 13;

    // Status Hutang
    if (totals.lunas) {
      pdf.setFillColor(212, 237, 218);
      pdf.rect(margin, y, contentWidth, 7, "F");
      pdf.setTextColor(21, 87, 36);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "HUTANG LUNAS DI MUSIM INI",
        pageWidth / 2,
        y + 4.5,
        { align: "center" }
      );
      y += 10;
    } else if (totals.sisaHutangAkhir > 0) {
      pdf.setFillColor(255, 243, 205);
      pdf.rect(margin, y, contentWidth, 7, "F");
      pdf.setTextColor(133, 100, 4);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `SISA HUTANG: ${formatRp(totals.sisaHutangAkhir)}`,
        pageWidth / 2,
        y + 4.5,
        { align: "center" }
      );
      y += 10;
    }

    // ===== DETAIL PER PANEN =====
    if (y > pageHeight - 50) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFillColor(41, 128, 185);
    pdf.rect(margin, y, contentWidth, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(`DETAIL PER PANEN (${panenList.length}x)`, margin + 2, y + 4);
    y += 8;

    // Header tabel
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y, contentWidth, 6, "F");
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");

    const cols = [
      { label: "#", x: margin + 2, align: "left" as const, width: 6 },
      { label: "Tanggal", x: margin + 10, align: "left" as const, width: 22 },
      { label: "Hasil", x: margin + 35, align: "right" as const, width: 20 },
      { label: "Prod.", x: margin + 60, align: "right" as const, width: 18 },
      { label: "Profit Bersih", x: margin + 82, align: "right" as const, width: 25 },
      { label: "Owner", x: margin + 108, align: "right" as const, width: 22 },
      { label: "Penggarap", x: margin + 134, align: "right" as const, width: 25 },
      { label: "Potong Hutang", x: margin + 165, align: "right" as const, width: 22 },
    ];

    cols.forEach((c) => {
      pdf.text(c.label, c.x, y + 4, { align: c.align });
    });
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);

    panenList.forEach((h, idx) => {
      if (y > pageHeight - 15) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, y, contentWidth, 6, "F");
      }

      pdf.setTextColor(60, 60, 60);
      pdf.text(String(idx + 1), cols[0].x, y + 4);
      pdf.text(formatTanggal(h.tanggal), cols[1].x, y + 4);
      pdf.text(
        `${h.hasilKg.toLocaleString("id-ID")} Kg`,
        cols[2].x,
        y + 4,
        { align: "right" }
      );
      pdf.text(
        `${h.produktivitas.toFixed(0)} Kg/Ha`,
        cols[3].x,
        y + 4,
        { align: "right" }
      );
      pdf.setTextColor(21, 87, 36);
      pdf.text(formatRp(h.profitBersih), cols[4].x, y + 4, { align: "right" });
      pdf.setTextColor(39, 174, 96);
      pdf.text(formatRp(h.profitOwner), cols[5].x, y + 4, { align: "right" });
      pdf.setTextColor(230, 126, 34);
      pdf.text(formatRp(h.profitPenggarap), cols[6].x, y + 4, {
        align: "right",
      });
      pdf.setTextColor(192, 57, 43);
      pdf.text(
        h.potonganHutang > 0 ? `- ${formatRp(h.potonganHutang)}` : "-",
        cols[7].x,
        y + 4,
        { align: "right" }
      );

      y += 6;
    });

    // TOTAL ROW
    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, y, contentWidth, 8, "F");
    pdf.setTextColor(21, 87, 36);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("TOTAL", cols[0].x, y + 5);
    pdf.text(
      `${totals.totalHasil.toLocaleString("id-ID")} Kg`,
      cols[2].x,
      y + 5,
      { align: "right" }
    );
    pdf.text(
      `${totals.produktivitas.toFixed(0)} Kg/Ha`,
      cols[3].x,
      y + 5,
      { align: "right" }
    );
    pdf.text(
      formatRp(totals.totalProfitBersih),
      cols[4].x,
      y + 5,
      { align: "right" }
    );
    pdf.text(formatRp(totals.totalProfitOwner), cols[5].x, y + 5, {
      align: "right",
    });
    pdf.text(formatRp(totals.totalProfitPenggarap), cols[6].x, y + 5, {
      align: "right",
    });
    pdf.setTextColor(192, 57, 43);
    pdf.text(
      `- ${formatRp(totals.totalPotonganHutang)}`,
      cols[7].x,
      y + 5,
      { align: "right" }
    );

    y += 15;

    // ===== FOOTER =====
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
        margin,
        pageHeight - 8
      );
      pdf.text(
        `Halaman ${i} dari ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }

    const pdfBuffer = pdf.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice_${musim.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Export PDF Musim error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
