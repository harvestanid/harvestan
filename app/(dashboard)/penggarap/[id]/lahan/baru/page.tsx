import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function tambahLahan(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const penggarap_id = formData.get('penggarap_id') as string
  const nama = formData.get('nama') as string
  const luas = parseFloat(formData.get('luas') as string)
  const lokasi_koordinat = formData.get('lokasi_koordinat') as string

  if (!penggarap_id || !nama || isNaN(luas)) {
    redirect(`/penggarap/${penggarap_id}/lahan/baru?error=Data+tidak+lengkap`)
  }

  const { error } = await supabase.from('lands').insert({
    penggarap_id,
    nama,
    luas,
    lokasi_koordinat: lokasi_koordinat || null,
  })

  if (error) {
    redirect(`/penggarap/${penggarap_id}/lahan/baru?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/penggarap/${penggarap_id}`)
}

export default async function TambahLahanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: penggarap } = await supabase
    .from('penggaraps')
    .select('id, nama')
    .eq('id', id)
    .single()

  if (!penggarap) redirect('/penggarap')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/penggarap/${id}`}
          className="text-green-700 hover:text-green-800 text-sm font-medium"
        >
          ← Kembali ke {penggarap.nama}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          🗺️ Tambah Lahan Baru
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Untuk penggarap: <strong>{penggarap.nama}</strong>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form action={tambahLahan} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <input type="hidden" name="penggarap_id" value={id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lahan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nama"
            required
            placeholder="Contoh: Sawah Utama, Kebun Belakang"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Luas (Hektar) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="luas"
            step="0.01"
            min="0.01"
            required
            placeholder="Contoh: 1.5"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Koordinat GPS (opsional)
          </label>
          <input
            type="text"
            name="lokasi_koordinat"
            placeholder="Contoh: -6.994303,112.174348"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            📍 Format: latitude,longitude (bisa copy dari Google Maps)
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            💾 Simpan Lahan
          </button>
          <Link
            href={`/penggarap/${id}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
