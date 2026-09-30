import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokePremium } from "@/lib/supabase/queries/subscription-server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "harvestan.id@gmail.com";

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

    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Hanya admin yang bisa akses" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const userId = body.user_id;
    const alasan = body.alasan || null;

    if (!userId) {
      return NextResponse.json(
        { error: "user_id wajib diisi" },
        { status: 400 }
      );
    }

    const result = await revokePremium(userId, user.email!, alasan);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error("Revoke premium exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
