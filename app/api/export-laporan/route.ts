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

function drawStars(
  pdf: jsPDF,
  x: number,
  y: number,
  count: number,
  size: number = 3
): number {
  for (let i = 0; i < count; i++) {
    const cx = x + i * (size * 2 + 1);
    drawStar(pdf, cx, y, size);
  }
  return x + count * (size * 2 + 1);
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

    // ========== AMBIL DATA ==========
    const { data: penggaraps } = await supabase
      .from("penggaraps")
      .select("*")
      .eq("user_id", user.id);

    const { data: lands } = await supabase
      .from("lands")
      .select("*")
      .eq("user_id", user.id);

    const { data: allHarvests } = await supabase
      .from("harvests")
      .select("*")
      .eq("user_id", user.id)
      .order("tanggal", { ascending: true });

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id);

    const { data: kategoriList } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    // Filter harvests by tahun/periode
    const filterPeriode = (h: any) => {
      const y = new Date(h.tanggal).getFullYear();
      return jenis === "tahunan" ? y === tahun : y >= tahun - 4 && y <= tahun;
    };

    const harvests = (allHarvests || []).filter(filterPeriode);

    // ========== STATISTIK GLOBAL ==========
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

    // ========== DAFTAR KOMODITAS ==========
    const komoditasDenganData = new Set<string>();
    harvests.forEach((h) => komoditasDenganData.add(h.komoditas || "padi"));
    const komoditasList = Array.from(komoditasDenganData).sort((a, b) => {
      const ia = KOMODITAS_ORDER.indexOf(a);
      const ib = KOMODITAS_ORDER.indexOf(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    // Cek kategori
    const kategoriTerisi = komoditasList.filter((kom) => {
      const th = (kategoriList || []).find((k) => k.komoditas === kom);
      return th && th.cukup !== null && th.cukup !== undefined;
    });
    const adaKategori = kategoriTerisi.length > 0;

    // ========== DATA PER PENGGARAP ==========
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

    // ========== REKOMENDASI ==========
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
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    // ===== HEADER =====
    pdf.setFillColor(44, 94, 46);
    pdf.rect(0, 0, pageWidth, 28, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("LAPORAN EVALUASI LAHAN", pageWidth / 2, 12, {
      align: "center",
    });

    pdf.setFontSize(13);
    pdf.text(
      jenis === "tahunan"
        ? `TAHUN ${tahun}`
        : `PERIODE 5 TAHUN (${tahun - 4} - ${tahun})`,
      pageWidth / 2,
      20,
      { align: "center" }
    );

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Sumber Data: ${
        mode === "terakhir" ? "Produktivitas Panen Terakhir" : "Rata-rata Produktivitas"
      }`,
      pageWidth / 2,
      25,
      { align: "center" }
    );

    y = 36;

    // ===== RINGKASAN KONDISI =====
    pdf.setTextColor(44, 94, 46);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("RINGKASAN KONDISI LAHAN", margin, y);
    pdf.setDrawColor(44, 94, 46);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 1.5, margin + 60, y + 1.5);
    y += 7;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const lineH = 6;
    pdf.text(`Total Lahan`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${totalLahanUtama} Ha`, margin + 50, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Jumlah Penggarap`, margin + 100, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${penggaraps?.length || 0} Orang`, margin + 145, y);
    y += lineH;

    pdf.setFont("helvetica", "normal");
    pdf.text(`Lahan Tergarap`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${lahanTergarap.toFixed(2)} Ha`, margin + 50, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Total Hutang`, margin + 100, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(200, 40, 40);
    pdf.text(formatRp(totalHutang), margin + 145, y);
    pdf.setTextColor(60, 60, 60);
    y += lineH;

    pdf.setFont("helvetica", "normal");
    pdf.text(`Sisa Lahan`, margin, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${sisaLahan.toFixed(2)} Ha`, margin + 50, y);
    y += 8;

    // ===== KATEGORI PRODUKTIVITAS (dengan keterangan) =====
    if (adaKategori) {
      pdf.setFillColor(232, 245, 233);
      pdf.rect(margin, y - 2, contentWidth, 6, "F");
      pdf.setTextColor(44, 94, 46);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "KATEGORI PRODUKTIVITAS (Kg/Ha) - DI-SET DI PENGATURAN",
        margin + 2,
        y + 2
      );
      y += 9;

      komoditasList.forEach((kom) => {
        const th = (kategoriList || []).find((k) => k.komoditas === kom);
        if (!th || th.cukup === null || th.cukup === undefined) return;

        // Baris 1: Nama komoditas
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(KOMODITAS_LABEL[kom] || kom, margin, y);
        y += 5;

        // Baris 2: Kurang Optimal
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 40, 40);
        pdf.text("Kurang Optimal:", margin + 4, y);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`< ${Number(th.cukup).toLocaleString("id-ID")}`, margin + 35, y);
        y += 5;

        // Baris 3: Cukup (bintang 1)
        pdf.setTextColor(230, 126, 34);
        pdf.text("Cukup:", margin + 4, y);
        pdf.setDrawColor(255, 193, 7);
        drawStar(pdf, margin + 20, y - 1, 2);
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          `≥ ${Number(th.cukup).toLocaleString("id-ID")}`,
          margin + 35,
          y
        );
        y += 5;

        // Baris 4: Baik (bintang 2)
        if (th.baik !== null && th.baik !== undefined) {
          pdf.setTextColor(74, 144, 226);
          pdf.text("Baik:", margin + 4, y);
          pdf.setDrawColor(255, 193, 7);
          drawStar(pdf, margin + 20, y - 1, 2);
          drawStar(pdf, margin + 26, y - 1, 2);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `≥ ${Number(th.baik).toLocaleString("id-ID")}`,
            margin + 35,
            y
          );
          y += 5;
        }

        // Baris 5: Sangat Baik (bintang 3)
        if (th.sangat_baik !== null && th.sangat_baik !== undefined) {
          pdf.setTextColor(44, 94, 46);
          pdf.text("Sangat Baik:", margin + 4, y);
          pdf.setDrawColor(255, 193, 7);
          drawStar(pdf, margin + 26, y - 1, 2);
          drawStar(pdf, margin + 32, y - 1, 2);
          drawStar(pdf, margin + 38, y - 1, 2);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `≥ ${Number(th.sangat_baik).toLocaleString("id-ID")}`,
            margin + 47,
            y
          );
          y += 5;
        }

        y += 3;
      });

      y += 3;
    }

    // ===== LEADERBOARD (tanpa kolom evaluasi) =====
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
      `LEADERBOARD (${mode === "terakhir" ? "Panen Terakhir" : "Rata-rata"})`,
      margin + 2,
      y + 2
    );
    y += 8;

    // Kolom dinamis
    const colRank = margin;
    const colNama = margin + 12;
    const colLahan = margin + 55;
    const colPanen = margin + 68;
    const colHasil = margin + 80;

    const colKomStart = margin + 100;
    const colKomWidth = Math.min(
      38,
      Math.max(28, (contentWidth - 100) / Math.max(komoditasList.length, 1))
    );

    // Header tabel
    pdf.setFillColor(44, 94, 46);
    pdf.rect(margin, y, contentWidth, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");

    pdf.text("No", colRank + 1, y + 4.5);
    pdf.text("Nama", colNama, y + 4.5);
    pdf.text("Lhn", colLahan + 1, y + 4.5);
    pdf.text("Panen", colPanen, y + 4.5);
    pdf.text("Total (Kg)", colHasil, y + 4.5);

    komoditasList.forEach((kom, i) => {
      pdf.text(
        KOMODITAS_LABEL[kom] || kom,
        colKomStart + i * colKomWidth,
        y + 4.5
      );
    });

    y += 7;

    // Body tabel
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);

    penggarapData.forEach((p, idx) => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, y, contentWidth, 7, "F");
      }

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.text(String(idx + 1), colRank + 3, y + 4.5);
      pdf.text(p.nama.substring(0, 18), colNama, y + 4.5);
      pdf.text(String(p.lahanCount), colLahan + 3, y + 4.5);
      pdf.text(String(p.jmlPanen), colPanen + 3, y + 4.5);
      pdf.text(p.totalHasil.toLocaleString("id-ID"), colHasil + 14, y + 4.5, {
        align: "right",
      });

      // Kolom komoditas — dengan bintang di samping nilai
      komoditasList.forEach((kom, i) => {
        const nilai = p.nilaiPerKomoditas[kom];
        const komX = colKomStart + i * colKomWidth;
        if (nilai) {
          // Render bintang dulu (kalau ada kategori)
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
                pdf.setDrawColor(255, 193, 7);
                pdf.setLineWidth(0.25);
                drawStars(pdf, komX, y + 3.5, stars, 1.8);
              } else {
                pdf.setTextColor(200, 40, 40);
                pdf.setFont("helvetica", "bold");
                pdf.text("!", komX, y + 4.5);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(60, 60, 60);
              }
            }
          }

          // Render angka produktivitas
          pdf.text(
            nilai.toFixed(0),
            komX + colKomWidth - 5,
            y + 4.5,
            { align: "right" }
          );
        } else {
          pdf.setTextColor(180, 180, 180);
          pdf.text("-", komX + 3, y + 4.5);
          pdf.setTextColor(60, 60, 60);
        }
      });

      y += 7;
    });

    y += 6;

    // ===== REWARD & PENDAMPINGAN =====
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

      pdf.setFontSize(9);
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
          drawStars(pdf, margin + 2, y - 1, 3, 2.5);
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

      // Pendampingan
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

      pdf.setFontSize(9);
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
    } else {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y - 2, contentWidth, 8, "F");
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Kategori produktivitas belum di-set. Buka Pengaturan untuk mengaktifkan evaluasi & rekomendasi.",
        margin + 2,
        y + 3
      );
      y += 12;
    }

    // ===== RINGKASAN SETIAP PANEN (BARU) =====
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

      // Sort by tanggal
      const harvestsSorted = [...harvests].sort(
        (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      harvestsSorted.forEach((h, idx) => {
        // Perlu ~30mm per panen
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }

        const p = (penggaraps || []).find((pg) => {
          const land = (lands || []).find((l) => l.id === h.land_id);
          return land && land.penggarap_id === pg.id;
        });
        const land = (lands || []).find((l) => l.id === h.land_id);

        // Header panen
        pdf.setFillColor(232, 245, 233);
        pdf.rect(margin, y, contentWidth, 5, "F");
        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${idx + 1}. ${p?.nama || "?"} - ${KOMODITAS_LABEL[h.komoditas] || h.komoditas}${h.musim ? ` (${h.musim})` : ""}`,
          margin + 2,
          y + 3.5
        );
        pdf.text(
          formatTanggal(h.tanggal),
          pageWidth - margin - 2,
          y + 3.5,
          { align: "right" }
        );
        y += 6;

        // Detail
        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        const pendapatan = Number(h.hasil_kg) * Number(h.harga_gabah);
        const biayaPanen = Number(h.hasil_kg) * Number(h.biaya_panen_per_kg);
        const biayaTambahan = Number(h.biaya_tambahan || 0);

        // Kolom kiri (info panen)
        const leftX = margin + 4;
        const rightX = pageWidth - margin - 4;

        pdf.text(
          `Hasil: ${Number(h.hasil_kg).toLocaleString("id-ID")} Kg x ${formatRp(h.harga_gabah)}`,
          leftX,
          y
        );
        pdf.text(`Pendapatan:`, rightX - 40, y);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatRp(pendapatan), rightX, y, { align: "right" });
        pdf.setFont("helvetica", "normal");
        y += 4;

        pdf.text(`Biaya Panen (${Number(h.biaya_panen_per_kg).toLocaleString("id-ID")}/Kg):`, leftX, y);
        pdf.setTextColor(200, 40, 40);
        pdf.text(`- ${formatRp(biayaPanen)}`, rightX, y, { align: "right" });
        pdf.setTextColor(60, 60, 60);
        y += 4;

        if (biayaTambahan > 0) {
          pdf.text(
            `Biaya Lainnya${h.keterangan_biaya ? ` (${h.keterangan_biaya})` : ""}:`,
            leftX,
            y
          );
          pdf.setTextColor(200, 40, 40);
          pdf.text(`- ${formatRp(biayaTambahan)}`, rightX, y, { align: "right" });
          pdf.setTextColor(60, 60, 60);
          y += 4;
        }

        // Profit bersih
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(21, 87, 36);
        pdf.text(`Profit Bersih:`, leftX, y);
        pdf.text(formatRp(Number(h.profit_bersih)), rightX, y, {
          align: "right",
        });
        y += 4;

        // Bagi hasil
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          `Bagi Hasil (${h.persen_owner}:${h.persen_penggarap}):`,
          leftX,
          y
        );
        y += 4;

        pdf.text(`- Owner:`, leftX + 4, y);
        pdf.setTextColor(39, 174, 96);
        pdf.text(formatRp(Number(h.profit_owner || 0)), rightX, y, {
          align: "right",
        });
        pdf.setTextColor(60, 60, 60);
        y += 4;

        pdf.text(`- Penggarap:`, leftX + 4, y);
        pdf.setTextColor(255, 140, 66);
        pdf.text(formatRp(Number(h.profit_penggarap || 0)), rightX, y, {
          align: "right",
        });
        pdf.setTextColor(60, 60, 60);
        y += 4;

        // Potong hutang (kalau ada)
        const potongan = Number(h.potongan_hutang || 0);
        if (potongan > 0) {
          pdf.text(`- Potong Hutang:`, leftX + 4, y);
          pdf.setTextColor(200, 40, 40);
          pdf.setFont("helvetica", "bold");
          pdf.text(`- ${formatRp(potongan)}`, rightX, y, { align: "right" });
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          y += 4;
        }

        // Garis pemisah antar panen
        y += 2;
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 4;
      });
    }

    // ===== RINGKASAN PROFIT PER PENGGARAP =====
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
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Nama", margin + 2, y + 4);
    pdf.text("Profit Owner", margin + 75, y + 4, { align: "right" });
    pdf.text("Profit Penggarap", margin + 130, y + 4, { align: "right" });
    pdf.text("Hutang Aktif", margin + 180, y + 4, { align: "right" });
    y += 6;

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    penggarapData.forEach((p, idx) => {
      if (y > pageHeight - 20) {
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
      pdf.setFontSize(8);
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
    const filename = `Laporan_${jenis}_${tahun}.pdf`;

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
