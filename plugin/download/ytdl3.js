const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require("../../config.json");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
    command: ["ytdl4"],

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
            // Ambil info video dulu pake API ytsearch (atau langsung dari ytmp4 kalo ada info)
            // Tapi API lu cuma ngasih link download doang, jadi gue tambahin API search biar dapet info lengkap
            // Gunain API lu yang ytsearch kalo ada, atau fallback ke public API
            let title = "YouTube Music";
            let channel = "Unknown";
            let duration = "Unknown";
            let views = "Unknown";
            let thumbUrl = "https://i.ytimg.com/vi_default.jpg"; // fallback

            // Coba ambil ID video
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i)?.[1];
            if (videoId) {
                thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

                // Optional: ambil info dari API gratis (no key needed)
                try {
                    const infoRes = await axios.get(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, { timeout: 10000 });
                    if (infoRes.data.title) {
                        title = infoRes.data.title;
                        channel = infoRes.data.author_name || channel;
                    }
                } catch (e) {
                    // Ignore kalo gagal, lanjut pake default
                }
            }

            // Panggil API download lu
            const apiUrl = `${config.baseURL}/download/ytmp3?apikey=${config.apiKey}&url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl, { timeout: 20000 });

            if (!res.data.status || !res.data.result) {
                throw new Error("API gagal atau link tidak support");
            }

            const videoUrl = res.data.result;
            const creator = res.data.creator || "Xyz-King's";

            // Nama file bersih
            const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`.slice(0, 100);
            if (!fileName.endsWith('.mp3')) fileName += '.mp3';

            // Temp folder
            const tempDir = path.join(__dirname, "../../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const videoPath = path.join(tempDir, fileName);
            const thumbPath = path.join(tempDir, "yt_thumb.jpg");

            // Download video MP4
            const videoWriter = fs.createWriteStream(videoPath);
            const videoRes = await axios({
                url: videoUrl,
                method: "GET",
                responseType: "stream",
                timeout: 120000 // 2 menit buat video besar
            });
            videoRes.data.pipe(videoWriter);

            await new Promise((resolve, reject) => {
                videoWriter.on("finish", resolve);
                videoWriter.on("error", reject);
            });

            // Caption lengkap
            const caption = `✅ DOWNLOAD MUSIK YOUTUBE BERHASIL!

⚙️ Powered by: ${creator} API

${config.copyright}`;

            // Kirim sebagai DOCUMENT + thumbnail
            await bot.sendMessage(m.key.remoteJid, {
                document: fs.readFileSync(videoPath),
                mimetype: "audio/mpeg",
                fileName: fileName,
                caption: caption,
                jpegThumbnail: thumbBuffer
            }, { quoted: m });

            // Cleanup temp
            try {
                fs.unlinkSync(videoPath);
                if (thumbBuffer) fs.unlinkSync(thumbPath);
            } catch (e) {}

        } catch (error) {
            console.error("Error ytdl3:", error.message || error);
            bot.sendMessage(m.key.remoteJid, {
                text: `❌ Gagal download video YouTube!\n\n• ${error.message || "Link tidak support atau error API"}\n• Coba link lain`
            }, { quoted: m });
        }
    }
};