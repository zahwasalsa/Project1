"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Pendaftaran = {
  id: string;
  status: string;
  created_at: string;
  Mahasiswa: {
    nama_lengkap: string;
    nim: string;
  };
};

export default function VerifikasiYudisiumPage() {
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("yudisium")
        .select(
          "id, status, created_at, Mahasiswa ( nama_lengkap, nim )"
        )
        .in("status", ["Menunggu Verifikasi", "pending"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        console.error("Error code:", error.code);
      } else {
        setData(data as unknown as Pendaftaran[]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p className="p-8">Memuat data...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Verifikasi Pendaftaran Yudisium</h1>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Nama</th>
            <th className="border p-2 text-left">NIM</th>
            <th className="border p-2 text-left">Tanggal Daftar</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map(function (row) {
            return (
              <tr key={row.id}>
                <td className="border p-2">{row.Mahasiswa?.nama_lengkap}</td>
                <td className="border p-2">{row.Mahasiswa?.nim}</td>
                <td className="border p-2">
                  {new Date(row.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="border p-2">{row.status}</td>
                <td className="border p-2">
                  <a href={"/yudisium/verifikasi/" + row.id} className="text-blue-600 underline">
                    Lihat Detail
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <p className="mt-4 text-gray-500">
          Tidak ada pendaftaran yang menunggu verifikasi.
        </p>
      )}
    </div>
  );
}