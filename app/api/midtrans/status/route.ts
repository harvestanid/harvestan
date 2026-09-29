import { NextRequest, NextResponse } from "next/server";
import {
  activatePremium,
  getOrderUserId,
  updateOrderStatus,
} from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

/**
 * GET /api/midtrans/status?order_id=HARV-xxxxx
 *
 * Manual check ke Midtrans — dipakai kalau webhook belum masuk
 * tapi user sudah bayar (misal user balik ke /premium/sukses).
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

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key missing" },
        { status: 500 }
      );
    }

    const baseUrl = isProduction
      ? `https://api.midtrans.com/v2/${orderId}/status`
      : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    const res = await fetch(baseUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.status_message || "Gagal cek status" },
        { status: 500 }
      );
    }

    const status = data.transaction_status;
    const fraud = data.fraud_status;

    // Aktifkan premium kalau sudah settlement / capture-accept
    const isSuccess =
      status === "settlement" ||
      (status === "capture" && fraud === "accept");

    if (isSuccess) {
      const orderData = await getOrderUserId(orderId);
      if (orderData) {
        await updateOrderStatus(orderId, "paid");
        await activatePremium({
          userId: orderData.userId,
          orderId,
          amount: Number(data.gross_amount),
          paymentMethod: data.payment_type,
          premiumType: "lifetime",
          source: "midtrans",
          notes: `Verified via status check ${data.transaction_id}`,
        });
      }
    }

    return NextResponse.json({
      order_id: orderId,
      transaction_status: status,
      fraud_status: fraud || null,
      is_success: isSuccess,
      payment_type: data.payment_type,
      gross_amount: data.gross_amount,
    });
  } catch (err: any) {
    console.error("Midtrans status exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
