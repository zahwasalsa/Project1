"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type ProfileRow = {
  id: string;
  nim: string;
  nama_lengkap: string | null;
  program_studi: string | null;
};

type WisudaRow = {
  mahasiswa_id: string;
  bersedia_hadir: boolean | null;
  file_bukti_bayar: string | null;
  status_verifikasi_bayar: "menunggu" | "ditolak" | "diterima" | null;
  file_foto: string | null;
  status_validasi_buku: "menunggu" | "revisi" | "lengkap" | null;
  status_akhir: string | null;
};

type Combined = {
  id: string;
  nim: string;
  nama_lengkap: string;
  program_studi: string;
  bersedia_hadir: boolean | null;
  statusBayar: "belum_mengisi" | "belum_upload" | "menunggu" | "ditolak" | "terverifikasi";
  statusBuku: "tidak_berlaku" | "belum_upload" | "menunggu" | "revisi" | "lengkap";
  statusAkhir: string;
};

const BAYAR_LABEL: Record<Combined["statusBayar"], string> = {
  belum_mengisi: "Belum Mengisi Kesediaan",
  belum_upload: "Menunggu Pembayaran",
  menunggu: "Menunggu Verifikasi",
  ditolak: "Pembayaran Ditolak",
  terverifikasi: "Pembayaran Terverifikasi",
};

const BAYAR_STYLE: Record<Combined["statusBayar"], string> = {
  belum_mengisi: "bg-slate-100 text-slate-500",
  belum_upload: "bg-slate-100 text-slate-600",
  menunggu: "bg-amber-50 text-amber-700",
  ditolak: "bg-red-50 text-red-700",
  terverifikasi: "bg-emerald-50 text-emerald-700",
};

const BUKU_LABEL: Record<Combined["statusBuku"], string> = {
  tidak_berlaku: "Tidak Berlaku (In Absentia)",
  belum_upload: "Menunggu Data Buku Wisuda",
  menunggu: "Menunggu Verifikasi",
  revisi: "Revisi Data Buku Wisuda",
  lengkap: "Data Buku Wisuda Lengkap",
};

const BUKU_STYLE: Record<Combined["statusBuku"], string> = {
  tidak_berlaku: "bg-slate-100 text-slate-400",
  belum_upload: "bg-slate-100 text-slate-600",
  menunggu: "bg-amber-50 text-amber-700",
  revisi: "bg-red-50 text-red-700",
  lengkap: "bg-emerald-50 text-emerald-700",
};

export default function DashboardWisudaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Combined[]>([]);

  const [filterProdi, setFilterProdi] = useState("semua");
  const [filterBayar, setFilterBayar] = useState<"semua" | Combined["statusBayar"]>("semua");
  const [filterHadir, setFilterHadir] = useState<"semua" | "bersedia" | "tidak" | "belum">("semua");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      router.push("/login");
      return;
    }

    // Ambil semua mahasiswa (bukan akun admin).
    // NOTE: sesuaikan filter role ini kalau value role mahasiswa di project kamu berbeda.
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nim, nama_lengkap, program_studi, role")
      .or("role.is.null,role.eq.mahasiswa");

    const { data: wisuda } = await supabase
      .from("wisuda")
      .select(
        "mahasiswa_id, bersedia_hadir, file_bukti_bayar, status_verifikasi_bayar, file_foto, status_validasi_buku, status_akhir"
      );

    const wisudaMap = new Map<string, WisudaRow>();
    (wisuda as WisudaRow[] | null)?.forEach((w) => wisudaMap.set(w.mahasiswa_id, w));

    const combined: Combined[] = ((profiles as ProfileRow[] | null) ?? []).map((p) => {
      const w = wisudaMap.get(p.id);

      let statusBayar: Combined["statusBayar"] = "belum_mengisi";
      if (w) {
        if (!w.file_bukti_bayar) statusBayar = "belum_upload";
        else if (w.status_verifikasi_bayar === "diterima") statusBayar = "terverifikasi";
        else if (w.status_verifikasi_bayar === "ditolak") statusBayar = "ditolak";
        else statusBayar = "menunggu";
      }

      let statusBuku: Combined["statusBuku"] = "belum_upload";
      if (w?.bersedia_hadir === false) {
        statusBuku = "tidak_berlaku";
      } else if (w) {
        if (!w.file_foto) statusBuku = "belum_upload";
        else if (w.status_validasi_buku === "lengkap") statusBuku = "lengkap";
        else if (w.status_validasi_buku === "revisi") statusBuku = "revisi";
        else statusBuku = "menunggu";
      }

      return {
        id: p.id,
        nim: p.nim ?? "-",
        nama_lengkap: p.nama_lengkap ?? "(Nama belum diisi)",
        program_studi: p.program_studi ?? "-",
        bersedia_hadir: w?.bersedia_hadir ?? null,
        statusBayar,
        statusBuku,
        statusAkhir: w?.status_akhir ?? "Belum Selesai",
      };
    });

    setRows(combined);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const prodiOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program_studi))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterProdi !== "semua" && r.program_studi !== filterProdi) return false;
      if (filterBayar !== "semua" && r.statusBayar !== filterBayar) return false;
      if (filterHadir === "bersedia" && r.bersedia_hadir !== true) return false;
      if (filterHadir === "tidak" && r.bersedia_hadir !== false) return false;
      if (filterHadir === "belum" && r.bersedia_hadir !== null) return false;
      return true;
    });
  }, [rows, filterProdi, filterBayar, filterHadir]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      bersediaHadir: rows.filter((r) => r.bersedia_hadir === true).length,
      tidakBersedia: rows.filter((r) => r.bersedia_hadir === false).length,
      belumIsiKesediaan: rows.filter((r) => r.bersedia_hadir === null).length,
      bayarTerverifikasi: rows.filter((r) => r.statusBayar === "terverifikasi").length,
      bukuLengkap: rows.filter((r) => r.statusBuku === "lengkap").length,
    }),
    [rows]
  );

  function exportCsv() {
    const header = ["NIM", "Nama", "Program Studi", "Kesediaan Hadir", "Status Bayar", "Status Buku Wisuda", "Status Akhir"];
    const body = filtered.map((r) => [
      r.nim,
      r.nama_lengkap,
      r.program_studi,
      r.bersedia_hadir === null ? "Belum Mengisi" : r.bersedia_hadir ? "Bersedia Hadir" : "Tidak Bersedia (In Absentia)",
      BAYAR_LABEL[r.statusBayar],
      BUKU_LABEL[r.statusBuku],
      r.statusAkhir,
    ]);
    const csv = [header, ...body].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-wisuda-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] text-sm text-slate-400">
        Memuat dashboard wisuda…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <p className="text-sm text-slate-500">
          <span className="text-slate-400">SIAP Wisuda</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-slate-700">Dashboard Wisuda</span>
        </p>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Logout
        </button>
      </div>

      <div className="px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard Wisuda</h1>
            <p className="mt-1 text-sm text-slate-500">Rekap kesediaan, pembayaran, dan data buku wisuda seluruh mahasiswa.</p>
          </div>
          <button
            onClick={exportCsv}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>

        {/* Ringkasan angka */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label="Total Calon Wisudawan" value={summary.total} />
          <SummaryCard label="Bersedia Hadir" value={summary.bersediaHadir} />
          <SummaryCard label="In Absentia" value={summary.tidakBersedia} />
          <SummaryCard label="Belum Isi Kesediaan" value={summary.belumIsiKesediaan} />
          <SummaryCard label="Bayar Terverifikasi" value={summary.bayarTerverifikasi} />
          <SummaryCard label="Buku Wisuda Lengkap" value={summary.bukuLengkap} />
        </div>

        {/* Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="semua">Semua Program Studi</option>
            {prodiOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterBayar}
            onChange={(e) => setFilterBayar(e.target.value as typeof filterBayar)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="semua">Semua Status Bayar</option>
            <option value="belum_mengisi">Belum Mengisi Kesediaan</option>
            <option value="belum_upload">Menunggu Pembayaran</option>
            <option value="menunggu">Menunggu Verifikasi</option>
            <option value="ditolak">Pembayaran Ditolak</option>
            <option value="terverifikasi">Pembayaran Terverifikasi</option>
          </select>

          <select
            value={filterHadir}
            onChange={(e) => setFilterHadir(e.target.value as typeof filterHadir)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="semua">Semua Kesediaan Hadir</option>
            <option value="bersedia">Bersedia Hadir</option>
            <option value="tidak">Tidak Bersedia (In Absentia)</option>
            <option value="belum">Belum Mengisi</option>
          </select>

          {/* Quick filter shortcuts */}
          <button
            onClick={() => setFilterBayar("belum_upload")}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            Belum Bayar
          </button>
          <button
            onClick={() => setFilterHadir("belum")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Belum Isi Kesediaan
          </button>
          {(filterProdi !== "semua" || filterBayar !== "semua" || filterHadir !== "semua") && (
            <button
              onClick={() => {
                setFilterProdi("semua");
                setFilterBayar("semua");
                setFilterHadir("semua");
              }}
              className="text-sm text-slate-400 underline hover:text-slate-600"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Tabel */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">NIM</th>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Kesediaan Hadir</th>
                <th className="px-6 py-3">Status Bayar</th>
                <th className="px-6 py-3">Status Buku Wisuda</th>
                <th className="px-6 py-3">Status Akhir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className={i !== filtered.length - 1 ? "border-b border-slate-100" : ""}>
                    <td className="px-6 py-3 text-slate-600">{r.nim}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{r.nama_lengkap}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {r.bersedia_hadir === null ? "Belum Mengisi" : r.bersedia_hadir ? "Bersedia Hadir" : "In Absentia"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${BAYAR_STYLE[r.statusBayar]}`}>
                        {BAYAR_LABEL[r.statusBayar]}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${BUKU_STYLE[r.statusBuku]}`}>
                        {BUKU_LABEL[r.statusBuku]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{r.statusAkhir}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
