"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const BUCKET = "bukti-pembayaran";

type WisudaRow = {
  id: string;
  mahasiswa_id: string;
  bersedia_hadir: boolean | null;
  nominal: number | null;
  tanggal_bayar: string | null;
  metode_bayar: string | null;
  file_bukti_bayar: string | null;
  status_verifikasi_bayar: "menunggu" | "ditolak" | "terverifikasi" | null;
};

const METODE_BAYAR = ["Transfer Bank BNI", "Transfer Bank BRI", "Virtual Account", "Lainnya"];

export default function PembayaranWisudaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<WisudaRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [nominal, setNominal] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState(METODE_BAYAR[0]);
  const [file, setFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("wisuda")
      .select(
        "id, mahasiswa_id, bersedia_hadir, nominal, tanggal_bayar, metode_bayar, file_bukti_bayar, status_verifikasi_bayar"
      )
      .eq("mahasiswa_id", auth.user.id)
      .maybeSingle();

    if (error) {
      setErrorMsg("Gagal memuat data pembayaran. Coba muat ulang halaman.");
      setLoading(false);
      return;
    }

    if (!data || data.bersedia_hadir === null || data.bersedia_hadir === undefined) {
      router.push("/mahasiswa/wisuda/kesediaan");
      return;
    }

    setRow(data as WisudaRow);
    if (data.nominal) setNominal(String(data.nominal));
    if (data.tanggal_bayar) setTanggalBayar(data.tanggal_bayar);
    if (data.metode_bayar) setMetodeBayar(data.metode_bayar);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    setErrorMsg(null);

    if (!nominal || !tanggalBayar || !metodeBayar) {
      setErrorMsg("Nominal, tanggal, dan metode bayar wajib diisi.");
      return;
    }
    if (!file && !row.file_bukti_bayar) {
      setErrorMsg("Bukti pembayaran wajib diunggah.");
      return;
    }

    setSaving(true);

    let filePath = row.file_bukti_bayar;

    if (file) {
      const ext = file.name.split(".").pop();
      const newPath = `${row.mahasiswa_id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, file, { upsert: true });

      if (uploadError) {
        setErrorMsg("Gagal mengunggah bukti pembayaran. Coba lagi.");
        setSaving(false);
        return;
      }
      filePath = newPath;
    }

    const { error: updateError } = await supabase
      .from("wisuda")
      .update({
        nominal: Number(nominal),
        tanggal_bayar: tanggalBayar,
        metode_bayar: metodeBayar,
        file_bukti_bayar: filePath,
        status_verifikasi_bayar: "menunggu",
      })
      .eq("mahasiswa_id", row.mahasiswa_id);

    setSaving(false);

    if (updateError) {
      setErrorMsg("Gagal menyimpan data pembayaran. Coba lagi.");
      return;
    }

    await loadData();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-slate-500">
        Memuat data pembayaran…
      </div>
    );
  }

  const status: "belum_bayar" | "menunggu" | "ditolak" | "terverifikasi" =
    !row?.file_bukti_bayar ? "belum_bayar" : row?.status_verifikasi_bayar ?? "menunggu";

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Stepper current={2} />

      <h1 className="mt-6 text-xl font-semibold text-slate-900">Pembayaran Wisuda</h1>
      <p className="mt-1 text-sm text-slate-500">
        Unggah bukti pembayaran biaya wisuda. Data akan diverifikasi oleh Admin Keuangan.
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {status === "terverifikasi" && (
        <StatusCard
          tone="success"
          title="Pembayaran terverifikasi"
          desc="Bukti pembayaran kamu sudah dicek dan sah. Kamu bisa lanjut ke tahap berikutnya."
        >
          <RingkasanBayar row={row!} />
          <button
            onClick={() => router.push("/mahasiswa/wisuda/buku-wisuda")}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Lanjut ke Data Buku Wisuda
          </button>
        </StatusCard>
      )}

      {status === "menunggu" && (
        <StatusCard
          tone="pending"
          title="Menunggu verifikasi"
          desc="Bukti pembayaran sudah kami terima dan sedang dicek oleh Admin Keuangan. Kamu akan mendapat notifikasi setelah diverifikasi."
        >
          <RingkasanBayar row={row!} />
        </StatusCard>
      )}

      {(status === "belum_bayar" || status === "ditolak") && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {status === "ditolak" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium">Bukti pembayaran sebelumnya ditolak</p>
              <p className="mt-1">
                Silakan periksa kembali nominal, tanggal, dan foto/scan bukti transfer, lalu unggah ulang.
              </p>
            </div>
          )}

          <Field label="Nominal Bayar (Rp)">
            <input
              type="number"
              min="0"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="contoh: 500000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </Field>

          <Field label="Tanggal Bayar">
            <input
              type="date"
              value={tanggalBayar}
              onChange={(e) => setTanggalBayar(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </Field>

          <Field label="Metode / Bank Tujuan">
            <select
              value={metodeBayar}
              onChange={(e) => setMetodeBayar(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {METODE_BAYAR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bukti Transfer / Struk Pembayaran">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="mt-1 text-xs text-slate-400">Format JPG, PNG, atau PDF.</p>
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Kirim Bukti Pembayaran"}
          </button>
        </form>
      )}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  const steps = ["Kesediaan", "Pembayaran", "Buku Wisuda"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                done
                  ? "bg-slate-900 text-white"
                  : active
                  ? "border-2 border-slate-900 text-slate-900"
                  : "border border-slate-300 text-slate-400"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <span className={`text-xs ${active ? "font-medium text-slate-900" : "text-slate-400"}`}>
              {s}
            </span>
            {i < steps.length - 1 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function StatusCard({
  tone,
  title,
  desc,
  children,
}: {
  tone: "success" | "pending";
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-blue-200 bg-blue-50 text-blue-800";
  return (
    <div className={`mt-6 rounded-xl border px-5 py-4 ${toneClasses}`}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm opacity-90">{desc}</p>
      {children}
    </div>
  );
}

function RingkasanBayar({ row }: { row: WisudaRow }) {
  return (
    <dl className="mt-4 space-y-1 text-sm text-slate-700">
      <div className="flex justify-between">
        <dt className="opacity-70">Nominal</dt>
        <dd className="font-medium">
          {row.nominal ? `Rp ${row.nominal.toLocaleString("id-ID")}` : "-"}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="opacity-70">Tanggal Bayar</dt>
        <dd className="font-medium">{row.tanggal_bayar ?? "-"}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="opacity-70">Metode</dt>
        <dd className="font-medium">{row.metode_bayar ?? "-"}</dd>
      </div>
    </dl>
  );
}