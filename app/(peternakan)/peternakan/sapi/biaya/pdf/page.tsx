"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";

const JENIS_PRESET: Record<string, string> = {
  pakan: "Pakan",
  obat: "Obat / Vaksin",
  tenaga: "Tenaga Kerja",
  lainnya: "Lainnya",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function PDFContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dari = searchParams.get("dari") || "";
      const sampai = searchParams.get("sampai") || "";
      const jenis = searchParams.get("jenis") || "";
      const search = searchParams.get("search") || "";

      let query = supabase
        .from("farm_operational_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("tanggal", { ascending: false });

      if (dari) query = query.gte("tanggal", dari);
      if (sampai) query = query.lte("tanggal", sampai);

      if (jenis) {
        if (jenis.startsWith("custom:")) {
          const namaCustom = jenis.replace("custom:", "");
          query = query.eq("jenis_kegiatan", namaCustom);
        } else {
          query = query.eq("jenis_kegiatan", JENIS_PRESET[jenis] || jenis);
        }
      }

      const { data: logs } = await query;

      let filtered = logs || [];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            (l.judul || "").toLowerCase().includes(q) ||
            (l.keterangan || "").toLowerCase().includes(q)
        );
      }

      setData(filtered);
      setLoading(false);
    }
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (loading) return;

    async function generatePDF() {
      try {
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let y = 25;

        const dari = searchParams.get("dari") || "";
        const sampai = searchParams.get("sampai") || "";
        const jenis = searchParams.get("jenis") || "";

        // Header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(22);
        pdf.setTextColor(44, 94, 46);
        pdf.text("LAPORAN BIAYA OPERASIONAL SAPI", margin, y);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        if (dari || sampai) {
          pdf.text(`Periode: ${dari ? formatTanggal(dari) : "Awal"} s/d ${sampai ? formatTanggal(sampai) : "Akhir"}`, margin, y + 7);
        } else {
          pdf.text(`Periode: Semua Waktu`, margin, y + 7);
        }

        if (jenis) {
          const jenisLabel = jenis.startsWith("custom:") ? jenis.replace("custom:", "") : JENIS_PRESET[jenis] || jenis;
          pdf.text(`Jenis: ${jenisLabel}`, margin, y + 13);
          y += 20;
        } else {
          y += 15;
        }

        // Garis Emas
        pdf.setDrawColor(240, 180, 41);
        pdf.setLineWidth(1.5);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Total Biaya
        const totalBiaya = data.reduce((s, l) => s + Number(l.biaya || 0), 0);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Total Kegiatan: ${data.length}`, margin, y);
        pdf.text(`Total Biaya: ${formatRp(totalBiaya)}`, pageWidth / 2, y);
        y += 10;

        // Rekap Biaya per Jenis
        const rekapJenis: Record<string, number> = {};
        data.forEach((l) => {
          const key = l.jenis_kegiatan || "Lainnya";
          rekapJenis[key] = (rekapJenis[key] || 0) + Number(l.biaya || 0);
        });

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        Object.entries(rekapJenis).forEach(([nama, total]) => {
          if (total > 0) {
            pdf.text(`- ${nama}: ${formatRp(total)}`, margin, y);
            y += 5;
          }
        });

        y += 5;

        // Table Header (5 Kolom)
        const colTanggal = margin + 2;
        const colJenis = margin + 30;
        const colJudul = margin + 60;
        const colBukti = margin + 110;
        const colBiaya = pageWidth - margin - 2;

        const renderHeader = () => {
          pdf.setFillColor(240, 253, 244);
          pdf.rect(margin, y - 5, pageWidth - margin * 2, 8, "F");
          pdf.setFontSize(8);
          pdf.setTextColor(44, 94, 46);
          pdf.setFont("helvetica", "bold");
          pdf.text("TANGGAL", colTanggal, y);
          pdf.text("JENIS", colJenis, y);
          pdf.text("JUDUL & DESKRIPSI", colJudul, y);
          pdf.text("BUKTI", colBukti, y);
          pdf.text("BIAYA", colBiaya, y, { align: "right" });
          y += 5;
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
        };

        renderHeader();

        for (let i = 0; i < data.length; i++) {
          const l = data[i];
          const isGanjil = i % 2 === 0;

          // Hitung tinggi baris
          let textHeight = 8;
          if (l.keterangan) {
            const descLines = pdf.splitTextToSize(l.keterangan, 45);
            textHeight += descLines.length * 4;
          }

          // Kalau ada foto, tinggi baris MINIMAL 40mm (biar foto 35mm masuk)
          let rowHeight = textHeight;
          if (l.foto_url) {
            rowHeight = Math.max(textHeight, 40);
          }

          // Cek ganti halaman
          if (y + rowHeight > 260) {
            pdf.addPage();
            y = 20;
            renderHeader();
          }

          // Simpan posisi awal baris (buat naruh foto)
          const rowStartY = y;

          // Background Zebra
          if (isGanjil) {
            pdf.setFillColor(248, 248, 248);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(margin, rowStartY - 5, pageWidth - margin * 2, rowHeight, "F");

          // --- Teks Data ---
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          pdf.text(formatTanggal(l.tanggal), colTanggal, rowStartY);
          pdf.text(l.jenis_kegiatan || "-", colJenis, rowStartY);

          const judulMax = 25;
          const judulAsli = l.judul || l.jenis_kegiatan || "-";
          const judul = judulAsli.length > judulMax ? judulAsli.substring(0, judulMax) + "..." : judulAsli;
          pdf.text(judul, colJudul, rowStartY);

          pdf.text(Number(l.biaya) > 0 ? formatRp(Number(l.biaya)) : "-", colBiaya, rowStartY, { align: "right" });

          // Deskripsi
          if (l.keterangan) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont("helvetica", "italic");
            const descLines = pdf.splitTextToSize(l.keterangan, 45);
            pdf.text(descLines, colJudul, rowStartY + 5);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
          }

          // Gambar Bukti (35x35mm)
          if (l.foto_url) {
            const base64 = await toBase64(l.foto_url);
            if (base64) {
              try {
                pdf.addImage(base64, "JPEG", colBukti, rowStartY - 4, 35, 35);
              } catch (e) {
                console.error("Gagal render gambar", e);
              }
            }
          }

          // Majukan Y untuk baris berikutnya
          y = rowStartY + rowHeight - 5;

          // Garis batas antar transaksi
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.3);
          pdf.line(margin, y + 2, pageWidth - margin, y + 2);
        }

        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Dibuat otomatis oleh Harvestan - harvestan.vercel.app", pageWidth / 2, 285, { align: "center" });

        pdf.save(`Laporan-Biaya-Operasional-${new Date().toISOString().split("T")[0]}.pdf`);
        setTimeout(() => router.push("/peternakan/sapi/biaya"), 1500);
      } catch (err) {
        console.error(err);
        alert("Gagal membuat PDF.");
        router.push("/peternakan/sapi/biaya");
      }
    }
    setTimeout(generatePDF, 500);
  }, [data, loading, searchParams, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">📄</div>
        <p className="text-gray-600 font-bold">Menyiapkan PDF...</p>
      </div>
    </div>
  );
}

export default function BiayaPDFPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Memuat...</div>}>
      <PDFContent />
    </Suspense>
  );
}
