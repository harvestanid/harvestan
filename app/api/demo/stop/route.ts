import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete semua data demo
    await supabase
      .from("harvests")
      .delete()
      .eq("user_id", user.id)
      .eq("is_demo", true);

    await supabase
      .from("debts")
      .delete()
      .eq("user_id", user.id)
      .eq("is_demo", true);

    await supabase
      .from("musim_cabai")
      .delete()
      .eq("user_id", user.id)
      .eq("is_demo", true);

    await supabase
      .from("lands")
      .delete()
      .eq("user_id", user.id)
      .eq("is_demo", true);

    await supabase
      .from("penggaraps")
      .delete()
      .eq("user_id", user.id)
      .eq("is_demo", true);

    // Update session jadi inactive
    await supabase
      .from("demo_sessions")
      .update({ is_active: false })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Demo selesai. Data demo sudah dihapus.",
    });
  } catch (err: any) {
    console.error("Demo stop error:", err);
    return NextResponse.json(
      { error: "Gagal menghentikan demo: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
