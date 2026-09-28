import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import { getDataFilter } from "@/lib/demo/demo-mode";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "Padi",
  jagung: "Jagung",
  kacang_tanah: "Kacang Tanah",
  bawang_merah: "Bawang Merah",
  cabai_rawit: "Cabai Rawit",
};

const KOMODITAS_SHORT: Record<string, string> = {
  padi: "Padi",
  jagung: "Jagung",
  kacang_tanah: "K.Tanah",
  bawang_merah: "B.Merah",
  cabai_rawit: "Cabai",
};

const KOMODITAS_ORDER = [
  "padi",
  "jagung",
  "kacang_tanah",
  "bawang_merah",
  "cabai_rawit",
];

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

function getKategoriFromThreshold(
  nilai: number,
  threshold: {
    cukup: number | null;
    baik: number | null;
    sangat_baik: number | null;
  } | null
): { label: string; kode: string } | null {
  if (!threshold || threshold.cukup === null || threshold.cukup === undefined) {
    return null;
  }
  const cukup = Number(threshold.cukup);
  const baik = threshold.baik !== null ? Number(threshold.baik) : null;
  const sangatBaik =
    threshold.sangat_baik !== null ? Number(threshold.sangat_baik) : null;

  if (sangatBaik !== null && nilai >= sangatBaik) {
    return { label: "SANGAT BAIK", kode: "sangat" };
  }
  if (baik !== null && nilai >= baik) {
    return { label: "BAIK", kode: "baik" };
  }
  if (nilai >= cukup) {
    return { label: "CUKUP", kode: "cukup" };
  }
  return { label: "KURANG OPTIMAL", kode: "kurang" };
}

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
  size: number = 1.5
): number {
  for (let i = 0; i < count; i++) {
    const cx = x + i * (size * 2 + 0.5);
    drawStar(pdf, cx, y, size);
  }
  return x + count * (size * 2 + 0.5);
}

function drawAlert(pdf: jsPDF, cx: number, cy: number, r: number) {
  const oldLineWidth = 0.3;
  pdf.setLineWidth(0.35);

  const topX = cx;
  const topY = cy - r;
  const leftX = cx - r * 0.9;
  const leftY = cy + r * 0.7;
  const rightX = cx + r * 0.9;
  const rightY = cy + r * 0.7;

  pdf.line(topX, topY, leftX, leftY);
  pdf.line(leftX, leftY, rightX, rightY);
  pdf.line(rightX, rightY, topX, topY);

  pdf.line(cx, cy - r * 0.3, cx, cy + r * 0.15);
  pdf.circle(cx, cy + r * 0.42, 0.3, "F");

  pdf.setLineWidth(oldLineWidth);
}

// Watermark DEMO — simple, tanpa saveGraphicsState
function addDemoWatermark(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setTextColor(230, 230, 230);
    pdf.setFontSize(70);
    pdf.setFont("helvetica", "bold");
    pdf.text("DEMO", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
  }
}

function addDemoFooter(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(200, 40, 40);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      "DATA DEMO - BUKAN DATA ASLI",
      pageWidth / 2,
      pageHeight - 4,
      { align: "center" }
    );
  }
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
    }
  > = {};

  harvests.forEach((h) => {
    const kom = h.komoditas || "padi";
    const land = lands.find((l) => l.id === h.land_id);
    if (!land || Number(land.luas) <= 0) return;

    const prod = Number(h.hasil_kg) / Number(land.luas);

    if (!data[kom]) {
      data[kom] = { totalHasil: 0, totalProdSum: 0, jmlPanen: 0 };
    }
    data[kom].totalHasil += Number(h.hasil_kg);
    data[kom].totalProdSum += prod;
    data[kom].jmlPanen += 1;
  });

  const hasil: any[] = [];
  Object.entries(data).forEach(([kom, d]) => {
    const rata = d.jmlPanen > 0 ? d.totalProdSum / d.jmlPanen : 0;
    const kat = kategoriList.find((k) => k.komoditas === kom) || null;

    hasil.push({
      komoditas: kom,
      produktivitasRata: rata,
      jmlPanen: d.jmlPanen,
      totalHasilKg: d.totalHasil,
      kategoriRata: getKategoriFromThreshold(rata, kat),
    });
  });

  const order = [
    "padi",
    "jagung",
    "kacang_tanah",
    "bawang_merah",
    "cabai_rawit",
  ];
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tahun = parseInt(url.searchParams.get("tahun") || "");
    const jenis = url.searchParams.get("jenis") || "tahunan";
    const mode = url.searchParams.get("mode") || "ratarata";

    if (!tahun || isNaN(tahun)) {
      return NextResponse.json({ error: "tahun wajib diisi" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = await getDataFilter(user.id);

    const { data: penggaraps } = await supabase
      .from("penggaraps")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    const { data: lands } = await supabase
      .from("lands")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    const { data: allHarvests } = await supabase
      .from("harvests")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
      .order("tanggal", { ascending: true });

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    const { data: kategoriList } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    const filterPeriode = (h: any) => {
      const y = new Date(h.tanggal).getFullYear();
      return jenis === "tahunan" ? y === tahun : y >= tahun - 4 && y <= tahun;
    };

    const harvests = (allHarvests || []).filter(filterPeriode);

    const totalLahanUtama = 16;
    const lahanTergarap = (lands || []).reduce(
      (s, l) => s + Number(l.luas),
      0
    );
    const sisaLahan = Math.max(0, totalLahanUtama - lahanTergarap);
    const totalHutang = (debts || []).reduce((s, d) => {
      const sisa = Number(d.sisa !== undefined ? d.sisa : d.jumlah);
      return s + (sisa > 0 ? sisa : 0);
    }, 0);

    const komoditasDenganData = new Set<string>();
    harvests.forEach((h) => komoditasDenganData.add(h.komoditas || "padi"));
    const komoditasList = Array.from(komoditasDenganData).sort((a, b) => {
      const ia = KOMODITAS_ORDER.indexOf(a);
      const ib = KOMODITAS_ORDER.indexOf(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    const kategoriTerisi = komoditasList.filter((kom) => {
      const th = (kategoriList || []).find((k) => k.komoditas === kom);
      return th && th.cukup !== null && th.cukup !== undefined;
    });
    const adaKategori = kategoriTerisi.length > 0;

    type PenggarapData = {
      id: string;
      nama: string;
      lahanCount: number;
      totalHasil: number;
      jmlPanen: number;
      nilaiPerKomoditas: Record<string, number>;
      kategoriPerKomoditas: Record<
        string,
        { label: string; kode: string } | null
      >;
      hutang: number;
      profitOwner: number;
      profitPenggarap: number;
    };

    const penggarapData: PenggarapData[] = (penggaraps || []).map((p) => {
      const penggarapLands = (lands || []).filter(
        (l) => l.penggarap_id === p.id
      );
      const landIds = penggarapLands.map((l) => l.id);
      const penggarapHarvests = harvests.filter((h) =>
        landIds.includes(h.land_id)
      );

      const nilaiPerKomoditas: Record<string, number> = {};
      const kategoriPerKomoditas: Record<
        string,
        { label: string; kode: string } | null
      > = {};

      komoditasList.forEach((kom) => {
        const harvestsKom = penggarapHarvests.filter(
          (h) => (h.komoditas || "padi") === kom
        );
        if (harvestsKom.length === 0) return;

        let nilai = 0;
        if (mode === "terakhir") {
          const sorted = [...harvestsKom].sort(
            (a, b) =>
              new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
          );
          const h = sorted[0];
          const land = penggarapLands.find((l) => l.id === h.land_id);
          if (land && Number(land.luas) > 0) {
            nilai = Number(h.hasil_kg) / Number(land.luas);
          }
        } else {
          const total = harvestsKom.reduce((s, h) => {
            const land = penggarapLands.find((l) => l.id === h.land_id);
            if (!land || Number(land.luas) <= 0) return s;
            return s + Number(h.hasil_kg) / Number(land.luas);
          }, 0);
          nilai = total / harvestsKom.length;
        }

        nilaiPerKomoditas[kom] = nilai;

        if (adaKategori) {
          const threshold =
            (kategoriList || []).find((k) => k.komoditas === kom) || null;
          const kat = getKategoriFromThreshold(nilai, threshold);
          kategoriPerKomoditas[kom] = kat
            ? { label: kat.label, kode: kat.kode }
            : null;
        }
      });

      const hutangP = (debts || [])
        .filter((d) => d.penggarap_id === p.id)
        .reduce((s, d) => {
          const sisa = Number(d.sisa !== undefined ? d.sisa : d.jumlah);
          return s + (sisa > 0 ? sisa : 0);
        }, 0);

      const totalHasil = penggarapHarvests.reduce(
        (s, h) => s + Number(h.hasil_kg),
        0
      );
      const profitOwner = penggarapHarvests.reduce(
        (s, h) => s + Number(h.profit_owner || 0),
        0
      );
      const profitPenggarap = penggarapHarvests.reduce(
        (s, h) => s + Number(h.profit_penggarap || 0),
        0
      );

      return {
        id: p.id,
        nama: p.nama,
        lahanCount: penggarapLands.length,
        totalHasil,
        jmlPanen: penggarapHarvests.length,
        nilaiPerKomoditas,
        kategoriPerKomoditas,
        hutang: hutangP,
        profitOwner,
        profitPenggarap,
      };
    });

    penggarapData.sort((a, b) => {
      const aPadi = a.nilaiPerKomoditas["padi"] || 0;
      const bPadi = b.nilaiPerKomoditas["padi"] || 0;
      if (bPadi !== aPadi) return bPadi - aPadi;
      return b.totalHasil - a.totalHasil;
    });

    const rewardList: { nama: string; komoditas: string; nilai: number }[] = [];
    const pendampinganList: { nama: string; komoditas: string; nilai: number }[] = [];

    if (adaKategori) {
      penggarapData.forEach((p) => {
        komoditasList.forEach((kom) => {
          const nilai = p.nilaiPerKomoditas[kom];
          if (!nilai) return;
          const kat = p.kategoriPerKomoditas[kom];
          if (!kat) return;
          if (kat.kode === "sangat") {
            rewardList.push({ nama: p.nama, komoditas: kom, nilai });
          } else if (kat.kode === "kurang") {
            pendampinganList.push({ nama: p.nama, komoditas: kom, nilai });
          }
        });
      });
    }

    // ========== GENERATE PDF ==========
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    // ===== HEADER =====
    pdf.setFillColor(44, 94, 46);
    pdf.rect(0, 0, pageWidth, 26, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("LAPORAN EVALUASI LAHAN", pageWidth / 2, 11, {
      align: "center",
    });

    pdf.setFontSize(12);
    pdf.text(
      jenis === "tahunan"
        ? `TAHUN ${tahun}`
        : `PERIODE 5 TAHUN (${tahun - 4} - ${tahun})`,
      pageWidth / 2,
      18,
      { align: "center" }
    );

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Sumber Data: ${
        mode === "terakhir"
          ? "Produktivitas Panen Terakhir"
          : "Rata-rata Produktivitas"
      }`,
      pageWidth / 2,
      23,
      { align: "center" }
    );

    y = 32;

    // ===== RINGKASAN KONDISI =====
    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("RINGKASAN KONDISI LAHAN", margin, y);
    pdf.setDrawColor(44, 94, 46);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 1.5, margin + 55, y + 1.5);
    y += 6;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    const lineH = 5;
    pdf.text(`Total Lahan`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${totalLahanUtama} Ha`, margin + 45, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Jumlah Penggarap`, margin + 95, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${penggaraps?.length || 0} Orang`, margin + 140, y);
    y += lineH;

    pdf.setFont("helvetica", "normal");
    pdf.text(`Lahan Tergarap`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${lahanTergarap.toFixed(2)} Ha`, margin + 45, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Total Hutang`, margin + 95, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(200, 40, 40);
    pdf.text(formatRp(totalHutang), margin + 140, y);
    pdf.setTextColor(60, 60, 60);
    y += lineH;

    pdf.setFont("helvetica", "normal");
    pdf.text(`Sisa Lahan`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${sisaLahan.toFixed(2)} Ha`, margin + 45, y);
    y += 8;

    // ===================================================
    // KATEGORI PRODUKTIVITAS
    // ===================================================
    if (adaKategori) {
      pdf.setFillColor(232, 245, 233);
      pdf.rect(margin, y - 2, contentWidth, 6, "F");
      pdf.setTextColor(44, 94, 46);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "KATEGORI PRODUKTIVITAS (Kg/Ha) - DI-SET DI PENGATURAN",
        margin + 2,
        y + 2
      );
      y += 9;

      const colKatWidth = contentWidth / 4;

      kategoriTerisi.forEach((kom) => {
        const th = (kategoriList || []).find((k) => k.komoditas === kom);
        if (!th || th.cukup === null || th.cukup === undefined) return;

        if (y > pageHeight - 35) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFillColor(240, 247, 237);
        pdf.rect(margin, y, contentWidth, 6, "F");
        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(KOMODITAS_LABEL[kom] || kom, margin + 2, y + 4);
        y += 6;

        const katCols: {
          label: string;
          warna: [number, number, number];
          bintang: number;
          isAlert: boolean;
          teksNilai: string;
        }[] = [];

        katCols.push({
          label: "Kurang Optimal",
          warna: [200, 40, 40],
          bintang: 0,
          isAlert: true,
          teksNilai: `< ${Number(th.cukup).toLocaleString("id-ID")}`,
        });

        katCols.push({
          label: "Cukup",
          warna: [230, 126, 34],
          bintang: 1,
          isAlert: false,
          teksNilai: `>= ${Number(th.cukup).toLocaleString("id-ID")}`,
        });

        if (th.baik !== null && th.baik !== undefined) {
          katCols.push({
            label: "Baik",
            warna: [74, 144, 226],
            bintang: 2,
            isAlert: false,
            teksNilai: `>= ${Number(th.baik).toLocaleString("id-ID")}`,
          });
        } else {
          katCols.push({
            label: "-",
            warna: [180, 180, 180],
            bintang: 0,
            isAlert: false,
            teksNilai: "",
          });
        }

        if (th.sangat_baik !== null && th.sangat_baik !== undefined) {
          katCols.push({
            label: "Sangat Baik",
            warna: [44, 94, 46],
            bintang: 3,
            isAlert: false,
            teksNilai: `>= ${Number(th.sangat_baik).toLocaleString("id-ID")}`,
          });
        } else {
          katCols.push({
            label: "-",
            warna: [180, 180, 180],
            bintang: 0,
            isAlert: false,
            teksNilai: "",
          });
        }

        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, y, contentWidth, 18, "F");
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.rect(margin, y, contentWidth, 18);

        katCols.forEach((col, i) => {
          const colCenterX = margin + i * colKatWidth + colKatWidth / 2;

          if (i > 0) {
            pdf.setDrawColor(230, 230, 230);
            pdf.setLineWidth(0.2);
            pdf.line(
              margin + i * colKatWidth,
              y + 1,
              margin + i * colKatWidth,
              y + 17
            );
          }

          if (col.label === "-") {
            pdf.setTextColor(200, 200, 200);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "italic");
            pdf.text("-", colCenterX, y + 10, { align: "center" });
            return;
          }

          pdf.setTextColor(col.warna[0], col.warna[1], col.warna[2]);
          pdf.setFontSize(7.5);
          pdf.setFont("helvetica", "bold");
          pdf.text(col.label, colCenterX, y + 5, { align: "center" });

          if (col.isAlert) {
            pdf.setTextColor(col.warna[0], col.warna[1], col.warna[2]);
            pdf.setDrawColor(col.warna[0], col.warna[1], col.warna[2]);
            pdf.setFillColor(col.warna[0], col.warna[1], col.warna[2]);

            const teksNilaiWidth = pdf.getTextWidth(col.teksNilai);
            const totalWidth = 4 + 1.5 + teksNilaiWidth;
            const startX = colCenterX - totalWidth / 2;

            pdf.setLineWidth(0.35);
            drawAlert(pdf, startX + 2, y + 12, 2);
            pdf.setLineWidth(0.2);

            pdf.setTextColor(60, 60, 60);
            pdf.setFontSize(7.5);
            pdf.setFont("helvetica", "normal");
            pdf.text(col.teksNilai, startX + 5.5, y + 13);
          } else if (col.bintang > 0) {
            const starSize = 1.6;
            const starWidth = col.bintang * (starSize * 2 + 0.5) - 0.5;
            const teksNilaiWidth = pdf.getTextWidth(col.teksNilai);
            const gap = 1.5;
            const totalWidth = starWidth + gap + teksNilaiWidth;
            const startX = colCenterX - totalWidth / 2;

            pdf.setDrawColor(255, 193, 7);
            pdf.setLineWidth(0.3);
            drawStars(pdf, startX, y + 12, col.bintang, starSize);

            pdf.setTextColor(60, 60, 60);
            pdf.setFontSize(7.5);
            pdf.setFont("helvetica", "normal");
            pdf.text(col.teksNilai, startX + starWidth + gap, y + 13);
          }
        });

        y += 20;
      });

      y += 4;
    } else {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y - 2, contentWidth, 8, "F");
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Kategori produktivitas belum di-set. Buka Pengaturan untuk mengaktifkan evaluasi & rekomendasi.",
        margin + 2,
        y + 3
      );
      y += 12;
    }

    // ===================================================
    // LEADERBOARD — LAYOUT DINAMIS ANTI KEPOTONG
    // ===================================================
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFillColor(255, 140, 66);
    pdf.rect(margin, y - 2, contentWidth, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `LEADERBOARD (${
        mode === "terakhir" ? "Panen Terakhir" : "Rata-rata"
      })`,
      margin + 2,
      y + 2
    );
    y += 8;

    // ===== HITUNG LEBAR KOLOM DINAMIS =====
    // Kolom tetap: No(8) + Nama(variabel) + Lhn(10) + Panen(12) = total fixed
    // Kolom komoditas: bagi sisa ruang
    const colRankW = 8;
    const colLahanW = 10;
    const colPanenW = 12;
    const fixedWidth = colRankW + colLahanW + colPanenW;
    const minNamaW = 30;
    const minKomW = 20;

    const availableForNamaAndKom = contentWidth - fixedWidth;

    // Jika jumlah komoditas banyak → perkecil nama
    let colNamaW = 40;
    let colKomWidth = minKomW;

    if (komoditasList.length > 0) {
      // Coba alokasi: nama 40, sisa untuk komoditas
      const sisaUntukKom = availableForNamaAndKom - colNamaW;
      const perKom = sisaUntukKom / komoditasList.length;

      if (perKom < minKomW) {
        // Perkecil nama biar komoditas dapat minKomW
        colKomWidth = minKomW;
        colNamaW = availableForNamaAndKom - colKomWidth * komoditasList.length;
        if (colNamaW < minNamaW) colNamaW = minNamaW;
      } else {
        colKomWidth = perKom;
      }
    }

    const colRankX = margin;
    const colNamaX = colRankX + colRankW;
    const colLahanX = colNamaX + colNamaW;
    const colPanenX = colLahanX + colLahanW;
    const colKomStartX = colPanenX + colPanenW;

    // Font size adaptif
    const headerFontSize = komoditasList.length > 3 ? 6.5 : 7.5;
    const bodyFontSize = komoditasList.length > 3 ? 7 : 8;

    // ===== HEADER TABEL =====
    pdf.setFillColor(44, 94, 46);
    pdf.rect(margin, y, contentWidth, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(headerFontSize);
    pdf.setFont("helvetica", "bold");

    pdf.text("No", colRankX + 2, y + 4.5);
    pdf.text("Nama", colNamaX + 1, y + 4.5);
    pdf.text("Lhn", colLahanX + 1, y + 4.5);
    pdf.text("Panen", colPanenX + 1, y + 4.5);

    komoditasList.forEach((kom, i) => {
      const xKom = colKomStartX + i * colKomWidth;
      const label = KOMODITAS_SHORT[kom] || kom;
      // Truncate label komoditas kalau kepanjangan
      const maxChars = Math.floor(colKomWidth / 2);
      const truncated = label.length > maxChars ? label.substring(0, maxChars) : label;
      pdf.text(truncated, xKom + colKomWidth / 2, y + 4.5, {
        align: "center",
      });
    });

    y += 7;

    // ===== BODY TABEL =====
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(bodyFontSize);
    pdf.setFont("helvetica", "normal");

    penggarapData.forEach((p, idx) => {
      if (y > pageHeight - 15) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, y, contentWidth, 7, "F");
      }

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);

      // No
      pdf.text(String(idx + 1), colRankX + 2, y + 4.5);

      // Nama (truncate kalau panjang)
      const maxNamaChars = Math.floor(colNamaW / 1.8);
      const namaTruncated =
        p.nama.length > maxNamaChars
          ? p.nama.substring(0, maxNamaChars - 1) + "."
          : p.nama;
      pdf.text(namaTruncated, colNamaX + 1, y + 4.5);

      // Lahan
      pdf.text(String(p.lahanCount), colLahanX + 1, y + 4.5);

      // Panen
      pdf.text(String(p.jmlPanen), colPanenX + 1, y + 4.5);

      // Kolom komoditas — angka + bintang / alert
      komoditasList.forEach((kom, i) => {
        const nilai = p.nilaiPerKomoditas[kom];
        const xKom = colKomStartX + i * colKomWidth;
        const centerX = xKom + colKomWidth / 2;

        if (nilai) {
          // Baris 1: angka di tengah atas
          pdf.setTextColor(60, 60, 60);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(bodyFontSize - 0.5);
          pdf.text(nilai.toFixed(0), centerX, y + 3, { align: "center" });

          // Baris 2: ikon di bawah (bintang atau alert)
          if (adaKategori) {
            const katInfo = p.kategoriPerKomoditas[kom];
            if (katInfo) {
              const stars =
                katInfo.kode === "sangat"
                  ? 3
                  : katInfo.kode === "baik"
                  ? 2
                  : katInfo.kode === "cukup"
                  ? 1
                  : 0;

              if (stars > 0) {
                const starSize = 1.2;
                const starWidth = stars * (starSize * 2 + 0.5) - 0.5;
                const startX = centerX - starWidth / 2;
                pdf.setDrawColor(255, 193, 7);
                pdf.setLineWidth(0.25);
                drawStars(pdf, startX, y + 5.8, stars, starSize);
              } else {
                pdf.setDrawColor(200, 40, 40);
                pdf.setFillColor(200, 40, 40);
                pdf.setLineWidth(0.3);
                drawAlert(pdf, centerX, y + 5.8, 1.5);
              }
            }
          }
        } else {
          pdf.setTextColor(180, 180, 180);
          pdf.setFont("helvetica", "normal");
          pdf.text("-", centerX, y + 4.5, { align: "center" });
        }
      });

      // Reset color
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(bodyFontSize);

      y += 7;
    });

    y += 6;

    // ===================================================
    // REWARD & PENDAMPINGAN
    // ===================================================
    if (adaKategori) {
      if (y > pageHeight - 50) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFillColor(255, 193, 7);
      pdf.rect(margin, y - 2, contentWidth, 6, "F");
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "REKOMENDASI REWARD (Kategori Sangat Baik)",
        margin + 2,
        y + 2
      );
      y += 8;

      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);

      if (rewardList.length === 0) {
        pdf.setFont("helvetica", "italic");
        pdf.text(
          "Belum ada penggarap dengan kategori sangat baik di periode ini.",
          margin + 2,
          y
        );
        y += 6;
      } else {
        rewardList.forEach((r) => {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = margin;
          }
          pdf.setDrawColor(255, 193, 7);
          pdf.setLineWidth(0.3);
          drawStars(pdf, margin + 2, y - 1, 3, 2);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${r.nama}`, margin + 24, y);
          pdf.setFont("helvetica", "normal");
          pdf.text(
            `- ${KOMODITAS_LABEL[r.komoditas] || r.komoditas} (${r.nilai.toFixed(0)} Kg/Ha)`,
            margin + 70,
            y
          );
          y += 6;
        });
      }

      y += 4;

      if (y > pageHeight - 50) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFillColor(231, 76, 60);
      pdf.rect(margin, y - 2, contentWidth, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "REKOMENDASI PENDAMPINGAN (Kurang Optimal)",
        margin + 2,
        y + 2
      );
      y += 8;

      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);

      if (pendampinganList.length === 0) {
        pdf.setFont("helvetica", "italic");
        pdf.text(
          "Tidak ada penggarap yang perlu pendampingan. Semua optimal!",
          margin + 2,
          y
        );
        y += 6;
      } else {
        pendampinganList.forEach((r) => {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = margin;
          }
          pdf.setTextColor(200, 40, 40);
          pdf.setFont("helvetica", "bold");
          pdf.text("! ", margin + 2, y);
          pdf.setTextColor(60, 60, 60);
          pdf.text(`${r.nama}`, margin + 8, y);
          pdf.setFont("helvetica", "normal");
          pdf.text(
            `- ${KOMODITAS_LABEL[r.komoditas] || r.komoditas} (${r.nilai.toFixed(0)} Kg/Ha)`,
            margin + 55,
            y
          );
          y += 6;
        });
      }

      y += 6;
    }

    // ===================================================
    // RINGKASAN SETIAP PANEN
    // ===================================================
    if (harvests.length > 0) {
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFillColor(74, 144, 226);
      pdf.rect(margin, y - 2, contentWidth, 6, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `RINGKASAN SETIAP PANEN (${harvests.length} transaksi)`,
        margin + 2,
        y + 2
      );
      y += 8;

      const harvestsSorted = [...harvests].sort(
        (a, b) =>
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      const leftColX = margin + 3;
      const midColX = margin + contentWidth / 2 + 3;
      const rightColX = margin + contentWidth - 3;

      harvestsSorted.forEach((h, idx) => {
        if (y > pageHeight - 45) {
          pdf.addPage();
          y = margin;
        }

        const p = (penggaraps || []).find((pg) => {
          const land = (lands || []).find((l) => l.id === h.land_id);
          return land && land.penggarap_id === pg.id;
        });
        const land = (lands || []).find((l) => l.id === h.land_id);

        pdf.setFillColor(232, 245, 233);
        pdf.rect(margin, y, contentWidth, 6, "F");
        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${idx + 1}. ${p?.nama || "?"} - ${
            KOMODITAS_LABEL[h.komoditas] || h.komoditas
          }${h.musim ? ` (${h.musim})` : ""} - ${land?.nama || ""}`,
          margin + 3,
          y + 4
        );
        pdf.text(formatTanggal(h.tanggal), pageWidth - margin - 3, y + 4, {
          align: "right",
        });
        y += 7;

        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.2);

        const pendapatan = Number(h.hasil_kg) * Number(h.harga_gabah);
        const biayaPanen = Number(h.hasil_kg) * Number(h.biaya_panen_per_kg);
        const biayaTambahan = Number(h.biaya_tambahan || 0);
        const potongan = Number(h.potongan_hutang || 0);

        let jumlahBaris = 3;
        if (biayaTambahan > 0) jumlahBaris++;
        jumlahBaris += 3;
        if (potongan > 0) jumlahBaris++;

        const barisH = 4.2;
        const blockH = jumlahBaris * barisH + 2;

        pdf.setFillColor(232, 245, 233);
        pdf.rect(margin, y - 1, 1.2, blockH, "F");

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");

        pdf.text(
          `Hasil: ${Number(h.hasil_kg).toLocaleString("id-ID")} Kg x ${formatRp(
            h.harga_gabah
          )}`,
          leftColX,
          y + 2
        );
        pdf.text(`Pendapatan:`, midColX, y + 2);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatRp(pendapatan), rightColX, y + 2, {
          align: "right",
        });
        y += barisH;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          `Biaya Panen (${Number(h.biaya_panen_per_kg).toLocaleString(
            "id-ID"
          )}/Kg)`,
          leftColX,
          y + 2
        );
        pdf.text(`Biaya Panen:`, midColX, y + 2);
        pdf.setTextColor(200, 40, 40);
        pdf.text(`- ${formatRp(biayaPanen)}`, rightColX, y + 2, {
          align: "right",
        });
        y += barisH;

        if (biayaTambahan > 0) {
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `Biaya Lainnya${
              h.keterangan_biaya ? ` (${h.keterangan_biaya})` : ""
            }`,
            leftColX,
            y + 2
          );
          pdf.text(`Biaya Lainnya:`, midColX, y + 2);
          pdf.setTextColor(200, 40, 40);
          pdf.text(`- ${formatRp(biayaTambahan)}`, rightColX, y + 2, {
            align: "right",
          });
          y += barisH;
        }

        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.15);
        pdf.line(midColX - 2, y - 0.5, rightColX, y - 0.5);
        y += 0.5;

        pdf.setTextColor(21, 87, 36);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Profit Bersih:`, midColX, y + 2);
        pdf.text(formatRp(Number(h.profit_bersih)), rightColX, y + 2, {
          align: "right",
        });
        y += barisH;

        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Bagi Hasil (${h.persen_owner}:${h.persen_penggarap})`,
          midColX,
          y + 2
        );
        y += barisH;

        pdf.text(`- Owner:`, midColX + 2, y + 2);
        pdf.setTextColor(39, 174, 96);
        pdf.text(formatRp(Number(h.profit_owner || 0)), rightColX, y + 2, {
          align: "right",
        });
        y += barisH;

        pdf.setTextColor(60, 60, 60);
        pdf.text(`- Penggarap:`, midColX + 2, y + 2);
        pdf.setTextColor(255, 140, 66);
        pdf.text(
          formatRp(Number(h.profit_penggarap || 0)),
          rightColX,
          y + 2,
          { align: "right" }
        );
        y += barisH;

        if (potongan > 0) {
          pdf.setTextColor(60, 60, 60);
          pdf.text(`- Potong Hutang:`, midColX + 2, y + 2);
          pdf.setTextColor(200, 40, 40);
          pdf.setFont("helvetica", "bold");
          pdf.text(`- ${formatRp(potongan)}`, rightColX, y + 2, {
            align: "right",
          });
          y += barisH;
        }

        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");

        pdf.setDrawColor(240, 240, 240);
        pdf.setLineWidth(0.15);
        pdf.line(margin, y + 1, margin + contentWidth, y + 1);
        y += 4;
      });
    }

    // ===================================================
    // RINGKASAN PROFIT PER PENGGARAP
    // ===================================================
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFillColor(74, 144, 226);
    pdf.rect(margin, y - 2, contentWidth, 6, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("RINGKASAN PROFIT PER PENGGARAP", margin + 2, y + 2);
    y += 8;

    pdf.setFillColor(240, 247, 237);
    pdf.rect(margin, y, contentWidth, 6, "F");
    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.text("Nama", margin + 2, y + 4);
    pdf.text("Profit Owner", margin + 75, y + 4, { align: "right" });
    pdf.text("Profit Penggarap", margin + 130, y + 4, { align: "right" });
    pdf.text("Hutang Aktif", margin + 180, y + 4, { align: "right" });
    y += 6;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");

    penggarapData.forEach((p, idx) => {
      if (y > pageHeight - 15) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, y, contentWidth, 6, "F");
      }

      pdf.text(p.nama.substring(0, 22), margin + 2, y + 4);
      pdf.setTextColor(39, 174, 96);
      pdf.text(formatRp(p.profitOwner), margin + 75, y + 4, {
        align: "right",
      });
      pdf.setTextColor(255, 140, 66);
      pdf.text(formatRp(p.profitPenggarap), margin + 130, y + 4, {
        align: "right",
      });
      pdf.setTextColor(
        p.hutang > 0 ? 200 : 100,
        p.hutang > 0 ? 40 : 100,
        p.hutang > 0 ? 40 : 100
      );
      pdf.text(
        p.hutang > 0 ? formatRp(p.hutang) : "Lunas",
        margin + 180,
        y + 4,
        { align: "right" }
      );
      pdf.setTextColor(60, 60, 60);
      y += 6;
    });

    // ===== FOOTER =====
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7.5);
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

    // Watermark DEMO
    if (filter.is_demo) {
      addDemoWatermark(pdf);
      addDemoFooter(pdf);
    }

    const pdfBuffer = pdf.output("arraybuffer");
    const filename = `Laporan_${jenis}_${tahun}_${mode}${
      filter.is_demo ? "_DEMO" : ""
    }.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Export Laporan error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat generate laporan" },
      { status: 500 }
    );
  }
}
