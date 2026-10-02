import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

let cachedRaw: string | null = null;
function loadDemoJSON(): DemoData {
  if (!cachedRaw) {
    const filePath = path.join(process.cwd(), "public", "demo-data.json");
    cachedRaw = fs.readFileSync(filePath, "utf8");
  }
  return JSON.parse(cachedRaw);
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

    // Admin client — bypass RLS untuk delete & insert massal
    const admin = createAdminClient();

    // Hapus SEMUA data demo lama (pakai admin client biar gak kena RLS)
    await Promise.all([
      admin.from("harvests").delete().eq("user_id", user.id).eq("is_demo", true),
      admin.from("debts").delete().eq("user_id", user.id).eq("is_demo", true),
      admin.from("musim_cabai").delete().eq("user_id", user.id).eq("is_demo", true),
      admin.from("lands").delete().eq("user_id", user.id).eq("is_demo", true),
      admin.from("penggaraps").delete().eq("user_id", user.id).eq("is_demo", true),
      admin.from("categories").delete().eq("user_id", user.id).eq("is_demo", true),
    ]);

    const demoData = loadDemoJSON();

    const mapPenggarap: Record<string, string> = {};
    const mapLahan: Record<string, string> = {};
    const mapDebt: Record<string, string> = {};

    // ===== PENGGARAP — bulk insert =====
    const penggarapBatch = demoData.penggarap.map((p) => {
      const newId = genUUID();
      mapPenggarap[p.id] = newId;
      return {
        id: newId,
        user_id: user.id,
        nama: p.nama,
        alamat: p.alamat,
        usia: p.usia,
        kontak: p.kontak,
        is_demo: true,
      };
    });

    if (penggarapBatch.length > 0) {
      const { error: errP } = await admin
        .from("penggaraps")
        .insert(penggarapBatch);
      if (errP) {
        console.error("Insert penggaraps error:", errP);
        throw new Error("Gagal insert penggarap: " + errP.message);
      }
    }

    // ===== LAHAN — bulk insert (dengan tipe_garap) =====
    const lahanBatch = demoData.lahan.map((l) => {
      const newId = genUUID();
      mapLahan[l.id] = newId;
      return {
        id: newId,
        user_id: user.id,
        penggarap_id: mapPenggarap[l.penggarap_id],
        nama: l.nama,
        luas: l.luas,
        lokasi_koordinat: l.lokasi_koordinat || null,
        polygon: l.polygon || null,
        tipe_garap: l.tipe_garap || "mandiri",
        nama_owner_external: l.nama_owner_external || null,
        persen_owner_default: l.persen_owner_default || 50,
        persen_penggarap_default: l.persen_penggarap_default || 50,
        is_demo: true,
      };
    });

    if (lahanBatch.length > 0) {
      const { error: errL } = await admin.from("lands").insert(lahanBatch);
      if (errL) {
        console.error("Insert lands error:", errL);
        throw new Error("Gagal insert lahan: " + errL.message);
      }
    }

    // ===== CATEGORIES — bulk insert =====
    if (demoData.categories && demoData.categories.length > 0) {
      const catBatch = demoData.categories.map((c) => ({
        user_id: user.id,
        komoditas: c.komoditas,
        cukup: c.cukup,
        baik: c.baik,
        sangat_baik: c.sangat_baik,
        is_demo: true,
      }));

      const { error: errC } = await admin
        .from("categories")
        .insert(catBatch);
      if (errC) {
        console.error("Insert categories error:", errC);
      }
    }

    // ===== DEBTS — bulk insert =====
    const debtBatch = demoData.debts.map((d) => {
      const newDebtId = genUUID();
      mapDebt[d.id] = newDebtId;
      return {
        id: newDebtId,
        user_id: user.id,
        penggarap_id: mapPenggarap[d.penggarap_id],
        tanggal: d.tanggal,
        jumlah: d.jumlah,
        dibayar: d.dibayar || 0,
        sisa: d.sisa !== undefined ? d.sisa : d.jumlah,
        keperluan: d.keperluan,
        log_perubahan: d.log_perubahan || [],
        is_demo: true,
      };
    });

    if (debtBatch.length > 0) {
      const { error: errD } = await admin.from("debts").insert(debtBatch);
      if (errD) {
        console.error("Insert debts error:", errD);
        throw new Error("Gagal insert hutang: " + errD.message);
      }
    }

    // ===== HARVESTS — bulk insert dengan chunk paralel =====
    const harvestsBatch = demoData.harvests.map((h) => {
      const pendapatan = Number(h.hasil_kg) * Number(h.harga_gabah);
      const biaya = Number(h.hasil_kg) * Number(h.biaya_panen_per_kg);
      const profit = pendapatan - biaya;

      const persenOwner = Number(h.persen_owner || 50) / 100;
      const persenPenggarap = Number(h.persen_penggarap || 50) / 100;

      const profitOwner = Number(h.profit_owner || profit * persenOwner);
      const profitPenggarap = Number(
        h.profit_penggarap || profit * persenPenggarap
      );

      const potonganLog = Array.isArray(h.potongan_hutang_log)
        ? h.potongan_hutang_log.map((log: any) => ({
            ...log,
            debt_id: mapDebt[log.debt_id] || log.debt_id,
            waktu_potong: new Date().toISOString(),
          }))
        : [];

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
        potongan_hutang_log: potonganLog,
        total_hutang_sebelum: h.total_hutang_sebelum || 0,
        sisa_hutang_sesudah: h.sisa_hutang_sesudah || 0,
        catatan: null,
        is_demo: true,
      };
    });

    const CHUNK = 100;
    const chunks: any[][] = [];
    for (let i = 0; i < harvestsBatch.length; i += CHUNK) {
      chunks.push(harvestsBatch.slice(i, i + CHUNK));
    }

    if (chunks.length > 0) {
      const results = await Promise.all(
        chunks.map((chunk) => admin.from("harvests").insert(chunk))
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) {
        console.error("Insert harvests error:", failed.error);
        throw new Error("Gagal insert panen: " + failed.error.message);
      }
    }

    // ===== MUSIM CABAI — bulk insert =====
    if (demoData.musim_cabai && demoData.musim_cabai.length > 0) {
      const musimBatch = demoData.musim_cabai.map((m) => ({
        user_id: user.id,
        nama: m.nama,
        tanggal_mulai: m.tanggal_mulai,
        tanggal_selesai: m.tanggal_selesai,
        catatan: null,
        is_demo: true,
      }));

      const { error: errM } = await admin
        .from("musim_cabai")
        .insert(musimBatch);
      if (errM) {
        console.error("Insert musim_cabai error:", errM);
      }
    }

    // Upsert session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    if (existingSession) {
      await admin
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
      await admin.from("demo_sessions").insert({
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
