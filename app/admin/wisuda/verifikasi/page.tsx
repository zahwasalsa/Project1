"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type WisudaRow = {
  id: string;
  mahasiswa_id: string;
  bersedia_hadir: boolean;
  file_foto: string | null;
  ukuran_toga: string | null;
  quote_wisuda: string | null;
  status_validasi_buku: "menunggu" | "revisi" | "lengkap";
  catatan_validasi_buku: string | null;
  profiles: {
    nama_lengkap: string | null;
    nim: string | null;
    program_studi: string | null;
    email: string;
  } | null;
};

export default function VerifikasiBukuWisudaPage() {
  const [data, setData] = useState<WisudaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [catatanInput, setCatatanInput] = useState<{ [key: string]: string }>({});
  const [filter, setFilter] = useState<"menunggu" | "revisi" | "lengkap" | "semua">("menunggu");

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("wisuda")
      .select(
        "id, mahasiswa_id, bersedia_hadir, file_foto, ukuran_toga, quote_wisuda, status_validasi_buku, catatan_validasi_buku, profiles!mahasiswa_id ( nama_lengkap, nim, program_studi, email )"
      )
      .eq("bersedia_hadir", true) // mahasiswa In Absentia melewati tahap ini
      .order("id", { ascending: false });

    if (filter !== "semua") {
      query = query.eq("status_validasi_buku", filter);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Gagal mengambil data buku wisuda:", error.message);
    } else {
      setData((rows as unknown as WisudaRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleVerifikasi = async (id: string, status: "lengkap" | "revisi") => {
    setProcessingId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("wisuda")
      .update({
        status_validasi_buku: status,
        catatan_validasi_buku: catatanInput[id] || null,
        admin_kemahasiswaan_id: user?.id,
        verified_buku_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert("Gagal memperbarui status: " + error.message);
    } else {
      await fetchData();
    }
    setProcessingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Verifikasi Data Buku Wisuda</h1>
      <p className="text-gray-600 mb-6">
        Tinjau foto formal, ukuran toga, dan quote wisuda yang diunggah mahasiswa, lalu tandai lengkap atau minta revisi.
      </p>

      <div className="flex gap-2 mb-6">
        {([
          { key: "menunggu", label: "Menunggu Verifikasi" },
          { key: "revisi", label: "Perlu Revisi" },
          { key: "lengkap", label: "Lengkap" },
          { key: "semua", label: "Semua" },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              "px-4 py-2 rounded-lg text-sm font-medium border transition " +
              (filter === f.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-gray-300 hover:bg-gray-50")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Memuat data...</p>
      ) : data.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          Tidak ada data buku wisuda untuk status ini.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.id} className="border rounded-lg p-5 bg-white shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex gap-4">
                  {row.file_foto && (
                    <img
                      src={row.file_foto}
                      alt="Foto formal"
                      className="h-24 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {row.profiles && row.profiles.nama_lengkap
                        ? row.profiles.nama_lengkap
                        : "(Nama belum diisi)"}
                    </p>
                    <p className="text-sm text-gray-500">
                      NIM: {row.profiles && row.profiles.nim ? row.profiles.nim : "-"} &middot;{" "}
                      {row.profiles && row.profiles.program_studi ? row.profiles.program_studi : "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {row.profiles ? row.profiles.email : ""}
                    </p>
                  </div>
                </div>

                <span
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full self-start " +
                    (row.status_validasi_buku === "lengkap"
                      ? "bg-green-100 text-green-700"
                      : row.status_validasi_buku === "revisi"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700")
                  }
                >
                  {row.status_validasi_buku === "lengkap"
                    ? "Lengkap"
                    : row.status_validasi_buku === "revisi"
                    ? "Perlu Revisi"
                    : "Menunggu Verifikasi"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">Ukuran Toga</p>
                  <p className="font-medium">{row.ukuran_toga || "-"}</p>
                </div>
                <div className="col-span-2 md:col-span-2">
                  <p className="text-gray-500">Quote Wisuda</p>
                  <p className="font-medium italic">
                    {row.quote_wisuda ? `"${row.quote_wisuda}"` : "-"}
                  </p>
                </div>
              </div>

              {row.file_foto && (
                <div className="mt-4">
                  <a
                    href={row.file_foto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm underline"
                  >
                    Lihat Foto Ukuran Penuh
                  </a>
                </div>
              )}

              {row.status_validasi_buku === "menunggu" && (
                <div className="mt-4 border-t pt-4">
                  <input
                    type="text"
                    placeholder="Catatan (opsional, terutama kalau minta revisi)"
                    value={catatanInput[row.id] || ""}
                    onChange={(e) =>
                      setCatatanInput((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={processingId === row.id}
                      onClick={() => handleVerifikasi(row.id, "lengkap")}
                      className="flex-1 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
                    >
                      {processingId === row.id ? "Memproses..." : "Tandai Lengkap"}
                    </button>
                    <button
                      disabled={processingId === row.id}
                      onClick={() => handleVerifikasi(row.id, "revisi")}
                      className="flex-1 bg-white text-red-600 border border-red-300 text-sm font-medium py-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                      {processingId === row.id ? "Memproses..." : "Minta Revisi"}
                    </button>
                  </div>
                </div>
              )}

              {row.status_validasi_buku !== "menunggu" && row.catatan_validasi_buku && (
                <p className="mt-3 text-sm text-gray-500 italic">
                  Catatan Admin: {row.catatan_validasi_buku}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
