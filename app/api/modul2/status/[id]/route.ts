import { supabase } from '@/app/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('hiring_tracer')
    .select('*')
    .eq('mahasiswa_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  return NextResponse.json({ data })
}