import { NextRequest, NextResponse } from "next/server";
import {
  activatePremium,
  getMayarOrderUser,
  updateMayarOrderStatus,
  findByMayarTransactionId,
} from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

type MayarWebhookPayload = {
  event: string;
  data?: {
    id?: string;
    transactionId?: string;
    status?: string;
    amount?: number;
    customerName?: string;
    customerEmail?: string;
    productName?: string;
    extraData?: {
      orderId?: string;
      userId?: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
};

export async function POST(req: NextRequest) {
  try {
    const webhookToken = process.env.MAYAR_WEBHOOK_TOKEN;
    if (!webhookToken) {
      console.error("Webhook Mayar: token missing");
      return NextResponse.json(
        { error: "Config error" },
        { status: 500 }
      );
    }

    // Verifikasi token di header (Mayar kirim di header "x-mayar-token"
    // atau di query ?token=xxx)
    const headerToken =
      req.headers.get("x-mayar-token") ||
      req.headers.get("mayar-token") ||
      req.nextUrl.searchParams.get("token");

    if (headerToken !== webhookToken) {
      console.error("Webhook Mayar: token mismatch");
      return NextResponse.json(
        { error: "Invalid webhook token" },
        { status: 401 }
      );
    }

    const payload: MayarWebhookPayload = await req.json();
    console.log("Mayar webhook received:", JSON.stringify(payload));

    const event = payload.event;
    const data = payload.data || {};

    // Cari order_id — bisa dari extraData atau dari database
    let orderId = data.extraData?.orderId || null;
    let userId = data.extraData?.userId || null;

    // Kalau gak ada di payload, cari pakai transactionId
    if (!orderId && (data.transactionId || data.id)) {
      const found = await findByMayarTransactionId(
        data.transactionId || data.id || ""
      );
      if (found) {
        orderId = found.orderId;
        userId = found.userId;
      }
    }

    if (!orderId || !userId) {
      console.error("Webhook Mayar: order tidak ditemukan");
      return NextResponse.json({
        ok: true,
        message: "Order not tracked",
      });
    }

    // Handle event
    const isSuccess =
      event === "payment.received" ||
      data.status === "SUCCESS" ||
      data.status === "PAID" ||
      data.status === "paid";

    if (isSuccess) {
      // Update order status
      await updateMayarOrderStatus(orderId, "paid");

      // Aktifkan premium
      const result = await activatePremium({
        userId,
        orderId,
        amount: Number(data.amount || 59000),
        paymentMethod: "qris_mayar",
        premiumType: "lifetime",
        source: "mayar",
        notes: `Mayar transaction ${data.id || data.transactionId}`,
      });

      if (!result.ok) {
        console.error("activatePremium Mayar gagal:", result.message);
        return NextResponse.json(
          { ok: false, error: result.message },
          { status: 500 }
        );
      }

      console.log(`✅ Premium activated via Mayar: user ${userId}`);
    } else if (
      event === "payment.expired" ||
      data.status === "EXPIRED" ||
      data.status === "FAILED"
    ) {
      await updateMayarOrderStatus(
        orderId,
        data.status === "EXPIRED" ? "expired" : "failed"
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook Mayar exception:", err);
    return NextResponse.json(
      { error: err.message || "Webhook error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Mayar webhook ready. Configure URL in Mayar dashboard.",
  });
}
