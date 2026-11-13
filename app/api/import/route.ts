import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

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
  try { return JSON.parse(str); } catch (e) { return null; }
}

function parseBool(v: any): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") {
    const s = v.trim().toUpperCase();
    return s === "TRUE" || s === "1" || s === "YA" || s === "YES";
  }
  if (typeof v === "number") return v !== 0;
  return false;
}

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // PAKAI ADMIN CLIENT (Bypass RLS)
    const supabase = createAdminClient();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mode = (formData.get("mode") as string) || "merge";

    if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const wb = XLSX.read(data, { type: "array" });

    const wsInfo = wb.Sheets["Info"];
    if (!wsInfo) {
      return NextResponse.json({ error: "File tidak valid. Harus dari 'Export Backup', bukan 'Export Laporan'." }, { status: 400 });
    }

    const infoRows: any[] = XLSX.utils.sheet_to_json(wsInfo, { header: 1, defval: "" });
    let tipeFile = "";
    let versiFile = "";
    infoRows.forEach((r) => {
      if (r[0] === "tipe_file") tipeFile = String(r[1]);
      if (r[0] === "versi") versiFile = String(r[1]);
    });

    if (tipeFile !== "BACKUP") {
      return NextResponse.json({ error: "File ini bukan backup. Gunakan tombol 'Export Backup', bukan 'Export Laporan'." }, { status: 400 });
    }

    // ===== MODE REPLACE =====
    if (mode === "replace") {
      await supabase.from("harvests").delete().eq("user_id", user.id);
      await supabase.from("debts").delete().eq("user_id", user.id);
      await supabase.from("lands").delete().eq("user_id", user.id);
      await supabase.from("penggaraps").delete().eq("user_id", user.id);
      await supabase.from("categories").delete().eq("user_id", user.id);
      await supabase.from("musim_cabai").delete().eq("user_id", user.id);
      await supabase.from("activity_logs").delete().eq("user_id", user.id);
      await supabase.from("activity_jenis_custom").delete().eq("user_id", user.id);
      await supabase.from("kalender_tanam").delete().eq("user_id", user.id);
    }

    // ===== PENGGARAP =====
    const wsPenggarap = wb.Sheets["Penggarap"];
    const penggarapRows: any[] = wsPenggarap ? XLSX.utils.sheet_to_json(wsPenggarap, { defval: "" }) : [];
    const idMapPenggarap: Record<string, string> = {};
    
    for (const row of penggarapRows) {
      if (!row.id || !row.nama) continue;
      
      // SELALU BUAT UUID BARU (Abaikan ID dari Excel)
      const newId = genUUID();
      idMapPenggarap[String(row.id)] = newId;
      const isSelf = parseBool(row.is_self);
      
      const { error } = await supabase.from("penggaraps").insert({
        id: newId, user_id: user.id, nama: String(row.nama),
        alamat: row.alamat ? String(row.alamat) : null,
        usia: row.usia ? parseInt(String(row.usia)) || null : null,
        kontak: row.kontak ? String(row.kontak) : null,
        is_self: isSelf, is_demo: false,
      });
      
      if (error) {
        console.error("Import penggarap error:", error);
        return NextResponse.json({ error: `Gagal import penggarap: ${error.message}` }, { status: 500 });
      }
    }

    // ===== LAHAN =====
    const wsLahan = wb.Sheets["Lahan"];
    const lahanRows: any[] = wsLahan ? XLSX.utils.sheet_to_json(wsLahan, { defval: "" }) : [];
    const idMapLahan: Record<string, string> = {};
    
    for (const row of lahanRows) {
      if (!row.id || !row.penggarap_id) continue;
      const oldPenggarapId = String(row.penggarap_id);
      const newPenggarapId = idMapPenggarap[oldPenggarapId];
      if (!newPenggarapId) continue;
      
      const newId = genUUID();
      idMapLahan[String(row.id)] = newId;

      let tipeGarap = row.tipe_garap ? String(row.tipe_garap) : "";
      if (tipeGarap !== "mandiri" && tipeGarap !== "bagi_hasil_owner" && tipeGarap !== "bagi_hasil_penggarap") tipeGarap = "bagi_hasil_owner";
      const namaOwnerExternal = row.nama_owner_external ? String(row.nama_owner_external) : null;
      
      let persenOwnerDefault = row.persen_owner_default ? Number(row.persen_owner_default) : (tipeGarap === "mandiri" ? 0 : 50);
      let persenPenggarapDefault = row.persen_penggarap_default ? Number(row.persen_penggarap_default) : (tipeGarap === "mandiri" ? 100 : 50);
      if (isNaN(persenOwnerDefault) || persenOwnerDefault < 0 || persenOwnerDefault > 100) persenOwnerDefault = tipeGarap === "mandiri" ? 0 : 50;
      if (isNaN(persenPenggarapDefault) || persenPenggarapDefault < 0 || persenPenggarapDefault > 100) persenPenggarapDefault = tipeGarap === "mandiri" ? 100 : 50;

      const { error } = await supabase.from("lands").insert({
        id: newId, user_id: user.id, penggarap_id: newPenggarapId,
        nama: String(row.nama), luas: Number(row.luas) || 0,
        lokasi_koordinat: row.lokasi_koordinat ? String(row.lokasi_koordinat) : null,
        polygon: safeJSON(row.polygon_json), tipe_garap: tipeGarap,
        nama_owner_external: namaOwnerExternal,
        persen_owner_default: persenOwnerDefault,
        persen_penggarap_default: persenPenggarapDefault, is_demo: false,
      });
      
      if (error) {
        console.error("Import lahan error:", error);
        return NextResponse.json({ error: `Gagal import lahan: ${error.message}` }, { status: 500 });
      }
    }

    // ===== PANEN =====
    const wsPanen = wb.Sheets["Panen"];
    const panenRows: any[] = wsPanen ? XLSX.utils.sheet_to_json(wsPanen, { defval: "" }) : [];
    
    for (const row of panenRows) {
      if (!row.id || !row.land_id) continue;
      const oldLandId = String(row.land_id);
      const newLandId = idMapLahan[oldLandId];
      if (!newLandId) continue;
      
      const newId = genUUID();
      
      const { error } = await supabase.from("harvests").insert({
        id: newId, user_id: user.id, land_id: newLandId,
        tanggal: String(row.tanggal), komoditas: row.komoditas ? String(row.komoditas) : "padi",
        musim: row.musim ? String(row.musim) : null,
        hasil_kg: Number(row.hasil_kg) || 0, harga_gabah: Number(row.harga_gabah) || 0,
        harga_per_kg: Number(row.harga_per_kg) || 0, biaya_panen_per_kg: Number(row.biaya_panen_per_kg) || 0,
        biaya_tambahan: Number(row.biaya_tambahan) || 0,
        keterangan_biaya: row.keterangan_biaya ? String(row.keterangan_biaya) : null,
        bawa_penggarap: Number(row.bawa_penggarap) || 0,
        bawa_owner: Number(row.bawa_owner) || 0, bawa_lain: Number(row.bawa_lain) || 0,
        persen_owner: Number(row.persen_owner) || 0, persen_penggarap: Number(row.persen_penggarap) || 100,
        profit_bersih: Number(row.profit_bersih) || 0, profit_owner: Number(row.profit_owner) || 0,
        profit_penggarap: Number(row.profit_penggarap) || 0,
        potongan_hutang: Number(row.potongan_hutang) || 0,
        total_hutang_sebelum: Number(row.total_hutang_sebelum) || 0,
        sisa_hutang_sesudah: Number(row.sisa_hutang_sesudah) || 0,
        catatan: row.catatan ? String(row.catatan) : null,
        potongan_hutang_log: safeJSON(row.potongan_hutang_log_json), is_demo: false,
      });
      
      if (error) {
        console.error("Import panen error:", error);
        return NextResponse.json({ error: `Gagal import panen: ${error.message}` }, { status: 500 });
      }
    }

    // ===== HUTANG =====
    const wsHutang = wb.Sheets["Hutang"];
    const hutangRows: any[] = wsHutang ? XLSX.utils.sheet_to_json(wsHutang, { defval: "" }) : [];
    
    for (const row of hutangRows) {
      if (!row.id || !row.penggarap_id) continue;
      const oldPenggarapId = String(row.penggarap_id);
      const newPenggarapId = idMapPenggarap[oldPenggarapId];
      if (!newPenggarapId) continue;
      
      const newId = genUUID();
      
      const { error } = await supabase.from("debts").insert({
        id: newId, user_id: user.id, penggarap_id: newPenggarapId,
        tanggal: String(row.tanggal), jumlah: Number(row.jumlah) || 0,
        keperluan: row.keperluan ? String(row.keperluan) : null,
        dibayar: Number(row.dibayar) || 0, sisa: Number(row.sisa) || 0,
        log_perubahan: safeJSON(row.log_perubahan_json), is_demo: false,
      });
      
      if (error) {
        console.error("Import hutang error:", error);
        return NextResponse.json({ error: `Gagal import hutang: ${error.message}` }, { status: 500 });
      }
    }

    // ===== KATEGORI =====
    const wsKategori = wb.Sheets["Kategori"];
    const kategoriRows: any[] = wsKategori ? XLSX.utils.sheet_to_json(wsKategori, { defval: "" }) : [];
    
    for (const row of kategoriRows) {
      if (!row.komoditas) continue;
      
      const { error } = await supabase.from("categories").insert({
        user_id: user.id, komoditas: String(row.komoditas),
        cukup: row.cukup !== "" ? Number(row.cukup) : null,
        baik: row.baik !== "" ? Number(row.baik) : null,
        sangat_baik: row.sangat_baik !== "" ? Number(row.sangat_baik) : null,
        is_demo: false,
      });
      
      if (error) {
        console.error("Import kategori error:", error);
        return NextResponse.json({ error: `Gagal import kategori: ${error.message}` }, { status: 500 });
      }
    }

    // ===== MUSIM CABAI =====
    const wsMusim = wb.Sheets["MusimCabai"];
    const musimRows: any[] = wsMusim ? XLSX.utils.sheet_to_json(wsMusim, { defval: "" }) : [];
    
    for (const row of musimRows) {
      if (!row.nama) continue;
      
      const newId = genUUID();
      
      const { error } = await supabase.from("musim_cabai").insert({
        id: newId, user_id: user.id, nama: String(row.nama),
        tanggal_mulai: row.tanggal_mulai ? String(row.tanggal_mulai) : null,
        tanggal_selesai: row.tanggal_selesai ? String(row.tanggal_selesai) : null,
        catatan: row.catatan ? String(row.catatan) : null, is_demo: false,
      });
      
      if (error) {
        console.error("Import musim error:", error);
        return NextResponse.json({ error: `Gagal import musim: ${error.message}` }, { status: 500 });
      }
    }

    // ===== LOG TANAM CUSTOM JENIS =====
    const wsJenis = wb.Sheets["LogTanamJenis"];
    const jenisRows: any[] = wsJenis ? XLSX.utils.sheet_to_json(wsJenis, { defval: "" }) : [];
    const idMapJenis: Record<string, string> = {};
    
    for (const row of jenisRows) {
      if (!row.id || !row.nama) continue;
      
      const newId = genUUID();
      idMapJenis[String(row.id)] = newId;
      
      const { error } = await supabase.from("activity_jenis_custom").insert({
        id: newId, user_id: user.id, nama: String(row.nama),
        emoji: row.emoji ? String(row.emoji) : "📝",
      });
      
      if (error) {
        console.error("Import jenis log error:", error);
        return NextResponse.json({ error: `Gagal import jenis log: ${error.message}` }, { status: 500 });
      }
    }

    // ===== LOG TANAM =====
    const wsLog = wb.Sheets["LogTanam"];
    const logRows: any[] = wsLog ? XLSX.utils.sheet_to_json(wsLog, { defval: "" }) : [];
    
    for (const row of logRows) {
      if (!row.id || !row.judul) continue;
      
      const newId = genUUID();
      
      const { error } = await supabase.from("activity_logs").insert({
        id: newId, user_id: user.id, tanggal: String(row.tanggal),
        jenis: String(row.jenis), jenis_custom: row.jenis_custom ? String(row.jenis_custom) : null,
        judul: String(row.judul), deskripsi: row.deskripsi ? String(row.deskripsi) : null,
        biaya: Number(row.biaya) || 0,
        keterangan_biaya: row.keterangan_biaya ? String(row.keterangan_biaya) : null,
        foto_url: row.foto_url ? String(row.foto_url) : null, is_demo: false,
      });
      
      if (error) {
        console.error("Import log error:", error);
        return NextResponse.json({ error: `Gagal import log: ${error.message}` }, { status: 500 });
      }
    }

    // ===== KALENDER TANAM =====
    const wsKalender = wb.Sheets["KalenderTanam"];
    const kalenderRows: any[] = wsKalender ? XLSX.utils.sheet_to_json(wsKalender, { defval: "" }) : [];
    const idMapKalender: Record<string, string> = {};
    
    for (const row of kalenderRows) {
      if (!row.id) continue;
      const oldLandId = row.land_id ? String(row.land_id) : "";
      const newLandId = oldLandId ? (idMapLahan[oldLandId] || null) : null;
      
      const newId = genUUID();
      idMapKalender[String(row.id)] = newId;
      
      const { error } = await supabase.from("kalender_tanam").insert({
        id: newId, user_id: user.id, land_id: newLandId,
        komoditas: String(row.komoditas), tanggal_mulai: String(row.tanggal_mulai),
        tanggal_selesai: String(row.tanggal_selesai), total_hst: Number(row.total_hst) || 90,
        is_demo: false,
      });
      
      if (error) {
        console.error("Import kalender error:", error);
        return NextResponse.json({ error: `Gagal import kalender: ${error.message}` }, { status: 500 });
      }
    }

    // ===== KALENDER KEGIATAN =====
    const wsKeg = wb.Sheets["KalenderKegiatan"];
    const kegRows: any[] = wsKeg ? XLSX.utils.sheet_to_json(wsKeg, { defval: "" }) : [];
    
    for (const row of kegRows) {
      if (!row.id || !row.kalender_id) continue;
      const oldKalId = String(row.kalender_id);
      const newKalId = idMapKalender[oldKalId];
      if (!newKalId) continue;
      
      const newId = genUUID();
      
      const { error } = await supabase.from("kalender_kegiatan").insert({
        id: newId, kalender_id: newKalId, hst: Number(row.hst) || 0,
        judul: String(row.judul),
        keterangan: row.keterangan ? String(row.keterangan) : null,
      });
      
      if (error) {
        console.error("Import kalender kegiatan error:", error);
        return NextResponse.json({ error: `Gagal import kalender kegiatan: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true, mode, versi_file: versiFile || "unknown",
      summary: {
        penggarap: penggarapRows.filter((r) => r.id && r.nama).length,
        lahan: lahanRows.filter((r) => r.id && r.penggarap_id).length,
        panen: panenRows.filter((r) => r.id && r.land_id).length,
        hutang: hutangRows.filter((r) => r.id && r.penggarap_id).length,
        kategori: kategoriRows.filter((r) => r.komoditas).length,
        musim: musimRows.filter((r) => r.nama).length,
        log: logRows.filter((r) => r.id && r.judul).length,
        kalender: kalenderRows.filter((r) => r.id).length,
      },
      message: "Import berhasil (Catatan: File gambar Log Tanam tidak di-upload ulang, hanya URL aslinya yang dicatat).",
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan: " + (err.message || "Unknown") }, { status: 500 });
  }
}
