const axios = require("axios");

// Array caption untuk elf
const elfCaptions = [
    "🌿 *Elegant elf beauty*",
    "✨ *Mystical elf magic*",
    "🌙 *Elven princess*",
    "🌸 *Forest elf guardian*",
    "💫 *Elf from another realm*",
    "🌳 *Ancient elf wisdom*",
    "🎯 *Elf archer ready*",
    "🌌 *Celestial elf*",
    "🍃 *Nature's elf child*",
    "🌟 *Starlight elf*",
    "🌺 *Flower elf maiden*",
    "💚 *Emerald elf enchantress*",
    "🦌 *Forest dwelling elf*",
    "🔮 *Magical elf sorceress*",
    "🏹 *Elf warrior spirit*"
];

async function getElfImage() {
    try {
        // Mencari gambar elf di Gelbooru (anime image board)
        const tags = "elf+1girl+solo";
        const response = await axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tags}&limit=50`);
        
        if (response.data && response.data.post && response.data.post.length > 0) {
            const posts = response.data.post;
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            
            return {
                url: randomPost.file_url,
                source: "Gelbooru",
                artist: randomPost.owner || "Unknown"
            };
        }
        
        // Fallback ke Safebooru (SFW version)
        return getFallbackImage();
        
    } catch (error) {
        console.error('Gelbooru Error:', error);
        return getFallbackImage();
    }
}

async function getFallbackImage() {
    try {
        // Gunakan danbooru dengan tags elf
        const response = await axios.get('https://danbooru.donmai.us/posts.json?tags=elf+1girl&limit=50');
        
        if (response.data && response.data.length > 0) {
            const posts = response.data.filter(post => 
                post.rating === 's' && // SFW only
                post.file_url && 
                !post.file_url.includes('?')
            );
            
            if (posts.length > 0) {
                const randomPost = posts[Math.floor(Math.random() * posts.length)];
                return {
                    url: randomPost.file_url,
                    source: "Danbooru",
                    artist: randomPost.tag_string_artist || "Unknown"
                };
            }
        }
        
        // Ultimate fallback ke waifu.pics
        const waifuRes = await axios.get('https://api.waifu.pics/sfw/waifu');
        if (waifuRes.data && waifuRes.data.url) {
            return {
                url: waifuRes.data.url,
                source: "waifu.pics",
                artist: "Random"
            };
        }
        
        // Static fallback
        return {
            url: "https://i.imgur.com/VJjZk8a.png",
            source: "fallback",
            artist: "Unknown"
        };
        
    } catch (error) {
        console.error('Fallback Error:', error);
        return {
            url: "https://i.imgur.com/VJjZk8a.png",
            source: "static",
            artist: "Unknown"
        };
    }
}

module.exports = {
    command: ["elf"],
    category: "anime",
    description: "Kirim gambar elf anime",
    
    async execute(bot, m, args) {
        try {
            // Kirim pesan loading
            const loadingMsg = await bot.sendMessage(m.key.remoteJid, {
                text: "🌿 *Mencari gambar elf di hutan...*"
            }, { quoted: m });
            
            // Ambil gambar
            const imageData = await getElfImage();
            
            // Pilih caption random
            const randomCaption = elfCaptions[Math.floor(Math.random() * elfCaptions.length)];
            
            // Buat caption
            let caption = `${randomCaption}\n\n`;
            caption += `🎨 *Artist:* ${imageData.artist}\n`;
            caption += `📁 *Source:* ${imageData.source}`;
            
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
            console.error("[ELF ERROR]", err);
            
            // Kirim pesan error
            const errorMessages = [
                "❌ Elf sedang bersembunyi di hutan...",
                "🍃 Gagal menemukan elf...",
                "🌳 Hutan terlalu gelap untuk mencari elf..."
            ];
            
            const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            
            await bot.sendMessage(m.key.remoteJid, {
                text: randomError
            }, { quoted: m });
        }
    }
};