import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let confirm = "";
    try {
      const body = await request.json();
      confirm = body.confirm || "";
    } catch (e) {
      return NextResponse.json(
        { error: "Format request tidak valid" },
        { status: 400 }
      );
    }

    if (confirm !== "HAPUS AKUN") {
      return NextResponse.json(
        { error: 'Konfirmasi tidak valid. Ketik "HAPUS AKUN"' },
        { status: 400 }
      );
    }

    // Hapus data user (pakai supabase client biasa)
    await supabase.from("harvests").delete().eq("user_id", user.id);
    await supabase.from("debts").delete().eq("user_id", user.id);
    await supabase.from("lands").delete().eq("user_id", user.id);
    await supabase.from("penggaraps").delete().eq("user_id", user.id);
    await supabase.from("categories").delete().eq("user_id", user.id);

    // ===== HAPUS USER AUTH PERMANEN (Pakai Admin Client) =====
    // Ini yang bikin username bisa dipakai lagi
    const admin = createAdminClient();
    const { error: errAuth } = await admin.auth.admin.deleteUser(user.id);

    if (errAuth) {
      console.error("Gagal hapus user auth:", errAuth);
      return NextResponse.json({ error: "Gagal menghapus akun permanen" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Akun dan data berhasil dihapus permanen.",
    });
  } catch (err: any) {
    console.error("Error delete akun:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
