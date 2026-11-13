import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
      .select("id, nama_sapi, jenis, jenis_kelamin, tanggal_masuk")
      .eq("public_token", token)
      .eq("is_public", true)
      .single();

    if (!sapi) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil data timbang TERAKHIR (berdasarkan tanggal)
    const { data: measurements } = await supabase
      .from("livestock_measurements")
      .select("bobot_kg, tanggal")
      .eq("livestock_id", sapi.id)
      .order("tanggal", { ascending: false })
      .limit(1);

    const lastMeasure = measurements && measurements.length > 0 ? measurements[0] : null;
    const bobotSekarang = lastMeasure ? lastMeasure.bobot_kg : 0;

    // 3. Susun prompt yang tegas
    const prompt = `Kamu adalah asisten virtual peternakan Harvestan.
Kamu sedang menjawab pertanyaan dari calon pembeli sapi.

Data sapi yang ditanyakan:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis}
- Kelamin: ${sapi.jenis_kelamin}
- Tanggal Masuk: ${sapi.tanggal_masuk}
- **BOBOT SAAT INI (HASIL TIMBANG TERAKHIR)**: ${bobotSekarang} Kg

Pertanyaan pembeli: "${pertanyaan}"

ATURAN KETAT:
1. Gunakan angka **${bobotSekarang} Kg** sebagai bobot utama saat ini.
2. JANGAN PERNAH menyebutkan bobot awal (jika ada) atau berasumsi bobot 200 kg. Abaikan masa lalu.
3. Hitung estimasi harga jual pasar berdasarkan bobot ${bobotSekarang} Kg.
4. Hitung estimasi karkas berdasarkan bobot ${bobotSekarang} Kg.
5. Jangan berikan harga beli/modal.
6. Jawab maksimal 2 paragraf pendek dengan tegas.`;

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
