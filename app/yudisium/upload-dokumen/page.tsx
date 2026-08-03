"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UploadDokumen() {
  const [nim, setNim] = useState("");
  const [jenisDokumen, setJenisDokumen] = useState("KTP");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setMessage("❌ Pilih file dulu");
      return;
    }

    setLoading(true);
    setMessage("Mengunggah dokumen...");

    // 1. Cari data mahasiswa berdasarkan NIM
    const { data: mahasiswaData, error: mahasiswaError } = await supabase
      .from("Mahasiswa")
      .select("id")
      .eq("nim", nim)
      .single();

    if (mahasiswaError || !mahasiswaData) {
      setMessage("❌ NIM tidak ditemukan. Pastikan sudah daftar yudisium dulu.");
      setLoading(false);
      return;
    }

    // 2. Upload file ke Storage
    const fileName = `${nim}_${jenisDokumen}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("dokumen-yudisium")
      .upload(fileName, file);

    if (uploadError) {
      setMessage("❌ Gagal upload file: " + uploadError.message);
      setLoading(false);
      return;
    }

    // 3. Simpan record ke tabel dokumen_yudisium
    const { error: dokumenError } = await supabase
      .from("dokumen_yudisium")
      .insert([
        {
          mahasiswa_id: mahasiswaData.id,
          jenis_dokumen: jenisDokumen,
          file_url: fileName,
          status_verifikasi: "Belum Diverifikasi",
        },
      ]);

    if (dokumenError) {
      setMessage("❌ Gagal simpan data dokumen: " + dokumenError.message);
      setLoading(false);
      return;
    }

    setMessage("✅ Dokumen berhasil diunggah!");
    setFile(null);
    setLoading(false);
  }

  const inputClass =
    "rounded border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 py-10">
      <form
        onSubmit={handleUpload}
        className="flex w-96 flex-col gap-4 rounded-lg bg-white p-8 shadow-lg border border-gray-200"
      >
        <h1 className="text-xl font-semibold text-black">
          Upload Dokumen Yudisium
        </h1>

        <input
          type="text"
          placeholder="NIM"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          className={inputClass}
          required
        />

        <select
          value={jenisDokumen}
          onChange={(e) => setJenisDokumen(e.target.value)}
          className={inputClass}
        >
          <option value="KTP">KTP</option>
          <option value="KK">Kartu Keluarga</option>
          <option value="Akta">Akta Kelahiran</option>
          <option value="Ijazah">Ijazah</option>
          <option value="Bebas Perpustakaan">Bebas Perpustakaan</option>
          <option value="Bebas Laboratorium">Bebas Laboratorium</option>
        </select>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className={inputClass}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Mengunggah..." : "Upload Dokumen"}
        </button>

        {message && <p className="text-sm text-black">{message}</p>}
      </form>
    </div>
  );
}