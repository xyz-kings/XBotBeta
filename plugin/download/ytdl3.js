const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require("../../config.json");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
    command: ["ytdl3"],

    async execute(bot, m, args) {
        if (args.length === 0) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Kirim link YouTube!\nContoh: ${config.prefix}ytdl3 https://youtu.be/RzmhRy4A3uE`
            }, { quoted: m });
        }

        const url = args[0];
        if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
            return bot.sendMessage(m.key.remoteJid, { text: "❌ Link bukan dari YouTube!" }, { quoted: m });
        }

        await reactLoading(bot, m);

        try {
            // Ambil video ID dari URL
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i)?.[1];
            let title = "YouTube Music";
            let channel = "Unknown";
            let thumbUrl = "";

            // Jika ada video ID, dapatkan thumbnail
            if (videoId) {
                thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                
                // Coba ambil info video dari API noembed
                try {
                    const infoRes = await axios.get(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { 
                        timeout: 10000 
                    });
                    if (infoRes.data.title) {
                        title = infoRes.data.title;
                        channel = infoRes.data.author_name || channel;
                    }
                } catch (e) {
                    console.log("Info API gagal, menggunakan default");
                }
            }

            // Panggil API download
            const apiUrl = `${config.baseURL}/download/ytmp3?apikey=${config.apiKey}&url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl, { timeout: 30000 });

            if (!res.data.status || !res.data.result) {
                throw new Error("API gagal atau link tidak support");
            }

            const audioUrl = res.data.result;
            const creator = res.data.creator || "Xyz-King's";

            // Nama file bersih
            const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
            const fileName = `${cleanTitle}.mp3`;

            // Temp folder
            const tempDir = path.join(__dirname, "../../temp");
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const audioPath = path.join(tempDir, fileName);

            // Download audio ke file temp
            const audioResponse = await axios({
                url: audioUrl,
                method: "GET",
                responseType: "stream",
                timeout: 120000
            });

            const writer = fs.createWriteStream(audioPath);
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            // Download thumbnail jika ada
            let thumbBuffer = null;
            if (thumbUrl) {
                try {
                    const thumbRes = await axios.get(thumbUrl, {
                        responseType: "arraybuffer",
                        timeout: 10000
                    });
                    thumbBuffer = Buffer.from(thumbRes.data, 'binary');
                } catch (e) {
                    console.log("Gagal download thumbnail:", e.message);
                }
            }

            // Buat caption sesuai format yang diminta
            const caption = `🎵 *YouTube Music Downloader*

📌 *Title:* ${title}
👤 *Channel:* ${channel}

⚙️ *Powered by:* ${creator} API

> _${config.copyright || "© 2025 Xyz Kings - All Rights Reserved"}_`;

            // Kirim AUDIO dulu
            const messageOptions = {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title.substring(0, 50)}.mp3`,
            };

            // Tambahkan thumbnail jika ada
            if (thumbBuffer) {
                messageOptions.jpegThumbnail = thumbBuffer;
            }

            // Kirim audio
            const audioMessage = await bot.sendMessage(m.key.remoteJid, messageOptions, { quoted: m });
            
            // Tunggu sebentar agar audio terkirim dulu
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Coba beberapa cara untuk mendapatkan ID pesan audio
            let audioMessageKey;
            
            if (audioMessage && audioMessage.key) {
                // Jika langsung dapat key dari response
                audioMessageKey = audioMessage.key;
            } else if (audioMessage && audioMessage.messageID) {
                // Jika dapat messageID
                audioMessageKey = {
                    remoteJid: m.key.remoteJid,
                    id: audioMessage.messageID,
                    fromMe: true
                };
            } else {
                // Buat key manual berdasarkan timestamp
                audioMessageKey = {
                    remoteJid: m.key.remoteJid,
                    id: Date.now().toString(),
                    fromMe: true,
                    participant: m.key.participant || m.key.remoteJid
                };
            }

            // Kirim caption sebagai reply ke audio
            await bot.sendMessage(m.key.remoteJid, {
                text: caption,
                quoted: {
                    key: audioMessageKey,
                    message: { audioMessage: {} }
                }
            });

            // Cleanup: hapus file audio dari temp
            try {
                if (fs.existsSync(audioPath)) {
                    fs.unlinkSync(audioPath);
                    console.log(`✓ File temp dihapus: ${fileName}`);
                }
            } catch (e) {
                console.log("Gagal menghapus file temp:", e.message);
            }

        } catch (error) {
            console.error("Error ytdl3:", error.message || error);
            bot.sendMessage(m.key.remoteJid, {
                text: `❌ Gagal download audio YouTube!\n\n• ${error.message || "Link tidak support atau error API"}\n• Coba link lain atau coba lagi nanti`
            }, { quoted: m });
        }
    }
};