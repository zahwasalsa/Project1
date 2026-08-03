'use client'
import { useState } from 'react'

export default function VerifikasiModul2Page() {
  const [hiringTracerId, setHiringTracerId] = useState('')
  const [keputusan, setKeputusan] = useState('disetujui')
  const [catatan, setCatatan] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setResultData(null)

    try {
      const res = await fetch('/api/modul2/verifikasi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiring_tracer_id: Number(hiringTracerId),
          keputusan,
          catatan,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage(`Berhasil: ${data.message}`)
        setResultData(data.data?.[0])
        setCatatan('')
      }
    } catch (err) {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Admin — Verifikasi Tracer & Hiring</h1>
        <p className="text-gray-400 text-sm mb-6">
          Halaman ini khusus untuk Admin Karir/BKK melakukan verifikasi akhir Modul 2.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Hiring Tracer ID (mahasiswa yang diverifikasi)</label>
            <input
              type="number"
              value={hiringTracerId}
              onChange={(e) => setHiringTracerId(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Keputusan</label>
            <select value={keputusan} onChange={(e) => setKeputusan(e.target.value)} className={inputClass}>
              <option value="disetujui">Disetujui (Lolos Tracer & Hiring)</option>
              <option value="perlu_revisi">Perlu Revisi</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Catatan (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Contoh: Data lengkap dan valid / Bukti kerja kurang jelas, mohon upload ulang"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              keputusan === 'disetujui'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {loading ? 'Memproses...' : keputusan === 'disetujui' ? 'Setujui' : 'Minta Revisi'}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm rounded-lg px-3 py-2 ${
              message.startsWith('Gagal')
                ? 'bg-red-950 text-red-400 border border-red-900'
                : 'bg-green-950 text-green-400 border border-green-900'
            }`}
          >
            {message}
          </p>
        )}

        {resultData && (
          <div className="mt-4 border border-gray-800 rounded-xl p-4 bg-gray-950/50 text-sm space-y-1">
            <p>
              <span className="text-gray-400">Mahasiswa ID:</span>{' '}
              <span className="text-white">{resultData.mahasiswa_id}</span>
            </p>
            <p>
              <span className="text-gray-400">Status Modul 2 Sekarang:</span>{' '}
              <span className="text-white">{resultData.status_modul2}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}