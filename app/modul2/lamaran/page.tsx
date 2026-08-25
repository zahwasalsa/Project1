'use client'
import { useState } from 'react'

export default function LamaranPage() {
  const [hiringTracerId, setHiringTracerId] = useState('')
  const [lowongan, setLowongan] = useState('')
  const [tanggalMelamar, setTanggalMelamar] = useState('')
  const [statusLamaran, setStatusLamaran] = useState('diproses')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [jumlahLamaran, setJumlahLamaran] = useState<number | null>(null)
  const [threshold, setThreshold] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/modul2/lamaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiring_tracer_id: Number(hiringTracerId),
          lowongan,
          tanggal_melamar: tanggalMelamar,
          status_lamaran: statusLamaran,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage(`Berhasil: ${data.message}`)
        setJumlahLamaran(data.jumlah_lamaran)
        setThreshold(data.threshold)
        setLowongan('')
        setTanggalMelamar('')
      }
    } catch (err) {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  const persentase =
    jumlahLamaran !== null && threshold !== null
      ? Math.min(100, Math.round((jumlahLamaran / threshold) * 100))
      : 0

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Form Lamaran Kerja</h1>
        <p className="text-gray-400 text-sm mb-6">
          Catat setiap lowongan yang kamu lamar di sini.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>
              Hiring Tracer ID <span className="text-xs text-gray-500">(sementara manual)</span>
            </label>
            <input
              type="number"
              value={hiringTracerId}
              onChange={(e) => setHiringTracerId(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nama Lowongan / Perusahaan</label>
            <input
              type="text"
              value={lowongan}
              onChange={(e) => setLowongan(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tanggal Melamar</label>
            <input
              type="date"
              value={tanggalMelamar}
              onChange={(e) => setTanggalMelamar(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Status Lamaran</label>
            <select
              value={statusLamaran}
              onChange={(e) => setStatusLamaran(e.target.value)}
              className={inputClass}
            >
              <option value="diproses">Diproses</option>
              <option value="interview">Interview</option>
              <option value="diterima">Diterima</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Kirim Lamaran'}
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

        {jumlahLamaran !== null && threshold !== null && (
          <div className="mt-5">
            <p className="text-sm text-gray-300 mb-2">
              Progress: {jumlahLamaran} / {threshold} lamaran
            </p>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  persentase >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${persentase}%` }}
              />
            </div>
            {persentase >= 100 && (
              <p className="text-green-400 text-sm mt-2">
                ✅ Threshold tercapai! Status: Memenuhi Syarat Hiring
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}