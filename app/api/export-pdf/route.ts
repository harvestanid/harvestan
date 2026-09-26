import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const penggarapId = url.searchParams.get("penggarap_id");

    if (!penggarapId) {
      return NextResponse.json(
        { error: "penggarap_id wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ========== AMBIL DATA ==========
    const { data: penggarap } = await supabase
      .from("penggaraps")
      .select("*")
      .eq("id", penggarapId)
      .eq("user_id", user.id)
      .single();

    if (!penggarap) {
      return NextResponse.json(
        { error: "Penggarap tidak ditemukan" },
        { status: 404 }
      );
    }

    const { data: lands } = await supabase
      .from("lands")
      .select("*")
      .eq("penggarap_id", penggarapId)
      .eq("user_id", user.id);

    const landIds = (lands || []).map((l) => l.id);

    let harvests: any[] = [];
    if (landIds.length > 0) {
      const { data } = await supabase
        .from("harvests")
        .select("*")
        .in("land_id", landIds)
        .eq("user_id", user.id)
        .order("tanggal", { ascending: false });
      harvests = data || [];
    }

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("penggarap_id", penggarapId)
      .eq("user_id", user.id)
      .order("tanggal", { ascending: false });

    // ========== HITUNG STATISTIK ==========
    const totalLuas = (lands || []).reduce((s, l) => s + Number(l.luas), 0);
    const totalHasil = harvests.reduce((s, h) => s + Number(h.hasil_kg), 0);
    const totalProfitOwner = harvests.reduce(
      (s, h) => s + Number(h.profit_owner || 0),
      0
    );
    const totalProfitPenggarap = harvests.reduce(
      (s, h) => s + Number(h.profit_penggarap || 0),
      0
    );
    const totalPotonganHutang = harvests.reduce(
      (s, h) => s + Number(h.potongan_hutang || 0),
      0
    );

    const hutangAktif = (debts || []).filter((d) => Number(d.sisa) > 0);
    const totalHutangAktif = hutangAktif.reduce(
      (s, d) => s + Number(d.sisa),
      0
    );
    const totalHutangDibayar = (debts || []).reduce(
      (s, d) => s + Number(d.dibayar || 0),
      0
    );

    const rataProduktivitas =
      harvests.length > 0 ? totalHasil / harvests.length / (totalLuas || 1) : 0;

    // ========== GENERATE PDF ==========
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let yPos = margin;

    // ===== HEADER =====
    pdf.setFillColor(44, 94, 46);
    pdf.rect(0, 0, pageWidth, 30, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("LAPORAN KINERJA PENGGARAP", pageWidth / 2, 14, {
      align: "center",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Harvestan - Sistem Manajemen Pertanian", pageWidth / 2, 22, {
      align: "center",
    });

    yPos = 38;

    // ===== INFO PENGGARAP =====
    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("DATA PENGGARAP", margin, yPos);
    pdf.setDrawColor(44, 94, 46);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos + 1.5, margin + 50, yPos + 1.5);

    yPos += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);

    // Baris 1
    pdf.setFont("helvetica", "bold");
    pdf.text("Nama:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.nama, margin + 25, yPos);

    pdf.setFont("helvetica", "bold");
    pdf.text("Jumlah Lahan:", margin + 90, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${lands?.length || 0} lahan`, margin + 128, yPos);

    yPos += 6;

    // Baris 2
    pdf.setFont("helvetica", "bold");
    pdf.text("Kontak:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.kontak || "-", margin + 25, yPos);

    pdf.setFont("helvetica", "bold");
    pdf.text("Total Luas:", margin + 90, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${totalLuas.toFixed(2)} Ha`, margin + 128, yPos);

    yPos += 6;

    // Baris 3
    pdf.setFont("helvetica", "bold");
    pdf.text("Alamat:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.alamat || "-", margin + 25, yPos);

    yPos += 10;

    // ===== RINGKASAN KEUANGAN =====
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(44, 94, 46);
    pdf.text("RINGKASAN KEUANGAN", margin, yPos);
    pdf.setDrawColor(44, 94, 46);
    pdf.line(margin, yPos + 1.5, margin + 55, yPos + 1.5);

    yPos += 7;

    // Card ringkasan
    const cardWidth = (contentWidth - 6) / 2;
    const cardHeight = 18;

    // Card 1: Profit Owner
    pdf.setFillColor(232, 245, 233);
    pdf.rect(margin, yPos, cardWidth, cardHeight, "F");
    pdf.setDrawColor(200, 230, 201);
    pdf.rect(margin, yPos, cardWidth, cardHeight);
    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("PROFIT OWNER", margin + 3, yPos + 5);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(21, 87, 36);
    pdf.text(formatRp(totalProfitOwner), margin + 3, yPos + 13);

    // Card 2: Profit Penggarap
    pdf.setFillColor(255, 243, 224);
    pdf.rect(margin + cardWidth + 6, yPos, cardWidth, cardHeight, "F");
    pdf.setDrawColor(255, 224, 178);
    pdf.rect(margin + cardWidth + 6, yPos, cardWidth, cardHeight);
    pdf.setTextColor(230, 126, 34);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("PROFIT PENGGARAP", margin + cardWidth + 9, yPos + 5);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(230, 81, 0);
    pdf.text(
      formatRp(totalProfitPenggarap),
      margin + cardWidth + 9,
      yPos + 13
    );

    yPos += cardHeight + 4;

    // Card 3: Hutang Aktif
    pdf.setFillColor(255, 235, 238);
    pdf.rect(margin, yPos, cardWidth, cardHeight, "F");
    pdf.setDrawColor(255, 205, 210);
    pdf.rect(margin, yPos, cardWidth, cardHeight);
    pdf.setTextColor(198, 40, 40);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `HUTANG AKTIF (${hutangAktif.length})`,
      margin + 3,
      yPos + 5
    );
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(183, 28, 28);
    pdf.text(formatRp(totalHutangAktif), margin + 3, yPos + 13);

    // Card 4: Total Panen
    pdf.setFillColor(227, 242, 253);
    pdf.rect(margin + cardWidth + 6, yPos, cardWidth, cardHeight, "F");
    pdf.setDrawColor(187, 222, 251);
    pdf.rect(margin + cardWidth + 6, yPos, cardWidth, cardHeight);
    pdf.setTextColor(21, 101, 192);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(`TOTAL PANEN (${harvests.length}x)`, margin + cardWidth + 9, yPos + 5);
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(13, 71, 161);
    pdf.text(formatKg(totalHasil), margin + cardWidth + 9, yPos + 13);

    yPos += cardHeight + 8;

    // Info tambahan
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Rata-rata Produktivitas: ${rataProduktivitas.toFixed(0)} Kg/Ha | Total Potongan Hutang dari Panen: ${formatRp(totalPotonganHutang)} | Total Hutang Dibayar: ${formatRp(totalHutangDibayar)}`,
      margin,
      yPos
    );
    yPos += 10;

    // ===== DAFTAR LAHAN =====
    if (lands && lands.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text("DAFTAR LAHAN", margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 30, yPos + 1.5);

      yPos += 6;

      // Header tabel
      pdf.setFillColor(240, 247, 237);
      pdf.rect(margin, yPos, contentWidth, 7, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(44, 94, 46);
      pdf.setFont("helvetica", "bold");

      const col1 = margin + 2;
      const col2 = margin + 60;
      const col3 = margin + 85;
      const col4 = margin + 105;

      pdf.text("Nama Lahan", col1, yPos + 4.5);
      pdf.text("Luas (Ha)", col2, yPos + 4.5);
      pdf.text("Jml Panen", col3, yPos + 4.5);
      pdf.text("Total Hasil (Kg)", col4, yPos + 4.5);

      yPos += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(9);

      lands.forEach((l) => {
        const lahanHarvests = harvests.filter((h) => h.land_id === l.id);
        const totalHasilLahan = lahanHarvests.reduce(
          (s, h) => s + Number(h.hasil_kg),
          0
        );

        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.text(l.nama.substring(0, 28), col1, yPos + 4);
        pdf.text(Number(l.luas).toFixed(2), col2, yPos + 4);
        pdf.text(String(lahanHarvests.length), col3, yPos + 4);
        pdf.text(totalHasilLahan.toLocaleString("id-ID"), col4, yPos + 4);

        yPos += 6;
      });

      yPos += 5;
    }

    // ===== RIWAYAT PANEN =====
    if (harvests.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text(`RIWAYAT PANEN (${harvests.length})`, margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 45, yPos + 1.5);

      yPos += 6;

      // Header tabel panen
      pdf.setFillColor(44, 94, 46);
      pdf.rect(margin, yPos, contentWidth, 7, "F");
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");

      const tc1 = margin + 2;
      const tc2 = margin + 22;
      const tc3 = margin + 48;
      const tc4 = margin + 78;
      const tc5 = margin + 95;
      const tc6 = margin + 118;
      const tc7 = margin + 145;

      pdf.text("Tanggal", tc1, yPos + 4.5);
      pdf.text("Lahan", tc2, yPos + 4.5);
      pdf.text("Komoditas", tc3, yPos + 4.5);
      pdf.text("Hasil (Kg)", tc4, yPos + 4.5);
      pdf.text("Prod", tc5, yPos + 4.5);
      pdf.text("Owner", tc6, yPos + 4.5);
      pdf.text("Penggarap", tc7, yPos + 4.5);

      yPos += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(8);

      harvests.forEach((h, idx) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        // Zebra stripe
        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos, contentWidth, 6, "F");
        }

        const land = lands?.find((l) => l.id === h.land_id);
        const prod = land ? Number(h.hasil_kg) / Number(land.luas) : 0;

        pdf.text(formatTanggal(h.tanggal), tc1, yPos + 4);
        pdf.text((land?.nama || "-").substring(0, 15), tc2, yPos + 4);
        pdf.text(
          (KOMODITAS_LABEL[h.komoditas] || h.komoditas).substring(0, 13),
          tc3,
          yPos + 4
        );
        pdf.text(Number(h.hasil_kg).toLocaleString("id-ID"), tc4, yPos + 4);
        pdf.text(prod.toFixed(0), tc5, yPos + 4);
        pdf.text(
          formatRp(Number(h.profit_owner || 0)).replace("Rp ", ""),
          tc6,
          yPos + 4
        );
        pdf.text(
          formatRp(Number(h.profit_penggarap || 0)).replace("Rp ", ""),
          tc7,
          yPos + 4
        );

        yPos += 6;
      });

      yPos += 5;
    }

    // ===== RIWAYAT HUTANG =====
    if (debts && debts.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text(`RIWAYAT HUTANG (${debts.length})`, margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 40, yPos + 1.5);

      yPos += 6;

      // Header tabel hutang
      pdf.setFillColor(155, 89, 182);
      pdf.rect(margin, yPos, contentWidth, 7, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");

      const hc1 = margin + 2;
      const hc2 = margin + 22;
      const hc3 = margin + 60;
      const hc4 = margin + 90;
      const hc5 = margin + 115;
      const hc6 = margin + 140;

      pdf.text("Tanggal", hc1, yPos + 4.5);
      pdf.text("Keperluan", hc2, yPos + 4.5);
      pdf.text("Jumlah", hc3, yPos + 4.5);
      pdf.text("Dibayar", hc4, yPos + 4.5);
      pdf.text("Sisa", hc5, yPos + 4.5);
      pdf.text("Status", hc6, yPos + 4.5);

      yPos += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(8);

      debts.forEach((d, idx) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos, contentWidth, 6, "F");
        }

        const sisa = Number(d.sisa);
        const lunas = sisa <= 0;

        pdf.text(formatTanggal(d.tanggal), hc1, yPos + 4);
        pdf.text(
          (d.keperluan || "-").substring(0, 22),
          hc2,
          yPos + 4
        );
        pdf.text(
          formatRp(Number(d.jumlah)).replace("Rp ", ""),
          hc3,
          yPos + 4
        );
        pdf.text(
          formatRp(Number(d.dibayar || 0)).replace("Rp ", ""),
          hc4,
          yPos + 4
        );
        pdf.text(
          formatRp(sisa).replace("Rp ", ""),
          hc5,
          yPos + 4
        );

        if (lunas) {
          pdf.setTextColor(39, 174, 96);
        } else {
          pdf.setTextColor(231, 76, 60);
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(lunas ? "LUNAS" : "AKTIF", hc6, yPos + 4);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);

        yPos += 6;
      });
    }

    // ===== FOOTER =====
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "normal");

      const footerY = pageHeight - 10;

      pdf.text(
        `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
        margin,
        footerY
      );
      pdf.text(
        `Halaman ${i} dari ${totalPages}`,
        pageWidth - margin,
        footerY,
        { align: "right" }
      );

      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    }

    // ===== GENERATE BUFFER =====
    const pdfBuffer = pdf.output("arraybuffer");

    const filename = `Laporan_${penggarap.nama.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export PDF error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat generate PDF" },
      { status: 500 }
    );
  }
}
