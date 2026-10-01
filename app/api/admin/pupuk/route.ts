import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

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
        { error: "Hanya admin yang bisa akses" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action;

    const admin = createAdminClient();

    // ===== CREATE =====
    if (action === "create") {
      const { data, error } = await admin
        .from("fertilizers")
        .insert({
          nama: body.nama,
          merk: body.merk || null,
          jenis: body.jenis || "subsidi",
          n_persen: body.n_persen || 0,
          p_persen: body.p_persen || 0,
          k_persen: body.k_persen || 0,
          unsur_lain: body.unsur_lain || null,
          kemasan_kg: body.kemasan_kg || 50,
          is_active: body.is_active !== false,
          urutan: body.urutan || 0,
        })
        .select()
        .single();

      if (error) {
        console.error("create pupuk error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `Pupuk "${data.nama}" berhasil ditambahkan`,
        pupuk: data,
      });
    }

    // ===== UPDATE =====
    if (action === "update") {
      if (!body.id) {
        return NextResponse.json(
          { error: "ID pupuk wajib diisi" },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("fertilizers")
        .update({
          nama: body.nama,
          merk: body.merk || null,
          jenis: body.jenis || "subsidi",
          n_persen: body.n_persen || 0,
          p_persen: body.p_persen || 0,
          k_persen: body.k_persen || 0,
          unsur_lain: body.unsur_lain || null,
          kemasan_kg: body.kemasan_kg || 50,
          is_active: body.is_active !== false,
          urutan: body.urutan || 0,
        })
        .eq("id", body.id);

      if (error) {
        console.error("update pupuk error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: `Pupuk "${body.nama}" berhasil diupdate`,
      });
    }

    // ===== TOGGLE ACTIVE =====
    if (action === "toggle") {
      if (!body.id) {
        return NextResponse.json(
          { error: "ID pupuk wajib diisi" },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("fertilizers")
        .update({ is_active: !!body.is_active })
        .eq("id", body.id);

      if (error) {
        console.error("toggle pupuk error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: body.is_active ? "Pupuk diaktifkan" : "Pupuk dinonaktifkan",
      });
    }

    // ===== DELETE =====
    if (action === "delete") {
      if (!body.id) {
        return NextResponse.json(
          { error: "ID pupuk wajib diisi" },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("fertilizers")
        .delete()
        .eq("id", body.id);

      if (error) {
        console.error("delete pupuk error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Pupuk berhasil dihapus",
      });
    }

    return NextResponse.json(
      { error: "Action tidak valid: create/update/toggle/delete" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Pupuk admin exception:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
