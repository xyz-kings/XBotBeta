const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require("../../config.json");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
    command: ["ttdl3"],

    async execute(bot, m, args) {
        if (args.length === 0) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Kirim link TikTok!\nContoh: ${config.prefix}ttdl3 https://vt.tiktok.com/ZSPEFXGUA/`
            }, { quoted: m });
        }

        const url = args[0];
        if (!url.includes("tiktok.com")) {
            return bot.sendMessage(m.key.remoteJid, { text: "❌ Link bukan dari TikTok!" }, { quoted: m });
        }

        await reactLoading(bot, m);

        try {
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl, { timeout: 20000 });

            if (res.data.code !== 0) {
                throw new Error("API error atau link invalid");
            }

            const data = res.data.data;

            // Prioritas link audio: music > music_info.play
            let musicUrl = data.music;
            if (!musicUrl && data.music_info?.play) {
                musicUrl = data.music_info.play;
            }

            if (!musicUrl) {
                throw new Error("Video ini tidak punya audio yang bisa di-download (mungkin mute atau restricted)");
            }

            // Ambil info lagu
            const title = data.music_info?.title || data.title || "TikTok Audio";
            const author = data.music_info?.author || "unknown";
            const duration = data.music_info?.duration || data.duration || "Unknown";
            const coverUrl = data.music_info?.cover || data.cover;

            // Nama file bersih
            const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`.slice(0, 100);

            // Temp folder
            const tempDir = path.join(__dirname, "../../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const audioPath = path.join(tempDir, fileName);
            const thumbPath = path.join(tempDir, "tt_music_cover.jpg");

            // Download MP3
            const writer = fs.createWriteStream(audioPath);
            const audioRes = await axios({
                url: musicUrl,
                method: "GET",
                responseType: "stream",
                timeout: 90000
            });
            audioRes.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            // Download cover (thumbnail) - optional
            let thumbBuffer = null;
            if (coverUrl) {
                try {
                    const thumbRes = await axios({
                        url: coverUrl,
                        method: "GET",
                        responseType: "stream"
                    });
                    const thumbWriter = fs.createWriteStream(thumbPath);
                    thumbRes.data.pipe(thumbWriter);
                    await new Promise((resolve, reject) => {
                        thumbWriter.on("finish", resolve);
                        thumbWriter.on("error", reject);
                    });
                    thumbBuffer = fs.readFileSync(thumbPath);
                } catch (e) {
                    console.log("Gagal download cover thumbnail");
                }
            }

            // Caption
            const caption = `✅ AUDIO TIKTOK BERHASIL!

🎵 Judul: ${title}
🎤 Artist/Author: ${author}
⏱ Durasi: ${duration}s

⚙️ Powered by: TikWM API

${config.copyright}`;

            // Kirim sebagai AUDIO (langsung play + waveform + cover)
            await bot.sendMessage(m.key.remoteJid, {
                audio: fs.readFileSync(audioPath),
                mimetype: "audio/mpeg",
                ptt: false,
                fileName: fileName,
                caption: caption,
                jpegThumbnail: thumbBuffer
            }, { quoted: m });

            // Cleanup
            try {
                fs.unlinkSync(audioPath);
                if (thumbBuffer) fs.unlinkSync(thumbPath);
            } catch (e) {}

        } catch (error) {
            console.error("Error ttdl3 MP3:", error.message || error);
            bot.sendMessage(m.key.remoteJid, {
                text: `❌ Gagal download audio!\n\n• ${error.message || "Unknown error"}\n• Pastikan video punya sound original`
            }, { quoted: m });
        }
    }
};