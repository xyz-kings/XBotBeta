# XBotBeta

Bot WhatsApp berbasis Node.js yang dapat dijalankan di Termux.

Repository ini berisi source code bot beserta sistem handler, fitur, dan konfigurasi dasar.

---

## Persyaratan

Pastikan perangkat sudah terpasang:
- Termux jika belum terinstall maka bisa klik di bawah ini 
   ```bash
   [![Download Termux](https://img.shields.io/badge/Download-Termux-brightgreen?style=for-the-badge)](https://f-droid.org/F-Droid.apk)
   ```
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

Instalasi

Clone repository:
```bash
git clone https://github.com/xyz-kings/XBotBeta.git
```

Masuk ke folder project:
```bash
cd XBotBeta
```
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
