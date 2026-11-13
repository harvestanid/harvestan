import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Fungsi cari internet pakai Tavily
async function searchTavily(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log("Tavily API Key tidak ditemukan.");
    return "Sistem pencarian internet tidak dikonfigurasi (API Key missing).";
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3,
      }),
    });

    if (!res.ok) {
      throw new Error(`Tavily HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    let hasil = "";
    if (data.answer) hasil += `Ringkasan: ${data.answer}\n\n`;
    
    if (data.results && data.results.length > 0) {
      hasil += data.results.map((r: any) => `Sumber (${r.url}): ${r.content}`).join("\n");
    }

    return hasil || "Tidak ada hasil pencarian.";
  } catch (err: any) {
    console.error("Search Error:", err);
    return "Gagal terhubung ke mesin pencari.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, pertanyaan } = body;

    if (!token || !pertanyaan) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: sapi } = await supabase
      .from("livestocks")
      .select("id, nama_sapi, jenis, jenis_kelamin, bobot_awal, tanggal_masuk, foto_url, public_token")
      .eq("public_token", token)
      .eq("is_public", true)
      .single();

    if (!sapi) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    const { data: measurements } = await supabase
      .from("livestock_measurements")
      .select("bobot_kg")
      .eq("livestock_id", sapi.id)
      .order("tanggal", { ascending: false })
      .limit(1);

    const bobotTerakhir = measurements && measurements.length > 0 ? measurements[0].bobot_kg : sapi.bobot_awal;

    // CARI HARGA VIA TAVILY
    const searchQuery = `harga sapi hidup ${sapi.jenis} per kg bobot hidup terbaru`;
    const internetInfo = await searchTavily(searchQuery);

    const prompt = `Kamu adalah Asisten Penjualan Sapi Profesional (Sales Closer) dari Harvestan.
Tugasmu: Meyakinkan calon pembeli dan memberikan estimasi harga yang AKURAT BERDASARKAN DATA INTERNET.

DATA SAPI:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis} (${sapi.jenis_kelamin})
- Bobot Terakhir: ${bobotTerakhir} Kg

HASIL PENCARIAN INTERNET REAL-TIME:
${internetInfo}

PERTANYAAN PEMBELI:
"${pertanyaan}"

ATURAN KETAT (WAJIB DIIKUTI):
1. Gunakan data dari "HASIL PENCARIAN INTERNET" di atas untuk menjawab. Jika data pencarian berisi "Gagal terhubung" atau "Tidak dikonfigurasi", katakan dengan jujur bahwa sistem harga sedang offline dan sarankan pembeli menghubungi admin.
2. **BEDAKAN HARGA SAPI HIDUP DAN HARGA DAGING:** Jangan tertukar!
3. Hitung estimasi harga jual berdasarkan **Bobot ${bobotTerakhir} Kg** dikali **Harga Sapi Hidup** yang ada di hasil pencarian.
4. Sebutkan sumber URL (link) secara spesifik darimana kamu mengambil harga tersebut.
5. Jelaskan potensi karkas dan jual kelebihan sapi ini.
6. Output maksimal 3 paragraf, gunakan format **bold**.`;

    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.4,
    });

    return NextResponse.json({ ok: true, hasil: text });
  } catch (err: any) {
    console.error("Public AI error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses AI" }, { status: 500 });
  }
}
