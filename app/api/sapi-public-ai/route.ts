import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

async function searchTavily(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  // Tampilkan error asli kalau API Key kosong
  if (!apiKey) {
    return "ERROR_SISTEM: API Key TAVILY_API_KEY tidak terbaca oleh server (kosong).";
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
      const errorText = await res.text();
      return `ERROR_SISTEM: Gagal konek ke Tavily (HTTP ${res.status}). Pesan: ${errorText}`;
    }

    const data = await res.json();
    let hasil = "";
    if (data.answer) hasil += `Ringkasan Tavily: ${data.answer}\n\n`;
    
    if (data.results && data.results.length > 0) {
      hasil += data.results.map((r: any) => `Sumber (${r.url}): ${r.content}`).join("\n");
    }

    return hasil || "ERROR_SISTEM: Tavily mengembalikan data kosong.";
  } catch (err: any) {
    return `ERROR_SISTEM: Exception di server. Pesan: ${err.message}`;
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
    const searchQuery = `harga sapi hidup ${sapi.jenis} per kg bobot hidup terbaru 2026`;
    const internetInfo = await searchTavily(searchQuery);

    // KALAU TAVILY ERROR, KITA KIRIM PESAN ERRORNYA LANGSUNG KE USER BUAT DEBUG
    if (internetInfo.startsWith("ERROR_SISTEM:")) {
      return NextResponse.json({ ok: true, hasil: `⚠️ **DEBUG MODE** ⚠️\n\n${internetInfo}` });
    }

    const prompt = `Kamu adalah Asisten Penjualan Sapi Profesional (Sales Closer) dari Harvestan.
Tugasmu: Meyakinkan calon pembeli dan memberikan estimasi harga yang AKURAT.

DATA SAPI:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis} (${sapi.jenis_kelamin})
- Bobot Terakhir: ${bobotTerakhir} Kg

HASIL PENCARIAN INTERNET REAL-TIME (TAVILY):
${internetInfo}

PERTANYAAN PEMBELI:
"${pertanyaan}"

ATURAN:
1. Gunakan data dari "HASIL PENCARIAN INTERNET" untuk menjawab.
2. Bedakan harga sapi hidup dan harga daging.
3. Hitung estimasi harga jual (Bobot x Harga Sapi Hidup).
4. Sebutkan sumber URL dari hasil pencarian.
5. Maksimal 3 paragraf, pakai format **bold**.`;

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
