import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDataFilter } from "@/lib/demo/demo-mode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filter = await getDataFilter(user.id);

    const { data: kalender } = await supabase
      .from("kalender_tanam")
      .select("*, lands(nama)")
      .eq("id", id)
      .eq("user_id", filter.user_id)
      .eq("is_demo", filter.is_demo)
      .single();

    if (!kalender) return NextResponse.json({ error: "Kalender tidak ditemukan" }, { status: 404 });

    const { data: kegiatanList } = await supabase
      .from("kalender_kegiatan")
      .select("*")
      .eq("kalender_id", id)
      .order("hst", { ascending: true });

    const tglMulai = new Date(kalender.tanggal_mulai);
    const tglSelesai = new Date(kalender.tanggal_selesai);
    const tglPanen = new Date(tglMulai);
    tglPanen.setDate(tglPanen.getDate() + Number(kalender.total_hst));

    // Format tanggal ICS untuk All-Day Event (YYYYMMDD)
    const formatICSDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}${m}${d}`;
    };

    const formatICSStamp = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Harvestan//Kalender Tanam//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ].join("\r\n") + "\r\n";

    const now = formatICSStamp(new Date());
    let counter = 0;

    // 1. Event TANAM
    let currDate = new Date(tglMulai);
    while (currDate <= tglSelesai) {
      counter++;
      icsContent += [
        "BEGIN:VEVENT",
        `UID:tanam-${kalender.id}-${counter}@harvestan.com`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${formatICSDate(currDate)}`,
        `SUMMARY:🌱 Tanam`,
        `DESCRIPTION:Tanggal tanam untuk lahan ${kalender.lands?.nama || "-"}`,
        "END:VEVENT",
      ].join("\r\n") + "\r\n";
      
      currDate.setDate(currDate.getDate() + 1);
    }

    // 2. Event PANEN
    counter++;
    icsContent += [
      "BEGIN:VEVENT",
      `UID:panen-${kalender.id}-${counter}@harvestan.com`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatICSDate(tglPanen)}`,
      `SUMMARY:🌾 Panen (${kalender.total_hst} HST)`,
      `DESCRIPTION:Estimasi panen untuk lahan ${kalender.lands?.nama || "-"}`,
      "END:VEVENT",
    ].join("\r\n") + "\r\n";

    // 3. Loop Kegiatan User
    if (kegiatanList) {
      kegiatanList.forEach((k) => {
        const tglKegiatan = new Date(tglMulai);
        tglKegiatan.setDate(tglKegiatan.getDate() + Number(k.hst));

        // JANGAN SKIP HST 0, biar Daut muncul!
        counter++;
        icsContent += [
          "BEGIN:VEVENT",
          `UID:kegiatan-${k.id}-${counter}@harvestan.com`, // UID Unik biar ga digabung
          `DTSTAMP:${now}`,
          `DTSTART;VALUE=DATE:${formatICSDate(tglKegiatan)}`,
          `SUMMARY:📝 ${k.judul} (${k.hst} HST)`,
          `DESCRIPTION:${k.keterangan || "Kegiatan tanam"}\\nLahan: ${kalender.lands?.nama || "-"}`,
          "END:VEVENT",
        ].join("\r\n") + "\r\n";
      });
    }

    icsContent += "END:VCALENDAR";

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="kalender-tanam-${kalender.komoditas}.ics"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal generate ICS" },
      { status: 500 }
    );
  }
}
