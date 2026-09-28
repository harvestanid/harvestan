import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import { getDataFilter } from "@/lib/demo/demo-mode";

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "Padi",
  jagung: "Jagung",
  kacang_tanah: "Kacang Tanah",
  bawang_merah: "Bawang Merah",
  cabai_rawit: "Cabai Rawit",
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter demo mode
    const filter = await getDataFilter(user.id);

    // Ambil semua data (filtered by is_demo)
    const { data: penggaraps } = await supabase
      .from("penggaraps")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
      .order("nama");

    const { data: lands } = await supabase
      .from("lands")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
      .order("nama");

    const { data: harvests } = await supabase
      .from("harvests")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
      .order("tanggal", { ascending: false });

    const { data: debts } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
      .order("tanggal", { ascending: false });

    const wb = XLSX.utils.book_new();

    // ===== SHEET 1: PENGGARAP =====
    const penggarapRows = [
      [
        "ID",
        "Nama",
        "Alamat",
        "Usia",
        "Kontak",
        "Jumlah Lahan",
        "Total Luas (Ha)",
        "Total Panen (Kg)",
        "Profit Owner (Rp)",
        "Profit Penggarap (Rp)",
        "Hutang Aktif (Rp)",
      ],
    ];

    (penggaraps || []).forEach((p) => {
      const penggarapLands = (lands || []).filter(
        (l) => l.penggarap_id === p.id
      );
      const landIds = penggarapLands.map((l) => l.id);
      const penggarapHarvests = (harvests || []).filter((h) =>
        landIds.includes(h.land_id)
      );
      const totalLuas = penggarapLands.reduce(
        (s, l) => s + Number(l.luas),
        0
      );
      const totalPanen = penggarapHarvests.reduce(
        (s, h) => s + Number(h.hasil_kg),
        0
      );
      const profitOwner = penggarapHarvests.reduce(
        (s, h) => s + Number(h.profit_owner || 0),
        0
      );
      const profitPenggarap = penggarapHarvests.reduce(
        (s, h) => s + Number(h.profit_penggarap || 0),
        0
      );
      const hutangAktif = (debts || [])
        .filter((d) => d.penggarap_id === p.id && Number(d.sisa) > 0)
        .reduce((s, d) => s + Number(d.sisa), 0);

      penggarapRows.push([
        p.id,
        p.nama,
        p.alamat || "",
        p.usia || "",
        p.kontak || "",
        penggarapLands.length,
        totalLuas.toFixed(2),
        totalPanen.toFixed(0),
        profitOwner.toFixed(0),
        profitPenggarap.toFixed(0),
        hutangAktif.toFixed(0),
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(penggarapRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Penggarap");

    // ===== SHEET 2: LAHAN =====
    const lahanRows = [
      [
        "ID",
        "Nama Lahan",
        "Penggarap",
        "Luas (Ha)",
        "Koordinat GPS",
        "Jumlah Panen",
        "Total Hasil (Kg)",
        "Rata-rata Produktivitas (Kg/Ha)",
      ],
    ];

    (lands || []).forEach((l) => {
      const penggarap = (penggaraps || []).find(
        (p) => p.id === l.penggarap_id
      );
      const lahanHarvests = (harvests || []).filter(
        (h) => h.land_id === l.id
      );
      const totalHasil = lahanHarvests.reduce(
        (s, h) => s + Number(h.hasil_kg),
        0
      );
      const rataProd =
        lahanHarvests.length > 0
          ? totalHasil / lahanHarvests.length / Number(l.luas)
          : 0;

      lahanRows.push([
        l.id,
        l.nama,
        penggarap?.nama || "?",
        Number(l.luas).toFixed(2),
        l.lokasi_koordinat || "",
        lahanHarvests.length,
        totalHasil.toFixed(0),
        rataProd.toFixed(0),
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(lahanRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Lahan");

    // ===== SHEET 3: PANEN =====
    const panenRows = [
      [
        "ID",
        "Tanggal",
        "Penggarap",
        "Lahan",
        "Komoditas",
        "Musim",
        "Hasil (Kg)",
        "Harga/Kg (Rp)",
        "Biaya Panen/Kg (Rp)",
        "Biaya Tambahan (Rp)",
        "Keterangan Biaya",
        "Bawa Penggarap (Kg)",
        "Bawa Owner (Kg)",
        "Bawa Lain (Kg)",
        "Persen Owner",
        "Persen Penggarap",
        "Profit Bersih (Rp)",
        "Profit Owner (Rp)",
        "Profit Penggarap (Rp)",
        "Potongan Hutang (Rp)",
        "Hutang Sebelum (Rp)",
        "Hutang Sesudah (Rp)",
        "Catatan",
      ],
    ];

    (harvests || []).forEach((h) => {
      const land = (lands || []).find((l) => l.id === h.land_id);
      const penggarap = (penggaraps || []).find(
        (p) => p.id === land?.penggarap_id
      );

      panenRows.push([
        h.id,
        h.tanggal,
        penggarap?.nama || "?",
        land?.nama || "?",
        KOMODITAS_LABEL[h.komoditas] || h.komoditas,
        h.musim || "",
        Number(h.hasil_kg).toFixed(0),
        Number(h.harga_gabah).toFixed(0),
        Number(h.biaya_panen_per_kg).toFixed(0),
        Number(h.biaya_tambahan || 0).toFixed(0),
        h.keterangan_biaya || "",
        Number(h.bawa_penggarap || 0).toFixed(0),
        Number(h.bawa_owner || 0).toFixed(0),
        Number(h.bawa_lain || 0).toFixed(0),
        h.persen_owner,
        h.persen_penggarap,
        Number(h.profit_bersih).toFixed(0),
        Number(h.profit_owner || 0).toFixed(0),
        Number(h.profit_penggarap || 0).toFixed(0),
        Number(h.potongan_hutang || 0).toFixed(0),
        Number(h.total_hutang_sebelum || 0).toFixed(0),
        Number(h.sisa_hutang_sesudah || 0).toFixed(0),
        h.catatan || "",
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(panenRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Panen");

    // ===== SHEET 4: HUTANG =====
    const hutangRows = [
      [
        "ID",
        "Tanggal",
        "Penggarap",
        "Jumlah (Rp)",
        "Dibayar (Rp)",
        "Sisa (Rp)",
        "Status",
        "Keperluan",
      ],
    ];

    (debts || []).forEach((d) => {
      const penggarap = (penggaraps || []).find(
        (p) => p.id === d.penggarap_id
      );
      const sisa = Number(d.sisa || 0);

      hutangRows.push([
        d.id,
        d.tanggal,
        penggarap?.nama || "?",
        Number(d.jumlah).toFixed(0),
        Number(d.dibayar || 0).toFixed(0),
        sisa.toFixed(0),
        sisa <= 0 ? "LUNAS" : "AKTIF",
        d.keperluan || "",
      ]);
    });

    const ws4 = XLSX.utils.aoa_to_sheet(hutangRows);
    XLSX.utils.book_append_sheet(wb, ws4, "Hutang");
    // ===== SHEET 5: INFO =====
        const infoRows = [
          ["Keterangan", "Nilai"],
          [
            "Tipe Data",
            filter.is_demo ? "⚠️ DEMO (Data Contoh)" : "Data Real",
          ],
          ["Tanggal Export", new Date().toLocaleString("id-ID")],
          ["Jumlah Penggarap", (penggaraps || []).length],
          ["Jumlah Lahan", (lands || []).length],
          ["Jumlah Panen", (harvests || []).length],
          ["Jumlah Hutang", (debts || []).length],
        ];
    
        if (filter.is_demo) {
          infoRows.push([
            "⚠️ PERINGATAN",
            "File ini berisi DATA DEMO dari petani contoh. Bukan data asli Anda.",
          ]);
        }
    
        const ws5 = XLSX.utils.aoa_to_sheet(infoRows);
        XLSX.utils.book_append_sheet(wb, ws5, "Info");
    
        // ===== GENERATE BUFFER =====
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    
        const filenameSuffix = filter.is_demo ? "_DEMO" : "";
        const filename = `Harvestan_Export_${new Date()
          .toISOString()
          .split("T")[0]}${filenameSuffix}.xlsx`;
    
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } catch (err) {
        console.error("Export error:", err);
        return NextResponse.json(
          { error: "Terjadi kesalahan saat export" },
          { status: 500 }
        );
      }
    }
