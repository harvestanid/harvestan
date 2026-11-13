import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TanyaAIKlien } from "./tanya-ai";

export const metadata = {
  title: "Data Sapi - Harvestan",
};

function formatTanggal(t: string) {
  return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SapiPublikPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: sapi } = await supabase
    .from("livestocks")
    .select("id, nama_sapi, jenis, jenis_kelamin, tanggal_masuk, bobot_awal, tinggi_awal, panjang_awal, foto_url, status, public_token")
    .eq("public_token", token)
    .eq("is_public", true)
    .single();

  if (!sapi) notFound();

  const { data: measurements } = await supabase
    .from("livestock_measurements")
    .select("tanggal, bobot_kg, tinggi_cm, panjang_cm, catatan")
    .eq("livestock_id", sapi.id)
    .order("tanggal", { ascending: true });

  const lastMeasurement = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const bobotTerakhir = lastMeasurement ? lastMeasurement.bobot_kg : sapi.bobot_awal;
  const tinggiTerakhir = lastMeasurement ? lastMeasurement.tinggi_cm : sapi.tinggi_awal;
  const panjangTerakhir = lastMeasurement ? lastMeasurement.panjang_cm : sapi.panjang_awal;

  const totalHari = Math.max(1, Math.floor((new Date().getTime() - new Date(sapi.tanggal_masuk).getTime()) / (1000 * 60 * 60 * 24)));
  const adg = (bobotTerakhir - sapi.bobot_awal) / totalHari;

  const dataSapi = {
    token: sapi.public_token,
    nama: sapi.nama_sapi || `Sapi ${sapi.jenis}`,
    jenis: sapi.jenis,
    bobot: bobotTerakhir,
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] pb-10">
      {/* Navbar Atas */}
      <nav className="bg-white border-b border-[#2c5e2e]/10 px-4 py-4 flex justify-center sticky top-0 z-20 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-horizontal.png" alt="Harvestan" className="h-10 w-auto" />
      </nav>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        
        {/* KARTU HEADER (FOTO & NAMA) */}
        <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-6 pt-14 text-center relative shadow-lg">
          {/* Background Hijau di atas */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[#2c5e2e] to-[#1f4521] rounded-t-3xl" />
          
          {/* Foto Profil */}
          <div className="relative z-10 flex justify-center -mt-12 mb-4">
            {sapi.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={sapi.foto_url} 
                alt="Foto Sapi" 
                className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-md bg-white" 
              />
            ) : (
              <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-md text-5xl">
                🐄
              </div>
            )}
          </div>

          {/* Nama & Info */}
          <h1 className="text-2xl font-black text-[#2c5e2e] leading-tight mb-1">
            {sapi.nama_sapi ? sapi.nama_sapi : `Sapi ${sapi.jenis}`}
          </h1>
          <p className="text-sm text-[#2c5e2e]/60 font-medium">
            {sapi.nama_sapi ? `Sapi ${sapi.jenis} · ` : ""}
            {sapi.jenis_kelamin} · Masuk {formatTanggal(sapi.tanggal_masuk)}
          </p>
          
          <div className="mt-4 inline-block bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-200">
            {sapi.status === "aktif" ? "🟢 Sapi Sehat & Aktif" : "🔴 Terjual"}
          </div>
        </div>

        {/* STATISTIK CARD */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border-2 border-[#2c5e2e]/10 p-4 text-center shadow-sm">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Bobot Terakhir</div>
            <div className="text-2xl font-black text-green-700">{bobotTerakhir.toLocaleString("id-ID")} <span className="text-sm text-gray-500 font-medium">Kg</span></div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-[#2c5e2e]/10 p-4 text-center shadow-sm">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">ADG (Pertumbuhan)</div>
            <div className="text-2xl font-black text-blue-700">{adg.toFixed(2)} <span className="text-sm text-gray-500 font-medium">Kg/hari</span></div>
          </div>
        </div>

        {/* DIMENSI */}
        <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-5 shadow-sm">
          <h3 className="font-bold text-[#2c5e2e] mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
            <span>📏</span> Dimensi Terakhir
          </h3>
          <div className="grid grid-cols-2 gap-4 bg-[#faf9f5] rounded-xl p-3 border border-[#2c5e2e]/5">
            <div className="text-center border-r border-[#2c5e2e]/10">
              <div className="text-[10px] text-gray-500 mb-0.5">Tinggi</div>
              <div className="font-bold text-gray-900 text-lg">{tinggiTerakhir || "-"} <span className="text-xs text-gray-500 font-normal">Cm</span></div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-0.5">Panjang</div>
              <div className="font-bold text-gray-900 text-lg">{panjangTerakhir || "-"} <span className="text-xs text-gray-500 font-normal">Cm</span></div>
            </div>
          </div>
        </div>

        {/* GRAFIK PERTUMBUHAN */}
        <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-5 shadow-sm">
          <h3 className="font-bold text-[#2c5e2e] mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <span>📈</span> Grafik Pertumbuhan
          </h3>
          {!measurements || measurements.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm italic bg-[#faf9f5] rounded-xl border border-dashed border-[#2c5e2e]/20">
              Belum ada data timbang
            </div>
          ) : (
            <div className="space-y-4">
              {measurements.map((m, i) => {
                const prev = i === 0 ? sapi.bobot_awal : measurements[i - 1].bobot_kg;
                const diff = m.bobot_kg - prev;
                const maxBobot = Math.max(...measurements.map(x => x.bobot_kg), sapi.bobot_awal);
                const pct = maxBobot > 0 ? (m.bobot_kg / maxBobot) * 100 : 0;

                return (
                  <div key={i}>
                    <div className="flex justify-between items-end text-xs mb-1.5 flex-wrap gap-1">
                      <span className="text-gray-600 font-medium">{formatTanggal(m.tanggal)}</span>
                      <span className="font-bold text-[#2c5e2e]">
                        {m.bobot_kg} Kg {diff > 0 && <span className="text-green-600 ml-1">(+{diff})</span>}
                      </span>
                    </div>
                    <div className="h-3.5 bg-[#faf9f5] rounded-full overflow-hidden border border-[#2c5e2e]/10">
                      <div className="h-full bg-gradient-to-r from-[#2c5e2e] to-[#4a9d4e] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    {m.catatan && <div className="text-[10px] text-gray-500 mt-1 italic pl-1 border-l-2 border-[#2c5e2e]/20 ml-1">📝 {m.catatan}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FITUR TANYA AI */}
        <TanyaAIKlien dataSapi={dataSapi} />

        {/* FOOTER */}
        <div className="text-center pt-6 pb-2">
          <p className="text-[10px] text-gray-400 mb-2">Data ini dikelola secara transparan menggunakan</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="Harvestan" className="h-6 w-auto inline-block opacity-40 grayscale" />
        </div>
      </div>
    </div>
  );
}
