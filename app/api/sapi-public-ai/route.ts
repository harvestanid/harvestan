import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Helper: Cari info via DuckDuckGo
async function cariInternet(query: string): Promise<string> {
  try {
    const searchRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    const data = await searchRes.json();
    let hasil = "";
    if (data.AbstractText) hasil += `${data.AbstractText}\n`;
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
       hasil += data.RelatedTopics.slice(0, 3).map((t: any) => t.Text).join("\n");
    }
    return hasil || "Tidak ada data spesifik ditemukan di internet.";
  } catch (e) {
    return "Gagal mengakses internet.";
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

    // 3. DEEP SEARCH INTERNET (Cari Harga Sapi Hidup & Harga Daging)
    // Kita cari info terbaru biar AI gak ngarang.
    const [searchSapiHidup, searchDaging] = await Promise.all([
      cariInternet(`harga sapi hidup limosin per kg 2026`),
      cariInternet(`harga daging sapi potong per kg 2026`)
    ]);

    // 4. Susun Prompt untuk AI (AI sebagai perekomendasi harga)
    const prompt = `Kamu adalah Asisten Penjualan Sapi Profesional (Sales Closer) dari Harvestan.
Tugasmu: Berikan rekomendasi harga jual yang WAJAR dan MEYAKINKAN kepada calon pembeli.

DATA SAPI SAAT INI:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis} (${sapi.jenis_kelamin})
- Bobot Terakhir (Data Timbang): ${bobotTerakhir} Kg
- Foto: ${sapi.foto_url ? "Ada (Sapi terlihat sehat & berotot)" : "Tidak ada"}

HASIL PENCARIAN INTERNET TERBARU:
1. **Harga Sapi Hidup**: ${searchSapiHidup}
2. **Harga Daging Sapi Potong**: ${searchDaging}

PERTANYAAN PEMBELI:
"${pertanyaan}"

ATURAN MENJAWAB:
1. **Analisa Dua Harga**: Kamu harus bisa membedakan mana "Harga Sapi Hidup" (biasanya per kg bobot hidup) dan mana "Harga Daging" (biasanya lebih mahal, per kg daging).
2. **Hitung Rekomendasi**: Berikan estimasi harga jual sapi ini berdasarkan **Bobot ${bobotTerakhir} Kg** dikali **Harga Sapi Hidup** yang kamu temukan di internet. (Jangan pakai harga daging untuk mengali total sapi hidup).
3. **Sebutkan Sumber**: Sebutkan dari mana kamu dapat info harga tersebut (berdasarkan hasil pencarian internet di atas).
4. **Jual Kelebihannya**: Yakinkan pembeli bahwa sapi ini sehat, pertumbuhannya bagus, dan potensi karkasnya tinggi (berdasarkan jenis & bobotnya).
5. Jika ditanya potensi karkas, jelaskan persentase karkas wajar untuk sapi jenis ${sapi.jenis} (misal 50-60%) dan hitung perkiraan kg dagingnya.
6. Output maksimal 3 paragraf, gunakan format **bold** untuk angka penting.`;

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
