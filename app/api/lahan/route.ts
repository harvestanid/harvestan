import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { penggarap_id, nama, luas, lokasi_koordinat } = body

    if (!penggarap_id || !nama || !luas) {
      return NextResponse.json(
        { error: 'penggarap_id, nama, dan luas wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('lands')
      .insert({
        penggarap_id,
        nama,
        luas: parseFloat(luas),
        lokasi_koordinat: lokasi_koordinat || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error insert lahan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
