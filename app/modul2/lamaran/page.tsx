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

  return (
    <div style={{ maxWidth: 450, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Form Lamaran Kerja</h1>
      <p>Catat setiap lowongan yang kamu lamar di sini.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Hiring Tracer ID (sementara manual):</label>
          <input
            type="number"
            value={hiringTracerId}
            onChange={(e) => setHiringTracerId(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Nama Lowongan / Perusahaan:</label>
          <input
            type="text"
            value={lowongan}
            onChange={(e) => setLowongan(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Tanggal Melamar:</label>
          <input
            type="date"
            value={tanggalMelamar}
            onChange={(e) => setTanggalMelamar(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Status Lamaran:</label>
          <select
            value={statusLamaran}
            onChange={(e) => setStatusLamaran(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            <option value="diproses">Diproses</option>
            <option value="interview">Interview</option>
            <option value="diterima">Diterima</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Menyimpan...' : 'Kirim Lamaran'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.startsWith('Gagal') ? 'red' : 'green' }}>
          {message}
        </p>
      )}

      {jumlahLamaran !== null && threshold !== null && (
        <div style={{ marginTop: 20 }}>
          <p>
            Progress: {jumlahLamaran} / {threshold} lamaran
          </p>
          <div style={{ background: '#333', borderRadius: 4, height: 12, width: '100%' }}>
            <div
              style={{
                background: persentase >= 100 ? 'limegreen' : 'dodgerblue',
                width: `${persentase}%`,
                height: '100%',
                borderRadius: 4,
              }}
            />
          </div>
          {persentase >= 100 && (
            <p style={{ color: 'limegreen', marginTop: 8 }}>
              ✅ Threshold tercapai! Status: Memenuhi Syarat Hiring
            </p>
          )}
        </div>
      )}
    </div>
  )
}