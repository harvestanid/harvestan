import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDataFilter } from "@/lib/demo/demo-mode";
import { TombolAksiKalender } from "./tombol-aksi";

export const metadata = {
  title: "Detail Kalender Tanam",
};

const KOMODITAS_LABEL: Record<string, string> = {
  padi: "🌾 Padi",
  jagung: "🌽 Jagung",
  kacang_tanah: "🥜 Kacang Tanah",
  bawang_merah: "🧅 Bawang Merah",
  cabai_rawit: "🌶️ Cabai Rawit",
  cabai: "🌶️ Cabai",
};

export default async function DetailKalenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filter = await getDataFilter(user.id);

  const { data: kalender } = await supabase
    .from("kalender_tanam")
    .select("*, lands(nama)")
    .eq("id", id)
    .eq("user_id", filter.user_id)
    .eq("is_demo", filter.is_demo)
    .single();

  if (!kalender) notFound();

  const { data: kegiatanData } = await supabase
    .from("kalender_kegiatan")
    .select("*")
    .eq("kalender_id", id)
    .order("hst", { ascending: true });

  const kegiatanList = kegiatanData || [];

  const tglMulai = new Date(kalender.tanggal_mulai);
  const tglSelesai = new Date(kalender.tanggal_selesai);
  
  function hitungTanggal(hst: number) {
    const d = new Date(tglMulai);
    d.setDate(d.getDate() + hst);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Susun array list
  const fullList: any[] = [];
  
  // 1. Kegiatan Minus
  kegiatanList.filter((k) => Number(k.hst) < 0).forEach((k) => {
    fullList.push({ type: "kegiatan", hst: Number(k.hst), judul: k.judul, keterangan: k.keterangan, tanggal: hitungTanggal(Number(k.hst)) });
  });

  // 2. Ambil Daut (HST 0) buat diselipin di hari pertama tanam
  const kegiatanHst0 = kegiatanList.filter((k) => Number(k.hst) === 0);

  // 3. Tanam Otomatis (Loop dinamis)
  let curr = new Date(tglMulai);
  let hariKe = 0;
  while (curr <= tglSelesai) {
    // Masukin Tanam
    fullList.push({ 
      type: "tanam", 
      hst: hariKe, 
      judul: "Tanam", 
      keterangan: "", 
      tanggal: curr.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) 
    });

    // Kalau ini hari pertama tanam, selipin Daut (HST 0)
    if (hariKe === 0) {
      kegiatanHst0.forEach((k) => {
        fullList.push({ 
          type: "kegiatan", 
          hst: 0, 
          judul: k.judul, 
          keterangan: k.keterangan, 
          tanggal: hitungTanggal(0) 
        });
      });
    }

    curr.setDate(curr.getDate() + 1);
    hariKe++;
  }

  // 4. Kegiatan Plus
  kegiatanList.filter((k) => Number(k.hst) > 0).forEach((k) => {
    fullList.push({ type: "kegiatan", hst: Number(k.hst), judul: k.judul, keterangan: k.keterangan, tanggal: hitungTanggal(Number(k.hst)) });
  });

  const tglPanen = new Date(tglMulai);
  tglPanen.setDate(tglPanen.getDate() + Number(kalender.total_hst));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/kalender-tanam" className="text-green-700 hover:text-green-800 text-sm font-medium">
          ← Kembali ke Daftar
        </Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">
            {KOMODITAS_LABEL[kalender.komoditas] || kalender.komoditas}
          </h1>
          <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full">
            {kalender.total_hst} HST
          </span>
        </div>
        <p className="text-gray-600 text-sm mt-1">
          {kalender.lands?.nama ? `📍 ${kalender.lands.nama}` : "📍 Lahan tidak spesifik"}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase mb-1">Mulai Tanam</div>
            <div className="font-semibold text-gray-900">
              {new Date(kalender.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase mb-1">Selesai Tanam</div>
            <div className="font-semibold text-gray-900">
              {new Date(kalender.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 font-bold uppercase mb-1">Estimasi Panen</div>
          <div className="font-bold text-green-700">
            {tglPanen.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">🗓️ Jadwal Kegiatan</h2>
        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
          {fullList.map((item, idx) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-green-100 text-green-700 font-bold text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                {item.hst}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900 text-sm mb-1">{item.judul}</div>
                <div className="text-[11px] text-green-700 font-semibold mb-2">{item.tanggal}</div>
                {item.keterangan && <div className="text-xs text-gray-600">{item.keterangan}</div>}
              </div>
            </div>
          ))}
          
          {/* Panen */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-orange-100 text-orange-700 font-bold text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              {kalender.total_hst}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-orange-50 p-3 rounded-xl border border-orange-200">
              <div className="font-bold text-orange-800 text-sm mb-1">🌾 PANEN</div>
              <div className="text-[11px] text-orange-600 font-semibold">{tglPanen.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
          </div>
        </div>
      </div>

      <TombolAksiKalender id={kalender.id} />
    </div>
  );
}
