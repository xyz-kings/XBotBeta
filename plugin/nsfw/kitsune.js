const axios = require("axios");
const config = require("../../config.json");

module.exports = {
    command: ["kitsune", "rubah"],
    category: "fun",
    description: "Mendapatkan gambar kitsune (rubah) yang aesthetic",
    
    async execute(bot, m, args) {
        try {
            // Tampilkan pesan sedang memproses
            const processingMsg = await bot.sendMessage(
                m.key.remoteJid,
                { text: "🦊 *Mencari kitsune yang cantik...*" },
                { quoted: m }
            );
            
            // API endpoint untuk gambar kitsune
            // Menggunakan multiple API sources untuk variasi
            const apiSources = [
                "https://api.waifu.pics/sfw/kitsune",
                "https://nekos.best/api/v2/kitsune",
                "https://api.nekosapi.com/v2/images/random?tag=kitsune"
            ];
            
            let imageUrl = null;
            let sourceName = "";
            
            // Coba dari berbagai sumber
            for (let i = 0; i < apiSources.length; i++) {
                try {
                    const source = apiSources[i];
                    
                    if (source.includes("waifu.pics")) {
                        const response = await axios.get(source, { timeout: 10000 });
                        if (response.data && response.data.url) {
                            imageUrl = response.data.url;
                            sourceName = "waifu.pics";
                            break;
                        }
                    } 
                    else if (source.includes("nekos.best")) {
                        const response = await axios.get(source, { timeout: 10000 });
                        if (response.data && response.data.results && response.data.results.length > 0) {
                            imageUrl = response.data.results[0].url;
                            sourceName = "nekos.best";
                            break;
                        }
                    }
                    else if (source.includes("nekosapi.com")) {
                        const response = await axios.get(source, { timeout: 10000 });
                        if (response.data && response.data.data && response.data.data.length > 0) {
                            imageUrl = response.data.data[0].url;
                            sourceName = "nekosapi.com";
                            break;
                        }
                    }
                } catch (err) {
                    console.log(`[KITSUNE] Source ${i+1} failed, trying next...`);
                    continue;
                }
            }
            
            // Jika semua API gagal, gunakan fallback
            if (!imageUrl) {
                // Fallback ke API alternatif
                try {
                    const fallbackResponse = await axios.get("https://api.waifu.im/search", {
                        params: {
                            included_tags: ["kitsune"],
                            is_nsfw: false
                        },
                        timeout: 15000
                    });
                    
                    if (fallbackResponse.data && fallbackResponse.data.images && fallbackResponse.data.images.length > 0) {
                        imageUrl = fallbackResponse.data.images[0].url;
                        sourceName = "waifu.im";
                    } else {
                        throw new Error("No image found");
                    }
                } catch (fallbackErr) {
                    // Jika masih gagal, gunakan gambar default
                    imageUrl = "https://i.pinimg.com/736x/34/2a/7a/342a7a8c0b8cf3a943076307b07df4c8.jpg";
                    sourceName = "fallback";
                }
            }
            
            // Hapus pesan processing
            await bot.sendMessage(m.key.remoteJid, { delete: processingMsg.key });
            
            // Download gambar
            const imageResponse = await axios.get(imageUrl, { 
                responseType: 'arraybuffer',
                timeout: 20000 
            });
            
            const imageBuffer = Buffer.from(imageResponse.data, 'binary');
            
            // Kirim gambar dengan caption aesthetic
            const caption = `
╭━━━━━━━━━━━━━━━━━━━━━╮
       🦊  𝐊𝐈𝐓𝐒𝐔𝐍𝐄  🦊
╰━━━━━━━━━━━━━━━━━━━━━╯

*✨ Kitsune telah muncul! ✨*

📛 *Nama:* Kitsune (狐)
🌟 *Makna:* Simbol kecerdasan & kebijaksanaan
🎭 *Sifat:* Penipu, pelindung, atau pembawa keberuntungan
🏮 *Asal:* Mitologi Jepang
🧧 *Jumlah ekor:* 1-9 (Kyūbi no Kitsune)

━━━━━━━━━━━━━━━━━━━━━━━

⚡ *Diproses oleh:* ${config.botName || "Bot"}

_🦊 Ketik .kitsune lagi untuk gambar lain!_
━━━━━━━━━━━━━━━━━━━━━━━
            `.trim();
            
            await bot.sendMessage(
                m.key.remoteJid,
                { 
                    image: imageBuffer,
                    caption: caption,
                    mimetype: 'image/jpeg'
                },
                { quoted: m }
            );
            
        } catch (err) {
            console.error("[KITSUNE ERROR]", err);
            
            // Coba kirim pesan error
            try {
                await bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ Gagal mendapatkan gambar kitsune. Coba lagi nanti!\n\n_Error:_ " + err.message },
                    { quoted: m }
                );
            } catch (sendErr) {
                console.error("[KITSUNE SEND ERROR]", sendErr);
            }
        }
    }
};