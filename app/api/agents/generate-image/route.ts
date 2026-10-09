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

// ---------- Provider 1: Cloudflare Workers AI ----------
async function tryCloudflare(
  prompt: string,
  dim: [number, number]
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_AI_API_KEY;

  if (!accountId || !apiKey) {
    return { ok: false, error: "Cloudflare env tidak lengkap" };
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        steps: 4,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        error: `Cloudflare HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = await res.json();

    const b64 = json?.result?.image;
    if (!b64) {
      return {
        ok: false,
        error: "Cloudflare: response tanpa result.image",
      };
    }

    return { ok: true, dataUrl: `data:image/jpeg;base64,${b64}` };
  } catch (err: any) {
    return { ok: false, error: `Cloudflare: ${err.message}` };
  }
}

// ---------- Provider 2: Pollinations ----------
async function tryPollinations(
  prompt: string,
  dim: [number, number]
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  const models = ["flux", "turbo", "sana"];

  let lastError = "";

  for (const model of models) {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodedPrompt}` +
      `?width=${dim[0]}&height=${dim[1]}&model=${model}` +
      `&nologo=true&seed=${Date.now()}`;

    const headers: Record<string, string> = {
      "User-Agent": "Harvestan-AI-Agents/1.0",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    try {
      const imgRes = await fetch(imageUrl, {
        headers,
        signal: AbortSignal.timeout(30000),
      });

      if (!imgRes.ok) {
        lastError = `Pollinations ${model}: HTTP ${imgRes.status}`;
        console.error(lastError);
        if (imgRes.status === 401 || imgRes.status === 403) {
          return {
            ok: false,
            error: `API key Pollinations invalid (${imgRes.status})`,
          };
        }
        continue;
      }

      const arrayBuffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return { ok: true, dataUrl: `data:${contentType};base64,${base64}` };
    } catch (err: any) {
      lastError = `Pollinations ${model}: ${err.message}`;
      console.error(lastError);
      continue;
    }
  }

  return { ok: false, error: lastError || "Pollinations gagal semua model" };
}

// ---------- Handler utama ----------
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
      return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
    }
    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Prompt maksimal 1000 karakter" },
        { status: 400 }
      );
    }

    const dim = ASPECT_TO_DIM[aspectRatio] || ASPECT_TO_DIM["1:1"];

    const errors: string[] = [];

    // 1. Cloudflare
    const cf = await tryCloudflare(prompt, dim);
    if (cf.ok) {
      return NextResponse.json({
        ok: true,
        image: cf.dataUrl,
        provider: "cloudflare",
        prompt,
        aspectRatio,
      });
    }
    errors.push(cf.error);
    console.warn("Cloudflare gagal:", cf.error);

    // 2. Pollinations (fallback)
    const poll = await tryPollinations(prompt, dim);
    if (poll.ok) {
      return NextResponse.json({
        ok: true,
        image: poll.dataUrl,
        provider: "pollinations",
        prompt,
        aspectRatio,
      });
    }
    errors.push(poll.error);

    return NextResponse.json(
      {
        error: "Semua provider gagal. " + errors.join(" | "),
        detail: errors,
      },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("Generate image error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal generate gambar" },
      { status: 500 }
    );
  }
}
