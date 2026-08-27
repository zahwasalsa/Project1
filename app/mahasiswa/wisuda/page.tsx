"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Profile = {
  nim: string;
  nama_lengkap: string;
  program_studi: string;
  gelar: string | null;
};

type WisudaRow = {
  bersedia_hadir: boolean | null;
  nominal: number | null;
  file_bukti_bayar: string | null;
  status_verifikasi_bayar: "menunggu" | "ditolak" | "diterima" | null;
  file_foto: string | null;
  status_validasi_buku: "menunggu" | "revisi" | "lengkap" | null;
  status_akhir_wisuda: "terdaftar_wisudawan" | "in_absentia" | null;
  finalized_at: string | null;
};

type StepState = "locked" | "todo" | "pending" | "revise" | "done";

export default function WisudaOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [row, setRow] = useState<WisudaRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      router.push("/login");
      return;
    }

    const [{ data: profileData }, { data: wisudaData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("nim, nama_lengkap, program_studi, gelar")
        .eq("id", auth.user.id)
        .maybeSingle(),
      supabase
        .from("wisuda")
        .select(
          "bersedia_hadir, nominal, file_bukti_bayar, status_verifikasi_bayar, file_foto, status_validasi_buku, status_akhir_wisuda, finalized_at"
        )
        .eq("mahasiswa_id", auth.user.id)
        .maybeSingle(),
    ]);

    setProfile(profileData as Profile);
    setRow((wisudaData as WisudaRow) ?? null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] text-sm text-slate-400">
        Memuat progres wisuda…
      </div>
    );
  }

  const step1: StepState = row?.bersedia_hadir === null || row?.bersedia_hadir === undefined ? "todo" : "done";

  const step2: StepState =
    step1 !== "done"
      ? "locked"
      : !row?.file_bukti_bayar
      ? "todo"
      : row?.status_verifikasi_bayar === "diterima"
      ? "done"
      : row?.status_verifikasi_bayar === "ditolak"
      ? "revise"
      : "pending";

  const inAbsentia = row?.bersedia_hadir === false;

  const step3: StepState = inAbsentia
    ? "done"
    : step2 !== "done"
    ? "locked"
    : !row?.file_foto
    ? "todo"
    : row?.status_validasi_buku === "lengkap"
    ? "done"
    : row?.status_validasi_buku === "revisi"
    ? "revise"
    : "pending";

  const steps = [
    {
      label: "Kesediaan Wisuda",
      desc: "Konfirmasi hadir langsung atau in absentia.",
      state: step1,
      path: "/mahasiswa/wisuda/kesediaan",
    },
    {
      label: "Pembayaran Wisuda",
      desc: "Unggah bukti bayar untuk diverifikasi Admin Keuangan.",
      state: step2,
      path: "/mahasiswa/wisuda/pembayaran",
    },
    {
      label: inAbsentia ? "Data Buku Wisuda (dilewati)" : "Data Buku Wisuda",
      desc: inAbsentia
        ? "Tidak wajib diisi karena kamu memilih in absentia."
        : "Unggah foto formal & lengkapi data cetak.",
      state: step3,
      path: "/mahasiswa/wisuda/buku-wisuda",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <p className="text-sm text-slate-500">
          <span className="text-slate-400">SIAP Wisuda</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-slate-700">Modul Wisuda</span>
        </p>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm text-slate-500">
              {profile.nama_lengkap} <span className="text-slate-300">&middot;</span> {profile.nim}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Progres Wisuda</h1>
            {profile ? (
              <p className="mt-1 text-sm text-slate-500">
                {profile.nama_lengkap} &middot; {profile.nim} &middot; {profile.program_studi}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Lengkapi 3 tahap berikut sampai selesai.</p>
            )}
          </div>
        </div>

        {/* Badge status akhir wisuda */}
        {row?.status_akhir_wisuda && (
          <div
            className={`mb-6 rounded-xl border px-6 py-4 ${
              row.status_akhir_wisuda === "terdaftar_wisudawan"
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-300 bg-slate-100"
            }`}
          >
            <p
              className={`text-base font-semibold ${
                row.status_akhir_wisuda === "terdaftar_wisudawan" ? "text-emerald-700" : "text-slate-700"
              }`}
            >
              {row.status_akhir_wisuda === "terdaftar_wisudawan"
                ? "🎓 Kamu terdaftar sebagai Wisudawan"
                : "Status Wisuda: In Absentia"}
            </p>
            {row.finalized_at && (
              <p className="mt-1 text-xs text-slate-500">
                Ditetapkan pada{" "}
                {new Date(row.finalized_at).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tahap</th>
                <th className="px-6 py-3">Deskripsi</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => (
                <tr key={s.label} className={i !== steps.length - 1 ? "border-b border-slate-100" : ""}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <span className="mr-2 text-xs text-slate-400">{i + 1}.</span>
                    {s.label}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{s.desc}</td>
                  <td className="px-6 py-4">
                    <StatusBadge state={s.state} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      disabled={s.state === "locked"}
                      onClick={() => router.push(s.path)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        s.state === "locked"
                          ? "cursor-not-allowed border-slate-200 text-slate-300"
                          : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      {s.state === "done" ? "Lihat" : s.state === "locked" ? "Terkunci" : "Lanjut"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: StepState }) {
  const map: Record<StepState, { label: string; className: string }> = {
    locked: { label: "Terkunci", className: "bg-slate-100 text-slate-400" },
    todo: { label: "Belum diisi", className: "bg-slate-100 text-slate-600" },
    pending: { label: "Menunggu verifikasi", className: "bg-amber-50 text-amber-700" },
    revise: { label: "Perlu revisi", className: "bg-red-50 text-red-700" },
    done: { label: "Selesai", className: "bg-emerald-50 text-emerald-700" },
  };
  const { label, className } = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state === "done"
            ? "bg-emerald-500"
            : state === "pending"
            ? "bg-amber-500"
            : state === "revise"
            ? "bg-red-500"
            : "bg-slate-400"
        }`}
      />
      {label}
    </span>
  );
}
