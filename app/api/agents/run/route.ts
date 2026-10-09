import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runOrchestrator,
  runMultiOrchestrator,
  runJudge,
} from "@/lib/agents/orchestrator";

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
    const multi = body.multi === true;

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

    if (mode === "refine" && !feedback.trim()) {
      return NextResponse.json(
        { error: "Mode refine butuh feedback" },
        { status: 400 }
      );
    }

    // ============================================================
    // MODE MULTI-ORCHESTRATOR
    // ============================================================
    if (multi && mode === "normal") {
      console.log("[MULTI] Start multi-orchestrator");

      let multiResult;
      try {
        multiResult = await runMultiOrchestrator(perintah);
      } catch (e: any) {
        console.error("[MULTI] runMultiOrchestrator crashed:", e);
        return NextResponse.json(
          {
            error: "Multi-orchestrator crash: " + (e?.message || "unknown"),
            stage: "runMultiOrchestrator",
          },
          { status: 500 }
        );
      }

      console.log("[MULTI] multiResult:", {
        ok: multiResult.ok,
        panels: multiResult.panels.length,
        error: multiResult.error,
      });

      if (!multiResult.ok) {
        return NextResponse.json(
          { error: multiResult.error || "Multi-orchestrator gagal" },
          { status: 500 }
        );
      }

      // Judge pilih rencana terbaik
      console.log("[MULTI] Running judge...");
      let judgeResult;
      try {
        judgeResult = await runJudge(perintah, multiResult.panels);
      } catch (e: any) {
        console.error("[MULTI] runJudge crashed:", e);
        return NextResponse.json(
          {
            error: "Judge crash: " + (e?.message || "unknown"),
            stage: "runJudge",
          },
          { status: 500 }
        );
      }

      console.log("[MULTI] judgeResult:", {
        ok: judgeResult.ok,
        pilihan: judgeResult.pilihan,
        hasRencana: !!judgeResult.rencanaFinal,
        error: judgeResult.error,
      });

      // Parse agent dari rencana final
      const agentNames = [
        "content-creator",
        "marketing",
        "idea-innovator",
        "social-media",
        "image-creator",
      ];

      const finalAgents: any[] = [];
      const rencanaFinalText = judgeResult.rencanaFinal || "";
      const lowerRencana = rencanaFinalText.toLowerCase();

      agentNames.forEach((a) => {
        if (lowerRencana.includes(a)) {
          finalAgents.push(a);
        }
      });

      // Kalau judge gagal / gak ada agent, fallback ke panel dengan agent terbanyak
      if (finalAgents.length === 0) {
        console.warn("[MULTI] Judge gak nemu agent, fallback ke panel A");
        const panelA = multiResult.panels.find((p) => p.id === "A");
        if (panelA && panelA.agents.length > 0) {
          finalAgents.push(...panelA.agents);
        } else {
          finalAgents.push("content-creator");
        }
      }

      console.log("[MULTI] finalAgents:", finalAgents);

      // Jalanin orchestrator single dengan agent hasil judge
      let hasil;
      try {
        hasil = await runOrchestrator(perintah, {
          mode: "normal",
          agentsFilter: finalAgents,
        });
      } catch (e: any) {
        console.error("[MULTI] runOrchestrator crashed:", e);
        return NextResponse.json(
          {
            error: "Orchestrator crash: " + (e?.message || "unknown"),
            stage: "runOrchestrator",
          },
          { status: 500 }
        );
      }

      if (!hasil.ok) {
        return NextResponse.json(
          { error: hasil.error || "Gagal jalankan agent" },
          { status: 500 }
        );
      }

      // Simpan log
      let savedLogId = logId;
      try {
        const logRencana = `## 🤖 Multi-Orchestrator Panels\n\n${multiResult.panels
          .map(
            (p) =>
              `### Panel ${p.id} — ${p.label} (${p.latencyMs}ms)\n${
                p.ok ? p.rencana : `❌ ERROR: ${p.error}`
              }`
          )
          .join("\n\n")}\n\n## ⚖️ Hasil Judge\n\nPilihan: **${
          judgeResult.pilihan
        }**\n\n${judgeResult.alasan}\n\n### Rencana Final:\n${
          judgeResult.rencanaFinal
        }\n\n## 📋 Rencana yang Dijalankan\n\n${hasil.rencana}`;

        if (logId) {
          await supabase
            .from("agent_logs")
            .update({
              hasil: hasil.hasil,
              rencana: logRencana,
              mode: "multi",
              feedback: feedback || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", logId)
            .eq("user_id", user.id);
        } else {
          const { data: logData } = await supabase
            .from("agent_logs")
            .insert({
              user_id: user.id,
              perintah,
              rencana: logRencana,
              hasil: hasil.hasil,
              mode: "multi",
            })
            .select("id")
            .single();

          if (logData) {
            savedLogId = logData.id;
          }
        }
      } catch (logErr: any) {
        console.error("Save log error:", logErr);
      }

      return NextResponse.json({
        ok: true,
        log_id: savedLogId,
        perintah: hasil.perintah,
        rencana: hasil.rencana,
        hasil: hasil.hasil,
        multi: true,
        panels: multiResult.panels,
        judge: judgeResult,
      });
    }

    // ============================================================
    // MODE SINGLE (existing)
    // ============================================================
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

    let savedLogId = logId;
    try {
      if (logId) {
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
    }

    return NextResponse.json({
      ok: true,
      log_id: savedLogId,
      perintah: hasil.perintah,
      rencana: hasil.rencana,
      hasil: hasil.hasil,
      multi: false,
    });
  } catch (err: any) {
    // Global catch — log detail biar kelihatan
    console.error("[RUN ROUTE] Global error:", err);
    console.error("[RUN ROUTE] Stack:", err?.stack);
    return NextResponse.json(
      {
        error: err.message || "Terjadi kesalahan",
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
