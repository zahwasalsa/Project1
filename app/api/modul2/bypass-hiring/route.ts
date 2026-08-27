// app/api/modul2/bypass-hiring/route.ts
// Fitur Bypass Admin (Bagian 9b): khusus melewati syarat threshold jumlah lamaran Hiring.
// Form Tracer Study TETAP wajib diisi mahasiswa setelah bypass — bypass hanya melewati
// syarat jumlah lamaran, bukan seluruh Modul 2.
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/modul2/bypass-hiring
// Daftar mahasiswa jalur "Belum Bekerja" yang berstatus "Belum Capai Threshold" (proses_hiring),
// jadi kandidat yang bisa di-bypass oleh admin.
export async function GET() {
  const { data, error } = await supabase
    .from('hiring_tracer')
    .select('*')
    .eq('status_pekerjaan', 'belum_bekerja')
    .eq('status_modul2', 'proses_hiring')
    .order('id', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// PATCH /api/modul2/bypass-hiring
// body: { hiring_tracer_id, admin_pelaku, alasan }
// Admin wajib mengisi alasan. Sistem mencatat siapa, kapan, dan alasan bypass sebagai log.
export async function PATCH(req: Request) {
  const { hiring_tracer_id, admin_pelaku, alasan } = (await req.json()) as {
    hiring_tracer_id: number
    admin_pelaku: string
    alasan: string
  }

  if (!hiring_tracer_id || !admin_pelaku?.trim() || !alasan?.trim()) {
    return NextResponse.json(
      { error: 'hiring_tracer_id, admin_pelaku, dan alasan wajib diisi' },
      { status: 400 }
    )
  }

  // pastikan hanya bisa bypass mahasiswa yang memang masih "proses_hiring"
  const { data: current, error: findError } = await supabase
    .from('hiring_tracer')
    .select('id, status_modul2')
    .eq('id', hiring_tracer_id)
    .single()

  if (findError || !current) {
    return NextResponse.json({ error: 'Data mahasiswa tidak ditemukan' }, { status: 404 })
  }
  if (current.status_modul2 !== 'proses_hiring') {
    return NextResponse.json(
      { error: 'Mahasiswa ini tidak dalam status "Belum Capai Threshold", bypass tidak dapat dilakukan.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('hiring_tracer')
    .update({
      status_modul2: 'bypass_admin_hiring',
      bypass_admin: admin_pelaku.trim(),
      bypass_alasan: alasan.trim(),
      bypass_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', hiring_tracer_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    message: 'Syarat threshold Hiring berhasil di-bypass. Mahasiswa tetap wajib mengisi Form Tracer Study.',
    data,
  })
}
