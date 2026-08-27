-- Migration: Modul 3 - Verifikasi Buku Wisuda & Finalisasi Status Akhir
-- Tanggal: 27 Agustus 2026
-- Ringkasan: menambahkan kolom yang dipakai halaman admin verifikasi buku
-- wisuda dan halaman finalisasi status akhir, serta memperluas RLS supaya
-- role admin_kemahasiswaan bisa membaca/mengubah data yang relevan.

-- =========================================================
-- 1. Kolom untuk verifikasi Data Buku Wisuda (admin_kemahasiswaan)
-- =========================================================
alter table wisuda add column if not exists catatan_validasi_buku text;
alter table wisuda add column if not exists admin_kemahasiswaan_id uuid;
alter table wisuda add column if not exists verified_buku_at timestamptz;

-- =========================================================
-- 2. Kolom untuk finalisasi status akhir wisuda
--    Nilai status_akhir_wisuda: 'terdaftar_wisudawan' | 'in_absentia'
-- =========================================================
alter table wisuda add column if not exists status_akhir_wisuda text;
alter table wisuda add column if not exists finalized_by uuid;
alter table wisuda add column if not exists finalized_at timestamptz;

-- =========================================================
-- 3. Fungsi helper untuk cek role admin_kemahasiswaan
--    (pola sama seperti is_admin_keuangan() yang sudah ada)
-- =========================================================
create or replace function is_admin_kemahasiswaan()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin_kemahasiswaan'
  );
$$;

-- =========================================================
-- 4. Perluas RLS tabel profiles supaya admin_kemahasiswaan juga
--    bisa membaca & mengubah profil mahasiswa (dibutuhkan halaman
--    verifikasi & finalisasi untuk menampilkan nama/NIM mahasiswa).
--    Catatan: policy "wisuda" (admin akses semua) sudah lebih dulu
--    mencakup admin_kemahasiswaan, jadi tidak perlu diubah lagi.
-- =========================================================
alter policy "admin_select_all_profiles"
on public.profiles
to authenticated
using (
  is_admin_keuangan() or is_admin_kemahasiswaan()
);

alter policy "admin_update_all_profiles"
on public.profiles
to authenticated
using (
  is_admin_keuangan() or is_admin_kemahasiswaan()
)
with check (
  is_admin_keuangan() or is_admin_kemahasiswaan()
);

-- =========================================================
-- 5. Bucket foto-buku-wisuda dijadikan public supaya foto formal
--    mahasiswa bisa ditampilkan di halaman admin.
--    (Dilakukan manual lewat Dashboard, dicatat di sini untuk referensi.
--     Catatan keamanan: karena berisi data pribadi, pertimbangkan
--     mengganti ke bucket private + signed URL saat tahap hardening.)
-- =========================================================
-- update storage.buckets set public = true where id = 'foto-buku-wisuda';
