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

const KOMODITAS_ICON: Record<string, string> = {
  padi: "Padi",
  jagung: "Jagung",
  kacang_tanah: "Kacang Tanah",
  bawang_merah: "Bawang Merah",
  cabai_rawit: "Cabai Rawit",
};

const KOMODITAS_COLOR_RGB: Record<string, [number, number, number]> = {
  padi: [39, 174, 96],
  jagung: [243, 156, 18],
  kacang_tanah: [142, 68, 173],
  bawang_merah: [231, 76, 60],
  cabai_rawit: [192, 57, 43],
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

function hitungKategoriPDF(
  produktivitas: number,
  kategori: any
): { label: string; color: [number, number, number] } | null {
  if (!kategori || kategori.cukup === null || kategori.cukup === undefined) {
    return null;
  }
  const cukup = Number(kategori.cukup);
  const baik = kategori.baik !== null ? Number(kategori.baik) : null;
  const sangatBaik =
    kategori.sangat_baik !== null ? Number(kategori.sangat_baik) : null;

  if (sangatBaik !== null && produktivitas >= sangatBaik) {
    return { label: "SANGAT BAIK", color: [44, 94, 46] };
  }
  if (baik !== null && produktivitas >= baik) {
    return { label: "BAIK", color: [30, 100, 200] };
  }
  if (produktivitas >= cukup) {
    return { label: "CUKUP", color: [230, 126, 34] };
  }
  return { label: "KURANG OPTIMAL", color: [220, 40, 40] };
}

function hitungProduktivitasPerKomoditasPDF(
  harvests: any[],
  lands: { id: string; luas: number }[],
  kategoriList: any[]
) {
  const data: Record<
    string,
    {
      totalHasil: number;
      totalProdSum: number;
      jmlPanen: number;
      panenList: { tanggal: string; prod: number; hasil: number }[];
    }
  > = {};

  harvests.forEach((h) => {
    const kom = h.komoditas || "padi";
    const land = lands.find((l) => l.id === h.land_id);
    if (!land || Number(land.luas) <= 0) return;

    const prod = Number(h.hasil_kg) / Number(land.luas);

    if (!data[kom]) {
      data[kom] = {
        totalHasil: 0,
        totalProdSum: 0,
        jmlPanen: 0,
        panenList: [],
      };
    }
    data[kom].totalHasil += Number(h.hasil_kg);
    data[kom].totalProdSum += prod;
    data[kom].jmlPanen += 1;
    data[kom].panenList.push({
      tanggal: h.tanggal,
      prod,
      hasil: Number(h.hasil_kg),
    });
  });

  const hasil: any[] = [];
  Object.entries(data).forEach(([kom, d]) => {
    const rata = d.jmlPanen > 0 ? d.totalProdSum / d.jmlPanen : 0;
    const sorted = [...d.panenList].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );
    const terakhir = sorted[0]?.prod || 0;
    const kat = kategoriList.find((k) => k.komoditas === kom) || null;

    // Sort panenList by tanggal ascending untuk chart
    const panenAsc = [...d.panenList].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    hasil.push({
      komoditas: kom,
      produktivitasTerakhir: terakhir,
      produktivitasRata: rata,
      jmlPanen: d.jmlPanen,
      totalHasilKg: d.totalHasil,
      kategoriTerakhir: hitungKategoriPDF(terakhir, kat),
      kategoriRata: hitungKategoriPDF(rata, kat),
      panenAsc,
    });
  });

  const order = ["padi", "jagung", "kacang_tanah", "bawang_merah", "cabai_rawit"];
  hasil.sort((a, b) => {
    const ia = order.indexOf(a.komoditas);
    const ib = order.indexOf(b.komoditas);
    if (ia === -1 && ib === -1) return a.komoditas.localeCompare(b.komoditas);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return hasil;
}

// ===================================================
// Helper: Gambar Line Chart pakai jsPDF primitives
// ===================================================
function gambarLineChart(
  pdf: jsPDF,
  data: { x: string; y: number }[],
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: [number, number, number];
    yLabel: string;
    yFormat?: (n: number) => string;
    maxPoints?: number;
  }
) {
  const { x, y, width, height, color, yLabel, yFormat, maxPoints } = options;

  if (data.length === 0) return;

  // Kalau terlalu banyak, sample
  let displayData = data;
  if (maxPoints && data.length > maxPoints) {
    const step = Math.ceil(data.length / maxPoints);
    displayData = data.filter((_, i) => i % step === 0);
    if (displayData[displayData.length - 1] !== data[data.length - 1]) {
      displayData.push(data[data.length - 1]);
    }
  }

  // Hitung range Y
  const maxY = Math.max(...displayData.map((d) => d.y), 1);
  const minY = 0;

  // Background chart
  pdf.setFillColor(250, 250, 250);
  pdf.rect(x, y, width, height, "F");
  pdf.setDrawColor(230, 230, 230);
  pdf.rect(x, y, width, height);

  // Y-axis label
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont("helvetica", "normal");
  pdf.text(yLabel, x + 2, y - 2);

  // Grid horizontal (3 lines)
  const numGridLines = 3;
  for (let i = 1; i <= numGridLines; i++) {
    const gy = y + height - (i / numGridLines) * height;
    pdf.setDrawColor(240, 240, 240);
    pdf.line(x, gy, x + width, gy);

    // Label Y
    const val = (maxY / numGridLines) * i;
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    const label = yFormat ? yFormat(val) : Math.round(val).toLocaleString("id-ID");
    pdf.text(label, x - 1, gy + 1, { align: "right" });
  }

  // X-axis baseline
  pdf.setDrawColor(180, 180, 180);
  pdf.line(x, y + height, x + width, y + height);

  // Plot points
  const padding = 8;
  const innerW = width - padding * 2;
  const innerH = height - padding;
  const stepX = innerW / Math.max(displayData.length - 1, 1);

  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setLineWidth(0.6);

  // Draw lines
  for (let i = 0; i < displayData.length - 1; i++) {
    const p1x = x + padding + i * stepX;
    const p1y = y + height - padding - ((displayData[i].y - minY) / (maxY - minY)) * innerH;
    const p2x = x + padding + (i + 1) * stepX;
    const p2y = y + height - padding - ((displayData[i + 1].y - minY) / (maxY - minY)) * innerH;
    pdf.line(p1x, p1y, p2x, p2y);
  }

  // Draw dots
  pdf.setFillColor(color[0], color[1], color[2]);
  displayData.forEach((d, i) => {
    const px = x + padding + i * stepX;
    const py = y + height - padding - ((d.y - minY) / (maxY - minY)) * innerH;
    pdf.circle(px, py, 0.8, "F");
  });

  // X-axis labels (first, middle, last)
  pdf.setFontSize(6);
  pdf.setTextColor(120, 120, 120);
  if (displayData.length > 0) {
    pdf.text(displayData[0].x, x + padding, y + height + 3);
    if (displayData.length > 2) {
      const midIdx = Math.floor(displayData.length / 2);
      pdf.text(
        displayData[midIdx].x,
        x + padding + midIdx * stepX,
        y + height + 3
      );
    }
    if (displayData.length > 1) {
      pdf.text(
        displayData[displayData.length - 1].x,
        x + width - padding,
        y + height + 3,
        { align: "right" }
      );
    }
  }
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
        .order("tanggal", { ascending: true });
      harvests = data || [];
    }

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("penggarap_id", penggarapId)
      .eq("user_id", user.id)
      .order("tanggal", { ascending: false });

    const { data: kategoriList } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

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

    const produktivitasPerKom = hitungProduktivitasPerKomoditasPDF(
      harvests,
      lands || [],
      kategoriList || []
    );

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

    pdf.setFont("helvetica", "bold");
    pdf.text("Nama:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.nama, margin + 25, yPos);

    pdf.setFont("helvetica", "bold");
    pdf.text("Jumlah Lahan:", margin + 90, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${lands?.length || 0} lahan`, margin + 128, yPos);

    yPos += 6;

    pdf.setFont("helvetica", "bold");
    pdf.text("Kontak:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(penggarap.kontak || "-", margin + 25, yPos);

    pdf.setFont("helvetica", "bold");
    pdf.text("Total Luas:", margin + 90, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${totalLuas.toFixed(2)} Ha`, margin + 128, yPos);

    yPos += 6;

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

    const cardWidth = (contentWidth - 6) / 2;
    const cardHeight = 18;

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

    pdf.setFillColor(227, 242, 253);
    pdf.rect(margin + cardWidth + 6, yPos, cardWidth, cardHeight, "F");
    pdf.setDrawColor(187, 222, 251);
    pdf.rect(margin + cardWidth + 6, yPos, cardWidth, cardHeight);
    pdf.setTextColor(21, 101, 192);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `TOTAL PANEN (${harvests.length}x)`,
      margin + cardWidth + 9,
      yPos + 5
    );
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(13, 71, 161);
    pdf.text(formatKg(totalHasil), margin + cardWidth + 9, yPos + 13);

    yPos += cardHeight + 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Total Potongan Hutang dari Panen: ${formatRp(totalPotonganHutang)} | Total Hutang Dibayar: ${formatRp(totalHutangDibayar)}`,
      margin,
      yPos
    );
    yPos += 12;

    // ===== EVALUASI PRODUKTIVITAS PER KOMODITAS =====
    if (produktivitasPerKom.length > 0) {
      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text("EVALUASI PRODUKTIVITAS PER KOMODITAS", margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 90, yPos + 1.5);

      yPos += 6;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        "* Setiap komoditas dihitung terpisah (tidak dicampur)",
        margin,
        yPos
      );
      yPos += 5;

      pdf.setFillColor(240, 247, 237);
      pdf.rect(margin, yPos, contentWidth, 8, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(44, 94, 46);
      pdf.setFont("helvetica", "bold");

      const kc1 = margin + 2;
      const kc2 = margin + 45;
      const kc3 = margin + 75;
      const kc4 = margin + 105;
      const kc5 = margin + 135;

      pdf.text("Komoditas", kc1, yPos + 5);
      pdf.text("Jml Panen", kc2, yPos + 5);
      pdf.text("Total (Kg)", kc3, yPos + 5);
      pdf.text("Rata-rata (Kg/Ha)", kc4, yPos + 5);
      pdf.text("Kategori", kc5, yPos + 5);

      yPos += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(9);

      produktivitasPerKom.forEach((pk: any, idx: number) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos, contentWidth, 7, "F");
        }

        const icon = KOMODITAS_ICON[pk.komoditas] || "";
        const label = KOMODITAS_LABEL[pk.komoditas] || pk.komoditas;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        pdf.text(`${icon}`, kc1, yPos + 5);
        pdf.text(label, kc1 + 4, yPos + 5);
        pdf.text(String(pk.jmlPanen), kc2, yPos + 5);
        pdf.text(
          Number(pk.totalHasilKg).toLocaleString("id-ID"),
          kc3,
          yPos + 5
        );
        pdf.text(
          `${pk.produktivitasRata.toFixed(0)} Kg/Ha`,
          kc4,
          yPos + 5
        );

        if (pk.kategoriRata) {
          const c = pk.kategoriRata.color;
          pdf.setTextColor(c[0], c[1], c[2]);
          pdf.setFont("helvetica", "bold");
          pdf.text(pk.kategoriRata.label, kc5, yPos + 5);
        } else {
          pdf.setTextColor(160, 160, 160);
          pdf.setFont("helvetica", "italic");
          pdf.text("(belum diatur)", kc5, yPos + 5);
        }

        yPos += 7;
      });

      yPos += 8;
    }

    // ===== GRAFIK PRODUKSI & PRODUKTIVITAS PER KOMODITAS =====
    if (produktivitasPerKom.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text("GRAFIK PRODUKSI & PRODUKTIVITAS", margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 70, yPos + 1.5);

      yPos += 6;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        "* Setiap komoditas memiliki grafik sendiri (tidak dicampur)",
        margin,
        yPos
      );
      yPos += 6;

      // Untuk setiap komoditas yang punya data
      produktivitasPerKom.forEach((pk: any) => {
        const panenList = pk.panenAsc || [];
        if (panenList.length === 0) return;

        const color = KOMODITAS_COLOR_RGB[pk.komoditas] || [100, 100, 100];
        const label = KOMODITAS_LABEL[pk.komoditas] || pk.komoditas;

        // Perlu ~90mm untuk 2 grafik (produksi & produktivitas) + header
        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = margin;
        }

        // Header komoditas
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(margin, yPos, contentWidth, 6, "F");
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${label} — ${pk.jmlPanen} panen — Total ${Number(
            pk.totalHasilKg
          ).toLocaleString("id-ID")} Kg — Rata-rata ${pk.produktivitasRata.toFixed(
            0
          )} Kg/Ha`,
          margin + 3,
          yPos + 4
        );
        yPos += 8;

        // Chart Produksi
        const chartWidth = contentWidth;
        const chartHeight = 35;

        const dataProd = panenList.map((p: any) => ({
          x: formatTanggal(p.tanggal),
          y: p.hasil,
        }));

        gambarLineChart(pdf, dataProd, {
          x: margin,
          y: yPos,
          width: chartWidth,
          height: chartHeight,
          color: color,
          yLabel: "Produksi (Kg)",
          yFormat: (n) => Math.round(n).toLocaleString("id-ID"),
          maxPoints: 15,
        });
        yPos += chartHeight + 6;

        // Chart Produktivitas
        const dataProdv = panenList.map((p: any) => ({
          x: formatTanggal(p.tanggal),
          y: p.prod,
        }));

        gambarLineChart(pdf, dataProdv, {
          x: margin,
          y: yPos,
          width: chartWidth,
          height: chartHeight,
          color: color,
          yLabel: "Produktivitas (Kg/Ha)",
          yFormat: (n) => Math.round(n).toLocaleString("id-ID"),
          maxPoints: 15,
        });
        yPos += chartHeight + 8;
      });
    }

    // ===== DAFTAR LAHAN =====
    if (lands && lands.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text("DAFTAR LAHAN", margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 30, yPos + 1.5);

      yPos += 6;

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

      // Sort riwayat panen descending
      const harvestsSorted = [...harvests].sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );

      harvestsSorted.forEach((h, idx) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

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
        pdf.text((d.keperluan || "-").substring(0, 22), hc2, yPos + 4);
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
        pdf.text(formatRp(sisa).replace("Rp ", ""), hc5, yPos + 4);

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
