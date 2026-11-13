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

    const wb = XLSX.utils.book_new();

    // ===== Sheet 1: Penggarap (RAW) =====
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

    // ===== Sheet 2: Lahan (RAW) =====
    const lahanRows = [
      [
        "id",
        "penggarap_id",
        "nama",
        "luas",
        "lokasi_koordinat",
        "polygon_json",
        "tipe_garap",
        "nama_owner_external",
        "persen_owner_default",
        "persen_penggarap_default",
        "created_at",
      ],
    ];
    (lands || []).forEach((l) => {
      const tipeGarap = (l as any).tipe_garap || "bagi_hasil_owner";
      const persenOwnerDefault =
        (l as any).persen_owner_default !== undefined &&
        (l as any).persen_owner_default !== null
          ? Number((l as any).persen_owner_default)
          : tipeGarap === "mandiri"
          ? 0
          : 50;
      const persenPenggarapDefault =
        (l as any).persen_penggarap_default !== undefined &&
        (l as any).persen_penggarap_default !== null
          ? Number((l as any).persen_penggarap_default)
          : tipeGarap === "mandiri"
          ? 100
          : 50;

      lahanRows.push([
        l.id,
        l.penggarap_id,
        l.nama || "",
        Number(l.luas) || 0,
        l.lokasi_koordinat || "",
        l.polygon ? JSON.stringify(l.polygon) : "",
        tipeGarap,
        (l as any).nama_owner_external || "",
        persenOwnerDefault,
        persenPenggarapDefault,
        l.created_at || "",
      ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(lahanRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Lahan");

    // ===== Sheet 3: Panen (RAW) =====
    const panenRows = [
      [
        "id",
        "land_id",
        "tanggal",
        "komoditas",
        "musim",
        "hasil_kg",
        "harga_gabah",
        "harga_per_kg",
        "biaya_panen_per_kg",
        "biaya_tambahan",
        "keterangan_biaya",
        "bawa_penggarap",
        "bawa_owner",
        "bawa_lain",
        "persen_owner",
        "persen_penggarap",
        "profit_bersih",
        "profit_owner",
        "profit_penggarap",
        "potongan_hutang",
        "total_hutang_sebelum",
        "sisa_hutang_sesudah",
        "catatan",
        "potongan_hutang_log_json",
        "created_at",
      ],
    ];
    (harvests || []).forEach((h) => {
      panenRows.push([
        h.id,
        h.land_id,
        h.tanggal,
        h.komoditas || "padi",
        h.musim || "",
        Number(h.hasil_kg) || 0,
        Number(h.harga_gabah) || 0,
        Number(h.harga_per_kg) || 0,
        Number(h.biaya_panen_per_kg) || 0,
        Number(h.biaya_tambahan) || 0,
        h.keterangan_biaya || "",
        Number(h.bawa_penggarap) || 0,
        Number(h.bawa_owner) || 0,
        Number(h.bawa_lain) || 0,
        Number(h.persen_owner) || 0,
        Number(h.persen_penggarap) || 100,
        Number(h.profit_bersih) || 0,
        Number(h.profit_owner) || 0,
        Number(h.profit_penggarap) || 0,
        Number(h.potongan_hutang) || 0,
        Number(h.total_hutang_sebelum) || 0,
        Number(h.sisa_hutang_sesudah) || 0,
        h.catatan || "",
        h.potongan_hutang_log ? JSON.stringify(h.potongan_hutang_log) : "",
        h.created_at || "",
      ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(panenRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Panen");

    // ===== Sheet 4: Hutang (RAW) =====
    const hutangRows = [
      [
        "id",
        "penggarap_id",
        "tanggal",
        "jumlah",
        "keperluan",
        "dibayar",
        "sisa",
        "log_perubahan_json",
        "created_at",
      ],
    ];
    (debts || []).forEach((d) => {
      hutangRows.push([
        d.id,
        d.penggarap_id,
        d.tanggal,
        Number(d.jumlah) || 0,
        d.keperluan || "",
        Number(d.dibayar) || 0,
        Number(d.sisa) || 0,
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
        c.sangat_baik !== null && c.sangat_baik !== undefined
          ? Number(c.sangat_baik)
          : "",
      ]);
    });
    const ws5 = XLSX.utils.aoa_to_sheet(kategoriRows);
    XLSX.utils.book_append_sheet(wb, ws5, "Kategori");

    // ===== Sheet 6: Musim Cabai =====
    const musimRows = [
      ["id", "nama", "tanggal_mulai", "tanggal_selesai", "catatan"],
    ];
    (musimCabai || []).forEach((m) => {
      musimRows.push([
        m.id,
        m.nama || "",
        m.tanggal_mulai || "",
        m.tanggal_selesai || "",
        m.catatan || "",
      ]);
    });
    const ws6 = XLSX.utils.aoa_to_sheet(musimRows);
    XLSX.utils.book_append_sheet(wb, ws6, "MusimCabai");

    // ===== Sheet 7: Info (Metadata) =====
    const infoRows = [
      ["keterangan", "nilai"],
      ["tipe_file", "BACKUP"],
      ["versi", "1.7"],
      ["tanggal_export", new Date().toISOString()],
      ["jumlah_penggarap", (penggaraps || []).length],
      ["jumlah_lahan", (lands || []).length],
      ["jumlah_panen", (harvests || []).length],
      ["jumlah_hutang", (debts || []).length],
      ["jumlah_kategori", (categories || []).length],
      ["jumlah_musim", (musimCabai || []).length],
    ];
    const ws7 = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.book_append_sheet(wb, ws7, "Info");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `Harvestan_Backup_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
