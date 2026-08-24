// app/api/modul2/bukti-kerja/verifikasi/route.ts
// Dipakai Admin Karir/BKK untuk memvalidasi kelengkapan Bukti Kerja
// (jalur "Sudah Bekerja" di Diagram 3a) sebelum mahasiswa boleh lanjut ke Form Tracer Study.
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

type Keputusan = 'valid' | 'revisi'

export async function PATCH(req: Request) {
  const { bukti_kerja_id, keputusan, catatan } = (await req.json()) as {
    bukti_kerja_id: number
    keputusan: Keputusan
    catatan?: string
  }

  if (!bukti_kerja_id || !keputusan) {
    return NextResponse.json({ error: 'bukti_kerja_id dan keputusan wajib diisi' }, { status: 400 })
  }
  if (keputusan !== 'valid' && keputusan !== 'revisi') {
    return NextResponse.json({ error: 'keputusan harus "valid" atau "revisi"' }, { status: 400 })
  }

  // ambil bukti kerja untuk tahu hiring_tracer_id terkait
  const { data: bukti, error: buktiFindError } = await supabase
    .from('bukti_kerja')
    .select('id, hiring_tracer_id')
    .eq('id', bukti_kerja_id)
    .single()

  if (buktiFindError || !bukti) {
    return NextResponse.json({ error: 'Data bukti kerja tidak ditemukan' }, { status: 404 })
  }

  // update status_validasi pada bukti_kerja
  const updateBukti: Record<string, unknown> = { status_validasi: keputusan }
  if (catatan !== undefined) updateBukti.catatan_verifikasi = catatan

  const { error: buktiUpdateError } = await supabase
    .from('bukti_kerja')
    .update(updateBukti)
    .eq('id', bukti_kerja_id)

  if (buktiUpdateError) {
    return NextResponse.json({ error: buktiUpdateError.message }, { status: 400 })
  }

  // update status_modul2 pada hiring_tracer sesuai keputusan
  const statusModul2 = keputusan === 'valid' ? 'bukti_kerja_terverifikasi' : 'revisi_bukti_kerja'

  const { data, error } = await supabase
    .from('hiring_tracer')
    .update({ status_modul2: statusModul2, updated_at: new Date().toISOString() })
    .eq('id', bukti.hiring_tracer_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    message:
      keputusan === 'valid'
        ? 'Bukti kerja dinyatakan valid. Mahasiswa dapat lanjut ke Form Tracer Study.'
        : 'Mahasiswa diminta mengunggah ulang bukti kerja.',
    data,
  })
}
