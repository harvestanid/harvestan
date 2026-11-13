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
      .select("id, nama_sapi, jenis, jenis_kelamin, bobot_awal, tanggal_masuk")
      .eq("public_token", token)
      .eq("is_public", true)
      .single();

    if (!sapi) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil data timbang terakhir
    const { data: measurements } = await supabase
      .from("livestock_measurements")
      .select("bobot_kg, tinggi_cm, panjang_cm")
      .eq("livestock_id", sapi.id)
      .order("tanggal", { ascending: false })
      .limit(1);

    const lastMeasure = measurements && measurements.length > 0 ? measurements[0] : null;
    const bobotSekarang = lastMeasure ? lastMeasure.bobot_kg : sapi.bobot_awal;

    const prompt = `Kamu adalah asisten virtual peternakan Harvestan.
Kamu sedang menjawab pertanyaan dari calon pembeli sapi.
Data sapi yang ditanyakan:
- Nama: ${sapi.nama_sapi || "Tanpa Nama"}
- Jenis: ${sapi.jenis}
- Kelamin: ${sapi.jenis_kelamin}
- Bobot Terakhir (Data Timbang): ${bobotSekarang} Kg
- Bobot Awal Masuk: ${sapi.bobot_awal} Kg
- Tanggal Masuk: ${sapi.tanggal_masuk}

Pertanyaan pembeli: "${pertanyaan}"

Jawablah dengan sopan, ramah, dan profesional. 
Gunakan data "Bobot Terakhir (Data Timbang)" sebagai acuan utama untuk menghitung estimasi harga atau karkas, JANGAN pakai bobot awal.
JANGAN memberikan informasi tentang harga beli (modal).
Jika ditanya harga jual, berikan estimasi harga pasar yang wajar (range harga) berdasarkan bobot terakhir.
Output maksimal 2 paragraf pendek.`;

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
