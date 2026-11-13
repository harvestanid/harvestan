import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action;

    if (action === "add_jenis") {
      const { data, error } = await supabase
        .from("livestock_custom_jenis")
        .insert({
          user_id: user.id,
          nama: body.nama,
          emoji: body.emoji || "🏷️",
        })
        .select()
        .single();

      if (error) {
        console.error("Insert jenis error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (err: any) {
    console.error("API Biaya error:", err);
    return NextResponse.json({ error: err.message || "Error" }, { status: 500 });
  }
}
