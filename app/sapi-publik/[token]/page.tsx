import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

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
    .select("id, nama_sapi, jenis, jenis_kelamin, tanggal_masuk, bobot_awal, foto_url, status, public_token")
    .eq("public_token", token)
    .eq("is_public", true)
    .single();

  if (!sapi) notFound();

  const { data: measurements } = await supabase
    .from("livestock_measurements")
    .select("tanggal, bobot_kg, tinggi_cm, panjang_cm")
    .eq("livestock_id", sapi.id)
    .order("tanggal", { ascending: true });

  const lastMeasurement = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const bobotTerakhir = lastMeasurement ? lastMeasurement.bobot_kg : sapi.bobot_awal;

  const totalHari = Math.max(1, Math.floor((new Date().getTime() - new Date(sapi.tanggal_masuk).getTime()) / (1000 * 60 * 60 * 24)));
  const adg = (bobotTerakhir - sapi.bobot_awal) / totalHari;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex justify-center shadow-sm sticky top-0 z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-horizontal.png" alt="Harvestan" className="h-10 w-auto" />
      </nav>

      <div className="max-w-md mx-auto p-4 space-y-5 mt-4">
        <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-5 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-[#2c5e2e]" />
          <div className="relative z-10 mt-6">
            {sapi.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sapi.foto_url} alt="Foto Sapi" className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white shadow-md" />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-md text-5xl">🐄</div>
            )}
            <h1 className="text-2xl font-black text-[#2c5e2e] mt-3">
              {sapi.nama_sapi ? sapi.nama_sapi : `Sapi ${sapi.jenis}`}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {sapi.nama_sapi ? `Sapi ${sapi.jenis} · ` : ""}
              {sapi.jenis_kelamin} · Masuk {formatTanggal(sapi.tanggal_masuk)}
            </p>
            <div className="mt-2 inline-block bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              {sapi.status === "aktif" ? "🟢 Sapi Sehat & Aktif" : "🔴 Terjual"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border-2 border-[#2c5e2e]/10 p-4 text-center shadow-sm">
            <div className="text-[10px] text-gray-500 font-bold uppercase">Bobot Terakhir</div>
            <div className="text-2xl font-black text-green-800 mt-1">{bobotTerakhir.toLocaleString("id-ID")} <span className="text-sm text-gray-500">Kg</span></div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-[#2c5e2e]/10 p-4 text-center shadow-sm">
            <div className="text-[10px] text-gray-500 font-bold uppercase">Pertumbuhan (ADG)</div>
            <div className="text-2xl font-black text-blue-800 mt-1">{adg.toFixed(2)} <span className="text-sm text-gray-500">Kg/hari</span></div>
          </div>
        </div>

        {lastMeasurement && (
          <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">📏 Dimensi Terakhir</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Tinggi</div>
                <div className="font-bold text-gray-900">{lastMeasurement.tinggi_cm || "-"} Cm</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Panjang</div>
                <div className="font-bold text-gray-900">{lastMeasurement.panjang_cm || "-"} Cm</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border-2 border-[#2c5e2e]/10 p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">📈 Grafik Pertumbuhan</h3>
          {!measurements || measurements.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs italic">Belum ada data timbang</div>
          ) : (
            <div className="space-y-3">
              {measurements.map((m, i) => {
                const prev = i === 0 ? sapi.bobot_awal : measurements[i - 1].bobot_kg;
                const diff = m.bobot_kg - prev;
                const maxBobot = Math.max(...measurements.map(x => x.bobot_kg), sapi.bobot_awal);
                const pct = maxBobot > 0 ? (m.bobot_kg / maxBobot) * 100 : 0;

                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{formatTanggal(m.tanggal)}</span>
                      <span className="font-bold">{m.bobot_kg} Kg {diff > 0 && <span className="text-green-600">(+{diff})</span>}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#2c5e2e] to-[#4a9d4e]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center text-[10px] text-gray-400 py-4">
          Data ini dikelola secara transparan menggunakan <br/>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="Harvestan" className="h-4 w-auto inline-block mt-1 opacity-50" />
        </div>
      </div>
    </div>
  );
}
