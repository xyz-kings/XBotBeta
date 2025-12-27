const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require("../../config.json");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
    command: ["ttdl4"],
    
    async execute(bot, m, args) {
        if (args.length === 0) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Kirim link TikTok!\nContoh: ${config.prefix}ttdl4 https://vt.tiktok.com/ZSLeabcde/`
            }, { quoted: m });
        }

        const url = args[0];
        if (!url.includes("tiktok.com")) {
            return bot.sendMessage(m.key.remoteJid, { text: "❌ Link bukan dari TikTok!" }, { quoted: m });
        }

        await reactLoading(bot, m);

        try {
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl, { timeout: 15000 });

            if (res.data.code !== 0 || !res.data.data?.play) {
                throw new Error("Video tidak ditemukan atau link invalid");
            }

            const data = res.data.data;
            const videoUrl = data.play;
            const thumbUrl = data.cover;
            const title = data.title || "tiktok_video";
            const author = data.author?.nickname || "unknown";
            const duration = data.duration ? `${data.duration}s` : "Unknown";
            const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`.slice(0, 100);

            // Temp folder
            const tempDir = path.join(__dirname, "../../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const videoPath = path.join(tempDir, fileName);
            const thumbPath = path.join(tempDir, "thumb.jpg");

            // Download video
            const videoWriter = fs.createWriteStream(videoPath);
            const videoRes = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
            videoRes.data.pipe(videoWriter);
            await new Promise((resolve, reject) => {
                videoWriter.on("finish", resolve);
                videoWriter.on("error", reject);
            });

            // Download thumbnail
            const thumbWriter = fs.createWriteStream(thumbPath);
            const thumbRes = await axios({ url: thumbUrl, method: "GET", responseType: "stream" });
            thumbRes.data.pipe(thumbWriter);
            await new Promise((resolve, reject) => {
                thumbWriter.on("finish", resolve);
                thumbWriter.on("error", reject);
            });

            // Caption lengkap
            const caption = `✅ DOWNLOAD BERHASIL!

📹 Judul: ${title}
👤 Author: @${author}
⏱ Durasi: ${duration}
🔗 No Watermark

⚙️ Powered by: TikWM API

${config.copyright}`;

            // Kirim sebagai DOCUMENT + thumbnail
            await bot.sendMessage(m.key.remoteJid, {
                document: fs.readFileSync(videoPath),
                mimetype: "video/mp4",
                fileName: fileName,
                caption: caption,
                jpegThumbnail: fs.readFileSync(thumbPath)
            }, { quoted: m });

            // Cleanup
            try {
                fs.unlinkSync(videoPath);
                fs.unlinkSync(thumbPath);
            } catch (e) {}

        } catch (error) {
            console.error("Error ttdl4:", error.message);
            bot.sendMessage(m.key.remoteJid, {
                text: `❌ Gagal download video!\n${error.message || "Coba link lain"}`
            }, { quoted: m });
        }
    }
};