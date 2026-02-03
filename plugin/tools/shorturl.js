const axios = require("axios");

module.exports = {
    command: ["shorturl", "short", "shortlink"],
    category: "tools",
    description: "Pendekin URL",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Cara pakai:* `.shorturl <URL>`\nContoh: `.shorturl https://google.com`"
                }, { quoted: m });
            }
            
            const url = args[0];
            if (!url.startsWith('http')) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ URL harus diawali dengan http:// atau https://"
                }, { quoted: m });
            }
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: "⏳ *Memendekkan URL...*"
            }, { quoted: m });
            
            try {
                const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                
                if (!response.data || !response.data.trim().startsWith('http')) {
                    throw new Error('API error');
                }
                
                const shortUrl = response.data.trim();
                
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                const result = `✅ *URL Berhasil Dipendekkan*\n\n🔗 *Original:* ${url}\n🔗 *Short URL:* ${shortUrl}\n🏷️ *Service:* TinyURL\n\n📊 *Stats:*\n• Panjang: ${url.length} → ${shortUrl.length} karakter\n• Pengurangan: ${Math.round((1 - shortUrl.length/url.length) * 100)}%`;
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: result
                }, { quoted: m });
                
            } catch (err) {
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: "❌ Gagal memendekkan URL. Coba lagi nanti."
                }, { quoted: m });
            }
            
        } catch (err) {
            console.error("[SHORTURL ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Error memproses permintaan."
            }, { quoted: m });
        }
    }
};