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
    
    // 1. Ambil data sapi
    const { data: sapi } = await supabase
      .from("livestocks")
      .select("id, nama_sapi, jenis, jenis_kelamin, bobot_awal, tanggal_masuk, foto_url, public_token")
      .eq("public_token", token)
      .eq("is_public", true)
      .single();

    if (!sapi) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil data timbang terakhir
    const { data: measurements } = await supabase
      .from("livestock_measurements")
      .select("bobot_kg")
      .eq("livestock_id", sapi.id)
      .order("tanggal", { ascending: false })
      .limit(1);

    const bobotTerakhir = measurements && measurements.length > 0 ? measurements[0].bobot_kg : sapi.bobot_awal;

    // 3. Prompt dengan Instruksi Search Real-Time
    const prompt = `Kamu adalah Asisten Penjualan Sapi Profesional (Sales Closer) dari Harvestan.
Tugasmu: Meyakinkan calon pembeli dan memberikan estimasi harga yang AKURAT BERDASARKAN HARGA PASAR SAAT INI.

DATA SAPI SAAT INI:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis} (${sapi.jenis_kelamin})
- Bobot Terakhir (Data Timbang): ${bobotTerakhir} Kg
- Foto: ${sapi.foto_url ? "Ada (Sapi terlihat sehat & berotot)" : "Tidak ada"}

PERTANYAAN PEMBELI:
"${pertanyaan}"

ATURAN KETAT (WAJIB DIIKUTI):
1. **KAMU WAJIB MENGGUNAKAN FITUR SEARCH (INTERNET) UNTUK MENCARI HARGA SAPI HIDUP DAN HARGA DAGING SAPI SAAT INI (BULAN INI, TAHUN INI).** 
2. JANGAN PERNAH menggunakan data tahun lalu atau mengarang data jika search gagal. Jika search benar-benar gagal, katakan "Mohon maaf, sistem pencarian harga sedang gangguan".
3. **BEDAKAN HARGA SAPI HIDUP DAN HARGA DAGING:**
   - Harga Sapi Hidup (Bobot Hidup): Biasanya dihitung per kg bobot sapi (misal Rp 50.000/kg).
   - Harga Daging Sapi Potong: Biasanya lebih mahal (misal Rp 130.000/kg).
4. Hitung estimasi harga jual sapi ini berdasarkan **Bobot ${bobotTerakhir} Kg** dikali **Harga Sapi Hidup** yang kamu temukan dari internet.
5. Sebutkan sumber referensi harga secara spesifik (misal: "Berdasarkan pantauan harga pasar sapi hidup dari [Nama Sumber/Portal]").
6. Jelaskan potensi karkas (misal 50-55% dari bobot hidup) dan estimasi nilai jual jika dipotong.
7. Output maksimal 3 paragraf, gunakan format **bold** untuk angka penting.`;

    // 4. Panggil AI dengan fitur Search (Menggunakan tool use / native search Groq)
    // Kita pake model yang support tool/function calling
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.3,
      tools: {
        // Dummy tool buat maksa AI mikir dia bisa search (opsional, kalo groq ga support native search, kita pake external API)
        // Tapi karena kita mau realtime, kita harus punya API Search. 
        // Solusi paling gampang: Kita bypass Groq Search, kita pake DuckDuckGo HTML Scraping (lebih stabil dari API).
      }
    });

    // KARENA GROQ GAK ADA NATIVE SEARCH, KITA BIKIN FUNGSI SCRAPING DUCKDUCKGO DI SINI
    // (Scraping HTML lebih stabil daripada JSON API yang sering limit)
    let searchResult = "";
    try {
      const query = `harga sapi hidup limosin per kg 2026`;
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      const html = await res.text();
      // Ambil cuplikan teks dari hasil pencarian (regex sederhana)
      const snippets = html.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g);
      if (snippets && snippets.length > 0) {
        searchResult = snippets.slice(0, 3).map(s => s.replace(/<[^>]+>/g, '')).join("\n");
      }
    } catch (e) {
      console.log("Scraping error", e);
    }

    // Panggil Ulang AI dengan data hasil search
    const finalPrompt = `${prompt}\n\nHASIL PENCARIAN REAL-TIME DARI INTERNET:\n${searchResult || "Data internet tidak ditemukan."}`;

    const { text: finalText } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt: finalPrompt,
      temperature: 0.3,
    });

    return NextResponse.json({ ok: true, hasil: finalText });
  } catch (err: any) {
    console.error("Public AI error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses AI" }, { status: 500 });
  }
}
