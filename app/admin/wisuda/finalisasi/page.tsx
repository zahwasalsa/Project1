"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type WisudaRow = {
  id: string;
  mahasiswa_id: string;
  bersedia_hadir: boolean | null;
  status_verifikasi_bayar: "menunggu" | "diterima" | "ditolak" | null;
  status_validasi_buku: "menunggu" | "revisi" | "lengkap" | null;
  status_akhir_wisuda: "terdaftar_wisudawan" | "in_absentia" | null;
  finalized_at: string | null;
  profiles: {
    nama_lengkap: string | null;
    nim: string | null;
    program_studi: string | null;
    email: string;
  } | null;
};

function isEligible(row: WisudaRow): boolean {
  if (row.bersedia_hadir === null || row.bersedia_hadir === undefined) return false;
  if (row.bersedia_hadir === false) {
    // In Absentia: cukup kesediaan sudah diisi, tidak perlu pembayaran/buku wisuda
    return true;
  }
  // Bersedia hadir: wajib pembayaran diterima DAN buku wisuda lengkap
  return row.status_verifikasi_bayar === "diterima" && row.status_validasi_buku === "lengkap";
}

function targetStatus(row: WisudaRow): "terdaftar_wisudawan" | "in_absentia" {
  return row.bersedia_hadir ? "terdaftar_wisudawan" : "in_absentia";
}

export default function FinalisasiWisudaPage() {
  const [data, setData] = useState<WisudaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"belum" | "sudah" | "semua">("belum");

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("wisuda")
      .select(
        "id, mahasiswa_id, bersedia_hadir, status_verifikasi_bayar, status_validasi_buku, status_akhir_wisuda, finalized_at, profiles!mahasiswa_id ( nama_lengkap, nim, program_studi, email )"
      )
      .order("id", { ascending: false });

    if (filter === "belum") {
      query = query.is("status_akhir_wisuda", null);
    } else if (filter === "sudah") {
      query = query.not("status_akhir_wisuda", "is", null);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Gagal mengambil data:", error.message);
    } else {
      setData((rows as unknown as WisudaRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleFinalisasi = async (row: WisudaRow) => {
    if (!isEligible(row)) return;
    setProcessingId(row.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("wisuda")
      .update({
        status_akhir_wisuda: targetStatus(row),
        finalized_by: user?.id,
        finalized_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      alert("Gagal finalisasi: " + error.message);
    } else {
      await fetchData();
    }
    setProcessingId(null);
  };

  const StatusBadge = ({
    label,
    ok,
    neutral,
  }: {
    label: string;
    ok: boolean | null;
    neutral?: boolean;
  }) => (
    <span
      className={
        "text-xs font-medium px-2 py-0.5 rounded-full " +
        (neutral
          ? "bg-slate-100 text-slate-500"
          : ok
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700")
      }
    >
      {label}
    </span>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Finalisasi Status Akhir Wisuda</h1>
      <p className="text-gray-600 mb-6">
        Tinjau kelengkapan tiap mahasiswa, lalu finalisasi status menjadi Terdaftar sebagai Wisudawan atau In Absentia.
      </p>

      <div className="flex gap-2 mb-6">
        {([
          { key: "belum", label: "Belum Difinalisasi" },
          { key: "sudah", label: "Sudah Final" },
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
          Tidak ada data untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((row) => {
            const eligible = isEligible(row);
            const alreadyFinal = !!row.status_akhir_wisuda;

            return (
              <div key={row.id} className="border rounded-lg p-5 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {row.profiles?.nama_lengkap || "(Nama belum diisi)"}
                    </p>
                    <p className="text-sm text-gray-500">
                      NIM: {row.profiles?.nim || "-"} &middot; {row.profiles?.program_studi || "-"}
                    </p>
                    <p className="text-sm text-gray-500">{row.profiles?.email}</p>
                  </div>

                  {alreadyFinal && (
                    <span
                      className={
                        "text-xs font-semibold px-3 py-1 rounded-full self-start " +
                        (row.status_akhir_wisuda === "terdaftar_wisudawan"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700")
                      }
                    >
                      {row.status_akhir_wisuda === "terdaftar_wisudawan"
                        ? "Terdaftar sebagai Wisudawan"
                        : "Wisuda In Absentia"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <StatusBadge
                    label={
                      row.bersedia_hadir === null
                        ? "Kesediaan: belum diisi"
                        : row.bersedia_hadir
                        ? "Kesediaan: Bersedia Hadir"
                        : "Kesediaan: In Absentia"
                    }
                    ok={row.bersedia_hadir !== null}
                  />
                  {row.bersedia_hadir !== false && (
                    <>
                      <StatusBadge
                        label={"Pembayaran: " + (row.status_verifikasi_bayar || "belum ada")}
                        ok={row.status_verifikasi_bayar === "diterima"}
                      />
                      <StatusBadge
                        label={"Buku Wisuda: " + (row.status_validasi_buku || "belum ada")}
                        ok={row.status_validasi_buku === "lengkap"}
                      />
                    </>
                  )}
                  {row.bersedia_hadir === false && (
                    <StatusBadge label="Pembayaran & Buku Wisuda: dilewati (In Absentia)" ok neutral />
                  )}
                </div>

                {!alreadyFinal && (
                  <div className="mt-4 border-t pt-4">
                    <button
                      disabled={!eligible || processingId === row.id}
                      onClick={() => handleFinalisasi(row)}
                      className="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {processingId === row.id
                        ? "Memproses..."
                        : eligible
                        ? `Finalisasi: ${
                            targetStatus(row) === "terdaftar_wisudawan"
                              ? "Terdaftar sebagai Wisudawan"
                              : "Wisuda In Absentia"
                          }`
                        : "Belum memenuhi syarat"}
                    </button>
                  </div>
                )}

                {alreadyFinal && row.finalized_at && (
                  <p className="mt-3 text-xs text-gray-400">
                    Difinalisasi pada {new Date(row.finalized_at).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
