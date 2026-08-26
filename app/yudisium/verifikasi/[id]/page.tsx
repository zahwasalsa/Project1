"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type DetailYudisium = {
  id: string;
  status: string;
  catatan: string | null;
  mahasiswa_id: number;
  Mahasiswa: {
    nama_lengkap: string;
    nim: string;
    email: string;
    program_studi: string;
    fakultas: string;
    judul_ta: string;
    dosen_pembimbing: string;
    no_whatsapp: string;
  };
};

type Dokumen = {
  id: string;
  jenis_dokumen: string;
  file_url: string;
  status_verifikasi: string;
};

export default function DetailVerifikasiPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<DetailYudisium | null>(null);
  const [dokumen, setDokumen] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      const { data: yudisiumData, error: yudisiumError } = await supabase
        .from("yudisium")
        .select(`
          id,
          status,
          catatan,
          mahasiswa_id,
          Mahasiswa (
            nama_lengkap,
            nim,
            email,
            program_studi,
            fakultas,
            judul_ta,
            dosen_pembimbing,
            no_whatsapp
          )
        `)
        .eq("id", id)
        .single();

      if (yudisiumError) {
        console.error("Error fetch yudisium:", yudisiumError);
        setLoading(false);
        return;
      }

      setData(yudisiumData as unknown as DetailYudisium);
      setCatatan(yudisiumData?.catatan || "");

      // Ambil dokumen berdasarkan mahasiswa_id
      const { data: dokumenData, error: dokumenError } = await supabase
        .from("dokumen_yudisium")
        .select("id, jenis_dokumen, file_url, status_verifikasi")
        .eq("mahasiswa_id", yudisiumData.mahasiswa_id);

      if (dokumenError) {
        console.error("Error fetch dokumen:", dokumenError);
      } else {
        setDokumen(dokumenData || []);
      }

      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  const handleKeputusan = async (
    statusBaru: "lolos" | "ditolak"
  ) => {
    setProcessing(true);

    const { error } = await supabase
      .from("yudisium")
      .update({
        status: statusBaru,
        catatan: catatan,
        tanggal_keputusan: new Date().toISOString(),
      })
      .eq("id", id);

    setProcessing(false);

    if (error) {
      alert("Gagal menyimpan keputusan: " + error.message);
    } else {
      alert(
        statusBaru === "lolos"
          ? "Mahasiswa dinyatakan LOLOS."
          : "Mahasiswa DITOLAK."
      );

      router.push("/yudisium/verifikasi");
    }
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage
      .from("dokumen-yudisium")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  if (loading) {
    return <p className="p-8">Memuat data...</p>;
  }

  if (!data) {
    return <p className="p-8">Data tidak ditemukan.</p>;
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Tombol kembali */}
      <button
        onClick={() => router.push("/yudisium/verifikasi")}
        className="mb-4 text-blue-600 underline"
      >
        &larr; Kembali ke daftar
      </button>

      {/* Judul */}
      <h1 className="text-2xl font-bold mb-4">
        Detail Pendaftaran Yudisium
      </h1>

      {/* Data Mahasiswa */}
      <div className="bg-white text-black rounded-lg p-6 mb-6 space-y-2">
        <p>
          <strong>Nama:</strong>{" "}
          {data.Mahasiswa?.nama_lengkap}
        </p>

        <p>
          <strong>NIM:</strong>{" "}
          {data.Mahasiswa?.nim}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {data.Mahasiswa?.email}
        </p>

        <p>
          <strong>Program Studi:</strong>{" "}
          {data.Mahasiswa?.program_studi}
        </p>

        <p>
          <strong>Fakultas:</strong>{" "}
          {data.Mahasiswa?.fakultas}
        </p>

        <p>
          <strong>Judul TA:</strong>{" "}
          {data.Mahasiswa?.judul_ta}
        </p>

        <p>
          <strong>Dosen Pembimbing:</strong>{" "}
          {data.Mahasiswa?.dosen_pembimbing}
        </p>

        <p>
          <strong>No. WhatsApp:</strong>{" "}
          {data.Mahasiswa?.no_whatsapp}
        </p>

        <p>
          <strong>Status Saat Ini:</strong>{" "}
          {data.status}
        </p>
      </div>

      {/* Dokumen */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Dokumen yang Diupload
        </h2>

        {dokumen.length === 0 ? (
          <p className="text-gray-400">
            Belum ada dokumen diupload.
          </p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {dokumen.map((doc) => (
              <li key={doc.id}>
                <a
                  href={getFileUrl(doc.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {doc.jenis_dokumen}
                </a>

                {" — "}

                <span className="text-sm text-gray-400">
                  {doc.status_verifikasi}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Catatan */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">
          Catatan (opsional)
        </label>

        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full border rounded p-2 text-black"
          rows={3}
          placeholder="Tulis catatan untuk mahasiswa..."
        />
      </div>

      {/* Tombol Keputusan */}
      <div className="flex gap-4">
        <button
          onClick={() => handleKeputusan("lolos")}
          disabled={processing}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {processing ? "Memproses..." : "Setujui / Lolos"}
        </button>

        <button
          onClick={() => handleKeputusan("ditolak")}
          disabled={processing}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {processing ? "Memproses..." : "Tolak"}
        </button>
      </div>
    </div>
  );
}