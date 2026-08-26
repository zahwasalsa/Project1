// app/lib/threshold.ts
// Helper untuk menentukan threshold minimal jumlah lamaran Hiring yang berlaku
// bagi seorang mahasiswa, berdasarkan konfigurasi Admin per Periode & Program Studi
// (lihat tabel threshold_hiring_config). Dipakai saat mahasiswa pertama kali
// mengisi status pekerjaan, supaya nilainya "ter-snapshot" di hiring_tracer.threshold_minimal.
import { supabase } from '@/app/lib/supabase'

// Dipakai HANYA jika admin belum membuat konfigurasi apapun sama sekali.
export const DEFAULT_THRESHOLD_MINIMAL = 5

export async function resolveThresholdMinimal(
  periode?: string | null,
  programStudi?: string | null
): Promise<number> {
  if (periode) {
    // 1) coba cocokkan periode + program studi spesifik
    if (programStudi) {
      const { data: exact } = await supabase
        .from('threshold_hiring_config')
        .select('threshold_minimal')
        .eq('periode', periode)
        .eq('program_studi', programStudi)
        .maybeSingle()
      if (exact?.threshold_minimal) return exact.threshold_minimal
    }

    // 2) coba cocokkan periode saja, dengan program_studi kosong (berlaku semua prodi)
    const { data: periodeOnly } = await supabase
      .from('threshold_hiring_config')
      .select('threshold_minimal')
      .eq('periode', periode)
      .is('program_studi', null)
      .maybeSingle()
    if (periodeOnly?.threshold_minimal) return periodeOnly.threshold_minimal
  }

  // 3) fallback tetap, dipakai kalau admin belum mengatur apapun
  return DEFAULT_THRESHOLD_MINIMAL
}
