'use client'
import { useState } from 'react'

export default function TracerStudyPage() {
  const [hiringTracerId, setHiringTracerId] = useState('')
  const [kondisiSaatIni, setKondisiSaatIni] = useState('bekerja')
  const [waktuTungguKerja, setWaktuTungguKerja] = useState('')
  const [caraMemperolehKerja, setCaraMemperolehKerja] = useState('')
  const [kesesuaianBidang, setKesesuaianBidang] = useState('sesuai')
  const [tingkatKompetensi, setTingkatKompetensi] = useState('tinggi')
  const [rentangGaji, setRentangGaji] = useState('')
  const [namaPerusahaan, setNamaPerusahaan] = useState('')
  const [saranMasukan, setSaranMasukan] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/modul2/tracer-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiring_tracer_id: Number(hiringTracerId),
          kondisi_saat_ini: kondisiSaatIni,
          waktu_tunggu_kerja: waktuTungguKerja,
          cara_memperoleh_kerja: caraMemperolehKerja,
          kesesuaian_bidang: kesesuaianBidang,
          tingkat_penggunaan_kompetensi: tingkatKompetensi,
          rentang_gaji: rentangGaji,
          nama_perusahaan: namaPerusahaan,
          saran_masukan: saranMasukan,
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

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-1">Form Tracer Study</h1>
        <p className="text-gray-400 text-sm mb-6">
          Wajib diisi oleh semua Calon Wisudawan, baik yang sudah maupun belum bekerja.
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
            <label className={labelClass}>Kondisi Saat Ini</label>
            <select value={kondisiSaatIni} onChange={(e) => setKondisiSaatIni(e.target.value)} className={inputClass}>
              <option value="bekerja">Bekerja</option>
              <option value="wirausaha">Wirausaha</option>
              <option value="melanjutkan_studi">Melanjutkan Studi</option>
              <option value="belum_bekerja">Belum Bekerja</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Waktu Tunggu Mendapat Pekerjaan Pertama</label>
            <input
              type="text"
              placeholder="misal: 3 bulan"
              value={waktuTungguKerja}
              onChange={(e) => setWaktuTungguKerja(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Cara Memperoleh Pekerjaan</label>
            <input
              type="text"
              placeholder="misal: Melamar mandiri, referensi, dll"
              value={caraMemperolehKerja}
              onChange={(e) => setCaraMemperolehKerja(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Kesesuaian Bidang Pekerjaan dengan Prodi</label>
            <select value={kesesuaianBidang} onChange={(e) => setKesesuaianBidang(e.target.value)} className={inputClass}>
              <option value="sangat_sesuai">Sangat Sesuai</option>
              <option value="sesuai">Sesuai</option>
              <option value="kurang_sesuai">Kurang Sesuai</option>
              <option value="tidak_sesuai">Tidak Sesuai</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tingkat Penggunaan Kompetensi Selama Kuliah</label>
            <select value={tingkatKompetensi} onChange={(e) => setTingkatKompetensi(e.target.value)} className={inputClass}>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Rentang Gaji/Pendapatan Pertama</label>
            <input
              type="text"
              placeholder="misal: 5-7 juta"
              value={rentangGaji}
              onChange={(e) => setRentangGaji(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Nama Perusahaan/Instansi (opsional)</label>
            <input
              type="text"
              value={namaPerusahaan}
              onChange={(e) => setNamaPerusahaan(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Saran/Masukan untuk Program Studi</label>
            <textarea
              value={saranMasukan}
              onChange={(e) => setSaranMasukan(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Submit Tracer Study'}
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