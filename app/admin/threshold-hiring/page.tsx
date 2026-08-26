'use client'
import { useEffect, useState } from 'react'

type ThresholdConfig = {
  id: number
  periode: string
  program_studi: string | null
  threshold_minimal: number
  keterangan: string | null
}

export default function ThresholdHiringPage() {
  const [items, setItems] = useState<ThresholdConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // form tambah baru
  const [periode, setPeriode] = useState('')
  const [programStudi, setProgramStudi] = useState('')
  const [thresholdMinimal, setThresholdMinimal] = useState(5)
  const [keterangan, setKeterangan] = useState('')

  // edit inline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editThreshold, setEditThreshold] = useState(5)

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/modul2/threshold-config')
      const data = await res.json()
      if (res.ok) setItems(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleTambah = async () => {
    if (!periode || !thresholdMinimal) {
      setMessage('Gagal: Periode dan threshold wajib diisi')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/modul2/threshold-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode,
          program_studi: programStudi || null,
          threshold_minimal: thresholdMinimal,
          keterangan,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setMessage('Konfigurasi threshold ditambahkan')
        setPeriode('')
        setProgramStudi('')
        setThresholdMinimal(5)
        setKeterangan('')
        fetchData()
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: number) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/modul2/threshold-config/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold_minimal: editThreshold }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(`Gagal: ${data.error}`)
      } else {
        setEditingId(null)
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus konfigurasi threshold ini?')) return
    setSaving(true)
    try {
      await fetch(`/api/modul2/threshold-config/${id}`, { method: 'DELETE' })
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Admin — Threshold Hiring</h1>
        <p className="text-gray-400 text-sm mb-6">
          Atur jumlah lamaran minimal (threshold) Campus Hiring per Periode Yudisium dan Program
          Studi. Kosongkan Program Studi jika ingin berlaku untuk semua prodi pada periode
          tersebut.
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

        {/* form tambah */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 space-y-3">
          <h2 className="text-white font-semibold text-sm mb-1">Tambah Konfigurasi Baru</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Periode Yudisium *</label>
              <input
                className={inputClass}
                placeholder="mis. 2026-Genap"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Program Studi (opsional)</label>
              <input
                className={inputClass}
                placeholder="Kosongkan = semua prodi"
                value={programStudi}
                onChange={(e) => setProgramStudi(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Threshold Minimal (jumlah lamaran) *</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={thresholdMinimal}
              onChange={(e) => setThresholdMinimal(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Keterangan (opsional)</label>
            <input
              className={inputClass}
              placeholder="mis. Kebijakan Fakultas Teknik"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>
          <button
            onClick={handleTambah}
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm"
          >
            {saving ? 'Menyimpan...' : 'Tambah Konfigurasi'}
          </button>
        </div>

        {/* daftar konfigurasi */}
        {loading && <p className="text-gray-400 text-sm">Memuat data...</p>}
        {!loading && items.length === 0 && (
          <p className="text-gray-500 text-sm">
            Belum ada konfigurasi. Mahasiswa akan memakai threshold default (5) sampai Anda
            menambahkan konfigurasi di atas.
          </p>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-white font-medium text-sm">
                  {item.periode} · {item.program_studi ?? 'Semua Program Studi'}
                </p>
                {item.keterangan && <p className="text-gray-500 text-xs mt-0.5">{item.keterangan}</p>}
              </div>

              {editingId === item.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    className="w-20 px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(Number(e.target.value))}
                  />
                  <button
                    onClick={() => handleUpdate(item.id)}
                    disabled={saving}
                    className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-blue-400 font-semibold text-sm">
                    {item.threshold_minimal} lamaran
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(item.id)
                      setEditThreshold(item.threshold_minimal)
                    }}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
