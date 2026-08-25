"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("✅ Daftar berhasil! Cek email untuk konfirmasi.");
    }
    setLoading(false);
  }

  const inputClass =
    "rounded border border-gray-300 px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <form
        onSubmit={handleRegister}
        className="flex w-80 flex-col gap-4 rounded-lg bg-white p-8 shadow-lg border border-gray-200"
      >
        <h1 className="text-xl font-semibold text-black">Daftar Akun</h1>
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