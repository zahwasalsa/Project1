// app/api/modul2/tracer-study/route.ts
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { hiring_tracer_id, ...tracerData } = body

  const { error: insertError } = await supabase
    .from('tracer_study')
    .insert([{ hiring_tracer_id, ...tracerData, status_verifikasi: 'menunggu' }])

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  const { data, error } = await supabase
    .from('hiring_tracer')
    .update({ status_modul2: 'menunggu_verifikasi_tracer', updated_at: new Date().toISOString() })
    .eq('id', hiring_tracer_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Form Tracer Study tersimpan', data })
}