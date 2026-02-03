const axios = require("axios");

module.exports = {
    command: ["cekip", "ip", "ipinfo"],
    category: "tools",
    description: "Cek informasi IP Address",
    
    async execute(bot, m, args) {
        try {
            const ip = args[0] || '';
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: ip ? `🔍 *Mencari info IP ${ip}...*` : "🌐 *Mendeteksi IP kamu...*"
            }, { quoted: m });
            
            let apiUrl = 'https://ipapi.co/json/';
            if (ip) {
                const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
                if (!ipPattern.test(ip)) {
                    await bot.sendMessage(m.key.remoteJid, {
                        delete: loading.key
                    });
                    return bot.sendMessage(m.key.remoteJid, {
                        text: "❌ Format IP tidak valid. Contoh: `.cekip 8.8.8.8`"
                    }, { quoted: m });
                }
                apiUrl = `https://ipapi.co/${ip}/json/`;
            }
            
            try {
                const response = await axios.get(apiUrl, { timeout: 10000 });
                const data = response.data;
                
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                let result = `🌐 *INFORMASI IP ADDRESS*\n\n`;
                result += `📍 *IP:* ${data.ip || 'Tidak diketahui'}\n`;
                result += `🏙️ *Kota:* ${data.city || '-'}\n`;
                result += `🏛️ *Region:* ${data.region || '-'}\n`;
                result += `🇮🇩 *Negara:* ${data.country_name || '-'}\n`;
                result += `🗺️ *Koordinat:* ${data.latitude || '-'}, ${data.longitude || '-'}\n`;
                result += `🌐 *ISP:* ${data.org || '-'}\n`;
                result += `⏰ *Zona Waktu:* ${data.timezone || '-'}\n`;
                
                if (data.latitude && data.longitude) {
                    result += `🗺️ *Google Maps:* https://maps.google.com/?q=${data.latitude},${data.longitude}\n`;
                }
                
                result += `_Data dari ipapi.co_`;
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: result
                }, { quoted: m });
                
            } catch (apiErr) {
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: `❌ Gagal mendapatkan info IP:\n${apiErr.message}`
                }, { quoted: m });
            }
            
        } catch (err) {
            console.error("[CEKIP ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Error saat mengecek IP."
            }, { quoted: m });
        }
    }
};