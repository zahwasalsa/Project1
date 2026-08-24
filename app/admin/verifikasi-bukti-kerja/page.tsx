'use client'
import { useEffect, useState } from 'react'

type BuktiKerja = {
  id: number
  hiring_tracer_id: number
  mahasiswa_id: number | null
  nama_perusahaan: string
  bidang_usaha: string
  jabatan: string
  tanggal_mulai_kerja: string
  jenis_bukti: string
  file_url: string
  status_validasi: string
}

const jenisBuktiLabel: Record<string, string> = {
  surat_keterangan_kerja: 'Surat Keterangan Kerja',
  kontrak_kerja: 'Kontrak Kerja',
  sk_pengangkatan: 'SK Pengangkatan',
  slip_gaji: 'Slip Gaji',
}

export default function VerifikasiBuktiKerjaPage() {
  const [items, setItems] = useState<BuktiKerja[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [catatanMap, setCatatanMap] = useState<Record<number, string>>({})
  const [message, setMessage] = useState('')

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/modul2/bukti-kerja?status=menunggu')
      const data = await res.json()
      if (res.ok) setItems(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleVerifikasi = async (buktiKerjaId: number, keputusan: 'valid' | 'revisi') => {
    setProcessingId(buktiKerjaId)
    setMessage('')
    try {
      const res = await fetch('/api/modul2/bukti-kerja/verifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bukti_kerja_id: buktiKerjaId,
          keputusan,
          catatan: catatanMap[buktiKerjaId] || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage(data.message)
        setItems((prev) => prev.filter((it) => it.id !== buktiKerjaId))
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Admin — Verifikasi Bukti Kerja</h1>
        <p className="text-gray-400 text-sm mb-6">
          Validasi kelengkapan bukti kerja mahasiswa jalur &quot;Sudah Bekerja&quot; sebelum mereka
          dapat lanjut mengisi Form Tracer Study.
        </p>

        {message && (
          <p
            className={`mb-4 text-sm rounded-lg px-3 py-2 ${
              message.startsWith('Gagal')
                ? 'bg-red-950 text-red-400 border border-red-900'
                : 'bg-green-950 text-green-400 border border-green-900'
            }`}
          >
            {message}
          </p>
        )}

        {loading && <p className="text-gray-400 text-sm">Memuat data...</p>}

        {!loading && items.length === 0 && (
          <p className="text-gray-500 text-sm">Tidak ada bukti kerja yang menunggu verifikasi saat ini.</p>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div>
                  <p className="text-white font-semibold">{item.nama_perusahaan}</p>
                  <p className="text-gray-400 text-sm">
                    {item.jabatan} · {item.bidang_usaha}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 h-fit rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">
                  Menunggu verifikasi
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-y-1 text-sm mb-3">
                <dt className="text-gray-500">Mahasiswa ID</dt>
                <dd className="text-gray-300">{item.mahasiswa_id ?? '-'}</dd>
                <dt className="text-gray-500">Tanggal Mulai Kerja</dt>
                <dd className="text-gray-300">{item.tanggal_mulai_kerja}</dd>
                <dt className="text-gray-500">Jenis Bukti</dt>
                <dd className="text-gray-300">{jenisBuktiLabel[item.jenis_bukti] ?? item.jenis_bukti}</dd>
              </dl>

              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-400 hover:text-blue-300 underline mb-3"
              >
                Lihat file bukti kerja →
              </a>

              <textarea
                placeholder="Catatan (opsional, terutama isi jika minta revisi)"
                value={catatanMap[item.id] || ''}
                onChange={(e) => setCatatanMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleVerifikasi(item.id, 'valid')}
                  disabled={processingId === item.id}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {processingId === item.id ? 'Memproses...' : 'Valid / Lengkap'}
                </button>
                <button
                  onClick={() => handleVerifikasi(item.id, 'revisi')}
                  disabled={processingId === item.id}
                  className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {processingId === item.id ? 'Memproses...' : 'Minta Revisi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
