const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require("../../config.json");
const { reactLoading } = require("../../lib/helperAnimasi");

// Mapping mimetype manual biar ga jadi .bin
const mimeMap = {
    '.rar': 'application/x-rar-compressed',
    '.zip': 'application/zip',
    '.apk': 'application/vnd.android.package-archive',
    '.pdf': 'application/pdf',
    '.exe': 'application/vnd.microsoft.portable-executable',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Tambahin sendiri kalo perlu
};

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return mimeMap[ext] || 'application/octet-stream'; // fallback
}

module.exports = {
    command: ["gdrive"],

    async execute(bot, m, args) {
        if (args.length === 0) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Kirim link Google Drive!\nContoh: ${config.prefix}gdrive https://drive.google.com/file/d/ID_FILE/view`
            }, { quoted: m });
        }

        const url = args[0];
        if (!url.includes("drive.google.com")) {
            return bot.sendMessage(m.key.remoteJid, { text: "❌ Link bukan dari Google Drive!" }, { quoted: m });
        }

        await reactLoading(bot, m);

        try {
            const apiUrl = `${config.baseURL}/download/gdrive?apikey=${config.apiKey}&url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 15000 });

            if (!response.data.status) {
                throw new Error("API gagal atau status false");
            }

            const { downloadUrl, fileName, fileSize } = response.data.result;
            const creator = response.data.creator || "Xyz-King's";

            // Ambil ekstensi buat jenis file di caption
            const ext = path.extname(fileName).replace('.', '').toUpperCase() || "FILE";
            const fileType = ext;

            // Tentukan mimetype yang benar biar ga jadi .bin
            const correctMime = getMimeType(fileName);

            // Folder temp
            const tempDir = path.join(__dirname, "../../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const tempPath = path.join(tempDir, fileName);

            // Download
            const writer = fs.createWriteStream(tempPath);
            const dlResponse = await axios({
                url: downloadUrl,
                method: "GET",
                responseType: "stream",
                timeout: 90000
            });

            dlResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            // Caption
            const caption = `✅ DOWNLOAD BERHASIL!

📁 Nama File: ${fileName}
📦 Ukuran File: ${fileSize}
📦 Jenis: ${fileType}

⚙️ Powered by: ${creator} API

${config.copyright}`;

            // Kirim dengan mimetype yang benar!
            await bot.sendMessage(m.key.remoteJid, {
                document: fs.readFileSync(tempPath),
                mimetype: correctMime,           // <--- INI YANG PENTING!
                fileName: fileName,              // Nama file tetap asli
                caption: caption
            }, { quoted: m });

            // Hapus temp
            try { fs.unlinkSync(tempPath); } catch (e) {}

        } catch (error) {
            console.error("Error gdrive:", error);
            bot.sendMessage(m.key.remoteJid, {
                text: `❌ Gagal download file!\n${error.message || "Unknown error"}`
            }, { quoted: m });
        }
    }
};