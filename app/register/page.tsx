"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nim, setNim] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [programStudi, setProgramStudi] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. Daftar ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage("❌ " + authError.message);
      setLoading(false);
      return;
    }

    // 2. Insert data profil ke tabel Mahasiswa
    const { error: dbError } = await supabase.from("Mahasiswa").insert({
      email,
      nim,
      nama_lengkap: namaLengkap,
      program_studi: programStudi,
      fakultas,
    });

    if (dbError) {
      setMessage("⚠️ Akun dibuat, tapi gagal simpan data profil: " + dbError.message);
      setLoading(false);
      return;
    }

    setMessage("✅ Daftar berhasil! Cek email untuk konfirmasi.");
    setLoading(false);
  }

  const inputClass =
    "rounded border border-gray-300 px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 py-8">
      <form
        onSubmit={handleRegister}
        className="flex w-80 flex-col gap-4 rounded-lg bg-white p-8 shadow-lg border border-gray-200"
      >
        <h1 className="text-xl font-semibold text-black">Daftar Akun</h1>
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
          type="password"
          placeholder="Password (min. 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>
        {message && <p className="text-sm text-black">{message}</p>}
        <p className="text-sm text-gray-600">
          Sudah punya akun?{" "}
          <a href="/login" className="text-black underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}