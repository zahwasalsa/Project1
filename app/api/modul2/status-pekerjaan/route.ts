import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { mahasiswa_id, status_pekerjaan } = await req.json()

  if (!mahasiswa_id || !status_pekerjaan) {
    return NextResponse.json({ error: 'mahasiswa_id dan status_pekerjaan wajib diisi' }, { status: 400 })
  }

  const statusAwal =
    status_pekerjaan === 'belum_bekerja' ? 'proses_hiring' : 'menunggu_verifikasi_bukti_kerja'

  const { data, error } = await supabase
    .from('hiring_tracer')
    .insert([{ mahasiswa_id, status_pekerjaan, status_modul2: statusAwal }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Status pekerjaan tersimpan', data }, { status: 201 })
}