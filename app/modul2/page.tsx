'use client'
import { useEffect, useState } from 'react'

type StatusPekerjaan = 'belum_bekerja' | 'sudah_bekerja'

export default function Modul2WizardPage() {
  const [step, setStep] = useState(1)
  const [mahasiswaId] = useState('1') // sementara manual, nanti dari session login
  const [hiringTracerId, setHiringTracerId] = useState<number | null>(null)
  const [statusPekerjaan, setStatusPekerjaan] = useState<StatusPekerjaan>('belum_bekerja')

  // state lamaran
  const [lowongan, setLowongan] = useState('')
  const [tanggalMelamar, setTanggalMelamar] = useState('')
  const [statusLamaran, setStatusLamaran] = useState('diproses')
  const [jumlahLamaran, setJumlahLamaran] = useState(0)
  const [threshold, setThreshold] = useState(5)

  // state bukti kerja
  const [namaPerusahaan, setNamaPerusahaan] = useState('')
  const [bidangUsaha, setBidangUsaha] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [tanggalMulaiKerja, setTanggalMulaiKerja] = useState('')
  const [jenisBukti, setJenisBukti] = useState('kontrak_kerja')
  const [file, setFile] = useState<File | null>(null)
  // status verifikasi bukti kerja oleh admin: 'form' (belum upload/perlu upload ulang),
  // 'menunggu' (sudah upload, menunggu admin), 'revisi' (admin minta upload ulang),
  // 'terverifikasi' (admin sudah setujui, boleh lanjut ke Tracer Study)
  const [buktiKerjaStatus, setBuktiKerjaStatus] = useState<'form' | 'menunggu' | 'revisi' | 'terverifikasi'>('form')
  const [catatanBuktiKerja, setCatatanBuktiKerja] = useState('')

  // state tracer study
  const [kondisiSaatIni, setKondisiSaatIni] = useState('bekerja')
  const [waktuTungguKerja, setWaktuTungguKerja] = useState('')
  const [caraMemperolehKerja, setCaraMemperolehKerja] = useState('')
  const [kesesuaianBidang, setKesesuaianBidang] = useState('sesuai')
  const [tingkatKompetensi, setTingkatKompetensi] = useState('tinggi')
  const [rentangGaji, setRentangGaji] = useState('')
  const [saranMasukan, setSaranMasukan] = useState('')

  const [statusFinal, setStatusFinal] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm text-gray-300 mb-1'

  // ================= STEP 1: Status Pekerjaan =================
  const submitStatusPekerjaan = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/modul2/status-pekerjaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mahasiswa_id: Number(mahasiswaId), status_pekerjaan: statusPekerjaan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setHiringTracerId(data.data[0].id)
        setThreshold(data.data[0].threshold_minimal)
        setStep(2)
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  // ================= STEP 2A: Lamaran =================
  const submitLamaran = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/modul2/lamaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiring_tracer_id: hiringTracerId,
          lowongan,
          tanggal_melamar: tanggalMelamar,
          status_lamaran: statusLamaran,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setJumlahLamaran(data.jumlah_lamaran)
        setLowongan('')
        setTanggalMelamar('')
        setMessage(`Lamaran ke-${data.jumlah_lamaran} tersimpan.`)
        if (data.jumlah_lamaran >= data.threshold) {
          setTimeout(() => setStep(3), 800)
        }
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  // ================= STEP 2B: Bukti Kerja =================
  const submitBuktiKerja = async () => {
    setLoading(true)
    setMessage('')
    if (!file) {
      setMessage('Gagal: File bukti kerja wajib diupload.')
      setLoading(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append('hiring_tracer_id', String(hiringTracerId))
      formData.append('nama_perusahaan', namaPerusahaan)
      formData.append('bidang_usaha', bidangUsaha)
      formData.append('jabatan', jabatan)
      formData.append('tanggal_mulai_kerja', tanggalMulaiKerja)
      formData.append('jenis_bukti', jenisBukti)
      formData.append('file', file)

      const res = await fetch('/api/modul2/bukti-kerja', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        // jangan langsung ke Tracer Study — tunggu admin verifikasi kelengkapan bukti kerja dulu
        setBuktiKerjaStatus('menunggu')
        setCatatanBuktiKerja('')
        setMessage('')
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  // ================= Cek Status Verifikasi Bukti Kerja =================
  const cekStatusBuktiKerja = async () => {
    if (!hiringTracerId) return
    try {
      const res = await fetch(`/api/modul2/bukti-kerja/status/${hiringTracerId}`)
      const data = await res.json()
      if (!res.ok) return
      const validasi = data.data?.status_validasi as string | undefined
      setCatatanBuktiKerja(data.data?.catatan_verifikasi || '')
      if (validasi === 'valid') setBuktiKerjaStatus('terverifikasi')
      else if (validasi === 'revisi') setBuktiKerjaStatus('revisi')
      else setBuktiKerjaStatus('menunggu')
    } catch {
      // diamkan, biarkan user coba cek manual lagi
    }
  }

  // auto-poll setiap 5 detik selama masih menunggu verifikasi bukti kerja
  useEffect(() => {
    if (step !== 2 || statusPekerjaan !== 'sudah_bekerja' || buktiKerjaStatus !== 'menunggu') return
    const interval = setInterval(cekStatusBuktiKerja, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, statusPekerjaan, buktiKerjaStatus, hiringTracerId])

  // ================= STEP 3: Tracer Study =================
  const submitTracerStudy = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/modul2/tracer-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiring_tracer_id: hiringTracerId,
          kondisi_saat_ini: kondisiSaatIni,
          waktu_tunggu_kerja: waktuTungguKerja,
          cara_memperoleh_kerja: caraMemperolehKerja,
          kesesuaian_bidang: kesesuaianBidang,
          tingkat_penggunaan_kompetensi: tingkatKompetensi,
          rentang_gaji: rentangGaji,
          saran_masukan: saranMasukan,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        await cekStatusFinal()
        setStep(4)
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setLoading(false)
    }
  }

  // ================= STEP 4: Cek Status Final =================
  const cekStatusFinal = async () => {
    const res = await fetch(`/api/modul2/status/${mahasiswaId}`)
    const data = await res.json()
    if (res.ok) setStatusFinal(data.data)
  }

  const statusLabel: Record<string, string> = {
    proses_hiring: 'Proses Hiring (Belum Capai Threshold)',
    memenuhi_syarat_hiring: 'Memenuhi Syarat Hiring',
    menunggu_verifikasi_bukti_kerja: 'Menunggu Verifikasi Bukti Kerja',
    revisi_bukti_kerja: 'Revisi Bukti Kerja',
    bukti_kerja_terverifikasi: 'Bukti Kerja Terverifikasi',
    menunggu_verifikasi_tracer: 'Menunggu Verifikasi Tracer & Hiring',
    revisi_tracer: 'Revisi Tracer & Hiring',
    lolos_tracer_hiring: 'Lolos Tracer & Hiring',
  }

  const steps = ['Status Pekerjaan', statusPekerjaan === 'belum_bekerja' ? 'Lamaran Kerja' : 'Bukti Kerja', 'Tracer Study', 'Selesai']

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step > i + 1
                    ? 'bg-green-600 text-white'
                    : step === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Status Pekerjaan</h1>
            <p className="text-gray-400 text-sm">Pilih status pekerjaan kamu saat ini.</p>
            <select
              value={statusPekerjaan}
              onChange={(e) => setStatusPekerjaan(e.target.value as StatusPekerjaan)}
              className={inputClass}
            >
              <option value="belum_bekerja">Belum Bekerja</option>
              <option value="sudah_bekerja">Sudah Bekerja</option>
            </select>
            <button
              onClick={submitStatusPekerjaan}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
            >
              {loading ? 'Menyimpan...' : 'Lanjut'}
            </button>
          </div>
        )}

        {/* STEP 2A: Lamaran */}
        {step === 2 && statusPekerjaan === 'belum_bekerja' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Form Lamaran Kerja</h1>
            <p className="text-gray-400 text-sm">
              Progress: {jumlahLamaran} / {threshold} lamaran
            </p>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (jumlahLamaran / threshold) * 100)}%` }}
              />
            </div>
            <div>
              <label className={labelClass}>Nama Lowongan/Perusahaan</label>
              <input value={lowongan} onChange={(e) => setLowongan(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tanggal Melamar</label>
              <input
                type="date"
                value={tanggalMelamar}
                onChange={(e) => setTanggalMelamar(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status Lamaran</label>
              <select value={statusLamaran} onChange={(e) => setStatusLamaran(e.target.value)} className={inputClass}>
                <option value="diproses">Diproses</option>
                <option value="interview">Interview</option>
                <option value="diterima">Diterima</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
            <button
              onClick={submitLamaran}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
            >
              {loading ? 'Menyimpan...' : 'Kirim Lamaran'}
            </button>
            {jumlahLamaran >= threshold && (
              <button
                onClick={() => setStep(3)}
                className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Threshold Tercapai — Lanjut ke Tracer Study →
              </button>
            )}
          </div>
        )}

        {/* STEP 2B: Bukti Kerja — menunggu verifikasi admin */}
        {step === 2 && statusPekerjaan === 'sudah_bekerja' && buktiKerjaStatus === 'menunggu' && (
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-bold text-white">Menunggu Verifikasi</h1>
            <p className="text-gray-400 text-sm">
              Bukti kerja kamu sudah diupload dan sedang ditinjau oleh Admin Karir/BKK.
              Halaman ini akan otomatis memeriksa status setiap beberapa detik.
            </p>
            <button
              onClick={cekStatusBuktiKerja}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Cek Status Sekarang
            </button>
          </div>
        )}

        {/* STEP 2B: Bukti Kerja — sudah terverifikasi, boleh lanjut */}
        {step === 2 && statusPekerjaan === 'sudah_bekerja' && buktiKerjaStatus === 'terverifikasi' && (
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-bold text-white">Bukti Kerja Terverifikasi ✓</h1>
            <p className="text-gray-400 text-sm">
              Bukti kerja kamu sudah divalidasi oleh Admin Karir/BKK. Kamu bisa lanjut mengisi Form Tracer Study.
            </p>
            <button
              onClick={() => setStep(3)}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Lanjut ke Tracer Study →
            </button>
          </div>
        )}

        {/* STEP 2B: Bukti Kerja — form upload (awal atau setelah diminta revisi) */}
        {step === 2 && statusPekerjaan === 'sudah_bekerja' && (buktiKerjaStatus === 'form' || buktiKerjaStatus === 'revisi') && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Upload Bukti Kerja</h1>
            {buktiKerjaStatus === 'revisi' && (
              <div className="rounded-lg bg-orange-950 border border-orange-900 text-orange-300 text-sm px-3 py-2">
                <p className="font-medium">Admin meminta revisi.</p>
                {catatanBuktiKerja && <p className="mt-1">{catatanBuktiKerja}</p>}
                <p className="mt-1">Silakan lengkapi/upload ulang bukti kerja di bawah ini.</p>
              </div>
            )}
            <div>
              <label className={labelClass}>Nama Perusahaan</label>
              <input value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bidang Usaha</label>
              <input value={bidangUsaha} onChange={(e) => setBidangUsaha(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Jabatan</label>
              <input value={jabatan} onChange={(e) => setJabatan(e.target.value)} className={inputClass} />
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
              <select value={jenisBukti} onChange={(e) => setJenisBukti(e.target.value)} className={inputClass}>
                <option value="surat_keterangan_kerja">Surat Keterangan Kerja</option>
                <option value="kontrak_kerja">Kontrak Kerja</option>
                <option value="sk_pengangkatan">SK Pengangkatan</option>
                <option value="slip_gaji">Slip Gaji</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Upload File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
            <button
              onClick={submitBuktiKerja}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
            >
              {loading ? 'Mengupload...' : 'Lanjut'}
            </button>
          </div>
        )}

        {/* STEP 3: Tracer Study */}
        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Form Tracer Study</h1>
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
              <label className={labelClass}>Waktu Tunggu Kerja Pertama</label>
              <input value={waktuTungguKerja} onChange={(e) => setWaktuTungguKerja(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cara Memperoleh Pekerjaan</label>
              <input value={caraMemperolehKerja} onChange={(e) => setCaraMemperolehKerja(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kesesuaian Bidang</label>
              <select value={kesesuaianBidang} onChange={(e) => setKesesuaianBidang(e.target.value)} className={inputClass}>
                <option value="sangat_sesuai">Sangat Sesuai</option>
                <option value="sesuai">Sesuai</option>
                <option value="kurang_sesuai">Kurang Sesuai</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Rentang Gaji</label>
              <input value={rentangGaji} onChange={(e) => setRentangGaji(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Saran untuk Prodi</label>
              <textarea value={saranMasukan} onChange={(e) => setSaranMasukan(e.target.value)} rows={2} className={inputClass} />
            </div>
            <button
              onClick={submitTracerStudy}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium"
            >
              {loading ? 'Menyimpan...' : 'Submit & Selesai'}
            </button>
          </div>
        )}

        {/* STEP 4: Hasil Akhir */}
        {step === 4 && (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-bold text-white">Alur Modul 2 Selesai 🎉</h1>
            {statusFinal && (
              <div className="border border-gray-800 rounded-xl p-4 bg-gray-950/50 text-left text-sm space-y-2">
                <p className="text-gray-400">
                  Status saat ini:{' '}
                  <span className="text-blue-400 font-medium">
                    {statusLabel[statusFinal.status_modul2] || statusFinal.status_modul2}
                  </span>
                </p>
                <p className="text-gray-500 text-xs">
                  Menunggu verifikasi dari Admin Karir/BKK sebelum status berubah menjadi "Lolos Tracer & Hiring".
                </p>
              </div>
            )}
          </div>
        )}

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