import { NextRequest, NextResponse } from "next/server";
import {
  activatePremium,
  getMayarOrderUser,
  updateMayarOrderStatus,
} from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

/**
 * GET /api/mayar/status?order_id=HARV-xxxxx
 *
 * Fallback: kalau webhook belum masuk tapi user sudah bayar.
 */
export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("order_id");
    if (!orderId) {
      return NextResponse.json(
        { error: "order_id wajib diisi" },
        { status: 400 }
      );
    }

    const apiKey = process.env.MAYAR_API_KEY;
    const isProduction = process.env.MAYAR_IS_PRODUCTION !== "false";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key Mayar missing" },
        { status: 500 }
      );
    }

    const orderData = await getMayarOrderUser(orderId);
    if (!orderData) {
      return NextResponse.json(
        { error: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const baseUrl = isProduction
      ? "https://api.mayar.id/hl/v2"
      : "https://api.mayar.club/hl/v2";

    const res = await fetch(
      `${baseUrl}/payments/${orderId}/status`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await res.json();
    const status = data?.data?.status || data?.status || "UNKNOWN";
    const isSuccess =
      status === "SUCCESS" || status === "PAID" || status === "paid";

    if (isSuccess) {
      await updateMayarOrderStatus(orderId, "paid");
      await activatePremium({
        userId: orderData.userId,
        orderId,
        amount: orderData.amount,
        paymentMethod: "qris_mayar",
        premiumType: "lifetime",
        source: "mayar",
        notes: `Verified via status check`,
      });
    }

    return NextResponse.json({
      order_id: orderId,
      status,
      is_success: isSuccess,
    });
  } catch (err: any) {
    console.error("Mayar status exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
