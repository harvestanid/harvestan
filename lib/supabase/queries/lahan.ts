// lib/supabase/queries/lahan.ts
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getLahanByPenggarapId(penggarapId: number) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('lands')
    .select('*')
    .eq('penggarap_id', penggarapId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching lahan:', error)
    return []
  }
  return data
}

export async function getLahanById(landId: number) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('lands')
    .select('*')
    .eq('id', landId)
    .single()

  if (error) {
    console.error('Error fetching lahan by id:', error)
    return null
  }
  return data
}

export async function createLahan(penggarapId: number, lahanData: { nama: string; luas: number; lokasi_koordinat?: string }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('lands')
    .insert({
      penggarap_id: penggarapId,
      nama: lahanData.nama,
      luas: lahanData.luas,
      lokasi_koordinat: lahanData.lokasi_koordinat || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating lahan:', error)
    return { error: error.message }
  }
  return { data }
}

export async function updateLahan(landId: number, lahanData: { nama?: string; luas?: number; lokasi_koordinat?: string }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('lands')
    .update(lahanData)
    .eq('id', landId)
    .select()
    .single()

  if (error) {
    console.error('Error updating lahan:', error)
    return { error: error.message }
  }
  return { data }
}

export async function deleteLahan(landId: number) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('lands')
    .delete()
    .eq('id', landId)

  if (error) {
    console.error('Error deleting lahan:', error)
    return { error: error.message }
  }
  return { success: true }
}
