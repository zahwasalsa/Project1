"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("Mengecek koneksi...");

  useEffect(() => {
    async function checkConnection() {
      const { error } = await supabase.auth.getSession();
      if (error) {
        setStatus("❌ Gagal connect: " + error.message);
      } else {
        setStatus("✅ Berhasil connect ke Supabase!");
      }
    }
    checkConnection();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <h1 className="text-2xl font-semibold">{status}</h1>
    </div>
  );
}