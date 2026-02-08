-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 07 Feb 2026 pada 13.27
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ridar_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `bot_logs`
--

CREATE TABLE `bot_logs` (
  `id` int(11) NOT NULL,
  `input_type` varchar(50) DEFAULT NULL,
  `input_value` varchar(100) DEFAULT NULL,
  `result_status` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `response_message` text DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `command_used` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `bot_logs`
--

INSERT INTO `bot_logs` (`id`, `input_type`, `input_value`, `result_status`, `created_at`, `response_message`, `session_id`, `command_used`) VALUES
(86, 'keyword', 'WO033400047', 'PROGRESS', '2026-02-07 18:42:44', 'Status tiket ditemukan', 'session_1769995803622_8ccx3pcw9', NULL),
(87, 'keyword', 'WO033400050', 'OPEN', '2026-02-07 18:53:18', 'Status tiket ditemukan', 'session_1769995803622_8ccx3pcw9', NULL),
(88, 'keyword', 'WO033400047', 'PROGRESS', '2026-02-07 18:53:48', 'Status tiket ditemukan', 'session_1769995803622_8ccx3pcw9', NULL),
(89, 'keyword', 'WO033400048', 'Workfail', '2026-02-07 19:02:27', 'Status tiket ditemukan', 'session_1769995803622_8ccx3pcw9', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `kendala_pelanggan`
--

CREATE TABLE `kendala_pelanggan` (
  `id` int(11) NOT NULL,
  `wonum` varchar(50) DEFAULT NULL,
  `tanggal_input` date DEFAULT NULL,
  `ttd_kb` varchar(100) DEFAULT NULL,
  `sto` varchar(50) DEFAULT NULL,
  `status_hi` varchar(50) DEFAULT NULL,
  `ttic` varchar(100) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `nama_teknis` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kendala_pelanggan`
--

INSERT INTO `kendala_pelanggan` (`id`, `wonum`, `tanggal_input`, `ttd_kb`, `sto`, `status_hi`, `ttic`, `keterangan`, `nama_teknis`, `created_at`, `updated_at`) VALUES
(101, 'WO033400001', '2026-01-15', '20 hari', 'PBB', 'PROGRESS', '1x24 Jam', 'ODP penuh butuh expand untuk pelanggan baru', 'Rendi Saputra', '2026-01-15 08:30:00', '2026-01-16 14:20:00'),
(102, 'WO033400002', '2026-01-15', '18 hari', 'ARK', 'PROGRESS', '2x24 Jam', 'Jarak pelanggan 420m dari ODP terdekat', 'Andika Pratama', '2026-01-15 09:15:00', NULL),
(103, 'WO033400003', '2026-01-15', '15 hari', 'DUM', 'PROGRESS', '1x24 Jam', 'Feeder rusak perlu perbaikan segera', 'Bambang Hermawan', '2026-01-15 10:00:00', NULL),
(104, 'WO033400004', '2026-01-16', '22 hari', 'PKR', 'CLOSED', '3x24 Jam', 'ODP rusak akibat vandalisme sudah diperbaiki', 'Dedi Kurniawan', '2026-01-16 07:45:00', '2026-01-17 10:30:00'),
(105, 'WO033400005', '2026-01-16', '25 hari', 'BKR', 'REJECT', '5x24 Jam', 'Crossing jalan raya butuh izin Dishub', 'Eko Wijaya', '2026-01-16 11:20:00', NULL),
(106, 'WO033400006', '2026-01-17', '20 hari', 'RBI', 'REJECT', '2x24 Jam', 'Lokasi di luar boundary perlu koordinasi', 'Fajar Nugraha', '2026-01-17 08:00:00', NULL),
(107, 'WO033400007', '2026-01-17', '30 hari', 'DRI', 'PROGRESS', '7x24 Jam', 'Butuh tanam tiang baru di lokasi', 'Gilang Ramadhan', '2026-01-17 13:30:00', NULL),
(108, 'WO033400008', '2026-01-18', '18 hari', 'PPN', 'PROGRESS', '2x24 Jam', 'SPBT penuh butuh penambahan port', 'Hendra Gunawan', '2026-01-18 09:00:00', NULL),
(109, 'WO033400009', '2026-01-18', '16 hari', 'BGU', 'CLOSED', '1x24 Jam', 'ODP loss tinggi sudah diganti splitter', 'Irfan Hakim', '2026-01-18 14:15:00', '2026-01-19 09:00:00'),
(110, 'WO033400010', '2026-01-19', '12 hari', 'TAK', 'REJECT', '1x24 Jam', 'Pelanggan cancel karena biaya tinggi', 'Joko Santoso', '2026-01-19 10:30:00', '2026-01-19 10:30:00'),
(111, 'WO033400011', '2026-01-20', '19 hari', 'PBB', 'PROGRESS', '2x24 Jam', 'ODP area padat penduduk sudah maksimal', 'Khairul Anwar', '2026-01-20 08:45:00', NULL),
(112, 'WO033400012', '2026-01-20', '21 hari', 'UBT', 'REJECT', '3x24 Jam', 'Pelanggan 380m dari ODP butuh approval', 'Lukman Hakim', '2026-01-20 11:00:00', NULL),
(113, 'WO033400013', '2026-01-21', '14 hari', 'ARK', 'CLOSED', '1x24 Jam', 'Maintenance ODP rutin sudah selesai', 'Muhammad Rizki', '2026-01-21 07:30:00', '2026-01-21 15:00:00'),
(114, 'WO033400014', '2026-01-21', '28 hari', 'RGT', 'REJECT', '7x24 Jam', 'Crossing jalan protokol butuh izin pemda', 'Nanda Pratama', '2026-01-21 13:00:00', NULL),
(115, 'WO033400015', '2026-01-22', '17 hari', 'PMB', 'PROGRESS', '2x24 Jam', 'Feeder putus akibat pohon tumbang', 'Oka Saputra', '2026-01-22 08:15:00', NULL),
(116, 'WO033400016', '2026-01-22', '32 hari', 'DUM', 'REJECT', '10x24 Jam', 'Area baru butuh tiang PLN', 'Putra Wijaya', '2026-01-22 10:45:00', NULL),
(117, 'WO033400017', '2026-01-23', '15 hari', 'PKR', 'CLOSED', '1x24 Jam', 'Splitter ODP sudah diganti baru', 'Qori Ramadhan', '2026-01-23 09:20:00', '2026-01-23 16:00:00'),
(118, 'WO033400018', '2026-01-23', '19 hari', 'BKN', 'PROGRESS', '2x24 Jam', 'SPBT maintenance untuk stabilitas', 'Rudi Hartono', '2026-01-23 14:00:00', NULL),
(119, 'WO033400019', '2026-01-24', '22 hari', 'PBB', 'REJECT', '3x24 Jam', 'Boundary 2 wilayah STO perlu koordinasi', 'Sandi Permana', '2026-01-24 08:00:00', NULL),
(120, 'WO033400020', '2026-01-24', '20 hari', 'ARK', 'PROGRESS', '2x24 Jam', 'ODP full ada 5 waiting list pelanggan', 'Toni Setiawan', '2026-01-24 11:30:00', NULL),
(121, 'WO033400021', '2026-01-25', '19 hari', 'BKR', 'PROGRESS', '2x24 Jam', 'Jarak 450m butuh kabel dan splitter inline', 'Umar Bakri', '2026-01-25 07:45:00', NULL),
(122, 'WO033400022', '2026-01-25', '16 hari', 'DRI', 'CLOSED', '2x24 Jam', 'Crossing jalan perumahan selesai', 'Vino Ardiansyah', '2026-01-25 13:15:00', '2026-01-26 14:00:00'),
(123, 'WO033400023', '2026-01-26', '18 hari', 'RBI', 'CLOSED', '1x24 Jam', 'Box ODP retak sudah diperbaiki', 'Wahyu Nugroho', '2026-01-26 09:00:00', '2026-01-27 10:00:00'),
(124, 'WO033400024', '2026-01-26', '10 hari', 'PPN', 'REJECT', '1x24 Jam', 'Pelanggan pilih provider kompetitor', 'Xaverius Budi', '2026-01-26 15:30:00', '2026-01-26 15:30:00'),
(125, 'WO033400025', '2026-01-27', '17 hari', 'TAK', 'PROGRESS', '2x24 Jam', 'Feeder tidak stabil perlu cek dari OLT', 'Yudi Prasetyo', '2026-01-27 08:30:00', NULL),
(126, 'WO033400026', '2026-01-27', '35 hari', 'BGU', 'REJECT', '10x24 Jam', 'Perumahan baru belum ada infrastruktur', 'Zainudin Ahmad', '2026-01-27 10:00:00', NULL),
(127, 'WO033400027', '2026-01-28', '20 hari', 'UBT', 'PROGRESS', '3x24 Jam', 'Kapasitas SPBT habis untuk area ini', 'Agus Salim', '2026-01-28 11:45:00', NULL),
(128, 'WO033400028', '2026-01-28', '14 hari', 'PBB', 'CLOSED', '1x24 Jam', 'Loss ODP sudah normal setelah perbaikan', 'Budi Santoso', '2026-01-28 14:20:00', '2026-01-29 09:00:00'),
(129, 'WO033400029', '2026-01-29', '30 hari', 'ARK', 'REJECT', '1x24 Jam', 'Crossing jalan utama butuh izin khusus', 'Candra Wijaya', '2026-01-29 08:15:00', '2026-02-07 14:39:12'),
(130, 'WO033400030', '2026-01-29', '23 hari', 'RGT', 'PROGRESS', '3x24 Jam', 'ODP kampus maksimal butuh expand', 'Dimas Prasetya', '2026-01-29 13:00:00', NULL),
(131, 'WO033400031', '2026-01-30', '21 hari', 'PKR', 'PROGRESS', '3x24 Jam', 'Ujung gang 395m dari ODP', 'Eko Purnomo', '2026-01-30 09:30:00', NULL),
(132, 'WO033400032', '2026-01-30', '15 hari', 'DUM', 'CLOSED', '1x24 Jam', 'ODP dibersihkan dari rayap dan kotoran', 'Fauzi Rahman', '2026-01-30 15:00:00', '2026-01-31 10:00:00'),
(133, 'WO033400033', '2026-01-31', '25 hari', 'PMB', 'REJECT', '5x24 Jam', 'Perbatasan kabupaten perlu koordinasi', 'Gunawan Putra', '2026-01-31 08:00:00', NULL),
(134, 'WO033400034', '2026-01-31', '35 hari', 'BKR', 'PROGRESS', '10x24 Jam', 'Butuh 3 tiang baru untuk jalur kabel', 'Hadi Kusuma', '2026-01-31 10:30:00', NULL),
(135, 'WO033400035', '2026-02-01', '18 hari', 'DRI', 'PROGRESS', '2x24 Jam', 'Fiber feeder bengkok butuh repair', 'Indra Gunawan', '2026-02-01 07:45:00', NULL),
(136, 'WO033400036', '2026-02-01', '13 hari', 'PPN', 'CLOSED', '1x24 Jam', 'Connector kotor sudah dibersihkan', 'Jaka Perdana', '2026-02-01 11:15:00', '2026-02-01 15:00:00'),
(137, 'WO033400037', '2026-02-02', '12 hari', 'PBB', 'CLOSED', '1x24 Jam', 'SPBT error sudah direset normal', 'Krisna Wardhana', '2026-02-02 09:00:00', '2026-02-02 11:30:00'),
(138, 'WO033400038', '2026-02-02', '32 hari', 'ARK', 'REJECT', '10x24 Jam', 'Crossing area industri butuh pipa besar', 'Lutfi Hakim', '2026-02-02 13:45:00', NULL),
(139, 'WO033400039', '2026-02-03', '8 hari', 'TAK', 'REJECT', '1x24 Jam', 'Pelanggan pindah alamat sebelum instalasi', 'Malik Ibrahim', '2026-02-03 08:30:00', '2026-02-03 08:30:00'),
(140, 'WO033400040', '2026-02-03', '22 hari', 'BGU', 'PROGRESS', '3x24 Jam', 'Upgrade ODP ke 32 core', 'Nurhadi Wijaya', '2026-02-03 14:00:00', NULL),
(141, 'WO033400041', '2026-02-04', '28 hari', 'RBI', 'REJECT', '7x24 Jam', 'Lokasi perbukitan jarak 510m', 'Oman Sulaiman', '2026-02-04 10:15:00', NULL),
(142, 'WO033400042', '2026-02-04', '20 hari', 'UBT', 'PROGRESS', '3x24 Jam', 'ODP kena petir butuh ganti total', 'Pandu Wicaksono', '2026-02-04 15:30:00', NULL),
(143, 'WO033400043', '2026-02-05', '19 hari', 'PKR', 'REJECT', '2x24 Jam', 'Alamat tidak sesuai sistem coverage', 'Qomaruddin Ali', '2026-02-05 08:00:00', NULL),
(144, 'WO033400044', '2026-02-05', '40 hari', 'DUM', 'REJECT', '12x24 Jam', 'Butuh 3 tiang PLN untuk jalur kabel', 'Rizal Fadillah', '2026-02-05 11:00:00', NULL),
(145, 'WO033400045', '2026-02-06', '19 hari', 'RGT', 'PROGRESS', '2x24 Jam', 'Signal feeder lemah dari OLT', 'Surya Dinata', '2026-02-06 07:30:00', NULL),
(146, 'WO033400046', '2026-02-06', '14 hari', 'PMB', 'CLOSED', '1x24 Jam', 'Pigtail aus sudah diganti baru', 'Taufik Hidayat', '2026-02-06 13:20:00', '2026-02-06 16:30:00'),
(147, 'WO033400047', '2026-02-06', '21 hari', 'BKN', 'PROGRESS', '3x24 Jam', 'Port SPBT habis untuk segment ini', 'Udin Setiawan', '2026-02-06 16:00:00', NULL),
(148, 'WO033400048', '2026-02-07', '35 hari', 'PBB', 'REJECT', '10x24 Jam', 'Crossing jalan tol butuh boring horizontal', 'Vicky Ramadhan', '2026-02-07 08:45:00', NULL),
(149, 'WO033400049', '2026-02-07', '20 hari', 'ARK', 'PROGRESS', '2x24 Jam', '16 core ODP terpakai perlu expansion', 'Wahid Fauzi', '2026-02-07 10:30:00', NULL),
(150, 'WO033400050', '2026-02-07', '9 hari', 'BKR', 'REJECT', '1x24 Jam', 'Pelanggan cancel karena harga tidak sesuai', 'Yusuf Mansur', '2026-02-07 14:15:00', '2026-02-07 14:15:00');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kendala_teknisi_sistem`
--

CREATE TABLE `kendala_teknisi_sistem` (
  `id` int(11) NOT NULL,
  `unit_inisiator` varchar(100) DEFAULT NULL,
  `wonum` varchar(50) DEFAULT NULL,
  `activity_id` int(11) DEFAULT NULL,
  `activity` varchar(255) DEFAULT NULL,
  `activity_teknisi` varchar(255) DEFAULT NULL,
  `status_todolist` varchar(50) DEFAULT NULL,
  `segment_alpro` varchar(50) DEFAULT NULL,
  `month_date` date DEFAULT NULL,
  `sto` varchar(50) DEFAULT NULL,
  `target` int(11) DEFAULT NULL,
  `proses` varchar(255) DEFAULT NULL,
  `solusi_progress` text DEFAULT NULL,
  `sc_order` varchar(100) DEFAULT NULL,
  `sto_inputan` varchar(10) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kendala_teknisi_sistem`
--

INSERT INTO `kendala_teknisi_sistem` (`id`, `unit_inisiator`, `wonum`, `activity_id`, `activity`, `activity_teknisi`, `status_todolist`, `segment_alpro`, `month_date`, `sto`, `target`, `proses`, `solusi_progress`, `sc_order`, `sto_inputan`, `created_at`, `updated_at`) VALUES
(14201, 'RIDAR RIAU', 'WO033400001', 1, 'Daily Housekeeping', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'PINDAH LOKER', 'VALINS', '2026-01-15', 'PBB', 1, 'Expand ODP sedang diproses', 'Menunggu material ODP expand 16 port', 'SC2026011501', 'PBB', '2026-01-15 08:30:00', '2026-01-16 14:20:00'),
(14202, 'RIDAR RIAU', 'WO033400002', NULL, 'Upload Excel', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'OPEN', 'VALINS', '2026-01-15', 'ARK', 2, 'Pengadaan kabel 500m', 'Material ready tunggu jadwal teknisi', 'SC2026011502', 'ARK', '2026-01-15 09:15:00', '2026-01-15 09:15:00'),
(14203, 'RIDAR RIAU', 'WO033400003', NULL, 'Upload Excel', 'PT2 | FEEDER RETI', 'OPEN', 'VALINS', '2026-01-15', 'DUM', 1, 'Perbaikan feeder', 'Tim splicing feeder di joint closure', 'SC2026011503', 'DUM', '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
(14204, 'RIDAR RIAU', 'WO033400004', 1, 'Daily Housekeeping', 'BENJAR ODP', 'COMPLETE', 'VALINS', '2026-01-16', 'PKR', 1, 'ODP sudah diperbaiki', 'Box ODP diganti dan kabel rapih', 'SC2026011601', 'PKR', '2026-01-16 07:45:00', '2026-01-17 10:30:00'),
(14205, 'RIDAR RIAU', 'WO033400005', NULL, 'Upload Excel', 'PT 3 | CROSSING JALAN', 'OGP', 'VALINS', '2026-01-16', 'BKR', 3, 'Menunggu izin Dishub', 'Surat perizinan crossing diajukan', 'SC2026011602', 'BKR', '2026-01-16 11:20:00', '2026-01-16 11:20:00'),
(14206, 'RIDAR RIAU', 'WO033400006', NULL, 'Upload Excel', 'OVER BOUNDARY', 'OGP', 'VALINS', '2026-01-17', 'RBI', 2, 'Koordinasi STO tetangga', 'Diskusi coverage area dengan regional', 'SC2026011701', 'RBI', '2026-01-17 08:00:00', '2026-01-17 08:00:00'),
(14207, 'RIDAR RIAU', 'WO033400007', 3, 'Daily Housekeeping', 'BUTUH TANAM TIANG', 'PINDAH LOKER', 'VALINS', '2026-01-17', 'DRI', 3, 'Proses tanam tiang', 'Koordinasi PLN pemasangan tiang', 'SC2026011702', 'DRI', '2026-01-17 13:30:00', '2026-01-17 13:30:00'),
(14208, 'RIDAR RIAU', 'WO033400008', 2, 'Daily Housekeeping', 'KENDALA SPBT', 'OPEN', 'VALINS', '2026-01-18', 'PPN', 2, 'Penambahan port SPBT', 'SPBT tambahan dikirim tunggu instal', 'SC2026011801', 'PPN', '2026-01-18 09:00:00', '2026-01-18 09:00:00'),
(14209, 'RIDAR RIAU', 'WO033400009', 2, 'Daily Housekeeping', 'ODP RETI/LOSS', 'COMPLETE', 'VALINS', '2026-01-18', 'BGU', 1, 'Splitter diganti', 'Loss normal setelah ganti splitter', 'SC2026011802', 'BGU', '2026-01-18 14:15:00', '2026-01-19 09:00:00'),
(14210, 'RIDAR RIAU', 'WO033400010', NULL, 'Upload Excel', 'CANCEL | PELANGGAN RAGU', 'COMPLETE', 'VALINS', '2026-01-19', 'TAK', 1, 'Order dibatalkan', 'Pelanggan tidak jadi berlangganan', 'SC2026011901', 'TAK', '2026-01-19 10:30:00', '2026-01-19 10:30:00'),
(14211, 'RIDAR RIAU', 'WO033400011', 1, 'Daily Housekeeping', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'OPEN', 'VALINS', '2026-01-20', 'PBB', 2, 'Proses expand ODP', 'Material expand ready jadwal teknisi', 'SC2026012001', 'PBB', '2026-01-20 08:45:00', '2026-01-20 08:45:00'),
(14212, 'RIDAR RIAU', 'WO033400012', NULL, 'Upload Excel', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'OGP', 'VALINS', '2026-01-20', 'UBT', 2, 'Survey ulang', 'Butuh kabel tambahan approval budget', 'SC2026012002', 'UBT', '2026-01-20 11:00:00', '2026-01-20 11:00:00'),
(14213, 'RIDAR RIAU', 'WO033400013', 2, 'Daily Housekeeping', 'BENJAR ODP', 'COMPLETE', 'VALINS', '2026-01-21', 'ARK', 1, 'Maintenance selesai', 'ODP dibersihkan kondisi normal', 'SC2026012101', 'ARK', '2026-01-21 07:30:00', '2026-01-21 15:00:00'),
(14214, 'RIDAR RIAU', 'WO033400014', NULL, 'Upload Excel', 'PT 3 | CROSSING JALAN', 'OGP', 'VALINS', '2026-01-21', 'RGT', 3, 'Izin jalan protokol', 'Surat ke Dishub dan Pemda diajukan', 'SC2026012102', 'RGT', '2026-01-21 13:00:00', '2026-01-21 13:00:00'),
(14215, 'RIDAR RIAU', 'WO033400015', NULL, 'Upload Excel', 'PT2 | FEEDER RETI', 'OPEN', 'VALINS', '2026-01-22', 'PMB', 2, 'Perbaikan feeder putus', 'Tim splicing kabel feeder', 'SC2026012201', 'PMB', '2026-01-22 08:15:00', '2026-01-22 08:15:00'),
(14216, 'RIDAR RIAU', 'WO033400016', 3, 'Daily Housekeeping', 'BUTUH TANAM TIANG', 'OGP', 'VALINS', '2026-01-22', 'DUM', 3, 'Koordinasi PLN', 'Menunggu jadwal tiang dari PLN', 'SC2026012202', 'DUM', '2026-01-22 10:45:00', '2026-01-22 10:45:00'),
(14217, 'RIDAR RIAU', 'WO033400017', 2, 'Daily Housekeeping', 'ODP RETI/LOSS', 'COMPLETE', 'VALINS', '2026-01-23', 'PKR', 1, 'Splitter diganti', 'Loss normal setelah penggantian', 'SC2026012301', 'PKR', '2026-01-23 09:20:00', '2026-01-23 16:00:00'),
(14218, 'RIDAR RIAU', 'WO033400018', 2, 'Daily Housekeeping', 'KENDALA SPBT', 'OPEN', 'VALINS', '2026-01-23', 'BKN', 2, 'Maintenance SPBT', 'Teknisi cek dan restart SPBT', 'SC2026012302', 'BKN', '2026-01-23 14:00:00', '2026-01-23 14:00:00'),
(14219, 'RIDAR RIAU', 'WO033400019', NULL, 'Upload Excel', 'OVER BOUNDARY', 'OGP', 'VALINS', '2026-01-24', 'PBB', 2, 'Koordinasi wilayah', 'Diskusi boundary dengan regional', 'SC2026012401', 'PBB', '2026-01-24 08:00:00', '2026-01-24 08:00:00'),
(14220, 'RIDAR RIAU', 'WO033400020', 1, 'Daily Housekeeping', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'OPEN', 'VALINS', '2026-01-24', 'ARK', 2, 'Expand ODP', 'Material datang jadwal expand hari ini', 'SC2026012402', 'ARK', '2026-01-24 11:30:00', '2026-01-24 11:30:00'),
(14221, 'RIDAR RIAU', 'WO033400021', NULL, 'Upload Excel', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'OPEN', 'VALINS', '2026-01-25', 'BKR', 2, 'Penarikan kabel', 'Kabel 500m ready tarik besok', 'SC2026012501', 'BKR', '2026-01-25 07:45:00', '2026-01-25 07:45:00'),
(14222, 'RIDAR RIAU', 'WO033400022', NULL, 'Upload Excel', 'PT 3 | CROSSING JALAN', 'COMPLETE', 'VALINS', '2026-01-25', 'DRI', 1, 'Crossing selesai', 'Boring berhasil dilakukan', 'SC2026012502', 'DRI', '2026-01-25 13:15:00', '2026-01-26 14:00:00'),
(14223, 'RIDAR RIAU', 'WO033400023', 2, 'Daily Housekeeping', 'BENJAR ODP', 'COMPLETE', 'VALINS', '2026-01-26', 'RBI', 1, 'ODP diperbaiki', 'Box diganti kabel rapih', 'SC2026012601', 'RBI', '2026-01-26 09:00:00', '2026-01-27 10:00:00'),
(14224, 'RIDAR RIAU', 'WO033400024', NULL, 'Upload Excel', 'CANCEL | PELANGGAN RAGU', 'COMPLETE', 'VALINS', '2026-01-26', 'PPN', 1, 'Order dibatalkan', 'Pilih provider lain', 'SC2026012602', 'PPN', '2026-01-26 15:30:00', '2026-01-26 15:30:00'),
(14225, 'RIDAR RIAU', 'WO033400025', NULL, 'Upload Excel', 'PT2 | FEEDER RETI', 'OPEN', 'VALINS', '2026-01-27', 'TAK', 2, 'Cek feeder OLT', 'Troubleshoot dari sisi OLT', 'SC2026012701', 'TAK', '2026-01-27 08:30:00', '2026-01-27 08:30:00'),
(14226, 'RIDAR RIAU', 'WO033400026', 3, 'Daily Housekeeping', 'BUTUH TANAM TIANG', 'OGP', 'VALINS', '2026-01-27', 'BGU', 3, 'Menunggu tiang PLN', 'Pengajuan tiang diproses PLN', 'SC2026012702', 'BGU', '2026-01-27 10:00:00', '2026-01-27 10:00:00'),
(14227, 'RIDAR RIAU', 'WO033400027', 2, 'Daily Housekeeping', 'KENDALA SPBT', 'OPEN', 'VALINS', '2026-01-28', 'UBT', 2, 'Penambahan SPBT', 'SPBT baru dalam perjalanan', 'SC2026012801', 'UBT', '2026-01-28 11:45:00', '2026-01-28 11:45:00'),
(14228, 'RIDAR RIAU', 'WO033400028', 2, 'Daily Housekeeping', 'ODP RETI/LOSS', 'COMPLETE', 'VALINS', '2026-01-28', 'PBB', 1, 'Loss normal', 'Connector bersih pigtail diganti', 'SC2026012802', 'PBB', '2026-01-28 14:20:00', '2026-01-29 09:00:00'),
(14229, 'RIDAR RIAU', 'WO033400029', NULL, 'Upload Excel', 'PT 3 | CROSSING JALAN', 'OGP', 'VALINS', '2026-01-29', 'ARK', 3, 'Izin pemda', 'Surat crossing jalan utama diproses', 'SC2026012901', 'ARK', '2026-01-29 08:15:00', '2026-01-29 08:15:00'),
(14230, 'RIDAR RIAU', 'WO033400030', 1, 'Daily Housekeeping', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'OPEN', 'VALINS', '2026-01-29', 'RGT', 2, 'Expand ODP kampus', 'Material ready tunggu izin kampus', 'SC2026012902', 'RGT', '2026-01-29 13:00:00', '2026-01-29 13:00:00'),
(14231, 'RIDAR RIAU', 'WO033400031', NULL, 'Upload Excel', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'OPEN', 'VALINS', '2026-01-30', 'PKR', 2, 'Tarik kabel panjang', 'Kabel splitter inline ready', 'SC2026013001', 'PKR', '2026-01-30 09:30:00', '2026-01-30 09:30:00'),
(14232, 'RIDAR RIAU', 'WO033400032', 2, 'Daily Housekeeping', 'BENJAR ODP', 'COMPLETE', 'VALINS', '2026-01-30', 'DUM', 1, 'Maintenance selesai', 'Dibersihkan rayap dan kotoran', 'SC2026013002', 'DUM', '2026-01-30 15:00:00', '2026-01-31 10:00:00'),
(14233, 'RIDAR RIAU', 'WO033400033', NULL, 'Upload Excel', 'OVER BOUNDARY', 'OGP', 'VALINS', '2026-01-31', 'PMB', 2, 'Koordinasi boundary', 'Diskusi perbatasan kabupaten', 'SC2026013101', 'PMB', '2026-01-31 08:00:00', '2026-01-31 08:00:00'),
(14234, 'RIDAR RIAU', 'WO033400034', 3, 'Daily Housekeeping', 'BUTUH TANAM TIANG', 'PINDAH LOKER', 'VALINS', '2026-01-31', 'BKR', 3, 'Tanam 3 tiang', 'Koordinasi PLN 3 titik tiang', 'SC2026013102', 'BKR', '2026-01-31 10:30:00', '2026-01-31 10:30:00'),
(14235, 'RIDAR RIAU', 'WO033400035', NULL, 'Upload Excel', 'PT2 | FEEDER RETI', 'OPEN', 'VALINS', '2026-02-01', 'DRI', 2, 'Repair fiber bengkok', 'Splicing ulang di joint closure', 'SC2026020101', 'DRI', '2026-02-01 07:45:00', '2026-02-01 07:45:00'),
(14236, 'RIDAR RIAU', 'WO033400036', 2, 'Daily Housekeeping', 'ODP RETI/LOSS', 'COMPLETE', 'VALINS', '2026-02-01', 'PPN', 1, 'Connector bersih', 'Loss normal cleaning connector', 'SC2026020102', 'PPN', '2026-02-01 11:15:00', '2026-02-01 15:00:00'),
(14237, 'RIDAR RIAU', 'WO033400037', 2, 'Daily Housekeeping', 'KENDALA SPBT', 'COMPLETE', 'VALINS', '2026-02-02', 'PBB', 1, 'SPBT normal', 'Reset configuration berhasil', 'SC2026020201', 'PBB', '2026-02-02 09:00:00', '2026-02-02 11:30:00'),
(14238, 'RIDAR RIAU', 'WO033400038', NULL, 'Upload Excel', 'PT 3 | CROSSING JALAN', 'OGP', 'VALINS', '2026-02-02', 'ARK', 3, 'Izin tol', 'Boring horizontal izin khusus', 'SC2026020202', 'ARK', '2026-02-02 13:45:00', '2026-02-02 13:45:00'),
(14239, 'RIDAR RIAU', 'WO033400039', NULL, 'Upload Excel', 'CANCEL | PELANGGAN RAGU', 'COMPLETE', 'VALINS', '2026-02-03', 'TAK', 1, 'Order dibatalkan', 'Pelanggan pindah alamat', 'SC2026020301', 'TAK', '2026-02-03 08:30:00', '2026-02-03 08:30:00'),
(14240, 'RIDAR RIAU', 'WO033400040', 1, 'Daily Housekeeping', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'OPEN', 'VALINS', '2026-02-03', 'BGU', 2, 'Upgrade ODP 32', 'Material ODP 32 core datang', 'SC2026020302', 'BGU', '2026-02-03 14:00:00', '2026-02-03 14:00:00'),
(14241, 'RIDAR RIAU', 'WO033400041', NULL, 'Upload Excel', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'OGP', 'VALINS', '2026-02-04', 'RBI', 3, 'Survey perbukitan', 'Jarak jauh approval khusus', 'SC2026020401', 'RBI', '2026-02-04 10:15:00', '2026-02-04 10:15:00'),
(14242, 'RIDAR RIAU', 'WO033400042', 2, 'Daily Housekeeping', 'BENJAR ODP', 'OPEN', 'VALINS', '2026-02-04', 'UBT', 2, 'Ganti ODP total', 'Material ODP baru dikirim', 'SC2026020402', 'UBT', '2026-02-04 15:30:00', '2026-02-04 15:30:00'),
(14243, 'RIDAR RIAU', 'WO033400043', NULL, 'Upload Excel', 'OVER BOUNDARY', 'OGP', 'VALINS', '2026-02-05', 'PKR', 2, 'Verifikasi coverage', 'Alamat tidak sesuai sistem', 'SC2026020501', 'PKR', '2026-02-05 08:00:00', '2026-02-05 08:00:00'),
(14244, 'RIDAR RIAU', 'WO033400044', 3, 'Daily Housekeeping', 'BUTUH TANAM TIANG', 'OGP', 'VALINS', '2026-02-05', 'DUM', 3, 'Proses tiang', 'Jadwal PLN untuk 3 tiang', 'SC2026020502', 'DUM', '2026-02-05 11:00:00', '2026-02-05 11:00:00'),
(14245, 'RIDAR RIAU', 'WO033400045', NULL, 'Upload Excel', 'PT2 | FEEDER RETI', 'OPEN', 'VALINS', '2026-02-06', 'RGT', 2, 'Cek splitter feeder', 'Troubleshoot OLT ke splitter', 'SC2026020601', 'RGT', '2026-02-06 07:30:00', '2026-02-06 07:30:00'),
(14246, 'RIDAR RIAU', 'WO033400046', 2, 'Daily Housekeeping', 'ODP RETI/LOSS', 'OPEN', 'VALINS', '2026-02-06', 'AMK', 1, 'Pigtail diganti', 'Menunggu material', 'SC2026020602', 'PMB', '2026-02-06 13:20:00', '2026-02-07 14:47:37'),
(14247, 'RIDAR RIAU', 'WO033400047', 2, 'Daily Housekeeping', 'KENDALA SPBT', 'OPEN', 'VALINS', '2026-02-06', 'BKN', 2, 'Tambah port SPBT', 'Material SPBT dalam perjalanan', 'SC2026020603', 'BKN', '2026-02-06 16:00:00', '2026-02-06 16:00:00'),
(14248, 'RIDAR RIAU', 'WO033400048', NULL, 'Upload Excel', 'PT 3 | CROSSING JALAN', 'OGP', 'VALINS', '2026-02-07', 'PBB', 3, 'Izin crossing tol', 'Izin khusus boring area tol', 'SC2026020701', 'PBB', '2026-02-07 08:45:00', '2026-02-07 08:45:00'),
(14249, 'RIDAR RIAU', 'WO033400049', 1, 'Daily Housekeeping', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'OPEN', 'VALINS', '2026-02-07', 'ARK', 2, 'Expand 16 core', 'Proses expand hari ini', 'SC2026020702', 'ARK', '2026-02-07 10:30:00', '2026-02-07 10:30:00'),
(14250, 'RIDAR RIAU', 'WO033400050', 1, 'Upload Excel', 'CANCEL | PELANGGAN RAGU', 'OGP', 'VALINS', '2026-02-07', 'BKR', 1, 'Order dibatalkan', 'Sisip tiang', 'SC2026020703', 'BKR', '2026-02-07 14:15:00', '2026-02-07 14:59:35'),
(14251, NULL, 'WO033400048', 1, 'Daily Housekeeping', 'Update Daily', 'PINDAH LOKER', NULL, NULL, 'BAG', NULL, NULL, 'Sisip tiang', NULL, NULL, '2026-02-07 12:32:27', '2026-02-07 14:43:15'),
(14252, NULL, 'WO033400050', 4, 'Daily Housekeeping', 'Update Daily', 'OPEN', NULL, NULL, 'BGU', NULL, NULL, 'Melakukan Pembangunan ODP di jalur baru', NULL, NULL, '2026-02-07 14:56:00', '2026-02-07 14:59:49');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_activity`
--

CREATE TABLE `master_activity` (
  `id` int(11) NOT NULL,
  `activity_name` varchar(150) DEFAULT NULL,
  `status_default` varchar(30) DEFAULT NULL,
  `progress_default` decimal(3,2) DEFAULT NULL,
  `solusi_default` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `master_activity`
--

INSERT INTO `master_activity` (`id`, `activity_name`, `status_default`, `progress_default`, `solusi_default`) VALUES
(1, 'Perbaikan Jalur DC', 'OGP', 0.50, 'Sisip tiang'),
(2, 'Penggantian ODP', 'OPEN', 0.00, 'Menunggu material'),
(3, 'TIANG | IZIN OK', 'PINDAH LOKER', 0.70, 'PINDAH TIANG | IZIN OK'),
(4, 'PEMBANGUNAN ODP BARU', 'OPEN', 0.60, 'Melakukan Pembangunan ODP di jalur baru');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_status`
--

CREATE TABLE `master_status` (
  `status_code` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `master_status`
--

INSERT INTO `master_status` (`status_code`) VALUES
('COMPLETE'),
('OGP'),
('OPEN'),
('PINDAH LOKER');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_wo`
--

CREATE TABLE `master_wo` (
  `wonum` varchar(50) NOT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `lang` decimal(10,7) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `package_name` varchar(100) DEFAULT NULL,
  `ticket_id` varchar(100) DEFAULT NULL,
  `regional` varchar(50) DEFAULT NULL,
  `sto` varchar(50) DEFAULT NULL,
  `status_daily` varchar(50) DEFAULT NULL,
  `odp_inputan` varchar(100) DEFAULT NULL,
  `odp_todolist` varchar(100) DEFAULT NULL,
  `status_akhir` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `master_wo`
--

INSERT INTO `master_wo` (`wonum`, `nama`, `lang`, `lat`, `package_name`, `ticket_id`, `regional`, `sto`, `status_daily`, `odp_inputan`, `odp_todolist`, `status_akhir`, `created_at`, `updated_at`) VALUES
('WO033400001', 'Budi Santoso', 101.4492800, 0.5070500, 'INTERNET 20 MBPS', 'TIC2026010001', 'RIAU 1', 'PBB', 'Startwork', 'ODP-PBB-FGP/125 FGP/D05/125.01', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'Menunggu expand ODP', '2026-01-15 08:30:00', '2026-01-16 14:20:00'),
('WO033400002', 'Siti Aminah', 101.3876200, 0.4593100, 'INTERNET 30 MBPS', 'TIC2026010002', 'RIAU 1', 'ARK', 'Startwork', 'ODP-ARK-FAE/089 FAE/D05/089.01', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'Jarak 420m butuh kabel tambahan', '2026-01-15 09:15:00', '2026-01-15 09:15:00'),
('WO033400003', 'Ahmad Fauzi', 101.4125400, 0.5234600, 'INTERNET 50 MBPS', 'TIC2026010003', 'RIAU 2', 'DUM', 'Startwork', 'ODP-DUM-FK/016 FK/D02/016.01', 'PT2 | FEEDER RETI', 'Feeder rusak perlu repair segera', '2026-01-15 10:00:00', '2026-01-15 10:00:00'),
('WO033400004', 'Dewi Lestari', 101.4486300, 0.5341200, 'INTERNET 20 MBPS', 'TIC2026010004', 'RIAU 1', 'PKR', 'Complete', 'ODP-PKR-FL/098 FL/D05/098.01', 'BENJAR ODP', 'ODP sudah diperbaiki', '2026-01-16 07:45:00', '2026-01-17 10:30:00'),
('WO033400005', 'Rudi Hartono', 101.4023100, 0.4892300, 'INTERNET 100 MBPS', 'TIC2026010005', 'RIAU 1', 'BKR', 'Workfail', 'ODP-BKR-FP/075 FP/D04/075.01', 'PT 3 | CROSSING JALAN', 'Menunggu izin Dishub untuk crossing', '2026-01-16 11:20:00', '2026-01-16 11:20:00'),
('WO033400006', 'Fitri Handayani', 101.3654800, 0.4123700, 'INTERNET 30 MBPS', 'TIC2026010006', 'RIAU 3', 'RBI', 'Workfail', 'ODP-RBI-FA/117 FA/D08/117.01', 'OVER BOUNDARY', 'Diluar coverage area STO', '2026-01-17 08:00:00', '2026-01-17 08:00:00'),
('WO033400007', 'Eko Prasetyo', 101.4398700, 0.5156900, 'INTERNET 20 MBPS', 'TIC2026010007', 'RIAU 3', 'DRI', 'Startwork', 'ODP-DRI-FH/045 FH/D04/045.01', 'BUTUH TANAM TIANG', 'Koordinasi dengan PLN tanam tiang', '2026-01-17 13:30:00', '2026-01-17 13:30:00'),
('WO033400008', 'Linda Wijaya', 101.4573200, 0.4876500, 'INTERNET 50 MBPS', 'TIC2026010008', 'RIAU 1', 'PPN', 'Startwork', 'ODP-PPN-FZ/063 FZ/D04/063.01', 'KENDALA SPBT', 'SPBT penuh butuh tambah port', '2026-01-18 09:00:00', '2026-01-18 09:00:00'),
('WO033400009', 'Hendra Gunawan', 101.4654300, 0.5287400, 'INTERNET 30 MBPS', 'TIC2026010009', 'RIAU 3', 'BGU', 'Complete', 'ODP-BGU-FC/049 FC/D03/049.01', 'ODP RETI/LOSS', 'Splitter sudah diganti, loss normal', '2026-01-18 14:15:00', '2026-01-19 09:00:00'),
('WO033400010', 'Ratna Sari', 101.4012300, 0.4654100, 'INTERNET 20 MBPS', 'TIC2026010010', 'RIAU 2', 'TAK', 'Complete', 'ODP-TAK-FP/074 FP/D04/074.01', 'CANCEL | PELANGGAN RAGU', 'Pelanggan cancel karena biaya', '2026-01-19 10:30:00', '2026-01-19 10:30:00'),
('WO033400011', 'Agus Setiawan', 101.4487600, 0.5067800, 'INTERNET 100 MBPS', 'TIC2026010011', 'RIAU 1', 'PBB', 'Startwork', 'ODP-PBB-FGP/089 FGP/D04/089.01', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'ODP area padat maksimal', '2026-01-20 08:45:00', '2026-01-20 08:45:00'),
('WO033400012', 'Yuni Kartika', 101.4123600, 0.5398700, 'INTERNET 30 MBPS', 'TIC2026010012', 'RIAU 1', 'UBT', 'Workfail', 'ODP-UBT-FAF/025 FAF/D02/025.01', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'Jarak 380m butuh approval', '2026-01-20 11:00:00', '2026-01-20 11:00:00'),
('WO033400013', 'Bambang Susilo', 101.3897500, 0.4587600, 'INTERNET 50 MBPS', 'TIC2026010013', 'RIAU 1', 'ARK', 'Complete', 'ODP-ARK-FBE/034 FBE/D02/034.01', 'BENJAR ODP', 'Maintenance ODP selesai', '2026-01-21 07:30:00', '2026-01-21 15:00:00'),
('WO033400014', 'Sri Mulyani', 101.4267800, 0.4932100, 'INTERNET 20 MBPS', 'TIC2026010014', 'RIAU 1', 'RGT', 'Workfail', 'ODP-RGT-FN/015 FN/D01/015.01', 'PT 3 | CROSSING JALAN', 'Crossing jalan protokol butuh izin', '2026-01-21 13:00:00', '2026-01-21 13:00:00'),
('WO033400015', 'Dedi Kurniawan', 101.4598300, 0.4721900, 'INTERNET 100 MBPS', 'TIC2026010015', 'RIAU 2', 'PMB', 'Startwork', 'ODP-PMB-FD/056 FD/D03/056.01', 'PT2 | FEEDER RETI', 'Feeder putus pohon tumbang', '2026-01-22 08:15:00', '2026-01-22 08:15:00'),
('WO033400016', 'Rina Fitriani', 101.4109800, 0.5245600, 'INTERNET 30 MBPS', 'TIC2026010016', 'RIAU 2', 'DUM', 'Workfail', 'ODP-DUM-FL/002 FL/D01/002.01', 'BUTUH TANAM TIANG', 'Area baru butuh tiang PLN', '2026-01-22 10:45:00', '2026-01-22 10:45:00'),
('WO033400017', 'Joko Widodo', 101.4475300, 0.5329800, 'INTERNET 50 MBPS', 'TIC2026010017', 'RIAU 1', 'PKR', 'Complete', 'ODP-PKR-FR/121 FR/D06/121.01', 'ODP RETI/LOSS', 'Splitter ODP diganti baru', '2026-01-23 09:20:00', '2026-01-23 16:00:00'),
('WO033400018', 'Maya Angelina', 101.3921400, 0.4456700, 'INTERNET 20 MBPS', 'TIC2026010018', 'RIAU 2', 'BKN', 'Startwork', 'ODP-BKN-FG/082 FG/D05/082.01', 'KENDALA SPBT', 'SPBT maintenance drop connection', '2026-01-23 14:00:00', '2026-01-23 14:00:00'),
('WO033400019', 'Irfan Hakim', 101.4501200, 0.5078900, 'INTERNET 30 MBPS', 'TIC2026010019', 'RIAU 1', 'PBB', 'Workfail', 'ODP-PBB-FGP/156 FGP/D07/156.01', 'OVER BOUNDARY', 'Perbatasan 2 wilayah STO', '2026-01-24 08:00:00', '2026-01-24 08:00:00'),
('WO033400020', 'Novi Susanti', 101.3845600, 0.4612300, 'INTERNET 100 MBPS', 'TIC2026010020', 'RIAU 1', 'ARK', 'Startwork', 'ODP-ARK-FAE/103 FAE/D08/103.01', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', '5 pelanggan waiting list ODP full', '2026-01-24 11:30:00', '2026-01-24 11:30:00'),
('WO033400021', 'Toni Hermawan', 101.4034500, 0.4879100, 'INTERNET 50 MBPS', 'TIC2026010021', 'RIAU 1', 'BKR', 'Startwork', 'ODP-BKR-FJ/040 FJ/D03/040.01', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'Jarak 450m butuh kabel dan splitter', '2026-01-25 07:45:00', '2026-01-25 07:45:00'),
('WO033400022', 'Wati Rahayu', 101.4387600, 0.5143200, 'INTERNET 20 MBPS', 'TIC2026010022', 'RIAU 3', 'DRI', 'Complete', 'ODP-DRI-FH/030 FH/D03/030.01', 'PT 3 | CROSSING JALAN', 'Crossing jalan perumahan selesai', '2026-01-25 13:15:00', '2026-01-26 14:00:00'),
('WO033400023', 'Fahmi Rahman', 101.3687900, 0.4156700, 'INTERNET 30 MBPS', 'TIC2026010023', 'RIAU 3', 'RBI', 'Complete', 'ODP-RBI-FQ/044 FQ/D04/044.01', 'BENJAR ODP', 'Box ODP retak sudah diperbaiki', '2026-01-26 09:00:00', '2026-01-27 10:00:00'),
('WO033400024', 'Lisa Marlina', 101.4589700, 0.4898200, 'INTERNET 100 MBPS', 'TIC2026010024', 'RIAU 1', 'PPN', 'Complete', 'ODP-PPN-FZ/078 FZ/D05/078.01', 'CANCEL | PELANGGAN RAGU', 'Pelanggan pilih provider lain', '2026-01-26 15:30:00', '2026-01-26 15:30:00'),
('WO033400025', 'Bayu Nugroho', 101.4023400, 0.4643200, 'INTERNET 50 MBPS', 'TIC2026010025', 'RIAU 2', 'TAK', 'Startwork', 'ODP-TAK-FP/089 FP/D05/089.01', 'PT2 | FEEDER RETI', 'Feeder tidak stabil dari OLT', '2026-01-27 08:30:00', '2026-01-27 08:30:00'),
('WO033400026', 'Dian Permata', 101.4632100, 0.5276500, 'INTERNET 20 MBPS', 'TIC2026010026', 'RIAU 3', 'BGU', 'Workfail', 'ODP-BGU-FC/067 FC/D04/067.01', 'BUTUH TANAM TIANG', 'Perumahan baru belum ada tiang', '2026-01-27 10:00:00', '2026-01-27 10:00:00'),
('WO033400027', 'Andri Saputra', 101.4156700, 0.5376900, 'INTERNET 30 MBPS', 'TIC2026010027', 'RIAU 1', 'UBT', 'Startwork', 'ODP-UBT-FAF/048 FAF/D03/048.01', 'KENDALA SPBT', 'Kapasitas SPBT habis area ini', '2026-01-28 11:45:00', '2026-01-28 11:45:00'),
('WO033400028', 'Sari Indah', 101.4476500, 0.5056400, 'INTERNET 100 MBPS', 'TIC2026010028', 'RIAU 1', 'PBB', 'Complete', 'ODP-PBB-FGP/112 FGP/D05/112.01', 'ODP RETI/LOSS', 'Loss ODP sudah normal', '2026-01-28 14:20:00', '2026-01-29 09:00:00'),
('WO033400029', 'Reza Pratama', 101.3876800, 0.4623400, 'INTERNET 50 MBPS', 'TIC2026010029', 'RIAU 1', 'ARK', 'Workfail', 'ODP-ARK-FKE/045 FKE/D03/045.01', 'PT 3 | CROSSING JALAN', 'Crossing jalan utama izin pemda', '2026-01-29 08:15:00', '2026-01-29 08:15:00'),
('WO033400030', 'Nina Karlina', 101.4289100, 0.4943700, 'INTERNET 20 MBPS', 'TIC2026010030', 'RIAU 1', 'RGT', 'Startwork', 'ODP-RGT-FX/027 FX/D02/027.01', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'ODP kampus maksimal', '2026-01-29 13:00:00', '2026-01-29 13:00:00'),
('WO033400031', 'Hadi Kusuma', 101.4498700, 0.5345600, 'INTERNET 30 MBPS', 'TIC2026010031', 'RIAU 1', 'PKR', 'Startwork', 'ODP-PKR-FS/046 FS/D03/046.01', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'Ujung gang 395m dari ODP', '2026-01-30 09:30:00', '2026-01-30 09:30:00'),
('WO033400032', 'Lia Amelia', 101.4134500, 0.5267800, 'INTERNET 100 MBPS', 'TIC2026010032', 'RIAU 2', 'DUM', 'Complete', 'ODP-DUM-FAM/193 FAM/D09/193.01', 'BENJAR ODP', 'ODP dibersihkan dari rayap', '2026-01-30 15:00:00', '2026-01-31 10:00:00'),
('WO033400033', 'Fajar Nugraha', 101.4576800, 0.4734200, 'INTERNET 50 MBPS', 'TIC2026010033', 'RIAU 2', 'PMB', 'Workfail', 'ODP-PMB-FD/087 FD/D05/087.01', 'OVER BOUNDARY', 'Perbatasan kabupaten luar coverage', '2026-01-31 08:00:00', '2026-01-31 08:00:00'),
('WO033400034', 'Ika Sari', 101.4045600, 0.4912300, 'INTERNET 20 MBPS', 'TIC2026010034', 'RIAU 1', 'BKR', 'Startwork', 'ODP-BKR-FKA/001 FKA/D01/001.01', 'BUTUH TANAM TIANG', 'Butuh 3 tiang baru jalur kabel', '2026-01-31 10:30:00', '2026-01-31 10:30:00'),
('WO033400035', 'Doni Saputra', 101.4412300, 0.5187600, 'INTERNET 30 MBPS', 'TIC2026010035', 'RIAU 3', 'DRI', 'Startwork', 'ODP-DRI-FKC/006 FKC/D01/006.01', 'PT2 | FEEDER RETI', 'Fiber feeder bengkok di joint', '2026-02-01 07:45:00', '2026-02-01 07:45:00'),
('WO033400036', 'Sinta Dewi', 101.4567300, 0.4876200, 'INTERNET 100 MBPS', 'TIC2026010036', 'RIAU 1', 'PPN', 'Complete', 'ODP-PPN-FZ/091 FZ/D05/091.01', 'ODP RETI/LOSS', 'Connector dibersihkan loss normal', '2026-02-01 11:15:00', '2026-02-01 15:00:00'),
('WO033400037', 'Adi Nugroho', 101.4487200, 0.5089700, 'INTERNET 50 MBPS', 'TIC2026010037', 'RIAU 1', 'PBB', 'Complete', 'ODP-PBB-FGP/134 FGP/D06/134.01', 'KENDALA SPBT', 'SPBT reset sudah normal', '2026-02-02 09:00:00', '2026-02-02 11:30:00'),
('WO033400038', 'Putri Ayu', 101.3892300, 0.4598700, 'INTERNET 20 MBPS', 'TIC2026010038', 'RIAU 1', 'ARK', 'Workfail', 'ODP-ARK-FBP/003 FBP/D01/003.01', 'PT 3 | CROSSING JALAN', 'Crossing area industri pipa besar', '2026-02-02 13:45:00', '2026-02-02 13:45:00'),
('WO033400039', 'Gilang Ramadan', 101.4012800, 0.4687400, 'INTERNET 30 MBPS', 'TIC2026010039', 'RIAU 2', 'TAK', 'Complete', 'ODP-TAK-FP/102 FP/D06/102.01', 'CANCEL | PELANGGAN RAGU', 'Pelanggan pindah sebelum instalasi', '2026-02-03 08:30:00', '2026-02-03 08:30:00'),
('WO033400040', 'Mega Lestari', 101.4645600, 0.5298700, 'INTERNET 100 MBPS', 'TIC2026010040', 'RIAU 3', 'BGU', 'Startwork', 'ODP-BGU-FC/089 FC/D05/089.01', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', 'Upgrade ODP ke 32 core', '2026-02-03 14:00:00', '2026-02-03 14:00:00'),
('WO033400041', 'Wahyu Prabowo', 101.3701200, 0.4189600, 'INTERNET 50 MBPS', 'TIC2026010041', 'RIAU 3', 'RBI', 'Workfail', 'ODP-RBI-FA/143 FA/D07/143.01', 'PT 3 | JARAK JAUH (Lebih dari 250M)', 'Area perbukitan jarak 510m', '2026-02-04 10:15:00', '2026-02-04 10:15:00'),
('WO033400042', 'Ratih Permata', 101.4189700, 0.5387600, 'INTERNET 20 MBPS', 'TIC2026010042', 'RIAU 1', 'UBT', 'Startwork', 'ODP-UBT-FAF/056 FAF/D04/056.01', 'BENJAR ODP', 'ODP kena petir ganti total', '2026-02-04 15:30:00', '2026-02-04 15:30:00'),
('WO033400043', 'Rizki Maulana', 101.4465400, 0.5312400, 'INTERNET 30 MBPS', 'TIC2026010043', 'RIAU 1', 'PKR', 'Workfail', 'ODP-PKR-FE/011 FE/D01/011.01', 'OVER BOUNDARY', 'Alamat tidak sesuai sistem', '2026-02-05 08:00:00', '2026-02-05 08:00:00'),
('WO033400044', 'Indah Sari', 101.4123700, 0.5289500, 'INTERNET 100 MBPS', 'TIC2026010044', 'RIAU 2', 'DUM', 'Workfail', 'ODP-DUM-FK/006 FK/D01/006.01', 'BUTUH TANAM TIANG', 'Jadwal PLN untuk 3 tiang', '2026-02-05 11:00:00', '2026-02-05 11:00:00'),
('WO033400045', 'Yusuf Hidayat', 101.4298700, 0.4967800, 'INTERNET 50 MBPS', 'TIC2026010045', 'RIAU 1', 'RGT', 'Startwork', 'ODP-RGT-FG/099 FG/D07/099.01', 'PT2 | FEEDER RETI', 'Signal feeder lemah dari OLT', '2026-02-06 07:30:00', '2026-02-06 07:30:00'),
('WO033400046', 'Feni Andriani', 101.4587600, 0.4745300, 'INTERNET 20 MBPS', 'TIC2026010046', 'RIAU 2', 'PMB', 'Complete', 'ODP-PMB-FD/098 FD/D06/098.01', 'ODP RETI/LOSS', 'Pigtail diganti loss normal', '2026-02-06 13:20:00', '2026-02-06 16:30:00'),
('WO033400047', 'Dimas Prasetya', 101.3934500, 0.4487600, 'INTERNET 30 MBPS', 'TIC2026010047', 'RIAU 2', 'BKN', 'Startwork', 'ODP-BKN-FG/104 FG/D06/104.01', 'KENDALA SPBT', 'Port SPBT habis segment ini', '2026-02-06 16:00:00', '2026-02-06 16:00:00'),
('WO033400048', 'Citra Dewi', 101.4503400, 0.5098700, 'INTERNET 100 MBPS', 'TIC2026010048', 'RIAU 1', 'PBB', 'Workfail', 'ODP-PBB-FGP/178 FGP/D08/178.01', 'PT 3 | CROSSING JALAN', 'BENJAR ODC | DONE LANJUT PT2', '2026-02-07 08:45:00', '2026-02-07 12:32:27'),
('WO033400049', 'Arif Budiman', 101.3865400, 0.4612900, 'INTERNET 50 MBPS', 'TIC2026010049', 'RIAU 1', 'ARK', 'Startwork', 'ODP-ARK-FCU/076 FCU/D04/076.01', 'PT 2 | KENDALA ODP FULL ( NOK EXPAND)', '16 core ODP terpakai perlu expand', '2026-02-07 10:30:00', '2026-02-07 10:30:00'),
('WO033400050', 'Santi Wulandari', 101.4056700, 0.4923400, 'INTERNET 20 MBPS', 'TIC2026010050', 'RIAU 1', 'BKR', 'Cancelwork', 'ODP-BKR-FZ/104 FZ/D06/104.01', 'CANCEL | PELANGGAN RAGU', 'BENJAR ODC | DONE LANJUT PT2', '2026-02-07 14:15:00', '2026-02-07 14:56:00');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin', '2026-01-28 15:28:19', '2026-01-28 15:28:19');

-- --------------------------------------------------------

--
-- Struktur dari tabel `wilayah_ridar`
--

CREATE TABLE `wilayah_ridar` (
  `sto` varchar(50) NOT NULL,
  `uic` varchar(100) DEFAULT NULL,
  `pic` varchar(100) DEFAULT NULL,
  `leader` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `wilayah_ridar`
--

INSERT INTO `wilayah_ridar` (`sto`, `uic`, `pic`, `leader`, `created_at`, `updated_at`) VALUES
('AMK', 'Irfan Hakim', 'Hendra Gunawan', 'Adi Nugroho', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('ARK', 'Agus Salim', 'Zainudin Ahmad', 'Hendra Gunawan', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('BAG', 'Qori Ramadhan', 'Putra Wijaya', 'Agus Setiawan', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('BAS', 'Rudi Hartono', 'Qori Ramadhan', 'Ratna Sari', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('BGU', 'Budi Santoso', 'Agus Salim', 'Linda Wijaya', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('BKN', 'Umar Bakri', 'Toni Setiawan', 'Adi Nugroho', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('BKR', 'Siti Aminah', 'Andika Pratama', 'Hendra Gunawan', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('BLS', 'Joko Santoso', 'Irfan Hakim', 'Dimas Prasetya', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('DRI', 'Candra Wijaya', 'Budi Santoso', 'Agus Setiawan', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('DUM', 'Sandi Permana', 'Rudi Hartono', 'Doni Saputra', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('KDS', 'Erwin Syah', 'Dimas Prasetya', 'Doni Saputra', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('KLE', 'Khairul Anwar', 'Joko Santoso', 'Citra Dewi', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('MIS', 'Eko Wijaya', 'Bambang Hermawan', 'Linda Wijaya', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PBB', 'Ahmad Fauzi', 'Rendi Saputra', 'Budi Santoso', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PBB BARAT', 'Haniifah Putri', 'Gunawan Pratama', 'Dimas Prasetya', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PBB TIMUR', 'Gunawan Pratama', 'Farhan Hamid', 'Adi Nugroho', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PJD', 'Dimas Prasetya', 'Candra Wijaya', 'Ratna Sari', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PKR', 'Dewi Lestari', 'Dedi Kurniawan', 'Agus Setiawan', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PMB', 'Lukman Hakim', 'Khairul Anwar', 'Arif Budiman', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PNP', 'Muhammad Rizki', 'Lukman Hakim', 'Yusuf Mansur', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PPN', 'Vino Ardiansyah', 'Umar Bakri', 'Dimas Prasetya', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('PWG', 'Fajar Nugraha', 'Eko Wijaya', 'Ratna Sari', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('RBI', 'Gilang Ramadhan', 'Fajar Nugraha', 'Doni Saputra', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('RGT', 'Nanda Pratama', 'Muhammad Rizki', 'Budi Santoso', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('SAK', 'Wahyu Nugroho', 'Vino Ardiansyah', 'Citra Dewi', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('SEA', 'Xaverius Budi', 'Wahyu Nugroho', 'Arif Budiman', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('SGP', 'Zainudin Ahmad', 'Yudi Prasetyo', 'Budi Santoso', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('SLJ', 'Toni Setiawan', 'Sandi Permana', 'Sinta Dewi', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('SOK', 'Hendra Gunawan', 'Gilang Ramadhan', 'Sinta Dewi', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('SYO', 'Farhan Hamid', 'Erwin Syah', 'Sinta Dewi', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('TAK', 'Oka Saputra', 'Nanda Pratama', 'Hendra Gunawan', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('TBH', 'Putra Wijaya', 'Oka Saputra', 'Linda Wijaya', '2026-01-20 08:00:00', '2026-01-20 08:00:00'),
('UBT', 'Yudi Prasetyo', 'Xaverius Budi', 'Yusuf Mansur', '2026-01-20 08:00:00', '2026-01-20 08:00:00');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `bot_logs`
--
ALTER TABLE `bot_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `kendala_pelanggan`
--
ALTER TABLE `kendala_pelanggan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pelanggan_wo` (`wonum`),
  ADD KEY `fk_pelanggan_sto` (`sto`);

--
-- Indeks untuk tabel `kendala_teknisi_sistem`
--
ALTER TABLE `kendala_teknisi_sistem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_kendala_wo` (`wonum`),
  ADD KEY `fk_kendala_sto` (`sto`),
  ADD KEY `fk_kendala_activity` (`activity_id`);

--
-- Indeks untuk tabel `master_activity`
--
ALTER TABLE `master_activity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_activity_status` (`status_default`);

--
-- Indeks untuk tabel `master_status`
--
ALTER TABLE `master_status`
  ADD PRIMARY KEY (`status_code`);

--
-- Indeks untuk tabel `master_wo`
--
ALTER TABLE `master_wo`
  ADD PRIMARY KEY (`wonum`),
  ADD KEY `fk_masterwo_sto` (`sto`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `wilayah_ridar`
--
ALTER TABLE `wilayah_ridar`
  ADD PRIMARY KEY (`sto`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `bot_logs`
--
ALTER TABLE `bot_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT untuk tabel `kendala_pelanggan`
--
ALTER TABLE `kendala_pelanggan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=151;

--
-- AUTO_INCREMENT untuk tabel `kendala_teknisi_sistem`
--
ALTER TABLE `kendala_teknisi_sistem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14253;

--
-- AUTO_INCREMENT untuk tabel `master_activity`
--
ALTER TABLE `master_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `kendala_pelanggan`
--
ALTER TABLE `kendala_pelanggan`
  ADD CONSTRAINT `fk_pelanggan_sto` FOREIGN KEY (`sto`) REFERENCES `wilayah_ridar` (`sto`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pelanggan_wo` FOREIGN KEY (`wonum`) REFERENCES `master_wo` (`wonum`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kendala_teknisi_sistem`
--
ALTER TABLE `kendala_teknisi_sistem`
  ADD CONSTRAINT `fk_kendala_activity` FOREIGN KEY (`activity_id`) REFERENCES `master_activity` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kendala_sto` FOREIGN KEY (`sto`) REFERENCES `wilayah_ridar` (`sto`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kendala_wo` FOREIGN KEY (`wonum`) REFERENCES `master_wo` (`wonum`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `master_activity`
--
ALTER TABLE `master_activity`
  ADD CONSTRAINT `fk_activity_status` FOREIGN KEY (`status_default`) REFERENCES `master_status` (`status_code`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `master_wo`
--
ALTER TABLE `master_wo`
  ADD CONSTRAINT `fk_masterwo_sto` FOREIGN KEY (`sto`) REFERENCES `wilayah_ridar` (`sto`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
