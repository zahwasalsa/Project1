-- Jalankan di Supabase SQL Editor sebelum memakai fitur verifikasi bukti kerja.
-- Menambahkan kolom untuk menyimpan catatan admin saat memvalidasi/meminta revisi
-- bukti kerja (dipakai oleh endpoint PATCH /api/modul2/bukti-kerja/verifikasi).

ALTER TABLE bukti_kerja
  ADD COLUMN IF NOT EXISTS catatan_verifikasi text;

-- Catatan:
-- Kolom status_validasi (bukti_kerja) dan status_modul2 (hiring_tracer) diasumsikan
-- bertipe text/varchar bebas (bukan enum Postgres), karena kode yang sudah ada
-- menyimpan berbagai string berbeda tanpa cast eksplisit. Nilai baru yang dipakai:
--   bukti_kerja.status_validasi: 'menunggu' | 'valid' | 'revisi'
--   hiring_tracer.status_modul2: ... 'bukti_kerja_terverifikasi' | 'revisi_bukti_kerja' ...
-- Jika kolom-kolom tersebut ternyata bertipe ENUM di database Anda, tambahkan value baru
-- dengan ALTER TYPE ... ADD VALUE sesuai nama enum masing-masing.
