import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveOrder } from "@/lib/supabase/queries/subscription-server";
import { sendTelegram } from "@/lib/notif/telegram";

export const runtime = "nodejs";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
    }

    const body = await req.json();
    const orderCode = body.order_code;

    if (!orderCode) {
      return NextResponse.json(
        { error: "order_code wajib" },
        { status: 400 }
      );
    }

    const result = await approveOrder(orderCode, user.email!);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Ambil info order
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", orderCode)
      .single();

    await sendTelegram(
      `✅ <b>Pesanan Di-approve</b>\n\n` +
        `🧾 Kode: <code>${orderCode}</code>\n` +
        `👤 Pembeli: ${order?.user_nama || "-"}\n` +
        `📦 Total: Rp ${(order?.total || 0).toLocaleString("id-ID")}\n\n` +
        `Stok otomatis berkurang. Jangan lupa input resi setelah kirim.`
    );

    return NextResponse.json({
      ok: true,
      message: result.message,
      order: {
        code: orderCode,
        nama: order?.user_nama,
        no_hp: order?.no_hp,
        total: order?.total,
      },
    });
  } catch (err: any) {
    console.error("Approve order error:", err);
    return NextResponse.json({ error: err.message || "Error" }, { status: 500 });
  }
}
