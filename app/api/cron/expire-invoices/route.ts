import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "harvestan-cron-2026";

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      req.nextUrl.searchParams.get("secret") === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("invoices")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) {
      console.error("Cron expire error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const count = data?.length || 0;
    console.log(`✅ Cron: ${count} invoice di-expire`);

    return NextResponse.json({
      ok: true,
      expired_count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cron exception:", err);
    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
