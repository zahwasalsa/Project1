-- Jalankan di Supabase SQL Editor sebelum memakai fitur Bypass Admin.

ALTER TABLE hiring_tracer ADD COLUMN IF NOT EXISTS bypass_admin text;
ALTER TABLE hiring_tracer ADD COLUMN IF NOT EXISTS bypass_alasan text;
ALTER TABLE hiring_tracer ADD COLUMN IF NOT EXISTS bypass_at timestamptz;

-- Kalau tabel ini masih memakai RLS default tanpa policy (seperti kasus
-- threshold_hiring_config sebelumnya), jalankan juga baris ini bila diperlukan:
-- ALTER TABLE hiring_tracer DISABLE ROW LEVEL SECURITY;
-- (biasanya tidak perlu karena hiring_tracer sudah dipakai sejak awal dan sudah berjalan normal)
