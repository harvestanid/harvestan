import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runOrchestrator } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 60;

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
        { error: "Hanya admin yang bisa akses AI agents" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const perintah = (body.perintah || "").trim();
    const mode = body.mode || "normal";
    const feedback = body.feedback || "";
    const hasilSebelumnya = body.hasil_sebelumnya || "";
    const agentsFilter = body.agents_filter || undefined;
    const logId = body.log_id || null;

    if (!perintah) {
      return NextResponse.json(
        { error: "Perintah wajib diisi" },
        { status: 400 }
      );
    }

    if (perintah.length > 2000) {
      return NextResponse.json(
        { error: "Perintah maksimal 2000 karakter" },
        { status: 400 }
      );
    }

    // Kalau refine, wajib ada feedback
    if (mode === "refine" && !feedback.trim()) {
      return NextResponse.json(
        { error: "Mode refine butuh feedback" },
        { status: 400 }
      );
    }

    const hasil = await runOrchestrator(perintah, {
      mode,
      feedback,
      hasilSebelumnya,
      agentsFilter,
    });

    if (!hasil.ok) {
      return NextResponse.json(
        { error: hasil.error || "Gagal jalankan agent" },
        { status: 500 }
      );
    }

    // Simpan ke log
    let savedLogId = logId;
    try {
      if (logId) {
        // Update log yang ada (refine/regenerate)
        await supabase
          .from("agent_logs")
          .update({
            hasil: hasil.hasil,
            rencana: hasil.rencana,
            mode,
            feedback: feedback || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId)
          .eq("user_id", user.id);
      } else {
        // Insert log baru
        const { data: logData } = await supabase
          .from("agent_logs")
          .insert({
            user_id: user.id,
            perintah,
            rencana: hasil.rencana,
            hasil: hasil.hasil,
            mode,
          })
          .select("id")
          .single();

        if (logData) {
          savedLogId = logData.id;
        }
      }
    } catch (logErr: any) {
      console.error("Save log error:", logErr);
      // Jangan gagalkan response kalau log gagal
    }

    return NextResponse.json({
      ok: true,
      log_id: savedLogId,
      perintah: hasil.perintah,
      rencana: hasil.rencana,
      hasil: hasil.hasil,
    });
  } catch (err: any) {
    console.error("Agents API error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
