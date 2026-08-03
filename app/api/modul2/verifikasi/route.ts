import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const { hiring_tracer_id, keputusan, catatan } = await req.json()

  if (!hiring_tracer_id || !keputusan) {
    return NextResponse.json({ error: 'hiring_tracer_id dan keputusan wajib diisi' }, { status: 400 })
  }

  const { error: tracerError } = await supabase
    .from('tracer_study')
    .update({ status_verifikasi: keputusan })
    .eq('hiring_tracer_id', hiring_tracer_id)

  if (tracerError) return NextResponse.json({ error: tracerError.message }, { status: 400 })

  const statusFinal = keputusan === 'disetujui' ? 'lolos_tracer_hiring' : 'revisi_tracer'

  const { data, error } = await supabase
    .from('hiring_tracer')
    .update({ status_modul2: statusFinal, updated_at: new Date().toISOString() })
    .eq('id', hiring_tracer_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    message: keputusan === 'disetujui' ? 'Mahasiswa Lolos Tracer & Hiring' : 'Diminta revisi',
    data,
  })
}