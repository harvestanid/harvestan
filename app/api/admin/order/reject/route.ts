import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectOrder } from "@/lib/supabase/queries/subscription-server";

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
    const catatan = body.catatan || "Ditolak oleh admin";

    if (!orderCode) {
      return NextResponse.json(
        { error: "order_code wajib" },
        { status: 400 }
      );
    }

    const result = await rejectOrder(orderCode, catatan);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error" }, { status: 500 });
  }
}
