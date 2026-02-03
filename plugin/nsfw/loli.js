const axios = require("axios");

// Array caption untuk loli (harus sesuai dengan guidelines)
const loliCaptions = [
    "🌸 *Cute anime character*",
    "✨ *Kawaii moment*",
    "🎀 *Adorable artwork*",
    "💫 *Anime girl vibes*",
    "🌼 *Sweet character design*",
    "🌟 *Cute and innocent*",
    "💖 *Adorable anime style*",
    "🦋 *Beautiful illustration*",
    "🎨 *Artistic character*",
    "🍬 *Sweet anime moment*",
    "🌺 *Pretty character art*",
    "🎐 *Cute aesthetic*",
    "🌸 *Anime art appreciation*",
    "✨ #AnimeArt #CharacterDesign",
    "🎀 Support original artists!"
];

// API yang aman dan sesuai guidelines
async function getSafeAnimeImage() {
    try {
        // Menggunakan waifu.pics yang memiliki konten SFW (safe for work)
        const response = await axios.get('https://api.waifu.pics/sfw/waifu', {
            timeout: 10000
        });
        
        if (response.data && response.data.url) {
            return {
                url: response.data.url,
                source: "waifu.pics",
                type: "sfw"
            };
        }
        
        throw new Error("No image found");
        
    } catch (error) {
        console.error('API Error:', error.message);
        return getFallbackImage();
    }
}

async function getFallbackImage() {
    try {
        // Fallback ke nekos.life API (juga SFW)
        const response = await axios.get('https://nekos.life/api/v2/img/waifu', {
            timeout: 8000
        });
        
        if (response.data && response.data.url) {
            return {
                url: response.data.url,
                source: "nekos.life",
                type: "sfw"
            };
        }
        
        // Ultimate fallback - gambar default anime yang aman
        return {
            url: "https://i.imgur.com/YQ6z4aD.jpg", // Contoh gambar anime umum yang aman
            source: "fallback",
            type: "sfw"
        };
        
    } catch (error) {
        return {
            url: "https://i.imgur.com/YQ6z4aD.jpg",
            source: "static",
            type: "sfw"
        };
    }
}

module.exports = {
    command: ["loli", "animegirl"],
    category: "anime",
    description: "Kirim gambar anime character yang cute (SFW only)",
    
    async execute(bot, m, args) {
        try {
            // Check jika ada argumen untuk kategori spesifik
            let category = "waifu";
            if (args[0]) {
                const safeCategories = ["waifu", "neko", "shinobu", "megumin"];
                if (safeCategories.includes(args[0].toLowerCase())) {
                    category = args[0].toLowerCase();
                }
            }
            
            // Kirim pesan loading
            const loadingMsg = await bot.sendMessage(m.key.remoteJid, {
                text: "🎀 *Mencari gambar anime...*"
            }, { quoted: m });
            
            // Ambil gambar
            let imageData;
            try {
                // Coba waifu.pics dengan kategori
                const response = await axios.get(`https://api.waifu.pics/sfw/${category}`);
                if (response.data && response.data.url) {
                    imageData = {
                        url: response.data.url,
                        source: "waifu.pics",
                        category: category
                    };
                } else {
                    imageData = await getSafeAnimeImage();
                }
            } catch (apiError) {
                imageData = await getSafeAnimeImage();
            }
            
            // Pilih caption random
            const randomCaption = loliCaptions[Math.floor(Math.random() * loliCaptions.length)];
            
            // Buat caption dengan disclaimer
            let caption = `${randomCaption}\n\n`;
            caption += `📁 *Type:* SFW Anime Art\n`;
            caption += `🏷️ *Category:* ${imageData.category || "anime"}\n`;
            caption += `🔗 *Source:* ${imageData.source}\n\n`;
            caption += `⚠️ *Note:* Please support original artists!\n`;
            caption += `🎨 #AnimeArt #SFW #Cute`;
            
            // Hapus pesan loading
            await bot.sendMessage(m.key.remoteJid, {
                delete: loadingMsg.key
            });
            
            // Kirim gambar
            await bot.sendMessage(m.key.remoteJid, {
                image: { url: imageData.url },
                caption: caption
            }, { quoted: m });
            
        } catch (err) {
            console.error("[ANIME ERROR]", err);
            
            // Kirim pesan error
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Gagal mengambil gambar anime\nCoba lagi nanti~"
            }, { quoted: m });
        }
    },
    
    // Function tambahan untuk validasi URL aman
    isSafeImage(url) {
        const safeDomains = [
            'waifu.pics',
            'nekos.life',
            'imgur.com',
            'i.imgur.com',
            'cdn.waifu.pics'
        ];
        
        return safeDomains.some(domain => url.includes(domain));
    }
};