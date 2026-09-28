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
    await supabase.from("harvests").delete().eq("user_id", user.id).eq("is_demo", true);
    await supabase.from("debts").delete().eq("user_id", user.id).eq("is_demo", true);
    await supabase.from("musim_cabai").delete().eq("user_id", user.id).eq("is_demo", true);
    await supabase.from("lands").delete().eq("user_id", user.id).eq("is_demo", true);
    await supabase.from("penggaraps").delete().eq("user_id", user.id).eq("is_demo", true);
    await supabase.from("categories").delete().eq("user_id", user.id).eq("is_demo", true);

    // Load data demo
    const filePath = path.join(process.cwd(), "public", "demo-data.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const demoData: DemoData = JSON.parse(raw);

    const mapPenggarap: Record<string, string> = {};
    const mapLahan: Record<string, string> = {};
    const mapDebt: Record<string, string> = {};

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

    // Insert Lahan — polygon dari JSON
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
        polygon: l.polygon || null,
        is_demo: true,
      });
    }

    // Insert Categories (threshold produktivitas demo)
    for (const c of demoData.categories || []) {
      await supabase.from("categories").insert({
        user_id: user.id,
        komoditas: c.komoditas,
        cukup: c.cukup,
        baik: c.baik,
        sangat_baik: c.sangat_baik,
        is_demo: true,
      });
    }

    // Insert Harvests — baca potongan_hutang + log dari JSON
    const harvestsBatch = demoData.harvests.map((h) => {
      const pendapatan = Number(h.hasil_kg) * Number(h.harga_gabah);
      const biaya = Number(h.hasil_kg) * Number(h.biaya_panen_per_kg);
      const profit = pendapatan - biaya;

      const persenOwner = Number(h.persen_owner || 50) / 100;
      const persenPenggarap = Number(h.persen_penggarap || 50) / 100;

      const profitOwner = Number(h.profit_owner || profit * persenOwner);
      const profitPenggarap = Number(h.profit_penggarap || profit * persenPenggarap);

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
        biaya_tambahan: h.biaya_tambahan || 0,
        keterangan_biaya: h.keterangan_biaya || null,
        bawa_penggarap: h.bawa_penggarap || 0,
        bawa_owner: h.bawa_owner || 0,
        bawa_lain: h.bawa_lain || 0,
        persen_owner: h.persen_owner || 50,
        persen_penggarap: h.persen_penggarap || 50,
        profit_bersih: profit,
        profit_owner: profitOwner,
        profit_penggarap: profitPenggarap,
        potongan_hutang: h.potongan_hutang || 0,
        potongan_hutang_log: h.potongan_hutang_log || [],
        total_hutang_sebelum: h.total_hutang_sebelum || 0,
        sisa_hutang_sesudah: h.sisa_hutang_sesudah || 0,
        catatan: null,
        is_demo: true,
      };
    });

    for (let i = 0; i < harvestsBatch.length; i += 50) {
      const chunk = harvestsBatch.slice(i, i + 50);
      await supabase.from("harvests").insert(chunk);
    }

    // Insert Debts — dengan dibayar & sisa dari JSON
    for (const d of demoData.debts) {
      const newDebtId = genUUID();
      mapDebt[d.id] = newDebtId;
      const newPenggarapId = mapPenggarap[d.penggarap_id];

      await supabase.from("debts").insert({
        id: newDebtId,
        user_id: user.id,
        penggarap_id: newPenggarapId,
        tanggal: d.tanggal,
        jumlah: d.jumlah,
        dibayar: d.dibayar || 0,
        sisa: d.sisa !== undefined ? d.sisa : d.jumlah,
        keperluan: d.keperluan,
        log_perubahan: d.log_perubahan || [],
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

    const panenDipotong = demoData.harvests.filter(
      (h: any) => (h.potongan_hutang || 0) > 0
    ).length;

    return NextResponse.json({
      success: true,
      message: "Demo berhasil dimulai",
      stats: {
        penggarap: demoData.penggarap.length,
        lahan: demoData.lahan.length,
        harvests: demoData.harvests.length,
        debts: demoData.debts.length,
        categories: (demoData.categories || []).length,
        panen_dipotong: panenDipotong,
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
