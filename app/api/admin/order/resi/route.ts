import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateOrderResi } from "@/lib/supabase/queries/subscription-server";
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
    const resi = body.resi;
    const kurirResi = body.kurir_resi || "JNE";

    if (!orderCode || !resi) {
      return NextResponse.json(
        { error: "order_code & resi wajib" },
        { status: 400 }
      );
    }

    const result = await updateOrderResi(orderCode, resi, kurirResi);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Get order untuk WA
    const { data: order } = await supabase
      .from("orders")
      .select("user_nama, no_hp, order_code")
      .eq("order_code", orderCode)
      .single();

    await sendTelegram(
      `🚚 <b>Resi Diinput</b>\n\n` +
        `🧾 Kode: <code>${orderCode}</code>\n` +
        `📮 Resi: ${resi}\n` +
        `🏢 Kurir: ${kurirResi}`
    );

    return NextResponse.json({
      ok: true,
      message: result.message,
      order: {
        code: orderCode,
        nama: order?.user_nama,
        no_hp: order?.no_hp,
        resi,
        kurir: kurirResi,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error" }, { status: 500 });
  }
}
