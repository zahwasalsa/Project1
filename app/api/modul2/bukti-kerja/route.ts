// app/api/modul2/bukti-kerja/route.ts
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/modul2/bukti-kerja?status=menunggu
// Dipakai halaman admin untuk menampilkan daftar bukti kerja yang perlu diverifikasi.
// Default hanya mengambil yang status_validasi = 'menunggu'.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'menunggu'

  const { data: buktiList, error: buktiError } = await supabase
    .from('bukti_kerja')
    .select('*')
    .eq('status_validasi', status)
    .order('id', { ascending: false })

  if (buktiError) return NextResponse.json({ error: buktiError.message }, { status: 400 })
  if (!buktiList || buktiList.length === 0) return NextResponse.json({ data: [] })

  // ambil info mahasiswa terkait dari hiring_tracer (query terpisah, tanpa bergantung
  // pada relasi FK otomatis Supabase, supaya tidak error kalau relasi belum dikonfigurasi)
  const hiringTracerIds = [...new Set(buktiList.map((b) => b.hiring_tracer_id))]
  const { data: tracerList, error: tracerError } = await supabase
    .from('hiring_tracer')
    .select('id, mahasiswa_id, status_pekerjaan, status_modul2')
    .in('id', hiringTracerIds)

  if (tracerError) return NextResponse.json({ error: tracerError.message }, { status: 400 })

  const tracerMap = new Map((tracerList ?? []).map((t) => [t.id, t]))
  const data = buktiList.map((b) => ({
    ...b,
    mahasiswa_id: tracerMap.get(b.hiring_tracer_id)?.mahasiswa_id ?? null,
    status_modul2: tracerMap.get(b.hiring_tracer_id)?.status_modul2 ?? null,
  }))

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const hiring_tracer_id = formData.get('hiring_tracer_id') as string
  const nama_perusahaan = formData.get('nama_perusahaan') as string
  const bidang_usaha = formData.get('bidang_usaha') as string
  const jabatan = formData.get('jabatan') as string
  const tanggal_mulai_kerja = formData.get('tanggal_mulai_kerja') as string
  const jenis_bukti = formData.get('jenis_bukti') as string
 const file = formData.get('file') as File | null

if (!file) {
  return NextResponse.json({ error: 'File tidak ditemukan di request. Pastikan field bernama "file" dan menggunakan form-data.' }, { status: 400 })
}

  // upload file ke Storage
  const fileName = `${hiring_tracer_id}-${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('bukti-kerja-hiring')
    .upload(fileName, file)

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: urlData } = supabase.storage.from('bukti-kerja-hiring').getPublicUrl(fileName)

  // simpan data bukti kerja
  const { error: insertError } = await supabase.from('bukti_kerja').insert([
    {
      hiring_tracer_id,
      nama_perusahaan,
      bidang_usaha,
      jabatan,
      tanggal_mulai_kerja,
      jenis_bukti,
      file_url: urlData.publicUrl,
      status_validasi: 'menunggu',
    },
  ])

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  // update status di hiring_tracer
  const { data, error } = await supabase
    .from('hiring_tracer')
    .update({ status_modul2: 'menunggu_verifikasi_bukti_kerja', updated_at: new Date().toISOString() })
    .eq('id', hiring_tracer_id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Bukti kerja terupload', data })
}