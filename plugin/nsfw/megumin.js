const axios = require("axios");
const config = require("../../config.json");

module.exports = {
    command: ["megumin", "explosion"],
    category: "anime",
    description: "Mendapatkan gambar Megumin (Explosion!) dari Konosuba",
    
    async execute(bot, m, args) {
        try {
            // Tampilkan pesan sedang memproses
            const processingMsg = await bot.sendMessage(
                m.key.remoteJid,
                { text: "💥 *Chanting explosion magic...*" },
                { quoted: m }
            );
            
            // API endpoint untuk gambar Megumin
            // Menggunakan multiple API sources untuk variasi
            const apiSources = [
                "https://api.waifu.pics/sfw/megumin",
                "https://nekos.best/api/v2/megumin",
                "https://api.safone.tech/anime/waifu?category=megumin"
            ];
            
            let imageUrl = null;
            let sourceName = "";
            let isGif = false;
            
            // Coba dari berbagai sumber
            for (let i = 0; i < apiSources.length; i++) {
                try {
                    const source = apiSources[i];
                    
                    if (source.includes("waifu.pics")) {
                        const response = await axios.get(source, { timeout: 10000 });
                        if (response.data && response.data.url) {
                            imageUrl = response.data.url;
                            sourceName = "waifu.pics";
                            isGif = imageUrl.includes('.gif');
                            break;
                        }
                    } 
                    else if (source.includes("nekos.best")) {
                        const response = await axios.get(source, { timeout: 10000 });
                        if (response.data && response.data.results && response.data.results.length > 0) {
                            imageUrl = response.data.results[0].url;
                            sourceName = "nekos.best";
                            isGif = imageUrl.includes('.gif');
                            break;
                        }
                    }
                    else if (source.includes("safone.tech")) {
                        const response = await axios.get(source, { timeout: 10000 });
                        if (response.data && response.data.image) {
                            imageUrl = response.data.image;
                            sourceName = "safone.tech";
                            isGif = imageUrl.includes('.gif');
                            break;
                        }
                    }
                } catch (err) {
                    console.log(`[MEGUMIN] Source ${i+1} failed, trying next...`);
                    continue;
                }
            }
            
            // Jika semua API gagal, gunakan fallback
            if (!imageUrl) {
                try {
                    // Fallback 1: Trace moe API
                    const traceResponse = await axios.get("https://api.trace.moe/search", {
                        params: {
                            url: "https://i.imgur.com/example.jpg" // placeholder
                        },
                        timeout: 10000
                    });
                    
                    // Cari gambar yang mengandung Megumin
                    if (traceResponse.data && traceResponse.data.result) {
                        for (const result of traceResponse.data.result.slice(0, 5)) {
                            if (result.filename.toLowerCase().includes('megumin') || 
                                (result.anilist && result.anilist.title && 
                                 (result.anilist.title.english || '').toLowerCase().includes('konosuba'))) {
                                imageUrl = result.image;
                                sourceName = "trace.moe";
                                break;
                            }
                        }
                    }
                    
                    // Jika masih gagal, fallback ke gambar default
                    if (!imageUrl) {
                        imageUrl = "https://i.imgur.com/nycHqFo.jpg"; // Megumin explosion default
                        sourceName = "fallback";
                    }
                } catch (fallbackErr) {
                    imageUrl = "https://i.imgur.com/nycHqFo.jpg";
                    sourceName = "fallback";
                }
            }
            
            // Hapus pesan processing
            try {
                await bot.sendMessage(m.key.remoteJid, { delete: processingMsg.key });
            } catch (e) {
                console.log("[MEGUMIN] Failed to delete processing message");
            }
            
            // Download media
            try {
                const mediaResponse = await axios.get(imageUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const mediaBuffer = Buffer.from(mediaResponse.data, 'binary');
                
                // Pilih quotes Megumin random
                const quotes = [
                    "**EXPLOSION!** 💥",
                    "Bakuretsu! Bakuretsu! La! La! La! 💥",
                    "Waga na wa Megumin! Saikyou no mahou, Explosion wo tsukasadoru! 💥",
                    "Chunchunmaru! 💥",
                    "I cast explosion magic! 💥"
                ];
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                
                // Kirim media dengan caption aesthetic
                const caption = `
╭━━━━━━━━━━━━━━━━━━━━━╮
       💥  𝐌𝐄𝐆𝐔𝐌𝐈𝐍  💥
╰━━━━━━━━━━━━━━━━━━━━━╯

*${randomQuote}*

📛 *Nama:* Megumin (めぐみん)
🎌 *Anime:* Kono Subarashii Sekai ni Shukufuku wo! (Konosuba)
🌟 *Role:* Arch Wizard (Crimson Demon Clan)
💫 *Spesialisasi:* Explosion Magic
🧙‍♀️ *Tingkat Sihir:* Tingkat Tertinggi
⚡ *Mana:* MAX (tapi habis 1x cast)

━━━━━━━━━━━━━━━━━━━━━━━

⚡ *Diproses oleh:* ${config.botName || "Bot"}

_💥 Ketik .megumin lagi untuk explosion lainnya!_
━━━━━━━━━━━━━━━━━━━━━━━
                `.trim();
                
                if (isGif) {
                    await bot.sendMessage(
                        m.key.remoteJid,
                        { 
                            video: mediaBuffer,
                            caption: caption,
                            gifPlayback: true,
                            mimetype: 'video/mp4'
                        },
                        { quoted: m }
                    );
                } else {
                    await bot.sendMessage(
                        m.key.remoteJid,
                        { 
                            image: mediaBuffer,
                            caption: caption,
                            mimetype: 'image/jpeg'
                        },
                        { quoted: m }
                    );
                }
                
                // Send additional explosion effect message
                setTimeout(async () => {
                    try {
                        await bot.sendMessage(
                            m.key.remoteJid,
                            { text: "💥 **BOOM!** 💥\n\n_Megumin has used all her mana and can't move..._" },
                            { quoted: m }
                        );
                    } catch (e) {
                        // Ignore if fails
                    }
                }, 1000);
                
            } catch (mediaErr) {
                console.error("[MEGUMIN MEDIA ERROR]", mediaErr);
                // Jika gagal download media, kirim link saja
                await bot.sendMessage(
                    m.key.remoteJid,
                    { 
                        text: `💥 **Megumin Explosion!** 💥\n\nGagal mengirim media, berikut linknya:\n${imageUrl}\n\n_Source: ${sourceName}_`
                    },
                    { quoted: m }
                );
            }
            
        } catch (err) {
            console.error("[MEGUMIN ERROR]", err);
            
            try {
                await bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ **Explosion failed!** 💢\n\nGagal mendapatkan gambar Megumin. Coba lagi nanti!\n\n_Error:_ " + err.message },
                    { quoted: m }
                );
            } catch (sendErr) {
                console.error("[MEGUMIN SEND ERROR]", sendErr);
            }
        }
    }
};