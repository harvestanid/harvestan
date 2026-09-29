import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveMayarOrder } from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

const PRICE = 59000;
const PRODUCT_NAME = "Harvestan Premium";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login dulu" },
        { status: 401 }
      );
    }

    const apiKey = process.env.MAYAR_API_KEY;
    const isProduction = process.env.MAYAR_IS_PRODUCTION === "true";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key Mayar belum diset" },
        { status: 500 }
      );
    }

    const orderId = `HARV-${user.id.slice(0, 8)}-${Date.now()}`;
    const baseUrl = isProduction
      ? "https://api.mayar.id/hl/v2"
      : "https://api.mayar.club/hl/v2";

    // Nama & mobile dari user metadata / fallback
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "") ||
      "Petani";

    const userMobile = user.user_metadata?.mobile || "";
    const mobile = userMobile.length >= 10 ? userMobile : "08000000000";

    const payload = {
      name: userName || "Petani Harvestan",
      email: user.email || "noemail@harvestan.app",
      mobile,
      amount: PRICE,
      description: PRODUCT_NAME + " - Akses Selamanya",
      redirectUrl: `${getBaseUrl(req)}/premium/sukses?order_id=${orderId}`,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          name: PRODUCT_NAME, // ⚠️ WAJIB: field "name" di items
          rate: PRICE,
          quantity: 1,
          description: "Akses premium selamanya",
        },
      ],
      extraData: {
        orderId,
        userId: user.id,
      },
    };

    const res = await fetch(`${baseUrl}/payments/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Mayar create error:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error:
            data.messages ||
            data.error ||
            "Gagal buat QRIS. Coba lagi dalam 1 menit.",
        },
        { status: 500 }
      );
    }

    const paymentLink =
      data?.data?.link || data?.link || data?.paymentUrl || null;
    const mayarTransactionId = data?.data?.id || data?.id || null;

    if (!paymentLink) {
      console.error("Mayar response tidak ada link:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Mayar tidak mengembalikan payment link" },
        { status: 500 }
      );
    }

    await saveMayarOrder({
      orderId,
      userId: user.id,
      mayarTransactionId,
      amount: PRICE,
      status: "pending",
      paymentUrl: paymentLink,
    });

    return NextResponse.json({
      order_id: orderId,
      payment_url: paymentLink,
      transaction_id: mayarTransactionId,
    });
  } catch (err: any) {
    console.error("Mayar create exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

function getBaseUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = req.headers.get("host") || "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
