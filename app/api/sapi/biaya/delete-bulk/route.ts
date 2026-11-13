import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const ids = body.ids || [];

    if (ids.length === 0) return NextResponse.json({ error: "Tidak ada yang dipilih" }, { status: 400 });

    const { data: logs } = await supabase.from("farm_operational_logs").select("id, foto_url").in("id", ids).eq("user_id", user.id);
    
    if (logs) {
      const fotoPaths: string[] = [];
      for (const l of logs) {
        if (l.foto_url) {
          try {
            const url = new URL(l.foto_url);
            const parts = url.pathname.split("/livestock-photos/");
            if (parts[1]) fotoPaths.push(decodeURIComponent(parts[1]));
          } catch {}
        }
      }
      if (fotoPaths.length > 0) {
        await supabase.storage.from("livestock-photos").remove(fotoPaths);
      }
    }

    const { error } = await supabase.from("farm_operational_logs").delete().in("id", ids).eq("user_id", user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true, jumlah: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
