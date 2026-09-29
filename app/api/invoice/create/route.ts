import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

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

    const userEmail = user.email || "noemail@harvestan.app";
    const userNama =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (user.email ? user.email.split("@")[0] : "Pengguna") ||
      "Pengguna";

    const result = await createInvoice(user.id, userEmail, userNama);

    if (!result.ok || !result.invoice) {
      return NextResponse.json(
        { error: result.message || "Gagal membuat invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      invoice: result.invoice,
      message: result.message,
    });
  } catch (err: any) {
    console.error("Invoice create exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
