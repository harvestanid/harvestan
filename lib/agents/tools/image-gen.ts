// Tool image generation untuk AI Agents Harvestan.
// - generateImageTool: chain Cloudflare → Pollinations (untuk prompt-only)
// - renderHtmlToImage: render HTML → PNG (untuk infografis)

const ASPECT_TO_DIM: Record<string, [number, number]> = {
  "1:1": [1024, 1024],
  "16:9": [1024, 576],
  "9:16": [576, 1024],
  "4:3": [1024, 768],
  "3:4": [768, 1024],
};

// ============================================================
// PROVIDER 1: Cloudflare Workers AI
// ============================================================
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
      body: JSON.stringify({ prompt, steps: 4 }),
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
      return { ok: false, error: "Cloudflare: response tanpa result.image" };
    }

    return { ok: true, dataUrl: `data:image/jpeg;base64,${b64}` };
  } catch (err: any) {
    return { ok: false, error: `Cloudflare: ${err.message}` };
  }
}

// ============================================================
// PROVIDER 2: Pollinations
// ============================================================
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
      continue;
    }
  }

  return { ok: false, error: lastError || "Pollinations gagal semua model" };
}

// ============================================================
// PUBLIC API 1: Generate image dari prompt (chain)
// ============================================================
export async function generateImageTool(input: {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}): Promise<
  | {
      ok: true;
      dataUrl: string;
      prompt: string;
      aspectRatio: string;
      provider: string;
    }
  | { ok: false; error: string; prompt: string }
> {
  const aspectRatio = input.aspectRatio || "1:1";
  const dim = ASPECT_TO_DIM[aspectRatio] || ASPECT_TO_DIM["1:1"];

  const errors: string[] = [];

  const cf = await tryCloudflare(input.prompt, dim);
  if (cf.ok) {
    return {
      ok: true,
      dataUrl: cf.dataUrl,
      prompt: input.prompt,
      aspectRatio,
      provider: "cloudflare",
    };
  }
  errors.push(cf.error);
  console.warn("Cloudflare gagal, fallback ke Pollinations:", cf.error);

  const poll = await tryPollinations(input.prompt, dim);
  if (poll.ok) {
    return {
      ok: true,
      dataUrl: poll.dataUrl,
      prompt: input.prompt,
      aspectRatio,
      provider: "pollinations",
    };
  }
  errors.push(poll.error);

  return {
    ok: false,
    error: "Semua provider gagal. " + errors.join(" | "),
    prompt: input.prompt,
  };
}

// ============================================================
// PUBLIC API 2: Render HTML → PNG (untuk infografis)
// Catatan: ini dipanggil dari server, jadi gak bisa langsung
// pakai puppeteer dari sini. Yang dirender pakai API route
// /api/agents/render-html.
// ============================================================
export const RENDER_HTML_NOTE =
  "Untuk render HTML → PNG, panggil POST /api/agents/render-html dengan body { html, aspect_ratio }";
