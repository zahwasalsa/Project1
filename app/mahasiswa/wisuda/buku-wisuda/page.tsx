"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Profile = {
  nim: string;
  nama_lengkap: string;
  program_studi: string;
};

type WisudaRow = {
  bersedia_hadir: boolean | null;
  file_foto: string | null;
  ukuran_toga: string | null;
  quote_wisuda: string | null;
  status_validasi_buku: "menunggu" | "revisi" | "lengkap" | null;
};

const UKURAN_TOGA_OPTIONS = ["S", "M", "L", "XL", "XXL"];

export default function BukuWisudaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [row, setRow] = useState<WisudaRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ukuranToga, setUkuranToga] = useState("");
  const [quote, setQuote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      router.push("/login");
      return;
    }
    setUserId(auth.user.id);

    const [{ data: profileData }, { data: wisudaData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("nim, nama_lengkap, program_studi")
        .eq("id", auth.user.id)
        .maybeSingle(),
      supabase
        .from("wisuda")
        .select("bersedia_hadir, file_foto, ukuran_toga, quote_wisuda, status_validasi_buku")
        .eq("mahasiswa_id", auth.user.id)
        .maybeSingle(),
    ]);

    setProfile(profileData as Profile);
    const w = wisudaData as WisudaRow | null;
    setRow(w);
    setUkuranToga(w?.ukuran_toga ?? "");
    setQuote(w?.quote_wisuda ?? "");
    setPreview(w?.file_foto ?? null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  async function handleSubmit() {
    if (!userId) return;
    setError(null);
    setSuccess(false);

    if (!file && !row?.file_foto) {
      setError("Foto formal wajib diunggah.");
      return;
    }
    if (!ukuranToga) {
      setError("Ukuran toga wajib dipilih.");
      return;
    }

    setSaving(true);

    let fileUrl = row?.file_foto ?? null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("foto-buku-wisuda")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError("Gagal mengunggah foto: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("foto-buku-wisuda")
        .getPublicUrl(path);

      fileUrl = publicUrlData.publicUrl;
    }

    const { error: upsertError } = await supabase.from("wisuda").upsert(
      {
        mahasiswa_id: userId,
        file_foto: fileUrl,
        ukuran_toga: ukuranToga,
        quote_wisuda: quote || null,
        status_validasi_buku: "menunggu",
      },
      { onConflict: "mahasiswa_id" }
    );

    setSaving(false);

    if (upsertError) {
      setError("Gagal menyimpan data: " + upsertError.message);
      return;
    }

    setSuccess(true);
    load();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] text-sm text-slate-400">
        Memuat data buku wisuda…
      </div>
    );
  }

  if (row?.bersedia_hadir === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB] px-6 text-center">
        <p className="text-lg font-medium text-slate-700">Data Buku Wisuda tidak berlaku</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Kamu memilih Tidak Bersedia Hadir (In Absentia), jadi tahap ini dilewati.
        </p>
        <button
          onClick={() => router.push("/mahasiswa/wisuda")}
          className="mt-6 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Kembali ke Progres Wisuda
        </button>
      </div>
    );
  }

  const alreadyVerified = row?.status_validasi_buku === "lengkap";

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <p className="text-sm text-slate-500">
          <span className="text-slate-400">SIAP Wisuda</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-slate-700">Data Buku Wisuda</span>
        </p>
        {profile && (
          <span className="text-sm text-slate-500">
            {profile.nama_lengkap} <span className="text-slate-300">&middot;</span> {profile.nim}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Data Buku Wisuda</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lengkapi foto formal dan data cetak untuk keperluan Buku Wisuda.
        </p>

        {row?.status_validasi_buku === "revisi" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Data sebelumnya perlu direvisi. Silakan unggah ulang foto dan/atau perbaiki data.
          </div>
        )}

        {alreadyVerified && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Data Buku Wisuda kamu sudah diverifikasi lengkap oleh Admin Kemahasiswaan.
          </div>
        )}

        <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nama Lengkap & Gelar</label>
            <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {profile?.nama_lengkap || "(Nama belum diisi)"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Otomatis dari data Modul 1, tidak bisa diubah di sini.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Foto Formal</label>
            <p className="mb-2 text-xs text-slate-400">Latar polos, sesuai ketentuan dress code kampus.</p>
            {preview && (
              <img
                src={preview}
                alt="Preview foto formal"
                className="mb-3 h-40 w-32 rounded-lg border border-slate-200 object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={alreadyVerified}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Ukuran Toga/Topi</label>
            <select
              value={ukuranToga}
              onChange={(e) => setUkuranToga(e.target.value)}
              disabled={alreadyVerified}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <option value="">Pilih ukuran</option>
              {UKURAN_TOGA_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Quote Wisuda (opsional)</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              disabled={alreadyVerified}
              rows={3}
              maxLength={200}
              placeholder="Kutipan singkat untuk dicetak di Buku Wisuda"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Data berhasil disimpan, menunggu verifikasi admin.</p>}

          {!alreadyVerified && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan Data Buku Wisuda"}
            </button>
          )}

          <button
            onClick={() => router.push("/mahasiswa/wisuda")}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Kembali ke Progres Wisuda
          </button>
        </div>
      </div>
    </div>
  );
}
