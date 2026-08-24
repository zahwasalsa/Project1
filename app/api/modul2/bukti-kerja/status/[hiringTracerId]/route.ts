// app/api/modul2/bukti-kerja/status/[hiringTracerId]/route.ts
// Dipakai mahasiswa (jalur "Sudah Bekerja") untuk mengecek apakah bukti kerja
// yang diupload sudah diverifikasi admin, dan membaca catatan revisi jika ada.
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ hiringTracerId: string }> }
) {
  const { hiringTracerId } = await params

  const { data, error } = await supabase
    .from('bukti_kerja')
    .select('*')
    .eq('hiring_tracer_id', hiringTracerId)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Belum ada bukti kerja yang diupload' }, { status: 404 })

  return NextResponse.json({ data })
}
