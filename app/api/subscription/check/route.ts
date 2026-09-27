import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumStatus } from "@/lib/supabase/queries/subscription-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = await checkPremiumStatus(user.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err: any) {
    console.error("Check premium error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
