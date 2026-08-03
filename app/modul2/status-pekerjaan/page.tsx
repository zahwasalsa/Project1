'use client'
import { useState } from 'react'

export default function StatusPekerjaanPage() {
  const [mahasiswaId, setMahasiswaId] = useState('1') // sementara manual, nanti diganti dari session login
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
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Isi Status Pekerjaan</h1>
      <p>Silakan pilih status pekerjaan kamu saat ini.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Mahasiswa ID (sementara manual):</label>
          <input
            type="number"
            value={mahasiswaId}
            onChange={(e) => setMahasiswaId(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Status Pekerjaan:</label>
          <select
            value={statusPekerjaan}
            onChange={(e) => setStatusPekerjaan(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            <option value="belum_bekerja">Belum Bekerja</option>
            <option value="sudah_bekerja">Sudah Bekerja</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.startsWith('Gagal') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
    </div>
  )
}