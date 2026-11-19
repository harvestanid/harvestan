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
  cabai: "Cabai",
};

const KOMODITAS_COLOR_RGB: Record<string, [number, number, number]> = {
  padi: [39, 174, 96],
  jagung: [243, 156, 18],
  kacang_tanah: [142, 68, 173],
  bawang_merah: [231, 76, 60],
  cabai_rawit: [192, 57, 43],
  cabai: [192, 57, 43],
};

function normalisasiKomoditas(kom: string | null | undefined): string {
  if (!kom) return "padi";
  if (kom === "cabai") return "cabai_rawit";
  return kom;
}

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
    color: [200, 40, 40],
    bintang: 0,
  };
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

    const filter = await getDataFilter(user.id);

    const { data: penggarap } = await supabase
      .from("penggaraps")
      .select("*")
      .eq("id", penggarapId)
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
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
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    const landIds = (lands || []).map((l) => l.id);

    let harvests: any[] = [];
    if (landIds.length > 0) {
      const { data } = await supabase
        .from("harvests")
        .select("*")
        .in("land_id", landIds)
        .eq("user_id", filter.user_id)
        .eq("is_demo", filter.is_demo)
        .order("tanggal", { ascending: true });
      harvests = data || [];
    }

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("penggarap_id", penggarapId)
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

    const { data: kategoriList } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo);

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

    const hutangAktif = (debts || []).filter((d) => Number(d.sisa) > 0);
    const totalHutangAktif = hutangAktif.reduce(
      (s, d) => s + Number(d.sisa),
      0
    );

    const isSelf = penggarap.is_self === true;

    // Tipe lahan breakdown
    const lahanMandiri = (lands || []).filter(
      (l: any) => (l.tipe_garap || "bagi_hasil_owner") === "mandiri"
    ).length;
    const lahanOwner = (lands || []).filter(
      (l: any) => (l.tipe_garap || "bagi_hasil_owner") === "bagi_hasil_owner"
    ).length;
    const lahanPenggarap = (lands || []).filter(
      (l: any) =>
        (l.tipe_garap || "bagi_hasil_owner") === "bagi_hasil_penggarap"
    ).length;

    // ==================== PRODUKTIVITAS PER KOMODITAS ====================
    type KomoditasStat = {
      komoditas: string;
      jmlPanen: number;
      totalHasilKg: number;
      produktivitasRata: number;
      kategori: ReturnType<typeof getKategoriFromThreshold>;
    };

    const komoditasMap = new Map<
      string,
      { total: number; jml: number; totalKg: number }
    >();

    harvests.forEach((h) => {
      const kom = normalisasiKomoditas(h.komoditas);
      const land = (lands || []).find((l) => l.id === h.land_id);
      if (!land || Number(land.luas) <= 0) return;

      const prod = Number(h.hasil_kg) / Number(land.luas);
      if (!komoditasMap.has(kom))
        komoditasMap.set(kom, { total: 0, jml: 0, totalKg: 0 });
      const m = komoditasMap.get(kom)!;
      m.total += prod;
      m.jml += 1;
      m.totalKg += Number(h.hasil_kg);
    });

    const produktivitas: KomoditasStat[] = Array.from(
      komoditasMap.entries()
    ).map(([kom, m]) => {
      const rata = m.jml > 0 ? m.total / m.jml : 0;
      const threshold =
        (kategoriList || []).find((k) => k.komoditas === kom) || null;
      return {
        komoditas: kom,
        jmlPanen: m.jml,
        totalHasilKg: m.totalKg,
        produktivitasRata: rata,
        kategori: getKategoriFromThreshold(rata, threshold),
      };
    });

    // ==================== GENERATE PDF ====================
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
    pdf.rect(0, 0, pageWidth, 40, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("LAPORAN KINERJA PENGGARAP", pageWidth / 2, 15, {
      align: "center",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Periode: ${new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      pageWidth / 2,
      24,
      { align: "center" }
    );

    pdf.setFontSize(8);
    pdf.text(
      filter.is_demo ? "⚠️ DATA DEMO - BUKAN DATA ASLI" : "Harvestan.id",
      pageWidth / 2,
      32,
      { align: "center" }
    );

    yPos = 50;

    // ==================== DATA PENGGARAP ====================
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
    pdf.text(
      isSelf ? `${penggarap.nama} (Diri Sendiri)` : penggarap.nama,
      margin + 25,
      yPos
    );

    pdf.setFont("helvetica", "bold");
    pdf.text("Jumlah Lahan:", margin + 90, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${lands?.length || 0} lahan`, margin + 128, yPos);

    yPos += 6;

    // ===== BARIS BARU: TIPE LAHAN =====
    const tipeLahanParts: string[] = [];
    if (lahanMandiri > 0) tipeLahanParts.push(`${lahanMandiri} Mandiri`);
    if (lahanOwner > 0)
      tipeLahanParts.push(`${lahanOwner} Bagi Hasil Owner`);
    if (lahanPenggarap > 0)
      tipeLahanParts.push(`${lahanPenggarap} Bagi Hasil Penggarap`);

    if (tipeLahanParts.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Tipe Lahan:", margin, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(tipeLahanParts.join(" · "), margin + 25, yPos);
      pdf.setFontSize(10);
      yPos += 6;
    }

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
    // ==================== RINGKASAN KEUANGAN ====================
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
    pdf.setFontSize(12);
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
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(200, 90, 20);
    pdf.text(formatRp(totalProfitPenggarap), margin + cardWidth + 9, yPos + 13);

    yPos += cardHeight + 4;

    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos, contentWidth, 10, "F");
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Total Hasil Panen:", margin + 3, yPos + 6.5);
    pdf.text(formatKg(totalHasil), margin + 50, yPos + 6.5);

    pdf.text("Hutang Aktif:", margin + 100, yPos + 6.5);
    pdf.setTextColor(200, 40, 40);
    pdf.text(
      totalHutangAktif > 0 ? formatRp(totalHutangAktif) : "Lunas",
      margin + 133,
      yPos + 6.5
    );

    yPos += 16;

    // ==================== PRODUKTIVITAS PER KOMODITAS ====================
    if (produktivitas.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text("PRODUKTIVITAS PER KOMODITAS", margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 75, yPos + 1.5);

      yPos += 7;

      produktivitas.forEach((p) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        const komLabel = KOMODITAS_LABEL[p.komoditas] || p.komoditas;
        const color = KOMODITAS_COLOR_RGB[p.komoditas] || [100, 100, 100];

        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(margin + 2, yPos + 2, 1.5, "F");

        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(komLabel, margin + 6, yPos + 3);

        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(
          `${p.jmlPanen}x panen · ${formatKg(p.totalHasilKg)} · ${Math.round(
            p.produktivitasRata
          ).toLocaleString("id-ID")} Kg/Ha`,
          margin + 6,
          yPos + 9
        );

        if (p.kategori) {
          const katX = margin + 100;
          pdf.setTextColor(
            p.kategori.color[0],
            p.kategori.color[1],
            p.kategori.color[2]
          );
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text(p.kategori.label, katX, yPos + 3);

          if (p.kategori.bintang > 0) {
            pdf.setDrawColor(255, 193, 7);
            pdf.setLineWidth(0.3);
            drawStars(pdf, katX, yPos + 8, p.kategori.bintang, 1.8);
          }
        }

        yPos += 14;
      });

      yPos += 4;
    }

    // ==================== RINGKASAN PER LAHAN ====================
    if ((lands || []).length > 0) {
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text("DAFTAR LAHAN", margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 40, yPos + 1.5);

      yPos += 7;

      (lands || []).forEach((l: any) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage();
          yPos = margin;
        }

        const lahanHarvests = harvests.filter((h) => h.land_id === l.id);
        const totalHasilLahan = lahanHarvests.reduce(
          (s, h) => s + Number(h.hasil_kg),
          0
        );

        const tipeGarap = l.tipe_garap || "bagi_hasil_owner";
        let tipeLabel = "";
        if (tipeGarap === "mandiri") tipeLabel = "🌱 Mandiri";
        else if (tipeGarap === "bagi_hasil_owner") tipeLabel = "👤 Bagi Hasil";
        else if (tipeGarap === "bagi_hasil_penggarap")
          tipeLabel = `👨‍🌾 Penggarap${
            l.nama_owner_external ? ` (${l.nama_owner_external})` : ""
          }`;

        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPos, contentWidth, 12, "F");
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(margin, yPos, contentWidth, 12);

        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(l.nama, margin + 3, yPos + 4.5);

        pdf.setTextColor(120, 120, 120);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(tipeLabel, margin + 3, yPos + 9.5);

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${Number(l.luas).toFixed(2)} Ha`,
          margin + 90,
          yPos + 6.5
        );
        pdf.text(
          `${lahanHarvests.length}x panen`,
          margin + 115,
          yPos + 6.5
        );
        pdf.text(formatKg(totalHasilLahan), margin + 140, yPos + 6.5);

        yPos += 14;
      });

      yPos += 4;
    }

    // ==================== RINGKASAN SEMUA PANEN ====================
    if (harvests.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 94, 46);
      pdf.text(`RINCIAN PANEN (${harvests.length} transaksi)`, margin, yPos);
      pdf.setDrawColor(44, 94, 46);
      pdf.line(margin, yPos + 1.5, margin + 65, yPos + 1.5);

      yPos += 7;

      const harvestsSorted = [...harvests].sort(
        (a, b) =>
          new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      harvestsSorted.forEach((h) => {
        if (yPos > pageHeight - 35) {
          pdf.addPage();
          yPos = margin;
        }

        const land = (lands || []).find((l) => l.id === h.land_id);
        const kom = normalisasiKomoditas(h.komoditas);
        const komLabel = KOMODITAS_LABEL[kom] || kom;

        pdf.setFillColor(240, 247, 237);
        pdf.rect(margin, yPos, contentWidth, 6, "F");

        pdf.setTextColor(44, 94, 46);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${formatTanggal(h.tanggal)} · ${komLabel}${
            h.musim ? ` (${h.musim})` : ""
          } · ${land?.nama || "?"}`,
          margin + 2,
          yPos + 4
        );

        yPos += 7;

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        const col1 = margin + 3;
        const col2 = margin + 55;
        const col3 = margin + 110;

        pdf.text(`Hasil: ${formatKg(Number(h.hasil_kg))}`, col1, yPos + 3);
        pdf.text(
          `Harga: ${formatRp(Number(h.harga_gabah))}/Kg`,
          col2,
          yPos + 3
        );
        pdf.setTextColor(21, 87, 36);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Profit: ${formatRp(Number(h.profit_bersih || 0))}`,
          col3,
          yPos + 3
        );

        yPos += 5;

        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);

        const persenO = Number(h.persen_owner || 0);
        const persenP = Number(h.persen_penggarap || 100);
        const isMandiri = persenO === 0;

        if (isMandiri) {
          pdf.text(
            `Profit Penggarap (100%): ${formatRp(
              Number(h.profit_penggarap || 0)
            )}`,
            col1,
            yPos + 3
          );
        } else {
          pdf.text(
            `Owner (${persenO}%): ${formatRp(Number(h.profit_owner || 0))}`,
            col1,
            yPos + 3
          );
          pdf.text(
            `Penggarap (${persenP}%): ${formatRp(
              Number(h.profit_penggarap || 0)
            )}`,
            col2,
            yPos + 3
          );
        }

        yPos += 7;
      });
    }

    // ==================== FOOTER ====================
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7.5);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Dicetak: ${new Date().toLocaleString("id-ID")}`,
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

    const filename = `Laporan_${penggarap.nama.replace(/\s+/g, "_")}_${
      filter.is_demo ? "DEMO_" : ""
    }${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Export PDF error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
