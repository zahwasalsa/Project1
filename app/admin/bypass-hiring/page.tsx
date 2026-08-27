'use client'
import { useEffect, useState } from 'react'

type Kandidat = {
  id: number
  mahasiswa_id: number
  jumlah_lamaran_terkirim: number | null
  threshold_minimal: number | null
  periode_yudisium: string | null
  program_studi: string | null
}

export default function BypassHiringPage() {
  const [items, setItems] = useState<Kandidat[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)

  // form konfirmasi bypass (dibuka per baris)
  const [openFormId, setOpenFormId] = useState<number | null>(null)
  const [adminPelaku, setAdminPelaku] = useState('')
  const [alasan, setAlasan] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/modul2/bypass-hiring')
      const data = await res.json()
      if (res.ok) setItems(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const bukaForm = (id: number) => {
    setOpenFormId(id)
    setAdminPelaku('')
    setAlasan('')
    setMessage('')
  }

  const konfirmasiBypass = async (id: number) => {
    if (!adminPelaku.trim() || !alasan.trim()) {
      setMessage('Gagal: Nama admin dan alasan bypass wajib diisi.')
      return
    }
    setProcessingId(id)
    setMessage('')
    try {
      const res = await fetch('/api/modul2/bypass-hiring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiring_tracer_id: id, admin_pelaku: adminPelaku, alasan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage(data.message)
        setItems((prev) => prev.filter((it) => it.id !== id))
        setOpenFormId(null)
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Admin — Bypass Syarat Hiring</h1>
        <p className="text-gray-400 text-sm mb-6">
          Lewati syarat jumlah lamaran minimal untuk mahasiswa yang belum mencapai threshold
          (mis. kasus mahasiswa tidak kooperatif). Form Tracer Study tetap wajib diisi mahasiswa
          setelah bypass. Setiap bypass dicatat sebagai log (admin, waktu, alasan).
        </p>

        {message && (
          <p
            className={`mb-4 text-sm rounded-lg px-3 py-2 ${
              message.startsWith('Gagal')
                ? 'bg-red-950 text-red-400 border border-red-900'
                : 'bg-green-950 text-green-400 border border-green-900'
            }`}
          >
            {message}
          </p>
        )}

        {loading && <p className="text-gray-400 text-sm">Memuat data...</p>}
        {!loading && items.length === 0 && (
          <p className="text-gray-500 text-sm">
            Tidak ada mahasiswa berstatus &quot;Belum Capai Threshold&quot; saat ini.
          </p>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div>
                  <p className="text-white font-semibold">Mahasiswa ID: {item.mahasiswa_id}</p>
                  <p className="text-gray-400 text-sm">
                    {item.periode_yudisium ?? '-'} · {item.program_studi ?? 'Semua Prodi'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 h-fit rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">
                  Belum Capai Threshold
                </span>
              </div>

              <p className="text-sm text-gray-300 mb-3">
                Progres lamaran:{' '}
                <span className="font-semibold text-white">
                  {item.jumlah_lamaran_terkirim ?? 0} / {item.threshold_minimal ?? '-'}
                </span>
              </p>

              {openFormId !== item.id ? (
                <button
                  onClick={() => bukaForm(item.id)}
                  className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium"
                >
                  Bypass Syarat Hiring
                </button>
              ) : (
                <div className="space-y-2 border-t border-gray-800 pt-3 mt-1">
                  <input
                    placeholder="Nama/ID Admin yang melakukan bypass *"
                    value={adminPelaku}
                    onChange={(e) => setAdminPelaku(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <textarea
                    placeholder="Alasan bypass (wajib diisi) *"
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => konfirmasiBypass(item.id)}
                      disabled={processingId === item.id}
                      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium"
                    >
                      {processingId === item.id ? 'Memproses...' : 'Konfirmasi Bypass'}
                    </button>
                    <button
                      onClick={() => setOpenFormId(null)}
                      className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
