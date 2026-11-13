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

    // PAKAI ADMIN CLIENT (Bypass RLS)
    const admin = createAdminClient();

    // Hapus data satu per satu (kalau gagal, tetap lanjut ke tabel berikutnya)
    await admin.from("harvests").delete().eq("user_id", user.id);
    await admin.from("debts").delete().eq("user_id", user.id);
    await admin.from("lands").delete().eq("user_id", user.id);
    await admin.from("penggaraps").delete().eq("user_id", user.id);
    await admin.from("categories").delete().eq("user_id", user.id);
    await admin.from("musim_cabai").delete().eq("user_id", user.id);
    await admin.from("activity_logs").delete().eq("user_id", user.id);
    await admin.from("activity_jenis_custom").delete().eq("user_id", user.id);
    await admin.from("kalender_tanam").delete().eq("user_id", user.id);

    // Hapus akun auth permanen
    const { error: errAuth } = await admin.auth.admin.deleteUser(user.id);

    if (errAuth) {
      console.error("Gagal hapus user auth:", errAuth);
      return NextResponse.json(
        { error: "Gagal menghapus akun permanen: " + errAuth.message },
        { status: 500 }
      );
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
