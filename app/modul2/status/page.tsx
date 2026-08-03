'use client'
import { useState } from 'react'

export default function StatusPage() {
  const [mahasiswaId, setMahasiswaId] = useState('1')
  const [statusData, setStatusData] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCekStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setStatusData(null)

    try {
      const res = await fetch(`/api/modul2/status/${mahasiswaId}`)
      const data = await res.json()

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setStatusData(data.data)
      }
    } catch (err) {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel: Record<string, string> = {
    belum_mengisi_status: 'Belum Mengisi Status Pekerjaan',
    proses_hiring: 'Proses Hiring (Belum Capai Threshold)',
    memenuhi_syarat_hiring: 'Memenuhi Syarat Hiring',
    menunggu_verifikasi_bukti_kerja: 'Menunggu Verifikasi Bukti Kerja',
    revisi_bukti_kerja: 'Revisi Bukti Kerja',
    bukti_kerja_terverifikasi: 'Bukti Kerja Terverifikasi',
    menunggu_pengisian_tracer: 'Menunggu Pengisian Tracer Study',
    menunggu_verifikasi_tracer: 'Menunggu Verifikasi Tracer & Hiring',
    revisi_tracer: 'Revisi Tracer & Hiring',
    lolos_tracer_hiring: 'Lolos Tracer & Hiring',
  }

  const statusBadge = (status: string) => {
    if (status === 'lolos_tracer_hiring')
      return 'bg-green-950 text-green-400 border border-green-800'
    if (status?.startsWith('revisi'))
      return 'bg-red-950 text-red-400 border border-red-800'
    return 'bg-blue-950 text-blue-400 border border-blue-800'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Status Modul 2 — Hiring & Tracer</h1>
        <p className="text-gray-400 text-sm mb-6">
          Cek status progres Campus Hiring & Tracer Study kamu di sini.
        </p>

        <form onSubmit={handleCekStatus} className="flex gap-2 mb-6">
          <input
            type="number"
            placeholder="Mahasiswa ID"
            value={mahasiswaId}
            onChange={(e) => setMahasiswaId(e.target.value)}
            required
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? 'Mencari...' : 'Cek Status'}
          </button>
        </form>

        {message && (
          <p className="text-sm rounded-lg px-3 py-2 bg-red-950 text-red-400 border border-red-900">
            {message}
          </p>
        )}

        {statusData && (
          <div className="border border-gray-800 rounded-xl p-5 bg-gray-950/50">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge(
                statusData.status_modul2
              )}`}
            >
              {statusLabel[statusData.status_modul2] || statusData.status_modul2}
            </span>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">Status Pekerjaan</span>
                <span className="text-white">{statusData.status_pekerjaan || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">Jumlah Lamaran</span>
                <span className="text-white">
                  {statusData.jumlah_lamaran_terkirim} / {statusData.threshold_minimal}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">Bypass Admin</span>
                <span className="text-white">
                  {statusData.is_bypass ? `Ya — ${statusData.bypass_alasan}` : 'Tidak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Terakhir Diperbarui</span>
                <span className="text-white">
                  {new Date(statusData.updated_at).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {statusData.status_modul2 === 'lolos_tracer_hiring' && (
              <p className="text-green-400 text-sm mt-4 text-center">
                🎉 Selamat! Kamu sudah bisa lanjut ke Modul 3 — Wisuda.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}