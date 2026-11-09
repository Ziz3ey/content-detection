# PROMPT TAMBAHAN — Tangkap Screenshot Dashboard Otomatis (Tanpa Login Manual)

> Salin seluruh isi di bawah garis ini ke Antigravity (workspace: folder project). Boleh dijalankan sebelum, sesudah, atau terpisah dari Langkah 2.

---

## PERAN

Kamu adalah QA/front-end engineer. Tugasmu: menghasilkan screenshot **seluruh halaman dashboard** beserta state pentingnya, **tanpa login sungguhan, tanpa backend, dan tanpa mengubah kode sumber aplikasi**. Hasilnya akan dipakai asisten lain yang tidak punya akses ke aplikasi, sebagai bahan redesign.

## ATURAN KETAT

1. **Jangan mengubah file apa pun di `dashboard/src/`, `services/`, `packages/`, maupun file `.env`.** Jangan mengubah `package.json` project. Jangan mencoba menebak, mengambil, atau mengubah kredensial admin.
2. Semua alat bantu (skrip, dependency) ditempatkan di folder terpisah `audit-ui/tools/` dengan `package.json` sendiri. Install dependency hanya di sana. Tambahkan `audit-ui/tools/node_modules` ke `.gitignore` bila perlu (itu satu-satunya perubahan di luar folder `audit-ui/` yang diperbolehkan).
3. Seluruh data di screenshot harus **data dummy**. Gunakan domain `example.go.id`, nama OPD fiktif atau umum (mis. "Dinas Contoh A"), dan email `petugas@example.go.id`. Jangan menampilkan email, hostname, atau data nyata dari database, `.env`, maupun dokumen wawancara.
4. Konten kategori terlarang pada data dummy (mis. cuplikan "slot gacor") boleh dipakai seperlunya sebagai teks bukti temuan, singkat saja, tanpa tautan nyata.

## METODE

Gunakan **Playwright** (Chromium) dari `audit-ui/tools/`, dengan **intersepsi jaringan** (`page.route`) untuk menggantikan seluruh panggilan ke `/api/v1/*` dengan respons buatan sendiri. Dengan cara ini frontend asli dijalankan apa adanya lewat `npm run dev` (port 5173), tetapi seolah-olah sudah login dan terhubung ke backend.

Langkah:
1. Baca `dashboard/src/api.js` dan `dashboard/src/App.test.jsx` untuk memahami **seluruh endpoint dan bentuk payload** (login/sesi, daftar situs, scan terbaru, detail scan, job scan, jadwal, notifikasi, kirim ulang email, dll.). Fixture di `App.test.jsx` adalah acuan bentuk data yang paling akurat.
2. Buat `audit-ui/tools/mock-api.js` yang memetakan setiap endpoint ke respons dummy. Sesi harus berstatus terautentikasi sebagai admin (sesuaikan dengan bentuk respons yang dibaca `api.js`). Pastikan permintaan yang tidak dikenal dicatat ke konsol dan dijawab dengan respons kosong yang aman, bukan dibiarkan menembus ke jaringan.
3. Siapkan beberapa **skenario data** yang bisa dipilih:
   - `normal`: 14 situs (campuran aktif/nonaktif, sebagian punya baseline), 40+ riwayat scan (campuran manual/terjadwal, bersih/terindikasi/gagal), 4 jadwal (harian, mingguan, bulanan, satu nonaktif), notifikasi campuran (terkirim, gagal, belum dibaca).
   - `empty`: tidak ada situs, jadwal, maupun riwayat.
   - `indicated`: satu scan dengan temuan di ketiga detektor (teks: gambling dan fraud; tautan: TLD berisiko, tautan tersembunyi `display:none`, IP mentah; defacement: judul dan struktur DOM berubah), beberapa halaman, dengan cuplikan bukti yang panjang agar kasus teks meluber terlihat.
   - `running`: job pemindaian yang sedang berjalan dengan progres bertahap (untuk banner progres).
   - `crawl-failed`: scan dengan kendala perayapan (timeout, redirect loop).
   - `error`: endpoint mengembalikan 500 (untuk melihat state galat).
4. Buat `audit-ui/tools/capture.js` yang menjalankan semua tangkapan di bawah, memakai viewport **1440×900** untuk desktop, **768×1024** untuk tablet, dan **390×844** untuk mobile. Gunakan `fullPage: true` untuk halaman panjang. Tunggu hingga tidak ada animasi/pemuatan (network idle dan elemen kunci terlihat) sebelum mengambil gambar. Nonaktifkan animasi lewat `reducedMotion: 'reduce'`.
5. Jalankan `npm run dev` di `dashboard/` bila belum aktif, dan hentikan setelah selesai bila kamu yang menyalakannya.

## DAFTAR TANGKAPAN

Simpan di `audit-ui/screenshots/dashboard/` dengan nama `NN-halaman-state-ukuran.png`.

**Desktop (1440px) — semua**
1. Ringkasan: `normal`, `empty`, `error`.
2. Manajemen situs: `normal`, `empty`, kolom pencarian terisi tanpa hasil, modal Tambah Situs (kosong), modal Edit Situs (terisi dan ada baseline), modal dengan error validasi.
3. Jadwal: `normal`, `empty`, modal Tambah Jadwal (preset harian), modal dengan Kustom Cron, modal Edit.
4. Pemindaian: form mode Situs Tunggal, form mode Seluruh Situs Aktif, accordion baseline terbuka, banner job `running`, state galat validasi (email salah).
5. Hasil: `indicated` (bagian atas dengan tiga kartu detektor, filter, dan beberapa kartu halaman terbuka), `normal` bersih, `crawl-failed`, state belum ada data.
6. Riwayat: `normal`, filter sumber Terjadwal, `empty`, detail sesi (sub-view `historyDetail`), baris dengan konfirmasi hapus.
7. Menu notifikasi di topbar dalam keadaan terbuka (`normal`, dan `empty`).
8. Sidebar dalam mode ciut (collapsed) pada tab Ringkasan.

**Tablet (768px)** — Ringkasan, Situs, Riwayat, Hasil (`indicated`), Pemindaian.

**Mobile (390px)** — Ringkasan, Situs, Riwayat, Hasil (`indicated`), Pemindaian, sidebar off-canvas terbuka, menu notifikasi terbuka, modal Tambah Situs.

**Publik (untuk perbandingan)** — Landing dan Login pada 1440px dan 390px, **dengan** perbaikan tampilan apa pun yang saat ini ada di kode (cukup ambil apa adanya).

Jika ada tangkapan yang tidak bisa diambil (elemen tidak ditemukan, state tidak bisa dipicu), **jangan mengarang**: catat di `INDEX.md` apa yang gagal dan alasannya.

## KEMASAN HASIL (penting)

Saya tidak ingin mengunggah puluhan gambar satu per satu. Karena itu hasilnya harus dirangkum menjadi **sedikit file**:

1. `audit-ui/screenshots/dashboard/INDEX.md`: tabel berisi nama file, halaman, state, ukuran, dan 1 kalimat deskripsi apa yang terlihat. Cantumkan juga tangkapan yang gagal beserta alasannya.
2. **Satu PDF bernama `audit-ui/dashboard-screens.pdf`** yang berisi semua tangkapan, urut sesuai daftar di atas, **satu tangkapan per halaman**, setiap halaman diberi judul kecil di atasnya (nomor, halaman, state, ukuran) agar bisa dirujuk. Atur ukuran halaman PDF mengikuti rasio gambar (jangan memotong gambar), dan pastikan teks pada screenshot desktop tetap terbaca (tidak diperkecil berlebihan). Jika PDF melebihi ±25 MB, pecah menjadi `dashboard-screens-1.pdf`, `-2.pdf`, dan seterusnya, urut per kelompok (desktop, tablet+mobile, publik). Boleh memakai Playwright untuk merender halaman HTML sementara ke PDF, atau pustaka PDF lain yang diinstal hanya di `audit-ui/tools/`.
3. Jangan menyertakan screenshot yang menampilkan data nyata. Periksa ulang sebelum menyimpan.

## KRITERIA SELESAI

- [ ] Tidak ada file di `dashboard/src/`, `services/`, `packages/`, `.env` yang berubah (verifikasi dengan `git status` atau `git diff --stat`)
- [ ] Seluruh data di screenshot adalah dummy
- [ ] Semua tangkapan di daftar sudah diambil atau dicatat alasan kegagalannya
- [ ] `INDEX.md` dan PDF tersedia, dan PDF terbuka tanpa error
- [ ] Skrip dapat dijalankan ulang dengan satu perintah (tulis `audit-ui/tools/README.md` berisi perintahnya)

Setelah selesai, ringkas di chat: jumlah tangkapan berhasil dan gagal, ukuran total PDF, dan lokasi semua file.
