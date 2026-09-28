import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import jsPDF from "jspdf";
import {
  loadDemoData,
  hitungDemoStats,
  getProfitPerTahun,
  getDetailPerPenggarap,
} from "@/lib/demo/data-loader";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = loadDemoData();
    const stats = hitungDemoStats(data);
    const profitPerTahun = getProfitPerTahun();
    const detailPenggarap = getDetailPerPenggarap();

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    // ===== HEADER =====
    pdf.setFillColor(44, 94, 46);
    pdf.rect(0, 0, pageWidth, 32, "F");

    pdf.setFillColor(255, 193, 7);
    pdf.rect(0, 32, pageWidth, 1.5, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("LAPORAN DEMO HARVESTAN", pageWidth / 2, 14, {
      align: "center",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Data Contoh Petani Sukses 2016-2026", pageWidth / 2, 22, {
      align: "center",
    });

    pdf.setFontSize(8);
    pdf.setTextColor(255, 235, 180);
    pdf.text(
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
      pageWidth / 2,
      28,
      { align: "center" }
    );

    y = 42;

    // ===== RINGKASAN =====
    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("RINGKASAN 10 TAHUN", margin, y);
    pdf.setDrawColor(44, 94, 46);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 1.5, margin + 60, y + 1.5);
    y += 8;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const rows: [string, string][] = [
      ["Total Penggarap", `${stats.totalPenggarap} orang`],
      ["Total Lahan", `${stats.totalLahan} lahan (${stats.totalLuas.toFixed(1)} Ha)`],
      ["Total Panen", `${stats.totalPanen} kali`],
      ["Total Hasil", `${stats.totalHasilKg.toLocaleString("id-ID")} Kg`],
      ["Total Pendapatan", formatRp(stats.totalPendapatan)],
      ["Total Biaya", formatRp(stats.totalBiaya)],
      ["Total Profit Bersih", formatRp(stats.totalProfitBersih)],
      ["Rata-rata Profit/Tahun", formatRp(stats.rataRataProfitPerTahun)],
    ];

    rows.forEach(([label, value]) => {
      pdf.setFont("helvetica", "normal");
      pdf.text(label, margin + 2, y);
      pdf.setFont("helvetica", "bold");
      pdf.text(value, pageWidth - margin - 2, y, { align: "right" });
      y += 6;
    });

    y += 4;

    // ===== PROFIT OWNER & PENGGARAP =====
    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, y, contentWidth, 20, "F");
    pdf.setDrawColor(44, 94, 46);
    pdf.setLineWidth(0.4);
    pdf.rect(margin, y, contentWidth, 20);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(44, 94, 46);
    pdf.text("PROFIT OWNER", margin + 5, y + 7);
    pdf.text("PROFIT PENGGARAP", pageWidth / 2 + 5, y + 7);

    pdf.setFontSize(13);
    pdf.setTextColor(21, 87, 36);
    pdf.text(formatRp(stats.totalProfitOwner), margin + 5, y + 15);
    pdf.setTextColor(230, 81, 0);
    pdf.text(
      formatRp(stats.totalProfitPenggarap),
      pageWidth / 2 + 5,
      y + 15
    );

    y += 26;

    // ===== PROFIT PER TAHUN =====
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }

    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROFIT PER TAHUN", margin, y);
    pdf.setDrawColor(44, 94, 46);
    pdf.line(margin, y + 1.5, margin + 50, y + 1.5);
    y += 8;

    // Header tabel
    pdf.setFillColor(44, 94, 46);
    pdf.rect(margin, y, contentWidth, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Tahun", margin + 3, y + 4.5);
    pdf.text("Profit Owner", pageWidth / 2 - 10, y + 4.5, {
      align: "right",
    });
    pdf.text("Profit Penggarap", pageWidth / 2 + 40, y + 4.5, {
      align: "right",
    });
    pdf.text("Total", pageWidth - margin - 3, y + 4.5, { align: "right" });
    y += 7;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    profitPerTahun.forEach((p, idx) => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, y, contentWidth, 6, "F");
      }

      pdf.text(p.tahun, margin + 3, y + 4);
      pdf.text(formatRp(p.profitOwner), pageWidth / 2 - 10, y + 4, {
        align: "right",
      });
      pdf.text(formatRp(p.profitPenggarap), pageWidth / 2 + 40, y + 4, {
        align: "right",
      });
      pdf.setFont("helvetica", "bold");
      pdf.text(formatRp(p.totalProfit), pageWidth - margin - 3, y + 4, {
        align: "right",
      });
      pdf.setFont("helvetica", "normal");
      y += 6;
    });

    y += 6;

    // ===== LEADERBOARD =====
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }

    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("LEADERBOARD PENGGARAP", margin, y);
    pdf.setDrawColor(44, 94, 46);
    pdf.line(margin, y + 1.5, margin + 60, y + 1.5);
    y += 8;

    pdf.setFillColor(44, 94, 46);
    pdf.rect(margin, y, contentWidth, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("#", margin + 2, y + 4.5);
    pdf.text("Nama", margin + 10, y + 4.5);
    pdf.text("Lahan", margin + 65, y + 4.5, { align: "center" });
    pdf.text("Panen", margin + 85, y + 4.5, { align: "center" });
    pdf.text("Hasil (Kg)", margin + 115, y + 4.5, { align: "right" });
    pdf.text("Profit Owner", pageWidth - margin - 3, y + 4.5, {
      align: "right",
    });
    y += 7;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    const sorted = [...detailPenggarap].sort(
      (a, b) => b.profitOwner - a.profitOwner
    );

    sorted.forEach((p, idx) => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, y, contentWidth, 6, "F");
      }

      pdf.text(String(idx + 1), margin + 2, y + 4);
      pdf.text(p.nama.substring(0, 20), margin + 10, y + 4);
      pdf.text(String(p.jmlLahan), margin + 65, y + 4, { align: "center" });
      pdf.text(String(p.jmlPanen), margin + 85, y + 4, { align: "center" });
      pdf.text(p.totalHasilKg.toLocaleString("id-ID"), margin + 115, y + 4, {
        align: "right",
      });
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(21, 87, 36);
      pdf.text(
        formatRp(p.profitOwner),
        pageWidth - margin - 3,
        y + 4,
        { align: "right" }
      );
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      y += 6;
    });

    // ===== FOOTER =====
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Harvestan — Mode Demo — harvestan.vercel.app",
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
        "Content-Disposition": `attachment; filename="Demo_Harvestan_10_Tahun.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Demo PDF export error:", err);
    return NextResponse.json(
      { error: "Gagal generate PDF: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
