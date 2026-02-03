const axios = require("axios");

// Array caption untuk yuri
const yuriCaptions = [
    "🌸 *Yuri moment~*",
    "💖 *Girls love is beautiful*",
    "🌙 *Sweet yuri scene*",
    "✨ *Yuri vibes~*",
    "🌷 *Cute girls together*",
    "🌊 *Yuri waves of love*",
    "🎀 *Pink yuri atmosphere*",
    "💫 *Yuri magic in the air*",
    "🍬 *Sweet yuri sweetness*",
    "🌈 *Yuri rainbow connection*",
    "🎵 *Yuri harmony*",
    "🌸 *Sakura yuri moment*",
    "💞 *Hearts intertwined*",
    "🌌 *Yuri starlight*",
    "🦋 *Yuri butterfly effect*"
];

async function getYuriImage() {
    try {
        // Menggunakan API waifu.pics untuk gambar yuri/sfw
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        
        if (response.data && response.data.url) {
            return {
                url: response.data.url,
                source: "waifu.pics"
            };
        }
        
        // Fallback ke nekos.life
        return getFallbackImage();
        
    } catch (error) {
        console.error('API Error:', error);
        return getFallbackImage();
    }
}

async function getFallbackImage() {
    try {
        const response = await axios.get('https://nekos.life/api/v2/img/waifu');
        if (response.data && response.data.url) {
            return {
                url: response.data.url,
                source: "nekos.life"
            };
        }
        
        // Default fallback image
        return {
            url: "https://i.imgur.com/7QkG0Yv.jpg",
            source: "fallback"
        };
        
    } catch (error) {
        return {
            url: "https://i.imgur.com/7QkG0Yv.jpg",
            source: "static"
        };
    }
}

module.exports = {
    command: ["yuri"],
    category: "anime",
    description: "Kirim gambar yuri random",
    
    async execute(bot, m, args) {
        try {
            // Kirim pesan loading
            await bot.sendMessage(m.key.remoteJid, {
                text: "🌸 *Mencari gambar yuri...*"
            }, { quoted: m });
            
            // Ambil gambar
            const imageData = await getYuriImage();
            
            // Pilih caption random
            const randomCaption = yuriCaptions[Math.floor(Math.random() * yuriCaptions.length)];
            
            // Buat caption sederhana
            const caption = `${randomCaption}\n\n_Source: ${imageData.source}_`;
            
            // Kirim gambar
            await bot.sendMessage(m.key.remoteJid, {
                image: { url: imageData.url },
                caption: caption
            }, { quoted: m });
            
        } catch (err) {
            console.error("[YURI ERROR]", err);
            
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Gagal mengambil gambar yuri"
            }, { quoted: m });
        }
    }
};