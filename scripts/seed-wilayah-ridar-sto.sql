-- Isi data STO ke wilayah_ridar agar dropdown STO dan FK master_wo terpenuhi.
-- Jalankan sekali: mysql -u root ridar_db < scripts/seed-wilayah-ridar-sto.sql
-- Jika tabel punya kolom uic, pic, leader dan mengizinkan NULL, gunakan blok di bawah.

USE ridar_db;

-- Opsi 1: Hanya kolom sto (jika tabel hanya punya sto atau kolom lain boleh NULL)
INSERT IGNORE INTO wilayah_ridar (sto) VALUES
('PBB'), ('BKR'), ('MIS'), ('PKR'), ('PWG'), ('RBI'), ('SOK'), ('AMK'), ('BLS'), ('KLE'),
('PMB'), ('PNP'), ('RGT'), ('TAK'), ('TBH'), ('BAG'), ('BAS'), ('DUM'), ('SLJ'), ('BKN'),
('PPN'), ('SAK'), ('SEA'), ('UBT'), ('SGP'), ('ARK'), ('BGU'), ('DRI'), ('PJD'), ('KDS'), ('SYO'),
('PBB TIMUR'), ('PBB BARAT');

-- Jika error "Column count doesn't match", coba Opsi 2 (uncomment jika tabel punya uic, pic, leader):
/*
INSERT IGNORE INTO wilayah_ridar (sto, uic, pic, leader) VALUES
('PBB', NULL, NULL, NULL), ('BKR', NULL, NULL, NULL), ('MIS', NULL, NULL, NULL), ('PKR', NULL, NULL, NULL),
('PWG', NULL, NULL, NULL), ('RBI', NULL, NULL, NULL), ('SOK', NULL, NULL, NULL), ('AMK', NULL, NULL, NULL),
('BLS', NULL, NULL, NULL), ('KLE', NULL, NULL, NULL), ('PMB', NULL, NULL, NULL), ('PNP', NULL, NULL, NULL),
('RGT', NULL, NULL, NULL), ('TAK', NULL, NULL, NULL), ('TBH', NULL, NULL, NULL), ('BAG', NULL, NULL, NULL),
('BAS', NULL, NULL, NULL), ('DUM', NULL, NULL, NULL), ('SLJ', NULL, NULL, NULL), ('BKN', NULL, NULL, NULL),
('PPN', NULL, NULL, NULL), ('SAK', NULL, NULL, NULL), ('SEA', NULL, NULL, NULL), ('UBT', NULL, NULL, NULL),
('SGP', NULL, NULL, NULL), ('ARK', NULL, NULL, NULL), ('BGU', NULL, NULL, NULL), ('DRI', NULL, NULL, NULL),
('PJD', NULL, NULL, NULL), ('KDS', NULL, NULL, NULL), ('SYO', NULL, NULL, NULL),
('PBB TIMUR', NULL, NULL, NULL), ('PBB BARAT', NULL, NULL, NULL);
*/
