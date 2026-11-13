import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: penggaraps } = await supabase
      .from("penggaraps")
      .select("*")
      .eq("user_id", user.id);

    const { data: lands } = await supabase
      .from("lands")
      .select("*")
      .eq("user_id", user.id);

    const { data: harvests } = await supabase
      .from("harvests")
      .select("*")
      .eq("user_id", user.id);

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id);

    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    const { data: musimCabai } = await supabase
      .from("musim_cabai")
      .select("*")
      .eq("user_id", user.id);

    // ==== FITUR BARU: LOG TANAM ====
    const { data: activityLogs } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id);

    const { data: activityJenisCustom } = await supabase
      .from("activity_jenis_custom")
      .select("*")
      .eq("user_id", user.id);

    // ==== FITUR BARU: KALENDER TANAM ====
    const { data: kalenderTanam } = await supabase
      .from("kalender_tanam")
      .select("*")
      .eq("user_id", user.id);

    // Ambil kegiatan kalender berdasarkan id kalender user
    const kalenderIds = (kalenderTanam || []).map((k) => k.id);
    let kalenderKegiatan: any[] = [];
    if (kalenderIds.length > 0) {
      const { data: kegiatan } = await supabase
        .from("kalender_kegiatan")
        .select("*")
        .in("kalender_id", kalenderIds);
      kalenderKegiatan = kegiatan || [];
    }

    const wb = XLSX.utils.book_new();

    // ===== Sheet 1: Penggarap =====
    const penggarapRows = [
      ["id", "nama", "alamat", "usia", "kontak", "is_self", "created_at"],
    ];
    (penggaraps || []).forEach((p) => {
      penggarapRows.push([
        p.id,
        p.nama || "",
        p.alamat || "",
        p.usia || "",
        p.kontak || "",
        p.is_self ? "TRUE" : "FALSE",
        p.created_at || "",
      ]);
    });
    const ws1 = XLSX.utils.aoa_to_sheet(penggarapRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Penggarap");

    // ===== Sheet 2: Lahan =====
    const lahanRows = [
      [
        "id", "penggarap_id", "nama", "luas", "lokasi_koordinat",
        "polygon_json", "tipe_garap", "nama_owner_external",
        "persen_owner_default", "persen_penggarap_default", "created_at",
      ],
    ];
    (lands || []).forEach((l) => {
      const tipeGarap = (l as any).tipe_garap || "bagi_hasil_owner";
      const persenOwnerDefault = (l as any).persen_owner_default ?? (tipeGarap === "mandiri" ? 0 : 50);
      const persenPenggarapDefault = (l as any).persen_penggarap_default ?? (tipeGarap === "mandiri" ? 100 : 50);

      lahanRows.push([
        l.id, l.penggarap_id, l.nama || "", Number(l.luas) || 0,
        l.lokasi_koordinat || "", l.polygon ? JSON.stringify(l.polygon) : "",
        tipeGarap, (l as any).nama_owner_external || "",
        persenOwnerDefault, persenPenggarapDefault, l.created_at || "",
      ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(lahanRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Lahan");

    // ===== Sheet 3: Panen =====
    const panenRows = [
      [
        "id", "land_id", "tanggal", "komoditas", "musim", "hasil_kg",
        "harga_gabah", "harga_per_kg", "biaya_panen_per_kg", "biaya_tambahan",
        "keterangan_biaya", "bawa_penggarap", "bawa_owner", "bawa_lain",
        "persen_owner", "persen_penggarap", "profit_bersih", "profit_owner",
        "profit_penggarap", "potongan_hutang", "total_hutang_sebelum",
        "sisa_hutang_sesudah", "catatan", "potongan_hutang_log_json", "created_at",
      ],
    ];
    (harvests || []).forEach((h) => {
      panenRows.push([
        h.id, h.land_id, h.tanggal, h.komoditas || "padi", h.musim || "",
        Number(h.hasil_kg) || 0, Number(h.harga_gabah) || 0,
        Number(h.harga_per_kg) || 0, Number(h.biaya_panen_per_kg) || 0,
        Number(h.biaya_tambahan) || 0, h.keterangan_biaya || "",
        Number(h.bawa_penggarap) || 0, Number(h.bawa_owner) || 0,
        Number(h.bawa_lain) || 0, Number(h.persen_owner) || 0,
        Number(h.persen_penggarap) || 100, Number(h.profit_bersih) || 0,
        Number(h.profit_owner) || 0, Number(h.profit_penggarap) || 0,
        Number(h.potongan_hutang) || 0, Number(h.total_hutang_sebelum) || 0,
        Number(h.sisa_hutang_sesudah) || 0, h.catatan || "",
        h.potongan_hutang_log ? JSON.stringify(h.potongan_hutang_log) : "",
        h.created_at || "",
      ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(panenRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Panen");

    // ===== Sheet 4: Hutang =====
    const hutangRows = [
      ["id", "penggarap_id", "tanggal", "jumlah", "keperluan", "dibayar", "sisa", "log_perubahan_json", "created_at"],
    ];
    (debts || []).forEach((d) => {
      hutangRows.push([
        d.id, d.penggarap_id, d.tanggal, Number(d.jumlah) || 0,
        d.keperluan || "", Number(d.dibayar) || 0, Number(d.sisa) || 0,
        d.log_perubahan ? JSON.stringify(d.log_perubahan) : "",
        d.created_at || "",
      ]);
    });
    const ws4 = XLSX.utils.aoa_to_sheet(hutangRows);
    XLSX.utils.book_append_sheet(wb, ws4, "Hutang");

    // ===== Sheet 5: Kategori =====
    const kategoriRows = [["komoditas", "cukup", "baik", "sangat_baik"]];
    (categories || []).forEach((c) => {
      kategoriRows.push([
        c.komoditas,
        c.cukup !== null && c.cukup !== undefined ? Number(c.cukup) : "",
        c.baik !== null && c.baik !== undefined ? Number(c.baik) : "",
        c.sangat_baik !== null && c.sangat_baik !== undefined ? Number(c.sangat_baik) : "",
      ]);
    });
    const ws5 = XLSX.utils.aoa_to_sheet(kategoriRows);
    XLSX.utils.book_append_sheet(wb, ws5, "Kategori");

    // ===== Sheet 6: Musim Cabai =====
    const musimRows = [["id", "nama", "tanggal_mulai", "tanggal_selesai", "catatan"]];
    (musimCabai || []).forEach((m) => {
      musimRows.push([
        m.id, m.nama || "", m.tanggal_mulai || "",
        m.tanggal_selesai || "", m.catatan || "",
      ]);
    });
    const ws6 = XLSX.utils.aoa_to_sheet(musimRows);
    XLSX.utils.book_append_sheet(wb, ws6, "MusimCabai");

    // ===== Sheet 7: Log Tanam =====
    const logRows = [
      [
        "id", "tanggal", "jenis", "jenis_custom", "judul", "deskripsi",
        "biaya", "keterangan_biaya", "foto_url", "created_at"
      ],
    ];
    (activityLogs || []).forEach((l) => {
      logRows.push([
        l.id, l.tanggal, l.jenis, l.jenis_custom || "", l.judul,
        l.deskripsi || "", Number(l.biaya) || 0, l.keterangan_biaya || "",
        l.foto_url || "", l.created_at || "",
      ]);
    });
    const wsLog = XLSX.utils.aoa_to_sheet(logRows);
    XLSX.utils.book_append_sheet(wb, wsLog, "LogTanam");

    // ===== Sheet 8: Jenis Log Custom =====
    const jenisRows = [["id", "nama", "emoji", "created_at"]];
    (activityJenisCustom || []).forEach((j) => {
      jenisRows.push([j.id, j.nama, j.emoji || "", j.created_at || ""]);
    });
    const wsJenis = XLSX.utils.aoa_to_sheet(jenisRows);
    XLSX.utils.book_append_sheet(wb, wsJenis, "LogTanamJenis");

    // ===== Sheet 9: Kalender Tanam =====
    const kalenderRows = [
      [
        "id", "land_id", "komoditas", "tanggal_mulai", "tanggal_selesai",
        "total_hst", "created_at"
      ],
    ];
    (kalenderTanam || []).forEach((k) => {
      kalenderRows.push([
        k.id, k.land_id || "", k.komoditas, k.tanggal_mulai,
        k.tanggal_selesai, Number(k.total_hst) || 0, k.created_at || "",
      ]);
    });
    const wsKalender = XLSX.utils.aoa_to_sheet(kalenderRows);
    XLSX.utils.book_append_sheet(wb, wsKalender, "KalenderTanam");

    // ===== Sheet 10: Kalender Kegiatan =====
    const kegRows = [["id", "kalender_id", "hst", "judul", "keterangan", "created_at"]];
    kalenderKegiatan.forEach((k) => {
      kegRows.push([
        k.id, k.kalender_id, Number(k.hst) || 0, k.judul,
        k.keterangan || "", k.created_at || "",
      ]);
    });
    const wsKeg = XLSX.utils.aoa_to_sheet(kegRows);
    XLSX.utils.book_append_sheet(wb, wsKeg, "KalenderKegiatan");

    // ===== Sheet 11: Info =====
    const infoRows = [
      ["keterangan", "nilai"],
      ["tipe_file", "BACKUP"],
      ["versi", "1.8"],
      ["tanggal_export", new Date().toISOString()],
      ["jumlah_penggarap", (penggaraps || []).length],
      ["jumlah_lahan", (lands || []).length],
      ["jumlah_panen", (harvests || []).length],
      ["jumlah_hutang", (debts || []).length],
      ["jumlah_kategori", (categories || []).length],
      ["jumlah_musim", (musimCabai || []).length],
      ["jumlah_log", (activityLogs || []).length],
      ["jumlah_kalender", (kalenderTanam || []).length],
      ["CATATAN_PENTING", "File gambar bukti Log Tanam TIDAK ikut di-backup. Hanya link URL yang dicatat."],
    ];
    const ws7 = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.book_append_sheet(wb, ws7, "Info");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `Harvestan_Backup_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export backup error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat export backup" },
      { status: 500 }
    );
  }
}
