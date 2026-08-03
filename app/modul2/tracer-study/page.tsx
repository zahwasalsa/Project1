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

  const inputStyle = { width: '100%', padding: 8, marginTop: 4 }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Form Tracer Study</h1>
      <p>Wajib diisi oleh semua Calon Wisudawan, baik yang sudah maupun belum bekerja.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Hiring Tracer ID (sementara manual):</label>
          <input
            type="number"
            value={hiringTracerId}
            onChange={(e) => setHiringTracerId(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Kondisi Saat Ini:</label>
          <select value={kondisiSaatIni} onChange={(e) => setKondisiSaatIni(e.target.value)} style={inputStyle}>
            <option value="bekerja">Bekerja</option>
            <option value="wirausaha">Wirausaha</option>
            <option value="melanjutkan_studi">Melanjutkan Studi</option>
            <option value="belum_bekerja">Belum Bekerja</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Waktu Tunggu Mendapat Pekerjaan Pertama:</label>
          <input
            type="text"
            placeholder="misal: 3 bulan"
            value={waktuTungguKerja}
            onChange={(e) => setWaktuTungguKerja(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Cara Memperoleh Pekerjaan:</label>
          <input
            type="text"
            placeholder="misal: Melamar mandiri, referensi, dll"
            value={caraMemperolehKerja}
            onChange={(e) => setCaraMemperolehKerja(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Kesesuaian Bidang Pekerjaan dengan Prodi:</label>
          <select value={kesesuaianBidang} onChange={(e) => setKesesuaianBidang(e.target.value)} style={inputStyle}>
            <option value="sangat_sesuai">Sangat Sesuai</option>
            <option value="sesuai">Sesuai</option>
            <option value="kurang_sesuai">Kurang Sesuai</option>
            <option value="tidak_sesuai">Tidak Sesuai</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Tingkat Penggunaan Kompetensi Selama Kuliah:</label>
          <select value={tingkatKompetensi} onChange={(e) => setTingkatKompetensi(e.target.value)} style={inputStyle}>
            <option value="tinggi">Tinggi</option>
            <option value="sedang">Sedang</option>
            <option value="rendah">Rendah</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Rentang Gaji/Pendapatan Pertama:</label>
          <input
            type="text"
            placeholder="misal: 5-7 juta"
            value={rentangGaji}
            onChange={(e) => setRentangGaji(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Nama Perusahaan/Instansi (opsional):</label>
          <input
            type="text"
            value={namaPerusahaan}
            onChange={(e) => setNamaPerusahaan(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Saran/Masukan untuk Program Studi:</label>
          <textarea
            value={saranMasukan}
            onChange={(e) => setSaranMasukan(e.target.value)}
            rows={3}
            style={inputStyle}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Menyimpan...' : 'Submit Tracer Study'}
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