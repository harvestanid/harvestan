"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "Padi",
  jagung: "Jagung",
  kacang_tanah: "Kacang Tanah",
  bawang_merah: "Bawang Merah",
  cabai_rawit: "Cabai Rawit",
  cabai: "Cabai",
};

const BULAN_LABEL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function KalenderPDFPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: kalender } = await supabase
        .from("kalender_tanam")
        .select("*, lands(nama)")
        .eq("id", id)
        .single();

      if (kalender) {
        const { data: kegiatan } = await supabase
          .from("kalender_kegiatan")
          .select("*")
          .eq("kalender_id", id)
          .order("hst", { ascending: true });

        setData({ kalender, kegiatan });
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!data || loading) return;

    async function generatePDF() {
      try {
        const { kalender, kegiatan } = data;
        const pdf = new jsPDF("p", "mm", "a4");
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let y = 25;

        const tglMulai = new Date(kalender.tanggal_mulai);
        const tglSelesai = new Date(kalender.tanggal_selesai);
        const tglPanen = new Date(tglMulai);
        tglPanen.setDate(tglPanen.getDate() + Number(kalender.total_hst));

        const formatDate = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

        // ================= HALAMAN 1: JADWAL KEGIATAN =================
        
        // Logo (Placeholder base64 atau URL)
        // Karena jsPDF butuh base64, kita asumsikan logo.png ada di folder public.
        // Tapi biar aman dan ga error, kita pakai teks aja dulu dengan font besar.
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(26);
        pdf.setTextColor(44, 94, 46); // Hijau Harvestan
        pdf.text("HARVESTAN", margin, y);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text("Smart Farming Management", margin, y + 5);

        // Garis Emas
        pdf.setDrawColor(240, 180, 41);
        pdf.setLineWidth(1.5);
        pdf.line(margin, y + 10, pageWidth - margin, y + 10);

        y += 20;

        // Judul Kalender
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text("KALENDER TANAM", margin, y);
        
        pdf.setFontSize(11);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Komoditas: ${KOMODITAS_LABEL[kalender.komoditas] || kalender.komoditas}`, margin, y + 8);
        pdf.text(`Lahan: ${kalender.lands?.nama || "Tidak Spesifik"}`, margin, y + 14);

        y += 25;

        // Box Info Elegan
        pdf.setFillColor(248, 250, 248); // Abu-abu sangat muda
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(margin, y, pageWidth - margin * 2, 25, "FD");
        
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "bold");
        pdf.text("MULAI TANAM", margin + 5, y + 6);
        pdf.text("SELESAI TANAM", margin + 60, y + 6);
        pdf.text("ESTIMASI PANEN", margin + 115, y + 6);

        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text(formatDate(tglMulai), margin + 5, y + 13);
        pdf.text(formatDate(tglSelesai), margin + 60, y + 13);
        
        pdf.setTextColor(200, 100, 0); // Oranye untuk panen
        pdf.text(`${formatDate(tglPanen)} (${kalender.total_hst} HST)`, margin + 115, y + 13);

        y += 35;

        // List Timeline
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 94, 46);
        pdf.text("Timeline Kegiatan", margin, y);
        y += 10;

        const mapKegiatan = new Map<string, any[]>();
        const pushKegiatan = (date: Date, hstLabel: string, judul: string, keterangan: string = "") => {
          const key = date.toDateString();
          if (!mapKegiatan.has(key)) mapKegiatan.set(key, []);
          mapKegiatan.get(key)!.push({ hstLabel, judul, keterangan, date });
        };

        kegiatan?.forEach((k: any) => {
          const d = new Date(tglMulai);
          d.setDate(d.getDate() + Number(k.hst));
          pushKegiatan(new Date(d), String(k.hst), k.judul, k.keterangan);
        });

        let curr = new Date(tglMulai);
        let hariKe = 0;
        while (curr <= tglSelesai) {
          pushKegiatan(new Date(curr), String(hariKe), "Tanam");
          curr.setDate(curr.getDate() + 1);
          hariKe++;
        }
        pushKegiatan(new Date(tglPanen), String(kalender.total_hst), "PANEN");

        const sortedKeys = Array.from(mapKegiatan.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        sortedKeys.forEach((key) => {
          const list = mapKegiatan.get(key)!;
          const date = list[0].date;
          const isPanen = list[0].judul === "PANEN";
          
          let itemHeights = list.length * 8;
          list.forEach(i => { if (i.keterangan) itemHeights += 5; });
          const boxHeight = 12 + itemHeights;
          
          if (y + boxHeight > pageHeight - margin) { pdf.addPage(); y = 20; }

          // Background Box
          if (isPanen) {
            pdf.setFillColor(255, 247, 237); 
            pdf.setDrawColor(240, 180, 41);
          } else {
            pdf.setFillColor(240, 253, 244); 
            pdf.setDrawColor(187, 247, 208);
          }
          pdf.rect(margin, y, pageWidth - margin * 2, boxHeight, "FD");

          // Lingkaran HST
          if (isPanen) pdf.setFillColor(240, 140, 0);
          else pdf.setFillColor(44, 94, 46);
          
          pdf.circle(margin + 8, y + (boxHeight/2), 6, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text(list[0].hstLabel, margin + 8, y + (boxHeight/2) + 1, { align: "center" });

          // Tanggal
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(formatDate(date), margin + 20, y + 6);
          
          // List Kegiatan
          let offsetY = 12;
          list.forEach((item) => {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.text(`• ${item.judul}`, margin + 20, y + offsetY);
            
            if (item.keterangan) {
              pdf.setFontSize(9);
              pdf.setFont("helvetica", "italic");
              pdf.setTextColor(100, 100, 100);
              const lines = pdf.splitTextToSize(item.keterangan, pageWidth - margin * 2 - 25);
              pdf.text(lines, margin + 23, y + offsetY + 4);
              offsetY += (lines.length * 4) + 4;
            } else {
              offsetY += 8;
            }
          });
          y += boxHeight + 4;
        });

        // ================= HALAMAN KALENDER BULANAN =================
        
        let currMonth = new Date(tglMulai.getFullYear(), tglMulai.getMonth(), 1);
        const firstEventDate = new Date(sortedKeys[0]);
        if (firstEventDate < currMonth) {
          currMonth = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1);
        }

        const endMonth = new Date(tglPanen.getFullYear(), tglPanen.getMonth(), 1);

        while (currMonth <= endMonth) {
          pdf.addPage(); // 1 Bulan 1 Halaman
          y = 25;

          // Header Halaman Kalender
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(20);
          pdf.setTextColor(44, 94, 46);
          pdf.text(`Kalender: ${BULAN_LABEL[currMonth.getMonth()]} ${currMonth.getFullYear()}`, margin, y);
          
          // Garis Emas
          pdf.setDrawColor(240, 180, 41);
          pdf.setLineWidth(1);
          pdf.line(margin, y + 5, pageWidth - margin, y + 5);
          
          y += 15;

          const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          
          const cellWidth = (pageWidth - margin * 2) / 7;
          let x = margin;
          
          // Header Tabel Hari
          pdf.setFillColor(240, 253, 244);
          pdf.rect(margin, y - 4, pageWidth - margin * 2, 6, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(44, 94, 46);
          days.forEach((d) => {
            pdf.text(d, x + cellWidth / 2, y, { align: "center" });
            x += cellWidth;
          });
          y += 4;

          const year = currMonth.getFullYear();
          const month = currMonth.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          let dayCounter = 1;
          
          for (let r = 0; r < 6; r++) {
            let maxCellHeight = 20; 

            // Hitung tinggi baris
            let tempDay = dayCounter;
            for (let c = 0; c < 7; c++) {
              if ((r === 0 && c >= startOffset) || (r > 0 && tempDay <= daysInMonth)) {
                if (tempDay <= daysInMonth) {
                  const currentDate = new Date(year, month, tempDay);
                  const list = mapKegiatan.get(currentDate.toDateString()) || [];
                  let h = 8; 
                  list.forEach(item => {
                    const txtLines = pdf.splitTextToSize(item.judul, cellWidth - 4);
                    h += txtLines.length * 4;
                    if (item.keterangan) {
                      const descLines = pdf.splitTextToSize(item.keterangan, cellWidth - 4);
                      h += descLines.length * 3;
                    }
                    h += 2;
                  });
                  if (h > maxCellHeight) maxCellHeight = h;
                }
                tempDay++;
              }
            }

            for (let c = 0; c < 7; c++) {
              const cellX = margin + c * cellWidth;
              const cellY = y;

              pdf.setDrawColor(230, 230, 230);
              pdf.setFillColor(255, 255, 255);
              
              if ((r === 0 && c >= startOffset) || (r > 0 && dayCounter <= daysInMonth)) {
                if (dayCounter <= daysInMonth) {
                  const currentDate = new Date(year, month, dayCounter);
                  const list = mapKegiatan.get(currentDate.toDateString()) || [];

                  if (list.length > 0) {
                    const isPanen = list.some(i => i.judul === "PANEN");
                    if (isPanen) pdf.setFillColor(255, 247, 237); // Oranye muda
                    else pdf.setFillColor(240, 253, 244); // Hijau muda
                  }
                  pdf.rect(cellX, cellY, cellWidth, maxCellHeight, "FD");

                  // Tanggal
                  pdf.setFontSize(9);
                  pdf.setFont("helvetica", "bold");
                  pdf.setTextColor(0, 0, 0);
                  pdf.text(String(dayCounter), cellX + 2, cellY + 5);

                  // Isi Kegiatan
                  if (list.length > 0) {
                    let textY = cellY + 9;
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(7);
                    
                    list.forEach(item => {
                      pdf.setFont("helvetica", "bold");
                      pdf.setTextColor(0, 0, 0);
                      const txtLines = pdf.splitTextToSize(item.judul, cellWidth - 4);
                      pdf.text(txtLines, cellX + 2, textY);
                      textY += txtLines.length * 4;

                      if (item.keterangan) {
                        pdf.setFont("helvetica", "italic");
                        pdf.setTextColor(80, 80, 80);
                        const descLines = pdf.splitTextToSize(item.keterangan, cellWidth - 4);
                        pdf.text(descLines, cellX + 2, textY);
                        textY += descLines.length * 3;
                      }
                      textY += 2;
                    });
                  }
                  dayCounter++;
                } else {
                  pdf.rect(cellX, cellY, cellWidth, maxCellHeight, "D");
                }
              } else {
                pdf.rect(cellX, cellY, cellWidth, maxCellHeight, "D");
              }
            }
            y += maxCellHeight;
            if (dayCounter > daysInMonth) break;
          }
          
          y += 10;
          currMonth.setMonth(currMonth.getMonth() + 1);
        }

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Dibuat dengan Harvestan - harvestan.vercel.app", pageWidth / 2, 285, { align: "center" });

        pdf.save(`Kalender-Tanam-${kalender.komoditas}.pdf`);
        setTimeout(() => router.push(`/kalender-tanam/${id}`), 1500);
      } catch (err) {
        console.error(err);
        alert("Gagal membuat PDF. Coba lagi.");
        router.push(`/kalender-tanam/${id}`);
      }
    }
    setTimeout(generatePDF, 500);
  }, [data, loading, id, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">📄</div>
        <p className="text-gray-600 font-bold">Menyiapkan PDF...</p>
      </div>
    </div>
  );
}
