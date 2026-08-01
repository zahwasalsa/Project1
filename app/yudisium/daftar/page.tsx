"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DaftarYudisium() {
  const [nim, setNim] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [programStudi, setProgramStudi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [email, setEmail] = useState("");
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("Menyimpan data...");

    const { data: mahasiswaData, error: mahasiswaError } = await supabase
      .from("Mahasiswa")
      .insert([
        {
          nim,
          nama_lengkap: namaLengkap,
          program_studi: programStudi,
          fakultas,
          email,
          no_whatsapp: noWhatsapp,
        },
      ])
      .select()
      .single();

    if (mahasiswaError) {
      setMessage("❌ Gagal simpan data mahasiswa: " + mahasiswaError.message);
      setLoading(false);
      return;
    }

    const { error: yudisiumError } = await supabase.from("yudisium").insert([
      {
        mahasiswa_id: mahasiswaData.id,
        status: "Menunggu Verifikasi",
      },
    ]);

    if (yudisiumError) {
      setMessage("❌ Gagal daftar yudisium: " + yudisiumError.message);
      setLoading(false);
      return;
    }

    setMessage("✅ Pendaftaran yudisium berhasil dikirim!");
    setNim("");
    setNamaLengkap("");
    setProgramStudi("");
    setFakultas("");
    setEmail("");
    setNoWhatsapp("");
    setLoading(false);
  }

  const inputClass =
    "rounded border border-gray-300 px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-96 flex-col gap-4 rounded-lg bg-white p-8 shadow-lg border border-gray-200"
      >
        <h1 className="text-xl font-semibold text-black">
          Pendaftaran Yudisium
        </h1>

        <input
          type="text"
          placeholder="NIM"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Nama Lengkap"
          value={namaLengkap}
          onChange={(e) => setNamaLengkap(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Program Studi"
          value={programStudi}
          onChange={(e) => setProgramStudi(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="Fakultas"
          value={fakultas}
          onChange={(e) => setFakultas(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="text"
          placeholder="No. WhatsApp"
          value={noWhatsapp}
          onChange={(e) => setNoWhatsapp(e.target.value)}
          className={inputClass}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Daftar Yudisium"}
        </button>

        {message && <p className="text-sm text-black">{message}</p>}
      </form>
    </div>
  );
}