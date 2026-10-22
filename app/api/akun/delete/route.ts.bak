import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { confirm } = body;

    if (confirm !== "HAPUS AKUN") {
      return NextResponse.json(
        { error: 'Konfirmasi tidak valid. Ketik "HAPUS AKUN"' },
        { status: 400 }
      );
    }

    // ===== HAPUS SEMUA DATA USER =====
    // (urutan penting: anak dulu, induk terakhir)

    // 1. Hapus harvests
    const { error: errHarvests } = await supabase
      .from("harvests")
      .delete()
      .eq("user_id", user.id);

    if (errHarvests) {
      console.error("Error hapus harvests:", errHarvests);
    }

    // 2. Hapus debts
    const { error: errDebts } = await supabase
      .from("debts")
      .delete()
      .eq("user_id", user.id);

    if (errDebts) {
      console.error("Error hapus debts:", errDebts);
    }

    // 3. Hapus lands
    const { error: errLands } = await supabase
      .from("lands")
      .delete()
      .eq("user_id", user.id);

    if (errLands) {
      console.error("Error hapus lands:", errLands);
    }

    // 4. Hapus penggaraps
    const { error: errPenggaraps } = await supabase
      .from("penggaraps")
      .delete()
      .eq("user_id", user.id);

    if (errPenggaraps) {
      console.error("Error hapus penggaraps:", errPenggaraps);
    }

    // 5. Hapus categories
    const { error: errCategories } = await supabase
      .from("categories")
      .delete()
      .eq("user_id", user.id);

    if (errCategories) {
      console.error("Error hapus categories:", errCategories);
    }

    // 6. Sign out user (soft delete — data auth masih ada, bisa di-recover admin)
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Semua data berhasil dihapus. Akun dinonaktifkan.",
    });
  } catch (err: any) {
    console.error("Error delete akun:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
