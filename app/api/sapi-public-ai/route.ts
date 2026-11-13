import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, pertanyaan } = body;

    if (!token || !pertanyaan) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // 1. Ambil data sapi (Termasuk URL Foto)
    const { data: sapi } = await supabase
      .from("livestocks")
      .select("id, nama_sapi, jenis, jenis_kelamin, bobot_awal, tanggal_masuk, foto_url, public_token")
      .eq("public_token", token)
      .eq("is_public", true)
      .single();

    if (!sapi) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil SEMUA data timbang
    const { data: measurements } = await supabase
      .from("livestock_measurements")
      .select("tanggal, bobot_kg, tinggi_cm, panjang_cm, catatan")
      .eq("livestock_id", sapi.id)
      .order("tanggal", { ascending: true });

    const listTimbang = measurements && measurements.length > 0 
      ? measurements.map((m, i) => `- Tgl ${m.tanggal}: ${m.bobot_kg} Kg (Tinggi: ${m.tinggi_cm || '-'}cm, Panjang: ${m.panjang_cm || '-'}cm)`).join('\n')
      : "Belum ada data timbang";

    const lastMeasure = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : null;
    const bobotTerakhir = lastMeasure ? lastMeasure.bobot_kg : sapi.bobot_awal;
    const totalHari = Math.max(1, Math.floor((new Date().getTime() - new Date(sapi.tanggal_masuk).getTime()) / (1000 * 60 * 60 * 24)));
    const adg = (bobotTerakhir - sapi.bobot_awal) / totalHari;

    // 3. Cari Harga Pasar via DuckDuckGo
    let hasilPencarian = "";
    try {
      const searchQuery = encodeURIComponent(`harga sapi ${sapi.jenis} bobot ${bobotTerakhir}kg 2026`);
      const searchRes = await fetch(`https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1`);
      const searchData = await searchRes.json();
      
      if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
         hasilPencarian = searchData.RelatedTopics.slice(0, 3).map((t: any) => t.Text).join("\n");
      }
    } catch (e) {
      console.log("Gagal search internet", e);
    }

    // 4. Siapkan Prompt Super Cerdas
    const prompt = `Kamu adalah Asisten Penjualan Sapi Profesional (Sales Closer) dari Harvestan.
Tugasmu: Meyakinkan calon pembeli untuk membeli sapi ini berdasarkan data riil.

DATA SAPI SAAT INI:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis}
- Kelamin: ${sapi.jenis_kelamin}
- Umur (Hari): ${totalHari} hari
- Bobot Awal: ${sapi.bobot_awal} Kg
- Bobot Terakhir: ${bobotTerakhir} Kg
- ADG (Pertumbuhan/Hari): ${adg.toFixed(2)} Kg/hari
- **Link Foto Sapi**: ${sapi.foto_url ? sapi.foto_url : "Tidak ada foto"}

RIWAYAT TIMBANG:
${listTimbang}

INFO HARGA PASAR TERKINI (Dari Internet):
${hasilPencarian || "Gunakan pengetahuan umum harga sapi terbaru."}

PERTANYAAN PEMBELI:
"${pertanyaan}"

ATURAN MENJAWAB:
1. Jawab dengan SANGAT MEYAKINKAN dan profesional. Fokus pada keunggulan sapi (pertumbuhan ADG yang bagus, bobot yang sudah tinggi, dll).
2. Hitung estimasi harga jual & potensi karkas berdasarkan **Bobot Terakhir (${bobotTerakhir} Kg)**, JANGAN pakai bobot awal.
3. WAJIB cantumkan sumber referensi harga pasar yang kamu sebutkan (misal: "Berdasarkan pantauan pasar X...").
4. Jika pembeli tanya soal gambar/foto atau potensi karkas, katakan bahwa berdasarkan "Foto Sapi (Link di atas)", sapi terlihat sehat, berotot, dan punya potensi karkas yang baik. (Karena kamu adalah AI teks, kamu bisa menganalisa secara logis dari jenis & bobotnya, dan seolah-olah kamu melihat fotonya untuk meyakinkan pembeli).
5. Jangan sebutkan harga beli/modal.
6. Output maksimal 3 paragraf, gunakan format markdown untuk poin-poin penting (bold).`;

    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.5,
    });

    return NextResponse.json({ ok: true, hasil: text });
  } catch (err: any) {
    console.error("Public AI error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses AI" }, { status: 500 });
  }
}
