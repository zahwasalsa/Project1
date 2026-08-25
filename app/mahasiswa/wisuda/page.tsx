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
  status_verifikasi_bayar: "menunggu" | "ditolak" | "terverifikasi" | null;
  file_foto: string | null;
  status_validasi_buku: "menunggu" | "revisi" | "lengkap" | null;
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
          "bersedia_hadir, nominal, file_bukti_bayar, status_verifikasi_bayar, file_foto, status_validasi_buku"
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101A33] text-sm text-[#9AA5C0]">
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
      : row?.status_verifikasi_bayar === "terverifikasi"
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

  const completedCount = [step1, step2, step3].filter((s) => s === "done").length;
  const finalStatus =
    completedCount === 3
      ? inAbsentia
        ? "Wisuda In Absentia"
        : "Terdaftar sebagai Wisudawan"
      : null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap");
        .font-display {
          font-family: "Fraunces", ui-serif, Georgia, serif;
        }
        .font-body {
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>

      <section className="relative overflow-hidden bg-[#101A33] px-6 pb-16 pt-14 text-[#F5F1E6]">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C9A227, transparent 70%)" }}
        />
        <div className="mx-auto max-w-2xl font-body">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
            SIAP Wisuda &middot; Modul 3
          </p>

          <h1 className="font-display mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            {profile
              ? `Selamat menempuh tahap akhir, ${profile.nama_lengkap.split(" ")[0]}.`
              : "Selamat menempuh tahap akhir menuju wisuda."}
          </h1>

          {profile && (
            <p className="mt-2 text-sm text-[#9AA5C0]">
              {profile.nim} &middot; {profile.program_studi}
              {profile.gelar ? ` &middot; ${profile.gelar}` : ""}
            </p>
          )}

          {finalStatus && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-1.5 text-sm font-medium text-[#E9D27C]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E9D27C]" />
              {finalStatus}
            </div>
          )}

          <div className="mt-10">
            <Sash step1={step1} step2={step2} step3={step3} inAbsentia={inAbsentia} />
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-2xl px-6 pb-16 font-body">
        <div className="space-y-3">
          <StepCard
            label="Tahap 1"
            title="Kesediaan Wisuda"
            desc="Konfirmasi apakah kamu akan hadir langsung atau in absentia."
            state={step1}
            onClick={() => router.push("/mahasiswa/wisuda/kesediaan")}
          />
          <StepCard
            label="Tahap 2"
            title="Pembayaran Wisuda"
            desc="Unggah bukti pembayaran biaya wisuda untuk diverifikasi Admin Keuangan."
            state={step2}
            onClick={() => router.push("/mahasiswa/wisuda/pembayaran")}
          />
          <StepCard
            label="Tahap 3"
            title="Data Buku Wisuda"
            desc={
              inAbsentia
                ? "Tidak wajib diisi karena kamu memilih in absentia."
                : "Unggah foto formal & lengkapi data untuk dicetak di buku wisuda."
            }
            state={step3}
            onClick={() => router.push("/mahasiswa/wisuda/buku-wisuda")}
          />
        </div>
      </section>
    </div>
  );
}

function Sash({
  step1,
  step2,
  step3,
  inAbsentia,
}: {
  step1: StepState;
  step2: StepState;
  step3: StepState;
  inAbsentia: boolean;
}) {
  const items = [
    { label: "Kesediaan", state: step1, icon: <IconHand /> },
    { label: "Pembayaran", state: step2, icon: <IconReceipt /> },
    { label: inAbsentia ? "Buku Wisuda (dilewati)" : "Buku Wisuda", state: step3, icon: <IconBook /> },
  ];

  return (
    <div className="flex items-center">
      {items.map((item, i) => (
        <div key={item.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
                item.state === "done"
                  ? "border-[#C9A227] bg-[#C9A227] text-[#101A33]"
                  : item.state === "pending"
                  ? "border-[#C9A227] text-[#C9A227]"
                  : item.state === "revise"
                  ? "border-[#E0755A] text-[#E0755A]"
                  : item.state === "todo"
                  ? "border-[#F5F1E6]/60 text-[#F5F1E6]/80"
                  : "border-[#F5F1E6]/20 text-[#F5F1E6]/30"
              }`}
            >
              {item.icon}
            </div>
            <span
              className={`whitespace-nowrap text-[11px] font-medium ${
                item.state === "locked" ? "text-[#F5F1E6]/30" : "text-[#F5F1E6]/85"
              }`}
            >
              {item.label}
            </span>
          </div>
          {i < items.length - 1 && (
            <div className="mx-2 mb-5 h-[2px] flex-1 rounded-full bg-[#F5F1E6]/15">
              <div
                className="h-full rounded-full bg-[#C9A227] transition-all"
                style={{ width: item.state === "done" ? "100%" : "0%" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const STATE_LABEL: Record<StepState, string> = {
  locked: "Terkunci",
  todo: "Belum diisi",
  pending: "Menunggu verifikasi",
  revise: "Perlu revisi",
  done: "Selesai",
};

function StepCard({
  label,
  title,
  desc,
  state,
  onClick,
}: {
  label: string;
  title: string;
  desc: string;
  state: StepState;
  onClick: () => void;
}) {
  const locked = state === "locked";

  const badgeClass =
    state === "done"
      ? "bg-[#101A33]/5 text-[#101A33] ring-1 ring-[#C9A227]/50"
      : state === "pending"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      : state === "revise"
      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
      : state === "todo"
      ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      : "bg-slate-50 text-slate-400 ring-1 ring-slate-100";

  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={`flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition ${
        locked ? "cursor-not-allowed border-slate-100 opacity-60" : "border-slate-200 hover:border-[#C9A227] hover:shadow-md"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-display mt-0.5 text-base font-semibold text-[#101A33]">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
        {STATE_LABEL[state]}
      </span>
    </button>
  );
}

function IconHand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11V6a1.5 1.5 0 0 1 3 0v5" strokeLinecap="round" />
      <path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V11" strokeLinecap="round" />
      <path d="M15 11V6a1.5 1.5 0 0 1 3 0v7c0 3.5-2 6-6 6s-6-2-6-6v-2a1.5 1.5 0 0 1 3 0" strokeLinecap="round" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" strokeLinecap="round" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5.5v16" strokeLinecap="round" />
    </svg>
  );
}