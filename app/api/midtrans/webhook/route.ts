import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  activatePremium,
  getOrderUserId,
  updateOrderStatus,
} from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

type MidtransNotification = {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
};

export async function POST(req: NextRequest) {
  try {
    const notif: MidtransNotification = await req.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error("Webhook: server key missing");
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    // ===== VERIFIKASI SIGNATURE =====
    // signature = sha512(order_id + status_code + gross_amount + server_key)
    const raw = `${notif.order_id}${notif.status_code}${notif.gross_amount}${serverKey}`;
    const expectedSig = crypto.createHash("sha512").update(raw).digest("hex");

    if (expectedSig !== notif.signature_key) {
      console.error("Webhook: signature mismatch", {
        expected: expectedSig,
        got: notif.signature_key,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ===== CARI USER DARI ORDER_ID =====
    const orderData = await getOrderUserId(notif.order_id);
    if (!orderData) {
      console.error("Webhook: order not found", notif.order_id);
      // Tetap balas 200 supaya Midtrans tidak retry terus
      return NextResponse.json({ ok: true, message: "Order not tracked" });
    }

    const { userId } = orderData;

    // ===== HANDLE STATUS =====
    const status = notif.transaction_status;
    const fraud = notif.fraud_status;

    let isSuccess = false;
    let finalStatus: "paid" | "failed" | "expired" | "pending" = "pending";

    if (status === "capture") {
      // Kartu kredit — butuh fraud_status accept
      if (fraud === "accept") {
        isSuccess = true;
        finalStatus = "paid";
      } else {
        finalStatus = "failed";
      }
    } else if (status === "settlement") {
      isSuccess = true;
      finalStatus = "paid";
    } else if (status === "pending") {
      finalStatus = "pending";
    } else if (status === "deny" || status === "cancel" || status === "failure") {
      finalStatus = "failed";
    } else if (status === "expire") {
      finalStatus = "expired";
    } else if (status === "refund" || status === "partial_refund") {
      finalStatus = "failed";
    }

    await updateOrderStatus(notif.order_id, finalStatus);

    if (isSuccess) {
      const result = await activatePremium({
        userId,
        orderId: notif.order_id,
        amount: Number(notif.gross_amount),
        paymentMethod: notif.payment_type,
        premiumType: "lifetime",
        source: "midtrans",
        notes: `Midtrans ${notif.transaction_id}`,
      });

      if (!result.ok) {
        console.error("activatePremium failed:", result.message);
        return NextResponse.json(
          { ok: false, error: result.message },
          { status: 500 }
        );
      }

      console.log(`✅ Premium activated for user ${userId} (${notif.order_id})`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook exception:", err);
    return NextResponse.json(
      { error: err.message || "Webhook error" },
      { status: 500 }
    );
  }
}

// Midtrans kadang kirim GET untuk health check
export async function GET() {
  return NextResponse.json({ ok: true, message: "Midtrans webhook ready" });
}
