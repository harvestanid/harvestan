import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ADMIN_EMAIL = "harvestan.id@gmail.com";

const ASPECT_TO_DIM: Record<string, [number, number]> = {
  "1:1": [1024, 1024],
  "16:9": [1024, 576],
  "9:16": [576, 1024],
  "4:3": [1024, 768],
  "3:4": [768, 1024],
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const prompt = (body.prompt || "").trim();
    const aspectRatio = body.aspect_ratio || "1:1";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt wajib diisi" },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Prompt maksimal 1000 karakter" },
        { status: 400 }
      );
    }

    const dim = ASPECT_TO_DIM[aspectRatio] || ASPECT_TO_DIM["1:1"];

    // Coba 3 model — kalau gagal, fallback ke berikutnya
    const models = ["turbo", "flux", "sana"];

    let dataUrl: string | null = null;
    let lastError = "";

    for (const model of models) {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dim[0]}&height=${dim[1]}&model=${model}&nologo=true&seed=${Date.now()}`;

      try {
        const imgRes = await fetch(imageUrl, {
          headers: { "User-Agent": "Harvestan-AI-Agents/1.0" },
          signal: AbortSignal.timeout(30000),
        });

        if (!imgRes.ok) {
          lastError = `Model ${model}: HTTP ${imgRes.status}`;
          console.error(lastError);
          continue;
        }

        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        dataUrl = `data:image/jpeg;base64,${base64}`;
        break;
      } catch (err: any) {
        lastError = `Model ${model}: ${err.message}`;
        console.error(lastError);
        continue;
      }
    }

    if (!dataUrl) {
      return NextResponse.json(
        { error: "Semua model gagal. " + lastError + ". Coba lagi nanti." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      image: dataUrl,
      prompt,
      aspectRatio,
    });
  } catch (err: any) {
    console.error("Generate image error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal generate gambar" },
      { status: 500 }
    );
  }
}
