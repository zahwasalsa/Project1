import { supabase } from '@/app/lib/supabase'
import { resolveThresholdMinimal } from '@/app/lib/threshold'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { mahasiswa_id, status_pekerjaan, periode_yudisium, program_studi } = await req.json()

  if (!mahasiswa_id || !status_pekerjaan) {
    return NextResponse.json({ error: 'mahasiswa_id dan status_pekerjaan wajib diisi' }, { status: 400 })
  }

  const statusAwal =
    status_pekerjaan === 'belum_bekerja' ? 'proses_hiring' : 'menunggu_verifikasi_bukti_kerja'

  // Threshold di-snapshot saat ini (bukan dibaca ulang tiap saat), supaya kalau admin
  // mengubah konfigurasi setelahnya, mahasiswa yang sudah berjalan tidak ikut berubah target.
  const thresholdMinimal = await resolveThresholdMinimal(periode_yudisium, program_studi)

  const { data, error } = await supabase
    .from('hiring_tracer')
    .insert([
      {
        mahasiswa_id,
        status_pekerjaan,
        status_modul2: statusAwal,
        periode_yudisium: periode_yudisium || null,
        program_studi: program_studi || null,
        threshold_minimal: thresholdMinimal,
      },
    ])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Status pekerjaan tersimpan', data }, { status: 201 })
}
