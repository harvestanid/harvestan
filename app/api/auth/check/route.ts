import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      logged_in: !!user,
      email: user?.email || null,
    });
  } catch {
    return NextResponse.json({ logged_in: false });
  }
}
