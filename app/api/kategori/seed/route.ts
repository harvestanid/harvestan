import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { seedKategoriDefaults } from "@/lib/supabase/queries/kategori-seed";

// Dipanggil setelah register agar akun baru langsung punya standar KPI default.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await seedKategoriDefaults(user.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Seed kategori error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
