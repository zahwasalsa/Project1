"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
      setLoading(false);
    } else {
      setMessage("✅ Login berhasil!");
      router.push("/yudisium/status");
    }
  }

  const inputClass =
    "rounded border border-gray-300 px-3 py-2 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <form
        onSubmit={handleLogin}
        className="flex w-80 flex-col gap-4 rounded-lg bg-white p-8 shadow-lg border border-gray-200"
      >
        <h1 className="text-xl font-semibold text-black">Login</h1>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Login"}
        </button>
        {message && <p className="text-sm text-black">{message}</p>}
        <p className="text-sm text-gray-600">
          Belum punya akun?{" "}
          <a href="/register" className="text-black underline">
            Daftar
          </a>
        </p>
      </form>
    </div>
  );
}