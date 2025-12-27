# XBotBeta

Bot WhatsApp berbasis Node.js yang dapat dijalankan di Termux.

Repository ini berisi source code bot beserta sistem handler, fitur, dan konfigurasi dasar.

---

## Persyaratan

Pastikan perangkat sudah terpasang:
- Termux
- Node.js
- Git
- Yarn

Install kebutuhan di Termux:
```bash
pkg update && pkg upgrade
pkg install git nodejs yarn


---

Instalasi

Clone repository:

git clone https://github.com/xyz-kings/XBotBeta.git

Masuk ke folder project:

cd XBotBeta

Install semua dependensi:

yarn install

atau:

yarn i


---

Menjalankan Bot

Jalankan bot dengan perintah:

yarn start

Setelah dijalankan, QR Code akan muncul di terminal.
Scan QR Code menggunakan WhatsApp untuk menghubungkan bot.


---

Konfigurasi

Edit file config.json untuk menyesuaikan:

Nomor owner

Nama bot

Prefix

API key (jika diperlukan fitur tertentu)


Pastikan format JSON benar agar bot tidak error saat dijalankan.


---

Catatan

Jangan menghapus file .json yang digunakan sebagai database.

Jika terjadi error, periksa log di terminal.

Gunakan Node.js versi yang stabil.

Script ini tidak diperjualbelikan.



---

Author

XYZ Kings
GitHub: https://github.com/xyz-kings