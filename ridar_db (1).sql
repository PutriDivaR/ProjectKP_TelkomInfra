-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 27 Jan 2026 pada 09.48
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
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `bot_logs`
--

INSERT INTO `bot_logs` (`id`, `input_type`, `input_value`, `result_status`, `created_at`) VALUES
(1, 'keyword', 'WO-001', 'ON_PROGRESS', '2026-01-26 14:06:59'),
(2, 'keyword', 'TCK-002', 'COMPLETE', '2026-01-26 14:13:01'),
(3, 'keyword', 'TCK-002', 'COMPLETE', '2026-01-26 14:20:24'),
(4, 'keyword', 'TCK-002', 'COMPLETE', '2026-01-26 14:25:24'),
(5, 'keyword', 'TCK-002', 'COMPLETE', '2026-01-26 14:25:31'),
(6, 'keyword', 'WO-001', 'ON_PROGRESS', '2026-01-26 14:25:53'),
(7, 'keyword', 'WO-001', 'ON_PROGRESS', '2026-01-27 15:45:00');

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
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kendala_teknisi_sistem`
--

INSERT INTO `kendala_teknisi_sistem` (`id`, `unit_inisiator`, `wonum`, `activity_id`, `activity`, `activity_teknisi`, `status_todolist`, `segment_alpro`, `month_date`, `sto`, `target`, `proses`, `solusi_progress`, `sc_order`, `created_at`, `updated_at`) VALUES
(1, 'Assurance', 'WO-001', 1, 'Perbaikan Jalur DC', 'Cek kabel dan redaman', 'OGP', 'Fiber', '2026-01-01', 'RIDAR', 1, 'On Going', 'Sisip tiang tambahan', 'SC-001', '2026-01-26 11:36:19', '2026-01-26 11:36:19');

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
(1, 'Perbaikan Jalur DC', 'ON_PROGRESS', 0.50, 'Sisip tiang'),
(2, 'Penggantian ODP', 'OPEN', 0.00, 'Menunggu material');

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
('CANCEL'),
('COMPLETE'),
('ON_PROGRESS'),
('OPEN');

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
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `master_wo`
--

INSERT INTO `master_wo` (`wonum`, `nama`, `lang`, `lat`, `package_name`, `ticket_id`, `regional`, `sto`, `status_daily`, `odp_inputan`, `odp_todolist`, `created_at`, `updated_at`) VALUES
('WO-001', 'Andi Saputra', 101.4475000, 0.5332000, 'IndiHome 30 Mbps', 'TCK-001', 'REGIONAL 1', 'RIDAR', 'ON_PROGRESS', 'ODP-RIDAR-01', NULL, '2026-01-26 11:35:40', '2026-01-26 11:35:40'),
('WO-002', 'Budi Santoso', 101.4550000, 0.5401000, 'IndiHome 50 Mbps', 'TCK-002', 'REGIONAL 1', 'BIMA', 'COMPLETE', 'ODP-BIMA-02', NULL, '2026-01-26 11:35:40', '2026-01-26 11:35:40');

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
('BIMA', 'UIC-R2', 'PIC-BIMA', 'LEADER-R2', '2026-01-26 11:32:39', '2026-01-26 11:32:39'),
('RIDAR', 'UIC-R1', 'PIC-RIDAR', 'LEADER-R1', '2026-01-26 11:32:39', '2026-01-26 11:32:39');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `kendala_pelanggan`
--
ALTER TABLE `kendala_pelanggan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `kendala_teknisi_sistem`
--
ALTER TABLE `kendala_teknisi_sistem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `master_activity`
--
ALTER TABLE `master_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
