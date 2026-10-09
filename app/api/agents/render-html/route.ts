import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;

const ADMIN_EMAIL = "harvestan.id@gmail.com";

const ASPECT_TO_DIM: Record<string, [number, number]> = {
  "1:1": [1080, 1080],
  "16:9": [1200, 675],
  "9:16": [1080, 1920],
  "4:3": [1200, 900],
  "3:4": [1080, 1440],
};

export async function POST(req: NextRequest) {
  let browser: any = null;

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
    const html = (body.html || "").trim();
    const aspectRatio = body.aspect_ratio || "1:1";

    if (!html) {
      return NextResponse.json({ error: "HTML wajib diisi" }, { status: 400 });
    }

    const dim = ASPECT_TO_DIM[aspectRatio] || ASPECT_TO_DIM["1:1"];

    // Bungkus HTML dengan container fixed size
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${dim[0]}, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#ffffff;width:${dim[0]}px;height:${dim[1]}px;overflow:hidden;">
${html}
</body>
</html>`;

    // Launch chromium (Vercel serverless)
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: dim[0],
        height: dim[1],
        deviceScaleFactor: 2, // 2x untuk kualitas HD
      },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: dim[0],
      height: dim[1],
      deviceScaleFactor: 2,
    });

    // Load HTML
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Tunggu font siap
    await page.evaluate(() => document.fonts.ready);

    // Screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: dim[0],
        height: dim[1],
      },
    });

    await browser.close();
    browser = null;

    const base64 = Buffer.from(screenshot).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      ok: true,
      image: dataUrl,
      provider: "html-render",
      width: dim[0],
      height: dim[1],
      aspectRatio,
    });
  } catch (err: any) {
    console.error("Render HTML error:", err);
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    return NextResponse.json(
      { error: err.message || "Gagal render HTML ke PNG" },
      { status: 500 }
    );
  }
}
