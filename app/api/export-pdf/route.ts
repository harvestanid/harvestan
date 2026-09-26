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

// ===================================================
// Helper: Kategori dari threshold
// ===================================================
function getKategoriFromThreshold(
  nilai: number,
  threshold: {
    cukup: number | null;
    baik: number | null;
    sangat_baik: number | null;
  } | null
): {
  label: string;
  kode: "kurang" | "cukup" | "baik" | "sangat";
  color: [number, number, number];
  bintang: number;
} | null {
  if (!threshold || threshold.cukup === null || threshold.cukup === undefined) {
    return null;
  }
  const cukup = Number(threshold.cukup);
  const baik = threshold.baik !== null ? Number(threshold.baik) : null;
  const sangatBaik =
    threshold.sangat_baik !== null ? Number(threshold.sangat_baik) : null;

  if (sangatBaik !== null && nilai >= sangatBaik) {
    return {
      label: "SANGAT BAIK",
      kode: "sangat",
      color: [44, 94, 46],
      bintang: 3,
    };
  }
  if (baik !== null && nilai >= baik) {
    return {
      label: "BAIK",
      kode: "baik",
      color: [74, 144, 226],
      bintang: 2,
    };
  }
  if (nilai >= cukup) {
    return {
      label: "CUKUP",
      kode: "cukup",
      color: [230, 126, 34],
      bintang: 1,
    };
  }
  return {
    label: "KURANG OPTIMAL",
    kode: "kurang",
    color: [220, 40, 40],
    bintang: 0,
  };
}

// ===================================================
// Helper: Gambar bintang
// ===================================================
function drawStar(pdf: jsPDF, cx: number, cy: number, r: number) {
  const points: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    points.push([
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
    ]);
  }
  const startX = points[0][0];
  const startY = points[0][1];
  for (let i = 1; i < points.length; i++) {
    pdf.line(
      points[i - 1][0],
      points[i - 1][1],
      points[i][0],
      points[i][1]
    );
  }
  pdf.line(
    points[points.length - 1][0],
    points[points.length - 1][1],
    startX,
    startY
  );
}

function drawStars(
  pdf: jsPDF,
  x: number,
  y: number,
  count: number,
  size: number = 2
): number {
  for (let i = 0; i < count; i++) {
    const cx = x + i * (size * 2 + 1);
    drawStar(pdf, cx, y, size);
  }
  return x + count * (size * 2 + 1);
}

// ===================================================
// Helper: Produktivitas per komoditas
// ===================================================
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

    const panenAsc = [...d.panenList].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    hasil.push({
      komoditas: kom,
      produktivitasTerakhir: terakhir,
      produktivitasRata: rata,
      jmlPanen: d.jmlPanen,
      totalHasilKg: d.totalHasil,
      kategoriTerakhir: getKategoriFromThreshold(terakhir, kat),
      kategoriRata: getKategoriFromThreshold(rata, kat),
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
// Helper: Line chart
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

  let displayData = data;
  if (maxPoints && data.length > maxPoints) {
    const step = Math.ceil(data.length / maxPoints);
    displayData = data.filter((_, i) => i % step === 0);
    if (displayData[displayData.length - 1] !== data[data.length - 1]) {
      displayData.push(data[data.length - 1]);
    }
  }

  const maxY = Math.max(...displayData.map((d) => d.y), 1);
  const minY = 0;

  pdf.setFillColor(250, 250, 250);
  pdf.rect(x, y, width, height, "F");
  pdf.setDrawColor(230, 230, 230);
  pdf.rect(x, y, width, height);

  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont("helvetica", "normal");
  pdf.text(yLabel, x + 2, y - 2);

  const numGridLines = 3;
  for (let i = 1; i <= numGridLines; i++) {
    const gy = y + height - (i / numGridLines) * height;
    pdf.setDrawColor(240, 240, 240);
    pdf.line(x, gy, x + width, gy);

    const val = (maxY / numGridLines) * i;
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    const label = yFormat
      ? yFormat(val)
      : Math.round(val).toLocaleString("id-ID");
    pdf.text(label, x - 1, gy + 1, { align: "right" });
  }

  pdf.setDrawColor(180, 180, 180);
  pdf.line(x, y + height, x + width, y + height);

  const padding = 8;
  const innerW = width - padding * 2;
  const innerH = height - padding;
  const stepX = innerW / Math.max(displayData.length - 1, 1);

  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setLineWidth(0.6);

  for (let i = 0; i < displayData.length - 1; i++) {
    const p1x = x + padding + i * stepX;
    const p1y =
      y + height - padding - ((displayData[i].y - minY) / (maxY - minY)) * innerH;
    const p2x = x + padding + (i + 1) * stepX;
    const p2y =
      y +
      height -
      padding -
      ((displayData[i + 1].y - minY) / (maxY - minY)) * innerH;
    pdf.line(p1x, p1y, p2x, p2y);
  }

  pdf.setFillColor(color[0], color[1], color[2]);
  displayData.forEach((d, i) => {
    const px = x + padding + i * stepX;
    const py =
      y + height - padding - ((d.y - minY) / (maxY - minY)) * innerH;
    pdf.circle(px, py, 0.8, "F");
  });

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

// ===================================================
// MAIN GET
// ===================================================
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
    const totalHutangSemua = (debts || []).reduce(
      (s, d) => s + Number(d.jumlah || 0),
      0
    );

    const produktivitasPerKom = hitungProduktivitasPerKomoditasPDF(
      harvests,
      lands || [],
      kategoriList || []
    );

    // Cek apakah ada kategori terisi
    const adaKategori = produktivitasPerKom.some(
      (pk: any) => pk.kategoriRata !== null
    );

    // Rekomendasi reward & pendampingan
    const rewardList: {
      komoditas: string;
      nilai: number;
      label: string;
    }[] = [];
    const pendampinganList: {
      komoditas: string;
      nilai: number;
      label: string;
    }[] = [];

    if (adaKategori) {
      produktivitasPerKom.forEach((pk: any) => {
        const kat = pk.kategoriRata;
        if (!kat) return;
        if (kat.kode === "sangat") {
          rewardList.push({
            komoditas: pk.komoditas,
            nilai: pk.produktivitasRata,
            label: kat.label,
          });
        } else if (kat.kode === "kurang") {
          pendampinganList.push({
            komoditas: pk.komoditas,
            nilai: pk.produktivitasRata,
            label: kat.label,
          });
        }
      });
    }

    // Rincian biaya total
    const totalBiayaPanen = harvests.reduce(
      (s, h) => s + Number(h.hasil_kg) * Number(h.biaya_panen_per_kg || 0),
      0
    );
    const totalBiayaTambahan = harvests.reduce(
      (s, h) => s + Number(h.biaya_tambahan || 0),
      0
    );
    const totalPendapatan = harvests.reduce(
      (s, h) => s + Number(h.hasil_kg) * Number(h.harga_gabah || 0),
      0
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

    // Baris tambahan: rincian biaya & hutang
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Total Pendapatan: ${formatRp(totalPendapatan)} | Biaya Panen: ${formatRp(totalBiayaPanen)} | Biaya Tambahan: ${formatRp(totalBiayaTambahan)}`,
      margin,
      yPos
    );
    yPos += 5;
    pdf.text(
      `Total Potongan Hutang: ${formatRp(totalPotonganHutang)} | Total Hutang Dibayar: ${formatRp(totalHutangDibayar)} | Total Hutang: ${formatRp(totalHutangSemua)}`,
      margin,
      yPos
    );
    yPos += 10;

    // ===== EVALUASI PRODUKTIVITAS PER KOMODITAS (dengan bintang) =====
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
        "* Setiap komoditas dihitung terpisah. ⭐ = kategori, ! = perlu pendampingan",
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

        const label = KOMODITAS_LABEL[pk.komoditas] || pk.komoditas;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
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

        // Kolom kategori dengan bintang
        const kat = pk.kategoriRata;
        if (kat) {
          pdf.setTextColor(kat.color[0], kat.color[1], kat.color[2]);
          pdf.setFont("helvetica", "bold");

          if (kat.bintang > 0) {
            pdf.setDrawColor(255, 193, 7);
            pdf.setLineWidth(0.3);
            drawStars(pdf, kc5, yPos + 3.5, kat.bintang, 1.8);
            pdf.text(kat.label, kc5 + 14, yPos + 5);
          } else {
            pdf.text("! ", kc5, yPos + 5);
            pdf.text(kat.label, kc5 + 3, yPos + 5);
          }
        } else {
          pdf.setTextColor(160, 160, 160);
          pdf.setFont("helvetica", "italic");
          pdf.text("(belum diatur)", kc5, yPos + 5);
        }

        yPos += 7;
      });

      yPos += 8;
    }

    // ===== REKOMENDASI REWARD & PENDAMPINGAN =====
    if (adaKategori) {
      if (yPos > pageHeight - 70) {
        pdf.addPage();
        yPos = margin;
      }

      // Reward
      pdf.setFillColor(255, 193, 7);
      pdf.rect(margin, yPos, contentWidth, 6, "F");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "REKOMENDASI REWARD (Kategori Sangat Baik)",
        margin + 2,
        yPos + 4
      );
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);

      if (rewardList.length === 0) {
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          "Belum ada komoditas dengan kategori sangat baik.",
          margin + 2,
          yPos
        );
        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");
        yPos += 6;
      } else {
        rewardList.forEach((r) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.setDrawColor(255, 193, 7);
          pdf.setLineWidth(0.3);
          drawStars(pdf, margin + 2, yPos - 1, 3, 2.5);
          pdf.setFont("helvetica", "bold");
          pdf.text(
            KOMODITAS_LABEL[r.komoditas] || r.komoditas,
            margin + 24,
            yPos
          );
          pdf.setFont("helvetica", "normal");
          pdf.text(
            `— ${r.nilai.toFixed(0)} Kg/Ha (${r.label})`,
            margin + 70,
            yPos
          );
          yPos += 6;
        });
      }

      yPos += 4;

      // Pendampingan
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFillColor(231, 76, 60);
      pdf.rect(margin, yPos, contentWidth, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "REKOMENDASI PENDAMPINGAN (Kurang Optimal)",
        margin + 2,
        yPos + 4
      );
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);

      if (pendampinganList.length === 0) {
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          "Tidak ada komoditas yang perlu pendampingan. Semua optimal!",
          margin + 2,
          yPos
        );
        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");
        yPos += 6;
      } else {
        pendampinganList.forEach((r) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.setTextColor(200, 40, 40);
          pdf.setFont("helvetica", "bold");
          pdf.text("! ", margin + 2, yPos);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            KOMODITAS_LABEL[r.komoditas] || r.komoditas,
            margin + 8,
            yPos
          );
          pdf.setFont("helvetica", "normal");
          pdf.text(
            `— ${r.nilai.toFixed(0)} Kg/Ha (${r.label})`,
            margin + 55,
            yPos
          );
          yPos += 6;
        });
      }

      yPos += 8;
    } else {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, contentWidth, 10, "F");
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Kategori produktivitas belum di-set. Buka Pengaturan untuk mengaktifkan evaluasi & rekomendasi.",
        margin + 2,
        yPos + 6
      );
      yPos += 14;
    }

    // ===== GRAFIK PRODUKSI & PRODUKTIVITAS PER KOMODITAS =====
    if (produktivitasPerKom.length > 0) {
      if (yPos > pageHeight - 100) {
        pdf.addPage();
        yPos = margin;
      }

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

      produktivitasPerKom.forEach((pk: any) => {
        const panenList = pk.panenAsc || [];
        if (panenList.length === 0) return;

        const color = KOMODITAS_COLOR_RGB[pk.komoditas] || [100, 100, 100];
        const label = KOMODITAS_LABEL[pk.komoditas] || pk.komoditas;

        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = margin;
        }

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

    // ===== RINGKASAN SETIAP PANEN (dengan rincian biaya lengkap) =====
    if (harvests.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text(`RINGKASAN SETIAP PANEN (${harvests.length})`, margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 65, yPos + 1.5);

      yPos += 8;

      const harvestsSorted = [...harvests].sort(
        (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      harvestsSorted.forEach((h, idx) => {
        if (yPos > pageHeight - 55) {
          pdf.addPage();
          yPos = margin;
        }

        const land = (lands || []).find((l) => l.id === h.land_id);

        // Header panen
        pdf.setFillColor(232, 245, 233);
        pdf.rect(margin, yPos, contentWidth, 5, "F");
        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${idx + 1}. ${KOMODITAS_LABEL[h.komoditas] || h.komoditas}${
            h.musim ? ` (${h.musim})` : ""
          } - ${land?.nama || "?"}`,
          margin + 2,
          yPos + 3.5
        );
        pdf.text(
          formatTanggal(h.tanggal),
          pageWidth - margin - 2,
          yPos + 3.5,
          { align: "right" }
        );
        yPos += 6;

        // Detail
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        const pendapatan = Number(h.hasil_kg) * Number(h.harga_gabah);
        const biayaPanen = Number(h.hasil_kg) * Number(h.biaya_panen_per_kg);
        const biayaTambahan = Number(h.biaya_tambahan || 0);

        const leftX = margin + 4;
        const rightX = pageWidth - margin - 4;

        pdf.text(
          `Hasil: ${Number(h.hasil_kg).toLocaleString("id-ID")} Kg x ${formatRp(
            h.harga_gabah
          )}`,
          leftX,
          yPos
        );
        pdf.text(`Pendapatan:`, rightX - 40, yPos);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatRp(pendapatan), rightX, yPos, { align: "right" });
        pdf.setFont("helvetica", "normal");
        yPos += 4;

        pdf.text(
          `Biaya Panen (${Number(h.biaya_panen_per_kg).toLocaleString(
            "id-ID"
          )}/Kg):`,
          leftX,
          yPos
        );
        pdf.setTextColor(200, 40, 40);
        pdf.text(`- ${formatRp(biayaPanen)}`, rightX, yPos, {
          align: "right",
        });
        pdf.setTextColor(60, 60, 60);
        yPos += 4;

        if (biayaTambahan > 0) {
          pdf.text(
            `Biaya Lainnya${
              h.keterangan_biaya ? ` (${h.keterangan_biaya})` : ""
            }:`,
            leftX,
            yPos
          );
          pdf.setTextColor(200, 40, 40);
          pdf.text(`- ${formatRp(biayaTambahan)}`, rightX, yPos, {
            align: "right",
          });
          pdf.setTextColor(60, 60, 60);
          yPos += 4;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(21, 87, 36);
        pdf.text(`Profit Bersih:`, leftX, yPos);
        pdf.text(formatRp(Number(h.profit_bersih)), rightX, yPos, {
          align: "right",
        });
        yPos += 4;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          `Bagi Hasil (${h.persen_owner}:${h.persen_penggarap}):`,
          leftX,
          yPos
        );
        yPos += 4;

        pdf.text(`- Owner:`, leftX + 4, yPos);
        pdf.setTextColor(39, 174, 96);
        pdf.text(formatRp(Number(h.profit_owner || 0)), rightX, yPos, {
          align: "right",
        });
        pdf.setTextColor(60, 60, 60);
        yPos += 4;

        pdf.text(`- Penggarap:`, leftX + 4, yPos);
        pdf.setTextColor(255, 140, 66);
        pdf.text(formatRp(Number(h.profit_penggarap || 0)), rightX, yPos, {
          align: "right",
        });
        pdf.setTextColor(60, 60, 60);
        yPos += 4;

        const potongan = Number(h.potongan_hutang || 0);
        if (potongan > 0) {
          pdf.text(`- Potong Hutang:`, leftX + 4, yPos);
          pdf.setTextColor(200, 40, 40);
          pdf.setFont("helvetica", "bold");
          pdf.text(`- ${formatRp(potongan)}`, rightX, yPos, {
            align: "right",
          });
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          yPos += 4;
        }

        yPos += 2;
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;
      });
    }

    // ===== RINCIAN HUTANG LENGKAP =====
    if (debts && debts.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text(`RINCIAN HUTANG (${debts.length})`, margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 40, yPos + 1.5);

      yPos += 6;

      // Summary hutang
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Total Hutang: ${formatRp(totalHutangSemua)} | Dibayar: ${formatRp(
          totalHutangDibayar
        )} | Aktif: ${formatRp(totalHutangAktif)} (${hutangAktif.length} hutang)`,
        margin,
        yPos
      );
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
