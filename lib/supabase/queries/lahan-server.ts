import { createClient } from '@/lib/supabase/server'

export type Lahan = {
  id: string
  penggarap_id: string
  nama: string
  luas: number
  lokasi_koordinat: string | null
  created_at: string
}

export async function getLahanByPenggarap(penggarapId: string): Promise<Lahan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lands')
    .select('*')
    .eq('penggarap_id', penggarapId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error getLahanByPenggarap:', error)
    return []
  }
  return data || []
}

export async function getLahanById(landId: string): Promise<Lahan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lands')
    .select('*')
    .eq('id', landId)
    .single()

  if (error) {
    console.error('Error getLahanById:', error)
    return null
  }
  return data
}
