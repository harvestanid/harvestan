import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TombolAksiLahan } from './tombol-aksi'

export default async function DetailLahanPage({
  params,
}: {
  params: Promise<{ id: string; landId: string }>
}) {
  const { id, landId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lahan, error } = await supabase
    .from('lands')
    .select('*')
    .eq('id', landId)
    .single()

  if (error || !lahan) {
    redirect(`/penggarap/${id}`)
  }

  const { data: penggarap } = await supabase
    .from('penggaraps')
    .select('id, nama')
    .eq('id', id)
    .single()

  const gpsUrl = lahan.lokasi_koordinat
    ? `https://www.google.com/maps?q=${lahan.lokasi_koordinat.replace(/\s/g, '')}`
    : null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {penggarap?.nama || 'Penggarap'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🗺️ {lahan.nama}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Nama Lahan</p>
            <p className="font-semibold text-gray-800 mt-1">{lahan.nama}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Luas</p>
            <p className="font-semibold text-gray-800 mt-1">{lahan.luas} Ha</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Koordinat GPS</p>
          {lahan.lokasi_koordinat ? (
            <a
              href={gpsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-mono hover:bg-blue-100"
            >
              📍 {lahan.lokasi_koordinat}
            </a>
          ) : (
            <p className="text-gray-400 italic mt-1 text-sm">Belum ada koordinat</p>
          )}
        </div>

        <div className="pt-4 border-t">
          <TombolAksiLahan
            landId={lahan.id}
            penggarapId={id}
            nama={lahan.nama}
            luas={lahan.luas}
            lokasiKoordinat={lahan.lokasi_koordinat || ''}
          />
        </div>
      </div>
    </div>
  )
}
