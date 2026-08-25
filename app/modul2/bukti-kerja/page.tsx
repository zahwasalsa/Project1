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
        body: formData,
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

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Upload Bukti Kerja</h1>
        <p className="text-gray-400 text-sm mb-6">
          Untuk mahasiswa yang sudah bekerja, unggah dokumen bukti kerja di sini.
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
            <label className={labelClass}>Nama Perusahaan/Instansi</label>
            <input
              type="text"
              value={namaPerusahaan}
              onChange={(e) => setNamaPerusahaan(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Bidang Usaha</label>
            <input
              type="text"
              value={bidangUsaha}
              onChange={(e) => setBidangUsaha(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Jabatan</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tanggal Mulai Kerja</label>
            <input
              type="date"
              value={tanggalMulaiKerja}
              onChange={(e) => setTanggalMulaiKerja(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Jenis Bukti</label>
            <select
              value={jenisBukti}
              onChange={(e) => setJenisBukti(e.target.value)}
              className={inputClass}
            >
              <option value="surat_keterangan_kerja">Surat Keterangan Kerja</option>
              <option value="kontrak_kerja">Kontrak Kerja</option>
              <option value="sk_pengangkatan">SK Pengangkatan</option>
              <option value="slip_gaji">Slip Gaji</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Upload File Bukti</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              required
              className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 file:cursor-pointer cursor-pointer bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? 'Mengupload...' : 'Upload Bukti Kerja'}
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