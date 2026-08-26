// app/api/modul2/threshold-config/[id]/route.ts
import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.periode !== undefined) updateData.periode = body.periode
  if (body.program_studi !== undefined) updateData.program_studi = body.program_studi || null
  if (body.threshold_minimal !== undefined) {
    if (Number(body.threshold_minimal) <= 0) {
      return NextResponse.json({ error: 'threshold_minimal harus lebih dari 0' }, { status: 400 })
    }
    updateData.threshold_minimal = Number(body.threshold_minimal)
  }
  if (body.keterangan !== undefined) updateData.keterangan = body.keterangan || null
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('threshold_hiring_config')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Konfigurasi threshold diperbarui', data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase.from('threshold_hiring_config').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ message: 'Konfigurasi threshold dihapus' })
}
