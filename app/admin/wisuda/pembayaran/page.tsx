"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

const BUCKET_NAME = "bukti-pembayaran"; // GANTI sesuai nama bucket aslimu

type WisudaRow = {
  id: string;
  mahasiswa_id: string;
  bersedia_hadir: boolean;
  nominal: number;
  tanggal_bayar: string;
  metode_bayar: string;
  file_bukti_bayar: string;
  status_verifikasi_bayar: "menunggu" | "diterima" | "ditolak";
  catatan_verifikasi_bayar: string | null;
  profiles: {
    nama_lengkap: string | null;
    nim: string | null;
    program_studi: string | null;
    email: string;
  } | null;
};

export default function VerifikasiPembayaranPage() {
  const [data, setData] = useState<WisudaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [catatanInput, setCatatanInput] = useState<{ [key: string]: string }>({});
  const [filter, setFilter] = useState<"menunggu" | "diterima" | "ditolak" | "semua">("menunggu");

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("wisuda")
      .select(
        "id, mahasiswa_id, bersedia_hadir, nominal, tanggal_bayar, metode_bayar, file_bukti_bayar, status_verifikasi_bayar, catatan_verifikasi_bayar, profiles!mahasiswa_id ( nama_lengkap, nim, program_studi, email )"
      )
      .order("tanggal_bayar", { ascending: false });

    if (filter !== "semua") {
      query = query.eq("status_verifikasi_bayar", filter);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Gagal mengambil data pembayaran:", error.message);
    } else {
      setData((rows as unknown as WisudaRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleVerifikasi = async (id: string, status: "diterima" | "ditolak") => {
    setProcessingId(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("wisuda")
      .update({
        status_verifikasi_bayar: status,
        catatan_verifikasi_bayar: catatanInput[id] || null,
        admin_keuangan_id: user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert("Gagal memperbarui status: " + error.message);
    } else {
      await fetchData();
    }
    setProcessingId(null);
  };

  const bukaBuktiBayar = async (path: string) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 60); // link berlaku 60 detik

  if (error || !data) {
    alert("Gagal membuka file: " + (error?.message || "unknown error"));
    return;
  }

  window.open(data.signedUrl, "_blank");
};

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Verifikasi Pembayaran Wisuda</h1>
      <p className="text-gray-600 mb-6">
        Tinjau bukti pembayaran yang diunggah mahasiswa, lalu terima atau tolak.
      </p>

      <div className="flex gap-2 mb-6">
        {([
          { key: "menunggu", label: "Menunggu Verifikasi" },
          { key: "diterima", label: "Diterima" },
          { key: "ditolak", label: "Ditolak" },
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
          Tidak ada data pembayaran untuk status ini.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((row) => (
            <div key={row.id} className="border rounded-lg p-5 bg-white shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
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

                <span
                  className={
                    "text-xs font-semibold px-3 py-1 rounded-full self-start " +
                    (row.status_verifikasi_bayar === "diterima"
                      ? "bg-green-100 text-green-700"
                      : row.status_verifikasi_bayar === "ditolak"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700")
                  }
                >
                  {row.status_verifikasi_bayar === "diterima"
                    ? "Diterima"
                    : row.status_verifikasi_bayar === "ditolak"
                    ? "Ditolak"
                    : "Menunggu Verifikasi"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                <div>
                  <p className="text-gray-500">Nominal</p>
                  <p className="font-medium">
                    Rp {Number(row.nominal).toLocaleString("id-ID")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tanggal Bayar</p>
                  <p className="font-medium">{row.tanggal_bayar}</p>
                </div>
                <div>
                  <p className="text-gray-500">Metode</p>
                  <p className="font-medium">{row.metode_bayar}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kesediaan</p>
                  <p className="font-medium">
                    {row.bersedia_hadir ? "Bersedia Hadir" : "In Absentia"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => bukaBuktiBayar(row.file_bukti_bayar)}
                  className="text-blue-600 text-sm underline"
                >
                  Lihat Bukti Pembayaran
                </button>
              </div>

              {row.status_verifikasi_bayar === "menunggu" && (
                <div className="mt-4 border-t pt-4">
                  <input
                    type="text"
                    placeholder="Catatan (opsional, terutama kalau ditolak)"
                    value={catatanInput[row.id] || ""}
                    onChange={(e) =>
                      setCatatanInput((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={processingId === row.id}
                      onClick={() => handleVerifikasi(row.id, "diterima")}
                      className="flex-1 bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
                    >
                      {processingId === row.id ? "Memproses..." : "Terima"}
                    </button>
                    <button
                      disabled={processingId === row.id}
                      onClick={() => handleVerifikasi(row.id, "ditolak")}
                      className="flex-1 bg-white text-red-600 border border-red-300 text-sm font-medium py-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                      {processingId === row.id ? "Memproses..." : "Tolak"}
                    </button>
                  </div>
                </div>
              )}

              {row.status_verifikasi_bayar !== "menunggu" && row.catatan_verifikasi_bayar && (
                <p className="mt-3 text-sm text-gray-500 italic">
                  Catatan Admin: {row.catatan_verifikasi_bayar}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}