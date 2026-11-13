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
    
    const { data: sapi } = await supabase
      .from("livestocks")
      .select("jenis, jenis_kelamin, bobot_awal, tanggal_masuk")
      .eq("public_token", token)
      .eq("is_public", true)
      .single();

    if (!sapi) {
      return NextResponse.json({ error: "Sapi tidak ditemukan" }, { status: 404 });
    }

    const prompt = `Kamu adalah asisten virtual peternakan Harvestan.
Kamu sedang menjawab pertanyaan dari calon pembeli sapi.
Data sapi yang ditanyakan:
- Jenis: ${sapi.jenis}
- Kelamin: ${sapi.jenis_kelamin}
- Bobot Awal: ${sapi.bobot_awal} Kg
- Tanggal Masuk: ${sapi.tanggal_masuk}

Pertanyaan pembeli: "${pertanyaan}"

Jawablah dengan sopan, ramah, dan profesional. 
JANGAN memberikan informasi tentang harga beli (rahasia). 
Jika ditanya harga jual, berikan estimasi harga pasar yang wajar (range harga).
Jika ditanya hal lain di luar sapi ini, jawab dengan bijak dan arahkan kembali ke topik sapi.
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
