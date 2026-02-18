# TRID – Aplikasi Pelaporan & Tugas RIDAR
# TRID — Telkom RIDAR ID

Sistem TRID (Telkom RIDAR ID) adalah aplikasi monitoring dan manajemen pekerjaan teknisi serta kendala pelanggan untuk wilayah RIDAR. Aplikasi ini menyatukan data master WO, housekeeping harian (daily), todolist aktivitas teknisi, rekap kendala pelanggan, wilayah STO, dan bot pengecekan cepat menjadi satu dashboard yang terintegrasi.

Dokumen ini menjelaskan arsitektur, alur data (alur cerita), skema database, API routes, halaman frontend, serta langkah instalasi dan penggunaan end‑to‑end.


## Ringkas Fitur

- Autentikasi (login/register/logout) berbasis session
- Dashboard KPI dan analitik dengan filter (STO, regional, status, rentang tanggal, pencarian)
- Daily Housekeeping: daftar/ubah detail WO dan pencatatan riwayat perubahan
- Todolist (Kendala Teknik Sistem): CRUD, impor dari Excel/CSV, sinkron dengan master_wo
- Rekap Kendala Pelanggan: input, edit, filter/paginate, ekspor Excel/PDF
- Data Kendala (gabungan teknik & sistem): upload/preview CSV/Excel, pemetaan kolom, de‑duplikasi
- Master data: Activity teknisi (default status/progress/solusi), Wilayah RIDAR (STO/UIC/PIC/Leader), Status master
- Bot API: endpoint untuk pencarian cepat status tiket/WO dan pelaporan log


## Arsitektur Aplikasi

- Platform: Node.js + Express
- View engine: EJS
- Session: express-session
- Database: MariaDB/MySQL (mysql2/promise)
- Upload/Parsing: multer, csv-parser
- Ekspor: exceljs, pdfkit, xlsx
- Frontend: EJS views + static assets di `public/`

Struktur utama:

- `src/app.js` — konfigurasi Express, middleware, session, routing
- `src/server.js` — entrypoint server, menjalankan pada port 3000
- `src/config/db.js` — koneksi pool database (mysql2/promise)
- `src/routes/*.routes.js` — modul rute untuk setiap fitur
- `views/*.ejs` — template halaman
- `public/css|js|img` — aset frontend
- `uploads/` — direktori sementara upload file


## Alur Cerita (Data Flow End‑to‑End)

1) Pengguna autentikasi
   - Mengakses `/login` untuk masuk. Kredensial diverifikasi terhadap tabel `users` (password tersimpan hash bcrypt). Session user diset pada `req.session.user`.
   - `/register` untuk membuat akun baru (validasi kuat: panjang, konfirmasi, cek duplikasi). Password di-hash.

2) Dashboard
   - Setelah login, root `/` mengarahkan ke `/dashboard`.
   - Dashboard melakukan agregasi dari `master_wo` (total WO, distribusi status harian, tren harian 30 hari, completion rate), join ke `kendala_teknisi_sistem` (distribusi status todolist, aktivitas teknisi), `kendala_pelanggan` (status HI, TTIC, TTD), dan `wilayah_ridar` (UIC/PIC/Leader). Filter query (`sto_filter`, `regional_filter`, `status_filter`, `date_from`, `date_to`, `search`) mempengaruhi semua KPI.

3) Daily Housekeeping
   - Halaman `/dailyhouse` menampilkan daftar WO dari `master_wo` dengan pagination dan filter tanggal.
   - Detail WO `/dailyhouse/:wonum` memperlihatkan record WO dan riwayat dari `kendala_teknisi_sistem` untuk WO terkait.
   - Update WO `/dailyhouse/update/:wonum` mengubah field (lat, lang, package_name, status_daily, status_akhir, sto, odp_todolist). Setiap perubahan akan dicatat sebagai log ke `kendala_teknisi_sistem` dengan activity “Daily Housekeeping”.

4) Todolist (Kendala Teknik Sistem)
   - `/todolist` menampilkan seluruh entry dari `kendala_teknisi_sistem` termasuk mapping ke `master_activity` dan `wilayah_ridar`.
   - API `GET /api/todolist` / `GET /api/todolist/:id` / `PUT /api/todolist/:id` / `DELETE` tersedia untuk manipulasi data.
   - Import todolist `POST /api/todolist/import` menerima array rows (Excel/CSV yang diubah ke JSON di frontend), melakukan:
     - Sinkronisasi `master_wo` (insert/update `wonum` dan `odp_inputan` bila perlu)
     - Upsert `kendala_teknisi_sistem` berdasar `wonum`
     - Transaksi, batching besar, dan timeout session agar stabil

5) Rekap Kendala Pelanggan
   - `/kendala` menampilkan rekap dari `kendala_pelanggan` join `master_wo` (ticket_id) dengan filter (q, status, sto, ttic, date) dan pagination.
   - `/kendala/input` — form input kendala pelanggan dengan validasi ketat WONUM (format `WO\d{10}`), STO whitelist, format TTD KB (contoh: “90 Hari”).
   - Saat simpan, jika `master_wo` belum punya record untuk `wonum`, sistem otomatis menyisipkan minimal kolom (termasuk `ticket_id` acak “IDXXXXXXXXX” bila tersedia), lalu menulis `kendala_pelanggan`.
   - `/kendala/edit/:id` — edit kendala; perubahan disimpan ke `kendala_pelanggan`.
   - Ekspor Excel/PDF disiapkan dari data hasil filter.

6) Data Kendala (Teknik & Sistem)
   - `/datakendala` menggabungkan listing dari `master_wo` untuk tampilan tab Teknik/Sistem.
   - Upload CSV `/datakendala/upload` dan preview `/datakendala/upload-preview` mendukung pemetaan kolom dinamis, validasi STO, konversi tanggal (serial Excel → ISO), serta de‑duplikasi berdasarkan kombinasi `wonum + tgl_manja + status_akhir`.
   - Upload JSON `/datakendala/upload-json` (hasil baca Excel di frontend) memakai logika serupa.

7) Wilayah RIDAR & Master Activity
   - API master: `GET /api/wilayah-ridar` dan `GET /api/master-activity` untuk mengisi dropdown dan default (status, progress, solusi) saat update todolist.
   - Bila upload menemukan STO baru yang valid (ada di whitelist), sistem berusaha memasukkan ke `wilayah_ridar` agar konsisten.

8) Bot API
   - Endpoint berada di `/api/bot` (lihat `src/routes/bot.routes.js`). Bot menampung log di tabel `bot_logs` (input_type, input_value, result_status, response_message, command_used, dll) dan melakukan lookup cepat terhadap WO atau perintah (misal `/help`, `/cek`).


## Instalasi & Menjalankan

Prasyarat:
- Node.js 18+ (disarankan)
- MariaDB/MySQL 10.4+ (atau kompatibel)

1) Clone repository dan install dependencies

```powershell
git clone https://github.com/PutriDivaR/ProjectKP_TelkomInfra.git
cd ProjectKP_TelkomInfra
npm install
```

2) Konfigurasi Database

- Buat database MariaDB/MySQL bernama `ridar_dummydiva`.
- Import file SQL: `ridar_dummydashboard.sql` ke database tersebut (berisi tabel: `master_wo`, `kendala_pelanggan`, `kendala_teknisi_sistem`, `users`, `wilayah_ridar`, `master_activity`, `master_status`, `bot_logs`).
- Ubah kredensial DB bila perlu di `src/config/db.js`.

3) Variabel Lingkungan (opsional)

- `SESSION_SECRET` — secret session; default: `telkom-dev-secret`.
- Kredensial DB bisa di-hardcode (sekarang) atau diatur via dotenv jika Anda menyesuaikan `src/config/db.js`.

4) Jalankan aplikasi

```powershell
npm run start
# atau selama pengembangan
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.


## Rute Utama (Backend)

- Auth
  - `GET /login`, `GET /register`
  - `POST /api/auth/login` — login (session)
  - `POST /api/auth/register` — buat akun (bcrypt)
  - `POST /api/auth/logout` atau `GET /logout`
  - `GET /api/auth/me` — info session user

- Dashboard
  - `GET /dashboard` — tampilan KPI & analitik dengan filter
  - `GET /dashboard/api/refresh` — refresh ringan (totalWO, statusDaily)
  - `GET /dashboard/export/excel` — ekspor data gabungan sesuai filter

- Daily Housekeeping
  - `GET /dailyhouse` — list WO (pagination)
  - `GET /dailyhouse/:wonum` — detail WO dan log
  - `POST /dailyhouse/update/:wonum` — update WO dan auto‑log perubahan
  - `GET /dailyhouse/api/status` — daftar status harian default
  - `GET /dailyhouse/api/status-akhir` — daftar status akhir preset

- Todolist (Kendala Teknik Sistem)
  - `GET /todolist` — halaman
  - `GET /api/todolist` — list
  - `GET /api/todolist/:id` — detail
  - `PUT /api/todolist/:id` — update (menggunakan default dari `master_activity` jika tidak diisi)
  - `DELETE /api/todolist/:id`, `POST /api/todolist/delete-selected`, `DELETE /api/todolist/delete-all`
  - `POST /api/todolist/import` — import batch (sinkronisasi `master_wo` + upsert `kendala_teknisi_sistem`)
  - Master: `GET /api/master-activity`, `GET /api/wilayah-ridar`

- Rekap Kendala Pelanggan
  - `GET /kendala` — list + filter/paginate
  - `GET /kendala/input` — form input
  - `POST /kendala/input` — simpan; validasi WONUM, STO, TTD KB
  - `GET /kendala/edit/:id` — detail/edit
  - `POST /kendala/edit/:id` — update
  - `GET /kendala/export/excel` — ekspor Excel
  - `GET /kendala/export/pdf` — ekspor PDF (bila diaktifkan di route)

- Data Kendala (Teknik & Sistem)
  - `GET /datakendala` — tab “teknik”/“sistem” dari `master_wo`
  - Upload CSV: `POST /datakendala/upload` + `POST /datakendala/upload-preview`
  - Upload JSON (Excel): `POST /datakendala/upload-json`
  - Export CSV: `GET /datakendala/export`

- Bot
  - `POST /api/bot/...` — endpoint sesuai implementasi bot; log di `bot_logs`


## Skema Database (Ringkas)

- `master_wo` — data WO utama: wonum, nama, lang, lat, package_name, ticket_id, regional, sto, status_daily, status_akhir, odp_inputan, bulan, tgl_manja, status_kpro, kendala, kategori, catatan_teknisi, created_at, updated_at
- `kendala_teknisi_sistem` — aktivitas teknisi/log perubahan: wonum, activity/activity_teknisi/status_todolist, solusi_progress, segment_alpro, sto, timestamps
- `kendala_pelanggan` — input kendala pelanggan: wonum, tanggal_input, sto, ttd_kb (durasi hari), status_hi, ttic, keterangan, nama_teknis, timestamps
- `users` — autentikasi: username, password (bcrypt), timestamps
- `wilayah_ridar` — master STO: sto, uic, pic, leader, timestamps
- `master_activity` — master aktivitas teknisi: activity_name, status_default, progress_default, solusi_default
- `master_status` — daftar status todolist
- `bot_logs` — logging bot
- Isi `master_wo` kini memuat banyak field integrasi untuk daily/todolist/kendala
- `wilayah_ridar` berisi mapping STO beserta UIC/PIC/Leader
- `users` memuat akun sample (catatan: pastikan hash bcrypt; jangan gunakan password plain)


## Halaman Frontend (Views)

- `views/login.ejs`, `views/register.ejs` — autentikasi
- `views/dashboard.ejs` — KPI, charts, tabel ringkasan; filter STO/Regional/Status/Date/Search
- `views/dailyhouse.ejs`, `views/detail.ejs` — daftar WO & detail/log
- `views/todolist.ejs` — daftar kendala teknisi sistem; aksi batch delete/import
- `views/kendala.ejs` — rekap, input, edit kendala pelanggan
- `views/datakendala.ejs` — gabungan teknik & sistem; upload/preview/mapping
- Layout: `views/layout/header.ejs`, `views/layout/sidebar.ejs`, `views/layout/footer.ejs`, `views/layout/bot.ejs`

Asset frontend berada di `public/` (CSS dan JS per halaman: dashboard.js/css, daily.js/css, todolist.js/css, kendala.js/css, datakendala.js/css, wilayahridar.js/css, dll).


## Best Practices & Catatan Implementasi

- Authentication guard: semua rute inti (dashboard, daily, todolist, kendala, datakendala, wilayah, kendala teknik) dilindungi oleh middleware `requireAuth` (redirect ke `/login`).
- DB pool: gunakan `mysql2/promise` pool dengan `waitForConnections=true`, `connectionLimit=10`. Fungsi `checkConnection()` akan log “db connect” saat startup.
- Import besar: gunakan batching (500–1000 row), transaksi, dan penyesuaian `wait_timeout` saat perlu.
- Validasi STO: whitelist STO dan sinkronisasi otomatis ke `wilayah_ridar` agar konsisten.
- Formatting TTD KB: input angka atau “X hari” akan dinormalisasi menjadi “X Hari”.
- Logging perubahan: setiap update daily akan menulis ringkasan perubahan ke `kendala_teknisi_sistem`.
- Ekspor: gunakan endpoint export untuk menyiapkan CSV/Excel sesuai kebutuhan; PDF via `pdfkit` tersedia bila diaktifkan.


## Cara Cepat Mencoba

1) Pastikan database `ridar_dummydiva` sudah di‑import dari `ridar_dummydashboard.sql`.
2) Jalankan server, akses `http://localhost:3000/login`.
3) Login akun contoh atau daftar akun baru.
4) Buka `/dashboard` untuk melihat metrik.
5) Telusuri `/dailyhouse`, `/todolist`, `/kendala`, `/datakendala` untuk fitur lengkap.


## Troubleshooting

- “db error”: cek kredensial di `src/config/db.js` dan bahwa database `ridar_dummydiva` aktif.
- Session tidak tersimpan: set `SESSION_SECRET` dan pastikan cookie tidak diblokir browser.
- Import CSV/Excel gagal: cek mapping kolom, pastikan wonum ada dan format tanggal valid. Gunakan preview untuk memverifikasi header.
- Ekspor tidak muncul: periksa hak akses folder dan response headers.


## Lisensi

ISC. Lihat `package.json` untuk detail.

Laporan teknis komprehensif untuk sistem web TRID yang digunakan tim RIDAR (TIP TA) dalam memantau Work Order (WO), mengelola kendala pelanggan dan kendala teknisi, serta menyajikan dashboard analitik dengan impor/ekspor data.

## Ringkasan

TRID adalah aplikasi berbasis Node.js + Express dengan view engine EJS, database MySQL, dan frontend JavaScript/CSS modular. Sistem ini menyediakan:
- Dashboard analitik (status, tren harian, distribusi STO, paket, dan KPI).
- Modul Daily Housekeeping untuk listing, pencarian, filter tanggal, detail WO, update, import CSV/Excel, dan export.
- Modul Kendala Pelanggan untuk input dan rekap kendala (status HI, TTIC, TTD KB) dengan validasi.
- Modul Kendala Teknik (Todolist) dan Master Activity untuk normalisasi aktivitas teknisi dan progress.
- Bot Status Assistant untuk cek status WO/Ticket ID, statistik riwayat, dan info STO.
- Autentikasi berbasis session (login/register/logout).

## Arsitektur dan Alur Kerja

```
[Browser (EJS Views + JS/CSS)]
        |  HTTP
        v
[Express (src/app.js)] -- session, static assets, auth guard
        |
        +-- Routes:
            - /dashboard (src/routes/dashboard.routes.js)
            - /dailyhouse (src/routes/daily.routes.js)
            - /kendala (src/routes/kendala.routes.js)
            - /kendala-teknik & /api/kendala-teknik (src/routes/kendalateknik.routes.js)
            - /todolist & /api/todolist (src/routes/todolist.routes.js)
            - /api/bot (src/routes/bot.routes.js)
            - /login /register /api/auth/* (src/routes/auth.routes.js)
        |
        v
[MySQL (src/config/db.js)] <--> Tables: master_wo, kendala_pelanggan,
                                    kendala_teknisi_sistem, wilayah_ridar,
                                    master_activity, bot_logs, users
```

- View engine: EJS (`views/`)
- Static assets: CSS & JS (`public/`)
- Server entry: `src/server.js` → listens on http://localhost:3000
- Database pool: `src/config/db.js` (mysql2/promise)

## Alur Sistem (Detail)

Berikut alur kerja utama sistem, ditulis agar dapat dipahami tanpa membuka seluruh kode sumber.

### Autentikasi & Akses
- Pengguna mengakses `/login` atau `/register` (render oleh `auth.routes.js`).
- Login: `POST /api/auth/login` memverifikasi username/password (bcrypt). Jika valid, menyetel `req.session.user`.
- Guard: Middleware `requireAuth` di `src/app.js` hanya mengizinkan akses modul inti jika sesi ada; jika tidak, redirect ke `/login`.
- Alur awal: GET `/` → jika sudah login, redirect `/dashboard`; jika belum, redirect `/login`.

### Dashboard (Data Pipeline end-to-end)
1. Request ke `GET /dashboard` membawa parameter filter opsional: `sto_filter`, `regional_filter`, `status_filter`, `date_from`, `date_to`, `search`.
2. Server (`dashboard.routes.js`) membangun WHERE clause dinamis dan menjalankan serangkaian query agregasi: total WO, distribusi status (daily/todolist/HI), top STO, tren harian 30 hari, completion rate harian, activity teknisi, workfall per STO, recent WO, paket, performa regional, info STO (join dengan `wilayah_ridar`), distribusi TTIC, segment, TTD KB.
3. Data dikirim ke EJS `views/dashboard.ejs`. Elemen `<canvas>` diberi atribut `data-values` yang berisi JSON sederhana hasil query.
4. Frontend (`public/js/dashboard.js`) menginisiasi berbagai Chart.js (pie/doughnut/bar/line/polarArea) dari `data-values`. Tersedia fitur filter, refresh KPI via `GET /dashboard/api/refresh`, dan ekspor:
  - Export PDF: client-side menggunakan jsPDF (header cover, KPI cards, tabel workfall, gambar chart) → file `RIDAR_Dashboard_YYYY-MM-DD.pdf`.
  - Export Excel: client-side SheetJS memanggil `GET /dashboard/export/excel` (menggabungkan master_wo + kendala) → workbook dengan sheet Summary dan Detailed Data.

### Daily Housekeeping (Listing → Detail → Update → Import/Export)
1. Listing: `GET /dailyhouse` menampilkan daftar WO dari `master_wo` dengan filter tanggal dan pagination. KPI kecil (count per status_daily) dihitung dari seluruh data (bukan hanya halaman aktif).
2. Detail: `GET /dailyhouse/:wonum` menampilkan detail WO serta log teknisi (dari `kendala_teknisi_sistem`).
3. Update: `POST /dailyhouse/update/:wonum` mengizinkan update field terbatas (lat, lang, package, status, status_akhir, sto, odp_todolist). Validasi STO terhadap `wilayah_ridar`. Jika `solusi_progress` diisi, dibuat satu log teknisi baru.
4. Import CSV (server-side parsing):
  - Preview: `POST /dailyhouse/upload-preview` membaca beberapa baris awal untuk menentukan header kolom via `csv-parser`.
  - Import: `POST /dailyhouse/upload` menerima file + mapping kolom. Validasi STO; lakukan UPDATE atau INSERT ke `master_wo` saja (tidak membuat log teknisi). Hitung keberhasilan/gagal per baris.
5. Import Excel (client-side parsing): `POST /dailyhouse/upload-json` menerima `rows` hasil parsing Excel di browser dengan SheetJS; alur validasi & update/insert sama seperti CSV import.
6. Export CSV: `GET /dailyhouse/export` menghasilkan CSV standar dari `master_wo`.

### Kendala Pelanggan (Form → Validasi → Simpan → Rekap/Edit/Hapus)
1. Form input: `GET /kendala/input` menampilkan daftar STO yang di-hardcode (fallback) serta pesan error jika ada.
2. Simpan: `POST /kendala/input` melakukan:
  - Validasi WONUM tidak kosong dan sesuai regex `^WO\d{10}$`.
  - Cek duplikat di `kendala_pelanggan`.
  - Generate Ticket ID otomatis (`ID#########`) dan (opsional) update `master_wo.ticket_id` jika belum ada.
  - Normalisasi `ttd_kb` ke format "X Hari"; jika invalid → error.
  - Insert baris baru ke `kendala_pelanggan` (id unik berbasis timestamp+random).
3. Rekap: `GET /kendala` menampilkan rekap dengan breakdown status HI (PROGRESS/REJECT/CLOSED) dan pencarian wonum.
4. Edit: `GET /kendala/edit/:id` + `POST /kendala/edit/:id` hanya menyimpan jika data benar-benar berubah (deteksi perubahan nilai kolom). Normalisasi `ttd_kb` dijalankan kembali.
5. Hapus: `POST /kendala/delete/:id` menghapus baris.

### Kendala Teknik (Todolist) & Master Activity (Batch Import & CRUD)
1. Page: `GET /todolist` dan `GET /kendala-teknik` merender halaman daftar dan master.
2. Master Activity API (`/api/kendala-teknik`): CRUD kamus aktivitas dengan validasi `progress_default` 0–1.
3. Todolist API (`/api/todolist`):
  - GET all / get by id, PUT update, DELETE by id, DELETE-ALL dan DELETE-SELECTED (
    menerima array id).
  - Import batch: `POST /api/todolist/import` memproses ribuan baris secara efisien:
    a) Ambil daftar wonum unik dari payload.
    b) Bulk-cek keberadaan wonum di `master_wo` dan `kendala_teknisi_sistem` (dalam batch, menjaga timeout).
    c) Siapkan `toInsertMasterWo` dan `toUpdateMasterWo` untuk master_wo (insert IGNORE & update berbatch).
    d) Pisahkan `rowsToInsert` dan `rowsToUpdate` untuk `kendala_teknisi_sistem` lalu jalankan dalam batch (commit transaksi di akhir; rollback bila error).

### Bot Status Assistant (Command → Query → Log → Response)
1. Endpoint utama: `POST /api/bot/check-status` menerima `keyword` dan `sessionId`.
2. Jika `keyword` diawali `/`, ditangani oleh handler perintah (`/help`, `/cek`, `/last`, `/history`, `/dashboard`, `/stats`, `/sto`, `/clear`, `/about`).
3. Jika `keyword` adalah WO/Ticket ID: query `master_wo` (status, lokasi, pelanggan), lalu gabungkan info `kendala_pelanggan` dan `kendala_teknisi_sistem` jika ada.
4. Setiap interaksi dicatat ke `bot_logs` (input, hasil, waktu). Response diperkaya dengan badge status, quick replies, dan waktu update terakhir.
5. Riwayat: `GET /api/bot/history/:sessionId`; hapus riwayat: `POST /api/bot/clear-history`.

### Edge Cases & Penanganan Error
- Validasi STO saat import/update (jika tidak ditemukan di `wilayah_ridar`, diset NULL agar konsisten).
- `ttd_kb` harus berbentuk angka atau "angka hari" (contoh: `90` atau `90 hari`).
- Batch import menghindari timeout dengan chunking dan transaksi; terjadi error → rollback.
- Pada dashboard, filter query aman (parameterized queries) dan semua agregasi mengabaikan nilai NULL saat perlu.
- Auth menolak akses tanpa session; password dibatasi minimal 6 karakter saat registrasi.

## Struktur File Lengkap

Tree berikut merangkum seluruh struktur yang relevan untuk memahami sistem tanpa harus membuka semua file:

```
index.js
package.json
README.md
ridar_db(verdiv).sql
public/
  css/
    auth.css
    bot.css
    daily.css
    dashboard.css
    kendala.css
    kendalateknik.css
    sidebar.css
    todolist.css
  img/
  js/
    auth.js
    bot.js
    daily-detail.js
    daily.js
    dashboard.js
    kendala.js
    kendalateknik.js
    sidebar.js
    todolist.js
scripts/
  drop-fk-kendala-wonum.sql
  get_first_wonum.js
  get_master_wo_schema.js
  seed-wilayah-ridar-sto.sql
src/
  app.js
  server.js
  config/
    db.js
  controllers/
  models/
  routes/
    auth.routes.js
    bot.routes.js
    daily.routes.js
    dashboard.routes.js
    kendala.routes.js
    kendalateknik.routes.js
    todolist.routes.js
  services/
  utils/
uploads/
views/
  dailyhouse.ejs
  dashboard.ejs
  detail.ejs
  kendala.ejs
  kendalateknik.ejs
  login.ejs
  register.ejs
  todolist.ejs
  layout/
    bot.ejs
    footer.ejs
    header.ejs
    sidebar.ejs
```

## Teknologi

- Backend: Node.js, Express, EJS, express-session
- Database: MySQL (mysql2/promise)
- Frontend: JS modular, CSS custom
- Visualisasi: Chart.js (via CDN di EJS),
- Ekspor: jsPDF + html2canvas (via CDN di EJS), SheetJS/XLSX (npm)
- Upload: multer, csv-parser
- Auth: bcrypt (hashing password)

Dependencies utama (`package.json`):
- express, ejs, express-session
- mysql2, dotenv, multer, csv-parser, xlsx
- bcrypt
- dev: nodemon

## Basis Data (Ikhtisar Tabel)

- `master_wo`: wonum, nama, ticket_id, sto, regional, lat/lang, package_name, status_daily, status_akhir, odp_inputan, odp_todolist, created_at, updated_at
- `kendala_pelanggan`: id, wonum, tanggal_input, sto, ttd_kb (format "X Hari"), status_hi, ttic, keterangan, nama_teknis, created_at, updated_at
- `kendala_teknisi_sistem`: id, wonum, activity/activity_teknisi, activity_id, status_todolist, solusi_progress, segment_alpro, unit_inisiator, month_date, sto, created_at, updated_at
- `wilayah_ridar`: sto, uic, pic, leader (master wilayah/STO)
- `master_activity`: id, activity_name, status_default, progress_default (0–1), solusi_default
- `bot_logs`: session_id, input_type (keyword/command), input_value, result_status, response_message, command_used, created_at
- `users`: id, username, password (bcrypt hash), timestamps

SQL awal: `ridar_db(verdiv).sql` dan seed wilayah: `scripts/seed-wilayah-ridar-sto.sql`

## Fitur Utama

### 1) Autentikasi
- Halaman: `views/login.ejs`, `views/register.ejs`
- API: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`
- Session guard (`requireAuth`) meneruskan user ke `/dashboard` ketika login, atau `/login` jika belum.

### 2) Dashboard
- Rangkuman KPI, distribusi status, tren harian (30 hari), top STO, paket, regional performance.
- Ekspor: PDF (jsPDF) & Excel (SheetJS/XLSX).
- File utama:
  - Backend: `src/routes/dashboard.routes.js`
  - View: `views/dashboard.ejs`
  - Frontend: `public/js/dashboard.js`, `public/css/dashboard.css`
- Charts yang dirender dari atribut data HTML (via Chart.js):
  - Status Daily (doughnut)
  - Status Todolist (bar horizontal)
  - Status HI (polar area)
  - Top STO (bar)
  - Daily WO Trend (line)
  - Completion Rate Trend (line)
  - Activity Teknisi (bar)
  - Paket (doughnut)
  - TTD KB (bar)

### 3) Daily Housekeeping
- Listing WO, filter tanggal, pagination, detail & update.
- Import CSV/Excel dengan pemetaan kolom (tanpa membuat log teknisi saat import).
- Ekspor CSV.
- File utama:
  - Backend: `src/routes/daily.routes.js`
  - View: `views/dailyhouse.ejs`, detail: `views/detail.ejs`
  - Frontend: `public/js/daily.js`, `public/js/daily-detail.js`, `public/css/daily.css`

### 4) Kendala Pelanggan
- Input, validasi WONUM, format TTD KB, auto Ticket ID, rekap & edit.
- File utama:
  - Backend: `src/routes/kendala.routes.js`
  - View: `views/kendala.ejs`
  - Frontend: `public/js/kendala.js`, `public/css/kendala.css`

### 5) Kendala Teknik (Todolist) & Master Activity
- Todolist: impor Excel (normalisasi), insert/update batch, ringkasan cards.
- Master Activity: CRUD kamus aktivitas teknisi.
- File utama:
  - Backend: `src/routes/todolist.routes.js`, `src/routes/kendalateknik.routes.js`
  - View: `views/todolist.ejs`, `views/kendalateknik.ejs`
  - Frontend: `public/js/todolist.js`, `public/js/kendalateknik.js`

### 6) Bot Status Assistant
- Cek status WO/Ticket ID, quick commands, riwayat sesi, dashboard statistik.
- File utama:
  - Backend: `src/routes/bot.routes.js` (mounted di `/api/bot`)
  - Frontend: `public/js/bot.js`, panel UI: `views/layout/bot.ejs`

## Daftar Endpoint (Ringkasan)

### Auth (`src/routes/auth.routes.js`)
- GET `/login`, GET `/register`
- POST `/api/auth/login`, POST `/api/auth/register`
- POST `/api/auth/logout`, GET `/logout`
- GET `/api/auth/me`

### Dashboard (`src/routes/dashboard.routes.js`, mount `/dashboard`)
- GET `/` → render dashboard dengan filter query (`sto_filter`, `regional_filter`, `status_filter`, `date_from`, `date_to`, `search`)
- GET `/api/refresh` → KPI singkat (AJAX)
- GET `/export/excel` → data gabungan master_wo + kendala untuk Excel

### Daily Housekeeping (`src/routes/daily.routes.js`, mount `/dailyhouse`)
- GET `/` → list WO + filter tanggal & pagination
- GET `/:wonum` → detail WO + logs teknisi
- POST `/update/:wonum` → update sebagian field WO; opsional insert log teknisi jika `solusi_progress` diisi
- GET `/api/status` → daftar status_daily
- GET `/api/status-akhir` → daftar status_akhir yang panjang
- POST `/upload-preview` → parsing CSV untuk preview header/kolom
- POST `/upload` → import CSV dengan mapping (update/insert master_wo saja)
- POST `/upload-json` → import dari JSON (hasil parsing Excel di client)
- GET `/export` → export CSV dari master_wo

### Kendala Pelanggan (`src/routes/kendala.routes.js`, mount `/kendala`)
- GET `/` → rekap + pencarian
- GET `/input` → form input
- POST `/input` → simpan data (validasi WONUM, TTD KB, STO)
- GET `/edit/:id` → form edit
- POST `/edit/:id` → update data
- POST `/delete/:id` → hapus data

### Kendala Teknik & Master Activity
- Page: GET `/kendala-teknik` → render page (kendalateknik)
- API Master Activity (`src/routes/kendalateknik.routes.js`):
  - GET `/api/kendala-teknik`
  - GET `/api/kendala-teknik/:id`
  - POST `/api/kendala-teknik`
  - PUT `/api/kendala-teknik/:id`
  - DELETE `/api/kendala-teknik/:id`
  - GET `/api/kendala-teknik/search/:keyword`
- API Todolist (`src/routes/todolist.routes.js`):
  - GET `/todolist` → render page
  - GET `/api/todolist`
  - GET `/api/todolist/:id`
  - PUT `/api/todolist/:id`
  - DELETE `/api/todolist/:id`
  - POST `/api/todolist/import` → batch insert/update
  - POST `/api/todolist/delete-selected`
  - DELETE `/api/todolist/delete-all`
  - GET `/api/master-activity`, GET `/api/wilayah-ridar`

### Bot (`src/routes/bot.routes.js`, mount `/api/bot`)
- POST `/check-status` → cek WO/Ticket ID atau handle command
- GET `/history/:sessionId` → riwayat sesi
- POST `/clear-history` → hapus riwayat
- GET `/commands` → daftar command

## Impor/Ekspor Data

### Daily Housekeeping
- Import CSV: `POST /dailyhouse/upload`
  - Kirim file CSV + mapping kolom (contoh mapping: `{ wonum: "WO_ID", sto: "STO", ... }`).
  - Validasi STO terhadap `wilayah_ridar`; jika tidak valid → `sto` diset NULL.
  - Update/Insert hanya ke `master_wo` (tidak membuat log teknisi).
- Import Excel (client-side → JSON): `POST /dailyhouse/upload-json`
  - Frontend membaca Excel via SheetJS, kirim JSON rows + mapping.
- Export CSV: `GET /dailyhouse/export`

### Dashboard
- Export Excel: `GET /dashboard/export/excel` (gabungan master_wo + kendala_pelanggan + kendala_teknisi_sistem, sesuai filter query)
- Export PDF: tombol di UI menggunakan jsPDF (via CDN) + html2canvas (untuk chart/screenshots)

## Bot Commands (Contoh)
- `/help` – bantuan
- `/cek` – cara cek status
- `/last` – pencarian terakhir
- `/history` – riwayat pencarian
- `/dashboard` – statistik bot
- `/stats` – statistik hari ini
- `/sto` – info wilayah STO
- `/clear` – hapus riwayat
- `/about` – tentang bot

## Instalasi & Menjalankan (Windows PowerShell)

### Prasyarat
- Node.js LTS (disarankan v18+)
- MySQL Server 8.x
- Git (opsional jika clone dari GitHub)

### Setup Database
1. Buat database, misal: `ridar_dummydiva` (sesuai `src/config/db.js`).
2. Import skema awal: `ridar_db(verdiv).sql` (gunakan MySQL client / CLI).
3. (Opsional) Seed wilayah/STO: jalankan isi `scripts/seed-wilayah-ridar-sto.sql`.
4. Pastikan kredensial di `src/config/db.js` sesuai (host, user, password, database).

### Konfigurasi Aplikasi
- Buat `.env` di root (opsional untuk session):
  ```env
  SESSION_SECRET=some-strong-secret
  ```
- Periksa `src/config/db.js` untuk kredensial MySQL.

### Install & Run

```powershell
# Install dependencies
npm install

# Jalankan server (development)
npm run dev

# Atau jalankan server (production-ish)
npm start
```

Akses: http://localhost:3000
- Register akun (menu Register) → Login → otomatis redirect ke `/dashboard`.

## Keamanan & Konfigurasi
- Password user di-hash dengan bcrypt.
- Session disimpan in-memory (default express-session). Untuk produksi, gunakan store (Redis/MySQL store) dan HTTPS.
- Validasi data impor: STO diverifikasi terhadap `wilayah_ridar`.
- Format TTD KB dinormalkan ke "X Hari".

## Troubleshooting
- Tidak bisa konek DB: periksa `src/config/db.js` dan status MySQL; cek user/password/database.
- Export PDF tidak jalan: pastikan jsPDF & html2canvas diload via CDN pada EJS (lihat `views/dashboard.ejs`).
- Chart tidak tampil: pastikan Chart.js diload via CDN dan elemen canvas memiliki `data-values`.
- Upload CSV gagal: cek ukuran file (multer), format header kolom, dan mapping.

## Lisensi
ISC (lihat `package.json`).

## Referensi File Utama
- App & server: `src/app.js`, `src/server.js`
- DB: `src/config/db.js`
- Dashboard: `src/routes/dashboard.routes.js`, `views/dashboard.ejs`, `public/js/dashboard.js`
- Daily: `src/routes/daily.routes.js`, `views/dailyhouse.ejs`, `views/detail.ejs`, `public/js/daily.js`
- Kendala Pelanggan: `src/routes/kendala.routes.js`, `views/kendala.ejs`, `public/js/kendala.js`
- Todolist/Kendala Teknik: `src/routes/todolist.routes.js`, `src/routes/kendalateknik.routes.js`, `views/todolist.ejs`, `views/kendalateknik.ejs`
- Bot: `src/routes/bot.routes.js`, `public/js/bot.js`, `views/layout/bot.ejs`
- Auth: `src/routes/auth.routes.js`, `views/login.ejs`, `views/register.ejs`, `public/js/auth.js`

---
Dokumen ini dirancang sebagai README komprehensif untuk memudahkan setup, pemahaman arsitektur, serta operasi harian TRID – RIDAR. Untuk pengembangan lanjutan, pertimbangkan penambahan test otomatis, store session terpusat, dan konfigurasi environment untuk DB agar tidak hard-coded.
