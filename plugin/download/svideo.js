const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require("../../config.json");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
    command: ["snckvideo", "snackvideo", "snack"],

    async execute(bot, m, args) {
        if (args.length === 0) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Kirim link SnackVideo!\nContoh: ${config.prefix}snackvideo https://www.snackvideo.com/video/xxxxxx\natau: ${config.prefix}snackvideo https://sck.io/xxxxxx`
            }, { quoted: m });
        }

        const url = args[0];
        const snackPattern = /(snackvideo\.com|sck\.io)/i;
        
        if (!snackPattern.test(url)) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: "❌ Link bukan dari SnackVideo!" 
            }, { quoted: m });
        }

        await reactLoading(bot, m);

        try {
            console.log("Mencoba API 1: ytdown...");
            
            // API 1: ytdown (bisa untuk snack video)
            const apiUrl1 = `https://ytdownloader.wapwon.workers.dev/?url=${encodeURIComponent(url)}`;
            
            try {
                const response1 = await axios.get(apiUrl1, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response1.data && response1.data.status === 'success') {
                    console.log("API 1 berhasil!");
                    return await processAndSend(bot, m, response1.data, "API 1");
                }
            } catch (e) {
                console.log("API 1 gagal:", e.message);
            }

            console.log("Mencoba API 2: savefrom...");
            
            // API 2: savefrom.net style
            const apiUrl2 = `https://co.wuk.sh/api/json`;
            const payload = {
                url: url,
                aFormat: "mp4",
                isAudioOnly: false,
                dubLang: false,
                filenamePattern: "classic"
            };
            
            try {
                const response2 = await axios.post(apiUrl2, payload, {
                    timeout: 15000,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                
                if (response2.data && response2.data.url) {
                    console.log("API 2 berhasil!");
                    return await processAndSend(bot, m, response2.data, "API 2");
                }
            } catch (e) {
                console.log("API 2 gagal:", e.message);
            }

            console.log("Mencoba API 3: ttdownloader...");
            
            // API 3: TikTok downloader (kadang bisa untuk snack)
            const apiUrl3 = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
            
            try {
                const response3 = await axios.get(apiUrl3, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                
                if (response3.data && response3.data.data) {
                    console.log("API 3 berhasil!");
                    return await processAndSend(bot, m, response3.data, "API 3");
                }
            } catch (e) {
                console.log("API 3 gagal:", e.message);
            }

            console.log("Mencoba API 4: snapinsta...");
            
            // API 4: snapinsta (insta downloader tapi kadang support snack)
            const apiUrl4 = `https://snapinsta.app/action.php?url=${encodeURIComponent(url)}`;
            
            try {
                const response4 = await axios.post(apiUrl4, "url=" + encodeURIComponent(url), {
                    timeout: 15000,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                
                if (response4.data && (response4.data.medias || response4.data.links)) {
                    console.log("API 4 berhasil!");
                    return await processAndSend(bot, m, response4.data, "API 4");
                }
            } catch (e) {
                console.log("API 4 gagal:", e.message);
            }

            throw new Error("Semua API gagal, coba link yang lain");

        } catch (error) {
            console.error("Error snackvideo:", error);
            
            let errorMessage = `❌ Gagal download video!\n\nError: ${error.message}`;
            
            if (error.message.includes('timeout')) {
                errorMessage += "\n\n⏱ Timeout: Server terlalu lama merespon";
            } else if (error.message.includes('Semua API gagal')) {
                errorMessage += "\n\n🔧 Semua server download sedang sibuk";
            }
            
            errorMessage += `\n\nTips:\n1. Coba link yang lain\n2. Pastikan video belum dihapus\n3. Coba lagi nanti`;
            
            bot.sendMessage(m.key.remoteJid, {
                text: errorMessage
            }, { quoted: m });
        }
    }
};

// Fungsi helper untuk proses dan kirim video
async function processAndSend(bot, m, data, apiName) {
    try {
        let videoUrl, title, thumbnail, duration, size;
        
        // Parse data berdasarkan API
        switch(apiName) {
            case "API 1":
                // Format: ytdown
                videoUrl = data.downloadUrl || data.url;
                title = data.title || "SnackVideo";
                thumbnail = data.thumbnail;
                duration = data.duration;
                size = data.size;
                break;
                
            case "API 2":
                // Format: co.wuk.sh
                videoUrl = data.url;
                title = data.filename || "SnackVideo";
                thumbnail = null;
                duration = null;
                size = null;
                break;
                
            case "API 3":
                // Format: tikwm
                videoUrl = data.data.play || data.data.wmplay || data.data.hdplay;
                title = data.data.title || "SnackVideo";
                thumbnail = data.data.cover;
                duration = data.data.duration;
                break;
                
            case "API 4":
                // Format: snapinsta
                const media = data.medias ? data.medias[0] : data.links[0];
                videoUrl = media.url || media.videoUrl;
                title = data.title || "SnackVideo";
                thumbnail = data.thumbnail;
                duration = null;
                break;
                
            default:
                throw new Error("Format API tidak dikenali");
        }
        
        if (!videoUrl) {
            throw new Error("URL video tidak ditemukan");
        }
        
        console.log(`Video URL dari ${apiName}:`, videoUrl.substring(0, 80) + "...");
        
        // Download thumbnail jika ada
        let thumbnailBuffer = null;
        if (thumbnail) {
            try {
                const thumbRes = await axios.get(thumbnail, { 
                    responseType: 'arraybuffer',
                    timeout: 10000 
                });
                thumbnailBuffer = Buffer.from(thumbRes.data, 'binary');
                console.log("Thumbnail berhasil diunduh");
            } catch (e) {
                console.log("Gagal download thumbnail:", e.message);
            }
        }
        
        // Download video
        const tempDir = path.join(__dirname, "../../temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const fileName = `snackvideo_${Date.now()}.mp4`;
        const tempPath = path.join(tempDir, fileName);
        
        const writer = fs.createWriteStream(tempPath);
        const dlResponse = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream",
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://snackvideo.com/',
                'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/octet-stream;q=0.8,*/*;q=0.7',
                'Accept-Encoding': 'identity',
                'Range': 'bytes=0-'
            }
        });
        
        let totalSize = 0;
        let lastProgress = 0;
        
        dlResponse.data.on('data', (chunk) => {
            totalSize += chunk.length;
            const progress = Math.floor((totalSize / 1024 / 1024) * 10) / 10;
            if (progress - lastProgress >= 0.5) {
                console.log(`Download progress: ${progress} MB`);
                lastProgress = progress;
            }
        });
        
        dlResponse.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
        
        console.log("Video berhasil diunduh");
        
        // Dapatkan info file
        const stats = fs.statSync(tempPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        const fileSize = fileSizeMB + ' MB';
        
        // Format durasi jika ada
        let durationText = '';
        if (duration) {
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            durationText = `⏱ Durasi: ${mins}:${secs.toString().padStart(2, '0')}`;
        }
        
        // Buat caption
        const caption = `✅ SNACKVIDEO DOWNLOAD BERHASIL!

📌 Judul: ${title}
${durationText}
📦 Ukuran: ${fileSize}
⚡ Via: ${apiName}

📥 Powered by WhatsApp Bot

${config.copyright || ''}`;
        
        // Kirim video
        console.log("Mengirim video ke WhatsApp...");
        await bot.sendMessage(m.key.remoteJid, {
            video: fs.readFileSync(tempPath),
            caption: caption,
            thumbnail: thumbnailBuffer || undefined,
            gifPlayback: false,
            mimetype: 'video/mp4',
            fileName: fileName
        }, { quoted: m });
        
        console.log("Video berhasil dikirim");
        
        // Cleanup
        try {
            fs.unlinkSync(tempPath);
            console.log("File temporary dihapus");
        } catch (e) {
            console.error("Error deleting temp file:", e.message);
        }
        
    } catch (error) {
        console.error("Error dalam processAndSend:", error);
        throw error;
    }
}