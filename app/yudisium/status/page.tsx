"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type StatusData = {
  status: string;
  kaprodi_penilai: string | null;
  metode_verifikasi: string | null;
  tanggal_keputusan: string | null;
  catatan: string | null;
  created_at: string;
};

export default function StatusYudisium() {
  const router = useRouter();
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchStatus() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const userEmail = userData.user.email;

      const { data: mahasiswa, error: mahasiswaError } = await supabase
        .from("Mahasiswa")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (mahasiswaError || !mahasiswa) {
        setErrorMsg("Data mahasiswa tidak ditemukan untuk email ini.");
        setLoading(false);
        return;
      }

      const { data: yudisium, error: yudisiumError } = await supabase
        .from("yudisium")
        .select(
          "status, kaprodi_penilai, metode_verifikasi, tanggal_keputusan, catatan, created_at",
        )
        .eq("mahasiswa_id", mahasiswa.id)
        .single();

      if (yudisiumError || !yudisium) {
        setErrorMsg("Kamu belum mendaftar yudisium.");
        setLoading(false);
        return;
      }

      setData(yudisium);
      setLoading(false);
    }

    fetchStatus();
  }, [router]);

  const statusLabel: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    diverifikasi: "Sudah Diverifikasi Kaprodi",
    lolos: "Lolos — Calon Wisudawan",
    ditolak: "Ditolak",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-black">Memuat status...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="w-96 rounded-lg bg-white p-8 shadow-lg border border-gray-200 text-center">
          <p className="text-black mb-4">{errorMsg}</p>
          {errorMsg === "Kamu belum mendaftar yudisium." ? (
            <a
              href="/yudisium/daftar"
              className="inline-block rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Daftar Yudisium Sekarang
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="w-96 rounded-lg bg-white p-8 shadow-lg border border-gray-200">
        <h1 className="mb-4 text-xl font-semibold text-black">
          Status Pendaftaran Yudisium
        </h1>
        <p className="text-black">
          Status: <strong>{statusLabel[data!.status] ?? data!.status}</strong>
        </p>
        {data!.kaprodi_penilai ? (
          <p className="mt-2 text-sm text-gray-600">
            Dinilai oleh: {data!.kaprodi_penilai}
          </p>
        ) : null}
        {data!.catatan ? (
          <p className="mt-2 text-sm text-gray-600">Catatan: {data!.catatan}</p>
        ) : null}
        <p className="mt-4 text-xs text-gray-400">
          Didaftarkan: {new Date(data!.created_at).toLocaleDateString("id-ID")}
        </p>
      </div>
    </div>
  );
}
