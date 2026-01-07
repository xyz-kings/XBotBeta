const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
    command: ["tourl"],
    description: "Upload gambar/video ke catbox dan dapatkan URL",
    category: "tools",
    premiumOnly: true, // INI SAJA YANG DITAMBAH
    example: "Reply gambar/video dengan caption .tourl",
    
    execute: async (bot, m, args) => {
        try {
            // Cek apakah ada quoted message
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quoted) {
                // Gunakan efek typing jika tersedia
                if (bot._sendWithTyping) {
                    return bot._sendWithTyping.call(this, 
                        "❌ *Upload Gagal!*\n\n" +
                        "📌 *Cara penggunaan:*\n" +
                        "Reply gambar/video dengan caption:\n" +
                        "`.tourl`\n\n" +
                        "📁 *Format yang didukung:*\n" +
                        "• Gambar (jpg, png, gif)\n" +
                        "• Video (mp4, gif)\n" +
                        "• File lainnya"
                    , m, { minDelay: 1000, maxDelay: 2000 });
                } else {
                    return bot.sendMessage(m.key.remoteJid, { 
                        text: "❌ *Upload Gagal!*\n\n" +
                              "📌 *Cara penggunaan:*\n" +
                              "Reply gambar/video dengan caption:\n" +
                              "`.tourl` atau `.upload`\n\n" +
                              "📁 *Format yang didukung:*\n" +
                              "• Gambar (jpg, png, gif)\n" +
                              "• Video (mp4, gif)\n" +
                              "• File lainnya"
                    }, { quoted: m });
                }
            }

            let mediaMessage = null;
            let fileName = "file";
            let fileType = "unknown";

            // Deteksi tipe file yang direply
            if (quoted.imageMessage) {
                mediaMessage = quoted.imageMessage;
                fileName += ".jpg";
                fileType = "image";
            } else if (quoted.videoMessage) {
                mediaMessage = quoted.videoMessage;
                fileName += ".mp4";
                fileType = "video";
            } else if (quoted.stickerMessage) {
                mediaMessage = quoted.stickerMessage;
                fileName += ".webp";
                fileType = "sticker";
            } else if (quoted.documentMessage) {
                mediaMessage = quoted.documentMessage;
                const docName = mediaMessage.fileName || "file";
                fileName = docName;
                fileType = "document";
            } else if (quoted.audioMessage) {
                mediaMessage = quoted.audioMessage;
                fileName += ".mp3";
                fileType = "audio";
            } else {
                if (bot._sendWithTyping) {
                    return bot._sendWithTyping.call(this, 
                        "❌ *Format tidak didukung!*\n\n" +
                        "📁 *Format yang didukung:*\n" +
                        "• Gambar (jpg, png, gif)\n" +
                        "• Video (mp4, gif)\n" +
                        "• Sticker (webp)\n" +
                        "• Audio (mp3)\n" +
                        "• Dokumen"
                    , m, { minDelay: 1000, maxDelay: 2000 });
                } else {
                    return bot.sendMessage(m.key.remoteJid, { 
                        text: "❌ *Format tidak didukung!*\n\n" +
                              "📁 *Format yang didukung:*\n" +
                              "• Gambar (jpg, png, gif)\n" +
                              "• Video (mp4, gif)\n" +
                              "• Sticker (webp)\n" +
                              "• Audio (mp3)\n" +
                              "• Dokumen"
                    }, { quoted: m });
                }
            }

            // Kirim reaksi loading
            try {
                await reactLoading(bot, m);
            } catch (error) {
                console.log("⚠️ React loading gagal, lanjut proses upload...");
            }

            // Kirim status awal upload
            let statusMsg = null;
            try {
                statusMsg = await bot.sendMessage(m.key.remoteJid, { 
                    text: `📤 *Mengupload ${fileType}...*\n\n` +
                          `📁 Nama: ${fileName}\n` +
                          `⏳ Mohon tunggu...`
                }, { quoted: m });
            } catch (error) {
                console.log("⚠️ Gagal kirim status upload");
            }

            // Download media
            let buffer;
            try {
                const mediaType = fileType === "image" ? "image" : 
                                 fileType === "video" ? "video" : 
                                 fileType === "audio" ? "audio" : "document";
                
                const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                let chunks = [];
                
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                
                buffer = Buffer.concat(chunks);
                
                // Cek ukuran file (max 200MB untuk catbox)
                const fileSizeMB = buffer.length / (1024 * 1024);
                if (fileSizeMB > 200) {
                    if (statusMsg) {
                        await bot.sendMessage(m.key.remoteJid, {
                            text: `❌ *File terlalu besar!*\n\n` +
                                  `📁 Ukuran: ${fileSizeMB.toFixed(2)} MB\n` +
                                  `📏 Maksimal: 200 MB\n` +
                                  `💡 Kompres file terlebih dahulu.`
                        }, { quoted: m });
                    }
                    return;
                }
                
            } catch (error) {
                console.error("❌ Download error:", error);
                if (statusMsg) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `❌ *Gagal download file!*\n\n` +
                              `⚠️ Error: ${error.message}\n` +
                              `💡 Pastikan file tidak korup.`
                    }, { quoted: m });
                }
                return;
            }

            // Upload ke Catbox
            try {
                const form = new FormData();
                form.append("reqtype", "fileupload");
                form.append("fileToUpload", buffer, { 
                    filename: fileName,
                    contentType: mediaMessage.mimetype || "application/octet-stream"
                });

                // Optional: tambahin userhash kalau mau (bisa buat album)
                if (args[0] && args[0].length > 5) {
                    form.append("userhash", args[0]);
                }

                const res = await fetch("https://catbox.moe/user/api.php", {
                    method: "POST",
                    body: form,
                    headers: form.getHeaders()
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const url = await res.text();
                
                // Validasi URL
                if (!url.startsWith('http')) {
                    throw new Error('URL tidak valid dari catbox');
                }

                // Hapus status message jika ada
                if (statusMsg) {
                    try {
                        await bot.sendMessage(m.key.remoteJid, {
                            delete: statusMsg.key
                        });
                    } catch (error) {
                        // Ignore delete error
                    }
                }

                // Kirim hasil dengan format yang bagus
                const fileSize = (buffer.length / 1024).toFixed(2);
                const resultText = `✅ *Upload Berhasil!*\n\n` +
                                 `📁 *File:* ${fileName}\n` +
                                 `📏 *Ukuran:* ${fileSize} KB\n` +
                                 `📋 *Tipe:* ${fileType}\n` +
                                 `🔗 *URL:* ${url}\n\n` +
                                 `💡 *Tips:*\n` +
                                 `• Copy URL di atas\n` +
                                 `• Bisa langsung share ke orang lain\n` +
                                 `• File tersimpan di catbox\n` +
                                 `• Expiry: Selama tidak ada laporan\n\n` +
                                 `✨ *Upload by:* ${m.pushName || 'User'}`;

                // Gunakan efek typing jika tersedia
                if (bot._sendWithTyping) {
                    await bot._sendWithTyping.call(this, resultText, m, { 
                        minDelay: 1500, 
                        maxDelay: 3000 
                    });
                } else {
                    await bot.sendMessage(m.key.remoteJid, { 
                        text: resultText
                    }, { quoted: m });
                }

                // Log success
                console.log(`✅ Upload success: ${fileName} → ${url}`);

            } catch (uploadError) {
                console.error("❌ Upload error:", uploadError);
                
                if (statusMsg) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `❌ *Upload Gagal!*\n\n` +
                              `⚠️ Error: ${uploadError.message}\n` +
                              `💡 Coba lagi nanti atau gunakan file lain.`
                    }, { quoted: m });
                }
            }

        } catch (err) {
            console.error("❌ Global error in tourl:", err);
            
            // Gunakan efek typing jika tersedia
            if (bot._sendWithTyping) {
                await bot._sendWithTyping.call(this, 
                    `❌ *Terjadi Error!*\n\n` +
                    `⚠️ ${err.message}\n\n` +
                    `💡 Coba lagi nanti atau gunakan file yang berbeda.`
                , m, { minDelay: 1000, maxDelay: 2000 });
            } else {
                await bot.sendMessage(m.key.remoteJid, { 
                    text: `❌ *Terjadi Error!*\n\n` +
                          `⚠️ ${err.message}\n\n` +
                          `💡 Coba lagi nanti atau gunakan file yang berbeda.`
                }, { quoted: m });
            }
        }
    }
};