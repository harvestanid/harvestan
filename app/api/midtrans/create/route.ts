import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savePremiumOrder } from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

const PRICE = 59000; // Rp 59.000
const PRODUCT_NAME = "Harvestan Premium - Akses Selamanya";

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

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key Midtrans belum diset" },
        { status: 500 }
      );
    }

    const orderId = `HARV-${user.id.slice(0, 8)}-${Date.now()}`;
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    const body = {
      transaction_details: {
        order_id: orderId,
        gross_amount: PRICE,
      },
      item_details: [
        {
          id: "premium-lifetime",
          price: PRICE,
          quantity: 1,
          name: PRODUCT_NAME,
        },
      ],
      customer_details: {
        email: user.email,
        first_name: user.email?.split("@")[0] || "Petani",
      },
      callbacks: {
        finish: `${getBaseUrl(req)}/premium/sukses?order_id=${orderId}`,
        error: `${getBaseUrl(req)}/premium/gagal?order_id=${orderId}`,
        pending: `${getBaseUrl(req)}/premium/gagal?order_id=${orderId}`,
      },
      credit_card: {
        secure: true,
      },
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Midtrans create error:", data);
      return NextResponse.json(
        { error: data.error_messages?.join(", ") || "Gagal buat transaksi" },
        { status: 500 }
      );
    }

    // Simpan order untuk webhook lookup
    await savePremiumOrder({
      orderId,
      userId: user.id,
      amount: PRICE,
      status: "pending",
    });

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      order_id: orderId,
    });
  } catch (err: any) {
    console.error("Midtrans create exception:", err);
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
