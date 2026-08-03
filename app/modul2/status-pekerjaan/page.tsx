'use client'
import { useState } from 'react'

export default function StatusPekerjaanPage() {
  const [mahasiswaId, setMahasiswaId] = useState('1')
  const [statusPekerjaan, setStatusPekerjaan] = useState('belum_bekerja')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/modul2/status-pekerjaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mahasiswa_id: Number(mahasiswaId),
          status_pekerjaan: statusPekerjaan,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage(`Berhasil: ${data.message}`)
      }
    } catch (err) {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Isi Status Pekerjaan</h1>
        <p className="text-gray-400 text-sm mb-6">
          Silakan pilih status pekerjaan kamu saat ini.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Mahasiswa ID <span className="text-xs text-gray-500">(sementara manual)</span>
            </label>
            <input
              type="number"
              value={mahasiswaId}
              onChange={(e) => setMahasiswaId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Status Pekerjaan</label>
            <select
              value={statusPekerjaan}
              onChange={(e) => setStatusPekerjaan(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="belum_bekerja">Belum Bekerja</option>
              <option value="sudah_bekerja">Sudah Bekerja</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
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
      </div>
    </div>
  )
}