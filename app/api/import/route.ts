import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

// Generate UUID v4
function genUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeJSON(str: any): any {
  if (!str) return null;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil file + mode dari form-data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mode = (formData.get("mode") as string) || "merge"; // "merge" | "replace"

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Baca file Excel
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const wb = XLSX.read(data, { type: "array" });

    // Cek apakah file ini backup (ada sheet Info dengan tipe_file=BACKUP)
    const wsInfo = wb.Sheets["Info"];
    if (!wsInfo) {
      return NextResponse.json(
        {
          error:
            "File tidak valid. Harus dari 'Export Backup', bukan 'Export Laporan'.",
        },
        { status: 400 }
      );
    }
    const infoRows: any[] = XLSX.utils.sheet_to_json(wsInfo, {
      header: 1,
      defval: "",
    });
    let tipeFile = "";
    infoRows.forEach((r) => {
      if (r[0] === "tipe_file") tipeFile = r[1];
    });
    if (tipeFile !== "BACKUP") {
      return NextResponse.json(
        {
          error:
            "File ini bukan file backup. Gunakan file dari tombol 'Export Backup'.",
        },
        { status: 400 }
      );
    }

    // ===== PARSE SEMUA SHEET =====
    const wsP = wb.Sheets["Penggarap"];
    const wsL = wb.Sheets["Lahan"];
    const wsPn = wb.Sheets["Panen"];
    const wsH = wb.Sheets["Hutang"];
    const wsK = wb.Sheets["Kategori"];
    const wsM = wb.Sheets["MusimCabai"];

    const rawPenggarap: any[] = wsP
      ? XLSX.utils.sheet_to_json(wsP, { defval: "" })
      : [];
    const rawLahan: any[] = wsL
      ? XLSX.utils.sheet_to_json(wsL, { defval: "" })
      : [];
    const rawPanen: any[] = wsPn
      ? XLSX.utils.sheet_to_json(wsPn, { defval: "" })
      : [];
    const rawHutang: any[] = wsH
      ? XLSX.utils.sheet_to_json(wsH, { defval: "" })
      : [];
    const rawKategori: any[] = wsK
      ? XLSX.utils.sheet_to_json(wsK, { defval: "" })
      : [];
    const rawMusim: any[] = wsM
      ? XLSX.utils.sheet_to_json(wsM, { defval: "" })
      : [];

    // ===== MODE REPLACE: HAPUS DULU =====
    if (mode === "replace") {
      // Hapus berurutan: harvests → debts → musim_cabai → categories → lands → penggaraps
      await supabase.from("harvests").delete().eq("user_id", user.id);
      await supabase.from("debts").delete().eq("user_id", user.id);
      await supabase.from("musim_cabai").delete().eq("user_id", user.id);
      await supabase.from("categories").delete().eq("user_id", user.id);
      await supabase.from("lands").delete().eq("user_id", user.id);
      await supabase.from("penggaraps").delete().eq("user_id", user.id);
    }

    // ===== AUTO-REMAP UUID =====
    const mapPenggarap: Record<string, string> = {};
    const mapLahan: Record<string, string> = {};

    // ==== 1. INSERT PENGGARAP ====
    let suksesPenggarap = 0;
    for (const p of rawPenggarap) {
      const oldId = String(p.id || "").trim();
      if (!oldId || !p.nama) continue;
      const newId = genUUID();
      mapPenggarap[oldId] = newId;

      const { error } = await supabase.from("penggaraps").insert({
        id: newId,
        user_id: user.id,
        nama: String(p.nama || "").trim(),
        alamat: p.alamat || null,
        usia: p.usia ? Number(p.usia) : null,
        kontak: p.kontak || null,
      });
      if (!error) suksesPenggarap++;
    }

    // ==== 2. INSERT LAHAN ====
    let suksesLahan = 0;
    for (const l of rawLahan) {
      const oldId = String(l.id || "").trim();
      const oldPenggarapId = String(l.penggarap_id || "").trim();
      const newPenggarapId = mapPenggarap[oldPenggarapId];
      if (!oldId || !newPenggarapId || !l.nama) continue;

      const newId = genUUID();
      mapLahan[oldId] = newId;

      const { error } = await supabase.from("lands").insert({
        id: newId,
        user_id: user.id,
        penggarap_id: newPenggarapId,
        nama: String(l.nama || "").trim(),
        luas: Number(l.luas) || 0,
        lokasi_koordinat: l.lokasi_koordinat || null,
        polygon: l.polygon_json ? safeJSON(l.polygon_json) : null,
      });
      if (!error) suksesLahan++;
    }

    // ==== 3. INSERT PANEN ====
    let suksesPanen = 0;
    for (const h of rawPanen) {
      const oldId = String(h.id || "").trim();
      const oldLandId = String(h.land_id || "").trim();
      const newLandId = mapLahan[oldLandId];
      if (!oldId || !newLandId || !h.tanggal) continue;

      const newId = genUUID();

      const { error } = await supabase.from("harvests").insert({
        id: newId,
        user_id: user.id,
        land_id: newLandId,
        tanggal: h.tanggal,
        komoditas: h.komoditas || "padi",
        musim: h.musim || null,
        hasil_kg: Number(h.hasil_kg) || 0,
        harga_gabah: Number(h.harga_gabah) || 0,
        harga_per_kg: Number(h.harga_per_kg) || 0,
        biaya_panen_per_kg: Number(h.biaya_panen_per_kg) || 0,
        biaya_tambahan: Number(h.biaya_tambahan) || 0,
        keterangan_biaya: h.keterangan_biaya || null,
        bawa_penggarap: Number(h.bawa_penggarap) || 0,
        bawa_owner: Number(h.bawa_owner) || 0,
        bawa_lain: Number(h.bawa_lain) || 0,
        persen_owner: Number(h.persen_owner) || 50,
        persen_penggarap: Number(h.persen_penggarap) || 50,
        profit_bersih: Number(h.profit_bersih) || 0,
        profit_owner: Number(h.profit_owner) || 0,
        profit_penggarap: Number(h.profit_penggarap) || 0,
        potongan_hutang: Number(h.potongan_hutang) || 0,
        total_hutang_sebelum: Number(h.total_hutang_sebelum) || 0,
        sisa_hutang_sesudah: Number(h.sisa_hutang_sesudah) || 0,
        catatan: h.catatan || null,
        potongan_hutang_log: h.potongan_hutang_log_json
          ? safeJSON(h.potongan_hutang_log_json)
          : [],
      });
      if (!error) suksesPanen++;
    }

    // ==== 4. INSERT HUTANG ====
    let suksesHutang = 0;
    for (const d of rawHutang) {
      const oldId = String(d.id || "").trim();
      const oldPenggarapId = String(d.penggarap_id || "").trim();
      const newPenggarapId = mapPenggarap[oldPenggarapId];
      if (!oldId || !newPenggarapId || !d.tanggal) continue;

      const newId = genUUID();

      const { error } = await supabase.from("debts").insert({
        id: newId,
        user_id: user.id,
        penggarap_id: newPenggarapId,
        tanggal: d.tanggal,
        jumlah: Number(d.jumlah) || 0,
        keperluan: d.keperluan || null,
        dibayar: Number(d.dibayar) || 0,
        sisa: Number(d.sisa) || 0,
        log_perubahan: d.log_perubahan_json
          ? safeJSON(d.log_perubahan_json)
          : [],
      });
      if (!error) suksesHutang++;
    }

    // ==== 5. INSERT KATEGORI ====
    let suksesKategori = 0;
    for (const k of rawKategori) {
      if (!k.komoditas) continue;
      const { error } = await supabase.from("categories").insert({
        user_id: user.id,
        komoditas: k.komoditas,
        cukup: k.cukup !== "" ? Number(k.cukup) : null,
        baik: k.baik !== "" ? Number(k.baik) : null,
        sangat_baik: k.sangat_baik !== "" ? Number(k.sangat_baik) : null,
      });
      if (!error) suksesKategori++;
    }

    // ==== 6. INSERT MUSIM CABAI ====
    let suksesMusim = 0;
    for (const m of rawMusim) {
      if (!m.nama) continue;
      const { error } = await supabase.from("musim_cabai").insert({
        user_id: user.id,
        nama: m.nama,
        tanggal_mulai: m.tanggal_mulai || null,
        tanggal_selesai: m.tanggal_selesai || null,
        catatan: m.catatan || null,
      });
      if (!error) suksesMusim++;
    }

    return NextResponse.json({
      success: true,
      mode,
      summary: {
        penggarap: suksesPenggarap,
        lahan: suksesLahan,
        panen: suksesPanen,
        hutang: suksesHutang,
        kategori: suksesKategori,
        musim: suksesMusim,
      },
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat import: " + (err.message || "Unknown") },
      { status: 500 }
    );
  }
}
