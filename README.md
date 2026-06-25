# Secure Cookie TXT Vault

Aplikasi statis untuk GitHub Pages dengan Google Sheets sebagai database melalui Google Apps Script.

## Fitur

- Upload banyak file `.txt` sekaligus.
- Tanggal upload otomatis dari server Google Apps Script.
- Hapus data manual per item.
- Ikon kategori untuk Netflix, YouTube, Spotify, Disney+, Prime Video, HBO Max, TikTok, dan lainnya.
- Data isi file dienkripsi di browser memakai Web Crypto API sebelum masuk ke Google Sheets.
- Cocok untuk hosting di GitHub Pages.

## Catatan keamanan

Cookie bisa berisi akses akun. Jangan menyimpan cookie mentah tanpa enkripsi. Jangan gunakan aplikasi ini untuk menyimpan, menjual, atau membagikan cookie akun milik orang lain.

## Struktur file

```text
cookie-vault-github/
├── index.html
├── style.css
├── app.js
├── .nojekyll
└── apps-script/
    └── Code.gs
```

## Setup Google Sheets dan Apps Script

1. Buat Google Sheets baru.
2. Buka `Extensions > Apps Script`.
3. Hapus isi file `Code.gs` bawaan.
4. Salin isi `apps-script/Code.gs` dari folder ini.
5. Ganti nilai berikut:

```javascript
const DEFAULT_APP_TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA_ANDA';
```

6. Klik `Run` pada fungsi `setup`.
7. Beri izin akses saat diminta.
8. Klik `Deploy > New deployment`.
9. Pilih tipe `Web app`.
10. Pada `Execute as`, pilih `Me`.
11. Pada `Who has access`, pilih sesuai kebutuhan. Untuk GitHub Pages umum, biasanya pilih `Anyone`.
12. Klik `Deploy`.
13. Salin URL Web App yang berakhiran `/exec`.

## Setup GitHub Pages

1. Buat repository baru di GitHub.
2. Upload file `index.html`, `style.css`, `app.js`, dan `.nojekyll` ke root repository.
3. Masuk ke `Settings > Pages`.
4. Pilih branch `main` dan folder `/root`.
5. Simpan.
6. Buka URL GitHub Pages.
7. Klik `Setup API`.
8. Masukkan Web App URL dan API Token.
9. Simpan.

## Cara pakai

1. Isi passphrase enkripsi minimal 8 karakter.
2. Pilih kategori atau gunakan deteksi otomatis.
3. Pilih beberapa file `.txt`.
4. Klik `Upload Sekarang`.
5. Data akan muncul sebagai kartu.
6. Untuk membuka isi data, masukkan passphrase yang sama.
7. Untuk menghapus data, klik `Hapus` pada kartu.

## Penting

- Passphrase tidak disimpan di Google Sheets dan tidak disimpan di browser.
- Jika passphrase hilang, isi file tidak bisa dibuka kembali.
- Token API jangan ditulis langsung di repository publik.
- Google Sheets tetap bukan tempat ideal untuk data sangat sensitif. Gunakan hanya untuk kebutuhan pribadi atau internal yang terkendali.
