import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

type DemoData = {
  info: any;
  penggarap: any[];
  lahan: any[];
  harvests: any[];
  debts: any[];
  musim_cabai: any[];
  categories: any[];
};

function genUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek session
    const { data: existingSession } = await supabase
      .from("demo_sessions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingSession?.is_active) {
      const now = Date.now();
      const expiresAt = new Date(existingSession.expires_at).getTime();
      if (expiresAt > now) {
        return NextResponse.json(
          { error: "Demo sudah aktif. Selesaikan atau restart dulu." },
          { status: 400 }
        );
      }
    }

    // Hapus data demo lama
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

    // Load data demo
    const filePath = path.join(process.cwd(), "public", "demo-data.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const demoData: DemoData = JSON.parse(raw);

    const mapPenggarap: Record<string, string> = {};
    const mapLahan: Record<string, string> = {};

    // Insert Penggarap
    for (const p of demoData.penggarap) {
      const newId = genUUID();
      mapPenggarap[p.id] = newId;

      await supabase.from("penggaraps").insert({
        id: newId,
        user_id: user.id,
        nama: p.nama,
        alamat: p.alamat,
        usia: p.usia,
        kontak: p.kontak,
        is_demo: true,
      });
    }

    // Insert Lahan
    for (const l of demoData.lahan) {
      const newId = genUUID();
      mapLahan[l.id] = newId;
      const newPenggarapId = mapPenggarap[l.penggarap_id];

      await supabase.from("lands").insert({
        id: newId,
        user_id: user.id,
        penggarap_id: newPenggarapId,
        nama: l.nama,
        luas: l.luas,
        lokasi_koordinat: l.lokasi_koordinat || null,
        polygon: null,
        is_demo: true,
      });
    }

    // Insert Harvests dengan profit dihitung
    const harvestsBatch = demoData.harvests.map((h) => {
      const pendapatan = Number(h.hasil_kg) * Number(h.harga_gabah);
      const biaya = Number(h.hasil_kg) * Number(h.biaya_panen_per_kg);
      const profit = pendapatan - biaya;

      const persenOwner = Number(h.persen_owner || 50) / 100;
      const persenPenggarap = Number(h.persen_penggarap || 50) / 100;

      let profitOwner = profit * persenOwner;
      let profitPenggarap = profit * persenPenggarap;

      const nilaiBawa = Number(h.bawa_penggarap || 0) * Number(h.harga_gabah);
      profitOwner += nilaiBawa;
      profitPenggarap -= nilaiBawa;

      return {
        id: genUUID(),
        user_id: user.id,
        land_id: mapLahan[h.land_id],
        tanggal: h.tanggal,
        komoditas: h.komoditas,
        musim: h.musim || null,
        hasil_kg: h.hasil_kg,
        harga_gabah: h.harga_gabah,
        harga_per_kg: h.harga_gabah,
        biaya_panen_per_kg: h.biaya_panen_per_kg,
        biaya_tambahan: 0,
        keterangan_biaya: null,
        bawa_penggarap: h.bawa_penggarap || 0,
        bawa_owner: 0,
        bawa_lain: 0,
        persen_owner: h.persen_owner || 50,
        persen_penggarap: h.persen_penggarap || 50,
        profit_bersih: profit,
        profit_owner: profitOwner,
        profit_penggarap: profitPenggarap,
        potongan_hutang: 0,
        total_hutang_sebelum: 0,
        sisa_hutang_sesudah: 0,
        catatan: null,
        is_demo: true,
      };
    });

    // Insert in chunks
    for (let i = 0; i < harvestsBatch.length; i += 50) {
      const chunk = harvestsBatch.slice(i, i + 50);
      await supabase.from("harvests").insert(chunk);
    }

    // Insert Debts
    for (const d of demoData.debts) {
      const newPenggarapId = mapPenggarap[d.penggarap_id];
      await supabase.from("debts").insert({
        id: genUUID(),
        user_id: user.id,
        penggarap_id: newPenggarapId,
        tanggal: d.tanggal,
        jumlah: d.jumlah,
        dibayar: d.dibayar,
        sisa: d.sisa,
        keperluan: d.keperluan,
        log_perubahan: [],
        is_demo: true,
      });
    }

    // Insert Musim Cabai
    for (const m of demoData.musim_cabai) {
      await supabase.from("musim_cabai").insert({
        user_id: user.id,
        nama: m.nama,
        tanggal_mulai: m.tanggal_mulai,
        tanggal_selesai: m.tanggal_selesai,
        catatan: null,
        is_demo: true,
      });
    }

    // Upsert session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    if (existingSession) {
      await supabase
        .from("demo_sessions")
        .update({
          is_active: true,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          last_restart_at: new Date().toISOString(),
          total_restarts: (existingSession.total_restarts || 0) + 1,
        })
        .eq("user_id", user.id);
    } else {
      await supabase.from("demo_sessions").insert({
        user_id: user.id,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        last_restart_at: new Date().toISOString(),
        total_restarts: 1,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Demo berhasil dimulai",
      stats: {
        penggarap: demoData.penggarap.length,
        lahan: demoData.lahan.length,
        harvests: demoData.harvests.length,
        debts: demoData.debts.length,
      },
    });
  } catch (err: any) {
    console.error("Demo start error:", err);
    return NextResponse.json(
      { error: "Gagal memulai demo: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
