// app/api/modul2/threshold-config/route.ts
// CRUD konfigurasi threshold minimal Hiring per Periode & Program Studi (Admin).
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('threshold_hiring_config')
    .select('*')
    .order('periode', { ascending: false })
    .order('program_studi', { ascending: true, nullsFirst: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const { periode, program_studi, threshold_minimal, keterangan } = await req.json()

  if (!periode || !threshold_minimal) {
    return NextResponse.json({ error: 'periode dan threshold_minimal wajib diisi' }, { status: 400 })
  }
  if (Number(threshold_minimal) <= 0) {
    return NextResponse.json({ error: 'threshold_minimal harus lebih dari 0' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('threshold_hiring_config')
    .insert([
      {
        periode,
        program_studi: program_studi || null, // kosong = berlaku semua prodi
        threshold_minimal: Number(threshold_minimal),
        keterangan: keterangan || null,
      },
    ])
    .select()

  if (error) {
    // unique constraint (periode, program_studi) sudah ada
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Konfigurasi untuk periode & program studi ini sudah ada. Silakan edit yang sudah ada.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Konfigurasi threshold ditambahkan', data }, { status: 201 })
}
