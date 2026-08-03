'use client'
import { useState } from 'react'

export default function BuktiKerjaPage() {
  const [hiringTracerId, setHiringTracerId] = useState('')
  const [namaPerusahaan, setNamaPerusahaan] = useState('')
  const [bidangUsaha, setBidangUsaha] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [tanggalMulaiKerja, setTanggalMulaiKerja] = useState('')
  const [jenisBukti, setJenisBukti] = useState('kontrak_kerja')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!file) {
      setMessage('Gagal: File bukti kerja wajib diupload.')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('hiring_tracer_id', hiringTracerId)
      formData.append('nama_perusahaan', namaPerusahaan)
      formData.append('bidang_usaha', bidangUsaha)
      formData.append('jabatan', jabatan)
      formData.append('tanggal_mulai_kerja', tanggalMulaiKerja)
      formData.append('jenis_bukti', jenisBukti)
      formData.append('file', file)

      const res = await fetch('/api/modul2/bukti-kerja', {
        method: 'POST',
        body: formData, // JANGAN set Content-Type manual, browser yang atur otomatis untuk FormData
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage(`Berhasil: ${data.message}`)
        setNamaPerusahaan('')
        setBidangUsaha('')
        setJabatan('')
        setTanggalMulaiKerja('')
        setFile(null)
      }
    } catch (err) {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Upload Bukti Kerja</h1>
      <p>Untuk mahasiswa yang sudah bekerja, unggah dokumen bukti kerja di sini.</p>

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
          <label>Nama Perusahaan/Instansi:</label>
          <input
            type="text"
            value={namaPerusahaan}
            onChange={(e) => setNamaPerusahaan(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Bidang Usaha:</label>
          <input
            type="text"
            value={bidangUsaha}
            onChange={(e) => setBidangUsaha(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Jabatan:</label>
          <input
            type="text"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Tanggal Mulai Kerja:</label>
          <input
            type="date"
            value={tanggalMulaiKerja}
            onChange={(e) => setTanggalMulaiKerja(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Jenis Bukti:</label>
          <select
            value={jenisBukti}
            onChange={(e) => setJenisBukti(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            <option value="surat_keterangan_kerja">Surat Keterangan Kerja</option>
            <option value="kontrak_kerja">Kontrak Kerja</option>
            <option value="sk_pengangkatan">SK Pengangkatan</option>
            <option value="slip_gaji">Slip Gaji</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Upload File Bukti:</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Mengupload...' : 'Upload Bukti Kerja'}
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