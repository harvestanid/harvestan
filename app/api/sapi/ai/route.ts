import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipe, jenis, jenis_kelamin, bobot_kg, adg, umur_hari } = body;

    if (!tipe || !jenis || !bobot_kg) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    let prompt = "";

    if (tipe === "harga") {
      prompt = `Kamu adalah analis harga sapi profesional di Indonesia. 
Data sapi:
- Jenis: ${jenis}
- Kelamin: ${jenis_kelamin}
- Bobot saat ini: ${bobot_kg} Kg
- ADG (Average Daily Gain): ${adg.toFixed(2)} Kg/hari
- Umur: ${umur_hari} hari

Tugas: Berikan estimasi harga jual sapi ini di pasar Indonesia saat ini (tahun 2026). 
Berikan estimasi harga dalam format range (misal: Rp 18.000.000 - Rp 21.000.000).
Sertakan juga alasan singkat berdasarkan bobot dan ADG. 
Output HANYA teks (maksimal 3 paragraf), jangan pakai markdown tabel/heading.`;
    } else if (tipe === "karkas") {
      prompt = `Kamu adalah ahli peternakan sapi. 
Data sapi:
- Jenis: ${jenis}
- Kelamin: ${jenis_kelamin}
- Bobot: ${bobot_kg} Kg

Tugas: Estimasi persentase karkas (daging + tulang) dan daging murni sapi ini.
Berikan estimasi bobot karkas (Kg) dan bobot daging murni (Kg).
Sertakan penjelasan singkat tentang faktor yang mempengaruhinya (jenis, bobot).
Output HANYA teks (maksimal 3 paragraf), jangan pakai markdown tabel/heading.`;
    } else {
      return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 });
    }

    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt,
      temperature: 0.4,
    });

    return NextResponse.json({ ok: true, hasil: text });
  } catch (err: any) {
    console.error("AI Sapi error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses AI" }, { status: 500 });
  }
}
