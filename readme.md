# XBotBeta

### ⚠️ PERHATIAN! INI MASIH BETA ⚠️
Bot WhatsApp ini masih tahap pengembangan. Fiturnya belum lengkap, kadang rewel, kadang nurut—maklum masih belajar jalan 🍼

### 📌 Wajib ikuti langkah-langkah instalasi secara berurutan
Jangan loncat-loncat. Salah satu langkah dilewatin = bot bisa ngambek dan nggak mau jalan.

### 🔔 Follow & pantau terus repository ini
Update resmi, perbaikan bug, dan fitur baru CUMA dirilis di repo ini.
Kalau dapet versi aneh-aneh di luar sini → itu bukan tanggung jawab kami 

~ Nantinya bakal ada versi STABLE (non-beta), jadi stay tune! ~

---
### 🤖 Tentang Bot Ini
Ini BUKAN bot AI.
Fokusnya ke tools & utilitas, seperti:

• Downloader

• Converter

• Search

• Random tools

• Game ringan

• Berita

• Fitur fun

• Fitur grup

• Stalking tools

---
Singkatnya: bot serba guna, bukan sok pinter tapi kepake 🔧

---

### 💬 Kalau nemu bug, error, atau ide fitur:

 • Jangan nyinyir
 
 • Jangan ngamuk
 
~ Langsung lapor lewat repo ~

---

## Persyaratan

Pastikan perangkat sudah terpasang:
- Termux jika belum terinstall maka bisa klik di bawah ini 
   [![Download Termux](https://img.shields.io/badge/Download-Termux-brightgreen?style=for-the-badge)](https://f-droid.org/repo/com.termux_1022.apk)
- Node.js
- Git
- Yarn

Install kebutuhan di Termux:
```bash
pkg update && pkg upgrade
```
```bash
pkg install git nodejs yarn 
```

---

## Instalasi

### Clone repository:
```bash
git clone https://github.com/xyz-kings/XBotBeta.git
```

Masuk ke folder project:
```bash
cd XBotBeta
```

Setelah masuk folder project:
- jangan langsung buka tapi masuk ke config.json caranya 
```bash
nano config.json
```
Edit bagian ini 
```bash
  "ownerNumber": "628xxxx@s.whatsapp.net",
  "ownerName": "Rename",
  "packName": "Sticker By",
  "authorSticker": "©Rename",
  "apiKey": "Paste Key dari daftar dan ambil https://xrest-api.vercel.app",
  "baseURL": "https://xrest-api.vercel.app",
  "copyright": "> _© 2025 Rename - All Rights Reserved_"
```

- dan setelah itu Ctrl + X + y 

### lalu lanjut ke install dependensi

Install semua dependensi:
```bash
yarn install
```
atau:
```bash
yarn i
```

---

## Menjalankan Bot

Jalankan bot dengan perintah:
```bash
yarn start
```

Setelah dijalankan, pairing Code akan muncul di terminal.
pairing code muncul dan langsung ke WhatsApp untuk menghubungkan bot Xyz ini.


---

## Konfigurasi

Edit file config.json untuk menyesuaikan:

• Nomor owner

• Nama bot

° Prefix

• API key (wajib daftar di website kami https://xrest-api.vercel.app)


Pastikan format JSON benar agar bot tidak error saat dijalankan.


---

## Catatan

Jangan menghapus file .json yang digunakan sebagai database.

Jika terjadi error, periksa log di terminal.

Gunakan Node.js v25.

Script ini tidak diperjualbelikan.
