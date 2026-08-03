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

  const inputStyle = { width: '100%', padding: 8, marginTop: 4 }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Admin — Verifikasi Tracer & Hiring</h1>
      <p style={{ opacity: 0.8 }}>
        Halaman ini khusus untuk Admin Karir/BKK melakukan verifikasi akhir Modul 2.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Hiring Tracer ID (mahasiswa yang diverifikasi):</label>
          <input
            type="number"
            value={hiringTracerId}
            onChange={(e) => setHiringTracerId(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Keputusan:</label>
          <select value={keputusan} onChange={(e) => setKeputusan(e.target.value)} style={inputStyle}>
            <option value="disetujui">Disetujui (Lolos Tracer & Hiring)</option>
            <option value="perlu_revisi">Perlu Revisi</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Catatan (opsional):</label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Contoh: Data lengkap dan valid / Bukti kerja kurang jelas, mohon upload ulang"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: keputusan === 'disetujui' ? 'limegreen' : 'orangered',
            color: 'black',
            border: 'none',
            borderRadius: 4,
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Memproses...' : keputusan === 'disetujui' ? 'Setujui' : 'Minta Revisi'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.startsWith('Gagal') ? 'red' : 'green' }}>
          {message}
        </p>
      )}

      {resultData && (
        <div style={{ marginTop: 16, border: '1px solid #444', borderRadius: 8, padding: 12 }}>
          <p>
            <strong>Mahasiswa ID:</strong> {resultData.mahasiswa_id}
          </p>
          <p>
            <strong>Status Modul 2 Sekarang:</strong> {resultData.status_modul2}
          </p>
        </div>
      )}
    </div>
  )
}