// app/api/modul2/lamaran/route.ts
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { hiring_tracer_id, lowongan, tanggal_melamar, status_lamaran } = await req.json()

  // simpan lamaran baru
  const { error: insertError } = await supabase
    .from('lamaran_hiring')
    .insert([{ hiring_tracer_id, lowongan, tanggal_melamar, status_lamaran }])

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  // hitung ulang total lamaran mahasiswa ini
  const { count } = await supabase
    .from('lamaran_hiring')
    .select('*', { count: 'exact', head: true })
    .eq('hiring_tracer_id', hiring_tracer_id)

  // ambil threshold minimal
  const { data: tracerData } = await supabase
    .from('hiring_tracer')
    .select('threshold_minimal')
    .eq('id', hiring_tracer_id)
    .single()

  const threshold = tracerData?.threshold_minimal ?? 5
  const sudahCapaiThreshold = (count ?? 0) >= threshold

  // update jumlah lamaran & status otomatis
  const { data, error } = await supabase
    .from('hiring_tracer')
    .update({
      jumlah_lamaran_terkirim: count,
      status_modul2: sudahCapaiThreshold ? 'memenuhi_syarat_hiring' : 'proses_hiring',
      updated_at: new Date().toISOString(),
    })
    .eq('id', hiring_tracer_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Lamaran tersimpan', jumlah_lamaran: count, threshold, data })
}