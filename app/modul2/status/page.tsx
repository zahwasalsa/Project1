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
    lolos_tracer_hiring: 'Lolos Tracer & Hiring ✅',
  }

  const statusColor = (status: string) => {
    if (status === 'lolos_tracer_hiring') return 'limegreen'
    if (status?.startsWith('revisi')) return 'orangered'
    return 'dodgerblue'
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Status Modul 2 — Hiring & Tracer</h1>
      <p>Cek status progres Campus Hiring & Tracer Study kamu di sini.</p>

      <form onSubmit={handleCekStatus} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="number"
          placeholder="Mahasiswa ID"
          value={mahasiswaId}
          onChange={(e) => setMahasiswaId(e.target.value)}
          required
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Mencari...' : 'Cek Status'}
        </button>
      </form>

      {message && <p style={{ color: 'red' }}>{message}</p>}

      {statusData && (
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <h3>
            Status:{' '}
            <span style={{ color: statusColor(statusData.status_modul2) }}>
              {statusLabel[statusData.status_modul2] || statusData.status_modul2}
            </span>
          </h3>

          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', opacity: 0.7 }}>Status Pekerjaan</td>
                <td>{statusData.status_pekerjaan || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', opacity: 0.7 }}>Jumlah Lamaran</td>
                <td>
                  {statusData.jumlah_lamaran_terkirim} / {statusData.threshold_minimal}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', opacity: 0.7 }}>Bypass Admin</td>
                <td>{statusData.is_bypass ? `Ya — ${statusData.bypass_alasan}` : 'Tidak'}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', opacity: 0.7 }}>Terakhir Diperbarui</td>
                <td>{new Date(statusData.updated_at).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          {statusData.status_modul2 === 'lolos_tracer_hiring' && (
            <p style={{ color: 'limegreen', marginTop: 16 }}>
              🎉 Selamat! Kamu sudah bisa lanjut ke Modul 3 — Wisuda.
            </p>
          )}
        </div>
      )}
    </div>
  )
}