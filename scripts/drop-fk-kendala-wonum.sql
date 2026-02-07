-- Opsional: Hapus foreign key agar kendala_pelanggan bisa menyimpan WONUM
-- yang belum terdaftar di master_wo (data tetap masuk rekapan).
-- Jalankan di MySQL jika Anda ingin mengizinkan input WONUM bebas.
-- Setelah dijalankan, restart aplikasi dan input data akan selalu tersimpan.

USE ridar_db;

ALTER TABLE kendala_pelanggan
  DROP FOREIGN KEY fk_pelanggan_wo;
