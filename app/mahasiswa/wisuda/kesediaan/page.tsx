"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type WisudaRow = {
  id: string;
  mahasiswa_id: string;
  bersedia_hadir: boolean | null;
  catatan_alasan: string | null;
};

export default function KesediaanWisudaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<WisudaRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [bersedia, setBersedia] = useState<boolean | null>(null);
  const [catatan, setCatatan] = useState("");
  const [editing, setEditing] = useState(false);

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
      .select("id, mahasiswa_id, bersedia_hadir, catatan_alasan")
      .eq("mahasiswa_id", auth.user.id)
      .maybeSingle();

    if (error) {
      setErrorMsg("Gagal memuat data kesediaan. Coba muat ulang halaman.");
      setLoading(false);
      return;
    }

    if (data) {
      setRow(data as WisudaRow);
      setBersedia(data.bersedia_hadir);
      setCatatan(data.catatan_alasan ?? "");
    } else {
      setRow({ id: "", mahasiswa_id: auth.user.id, bersedia_hadir: null, catatan_alasan: null });
      setEditing(true);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    setErrorMsg(null);

    if (bersedia === null) {
      setErrorMsg("Silakan pilih salah satu: Bersedia Hadir atau Tidak Bersedia Hadir.");
      return;
    }

    setSaving(true);

    const { error: upsertError } = await supabase
      .from("wisuda")
      .upsert(
        {
          mahasiswa_id: row.mahasiswa_id,
          bersedia_hadir: bersedia,
          catatan_alasan: bersedia ? null : catatan || null,
        },
        { onConflict: "mahasiswa_id" }
      );

    setSaving(false);

    if (upsertError) {
      setErrorMsg("Gagal menyimpan kesediaan. Coba lagi.");
      return;
    }

    setEditing(false);
    await loadData();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-slate-500">
        Memuat data kesediaan…
      </div>
    );
  }

  const sudahIsi = row?.bersedia_hadir !== null && row?.bersedia_hadir !== undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Stepper current={1} />

      <h1 className="mt-6 text-xl font-semibold text-slate-900">Kesediaan Wisuda</h1>
      <p className="mt-1 text-sm text-slate-500">
        Beri tahu kami apakah kamu akan hadir langsung di acara wisuda atau memilih status in absentia.
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {sudahIsi && !editing ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          <p className="font-medium">
            {row?.bersedia_hadir ? "Kamu memilih Bersedia Hadir" : "Kamu memilih Tidak Bersedia Hadir (In Absentia)"}
          </p>
          {!row?.bersedia_hadir && row?.catatan_alasan && (
            <p className="mt-1 text-sm opacity-90">Catatan: {row.catatan_alasan}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Ubah Pilihan
            </button>
            <button
              onClick={() => router.push("/mahasiswa/wisuda/pembayaran")}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Lanjut ke Pembayaran
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-3">
            <OptionCard
              selected={bersedia === true}
              onClick={() => setBersedia(true)}
              title="Bersedia Hadir"
              desc="Kamu akan hadir langsung di acara wisuda."
            />
            <OptionCard
              selected={bersedia === false}
              onClick={() => setBersedia(false)}
              title="Tidak Bersedia Hadir (In Absentia)"
              desc="Kamu tidak hadir di acara, kelulusan tetap diproses secara in absentia."
            />
          </div>

          {bersedia === false && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Catatan / Alasan <span className="font-normal text-slate-400">(opsional)</span>
              </span>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="contoh: bertugas di luar kota pada tanggal wisuda"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          )}

          <div className="flex gap-2">
            {sudahIsi && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setBersedia(row?.bersedia_hadir ?? null);
                  setCatatan(row?.catatan_alasan ?? "");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan Kesediaan"}
            </button>
          </div>
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

function OptionCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-slate-900" : "border-slate-300"
          }`}
        >
          {selected && <div className="h-2 w-2 rounded-full bg-slate-900" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
        </div>
      </div>
    </button>
  );
}