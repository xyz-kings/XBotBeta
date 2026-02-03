const axios = require("axios");
const config = require("../../config.json");

// Kategori cosplay yang tersedia
const cosplayCategories = [
    "anime", "game", "vtuber", "maid", "ninja", "knight", "witch", 
    "angel", "demon", "school", "gothic", "steampunk", "fantasy"
];

module.exports = {
    command: ["cosplay", "cos"],
    category: "anime",
    description: "Mendapatkan gambar cosplay aesthetic dari berbagai karakter",
    
    async execute(bot, m, args) {
        try {
            // Parse arguments untuk kategori
            const input = args.join(" ").toLowerCase().trim();
            let category = "random";
            
            // Cek jika ada kategori spesifik
            if (input) {
                const foundCategory = cosplayCategories.find(cat => 
                    cat.toLowerCase() === input || 
                    input.includes(cat)
                );
                if (foundCategory) {
                    category = foundCategory;
                }
            }
            
            // Tampilkan pesan sedang memproses
            const processingMsg = await bot.sendMessage(
                m.key.remoteJid,
                { text: `🎭 *Mencari cosplay ${category} yang epic...*` },
                { quoted: m }
            );
            
            // API endpoint untuk gambar cosplay (SFW only)
            const apiSources = [
                {
                    url: "https://api.waifu.pics/sfw/waifu",
                    name: "waifu.pics",
                    transform: (data) => data.url
                },
                {
                    url: "https://nekos.best/api/v2/neko",
                    name: "nekos.best",
                    transform: (data) => data.results[0]?.url
                },
                {
                    url: "https://api.catboys.com/img",
                    name: "catboys.com",
                    transform: (data) => data.url
                },
                {
                    url: "https://api.safone.tech/anime/waifu",
                    name: "safone.tech",
                    transform: (data) => data.image
                }
            ];
            
            // Jika ada kategori spesifik, coba API khusus cosplay
            if (category !== "random" && category !== "waifu") {
                apiSources.unshift({
                    url: `https://api.waifu.im/search`,
                    name: "waifu.im",
                    params: {
                        included_tags: [category],
                        is_nsfw: false,
                        many: false
                    },
                    transform: (data) => data.images[0]?.url
                });
            }
            
            let imageUrl = null;
            let sourceName = "";
            let characterName = "";
            let cosplayInfo = "";
            
            // Coba dari berbagai sumber
            for (let i = 0; i < apiSources.length; i++) {
                try {
                    const source = apiSources[i];
                    console.log(`[COSPLAY] Trying source: ${source.name}`);
                    
                    const response = await axios.get(source.url, {
                        params: source.params || {},
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.data) {
                        imageUrl = source.transform(response.data);
                        if (imageUrl) {
                            sourceName = source.name;
                            
                            // Generate random character name based on category
                            characterName = generateCharacterName(category);
                            cosplayInfo = generateCosplayInfo(category, characterName);
                            break;
                        }
                    }
                } catch (err) {
                    console.log(`[COSPLAY] Source ${i+1} failed:`, err.message);
                    continue;
                }
            }
            
            // Fallback jika semua API gagal
            if (!imageUrl) {
                try {
                    // Fallback ke pic.re
                    const fallbackResponse = await axios.get("https://pic.re/image", {
                        params: {
                            type: "sfw",
                            category: category !== "random" ? category : "anime"
                        },
                        timeout: 10000
                    });
                    
                    if (fallbackResponse.data && fallbackResponse.data.url) {
                        imageUrl = fallbackResponse.data.url;
                        sourceName = "pic.re";
                        characterName = generateCharacterName(category);
                        cosplayInfo = generateCosplayInfo(category, characterName);
                    } else {
                        throw new Error("No fallback image");
                    }
                } catch (fallbackErr) {
                    // Ultimate fallback - gambar default
                    imageUrl = "https://i.imgur.com/ZLJcRwf.jpg";
                    sourceName = "default";
                    characterName = "Cosplay Character";
                    cosplayInfo = "Amazing cosplay from anime convention";
                }
            }
            
            // Hapus pesan processing
            try {
                await bot.sendMessage(m.key.remoteJid, { delete: processingMsg.key });
            } catch (e) {
                console.log("[COSPLAY] Failed to delete processing message");
            }
            
            // Download gambar
            try {
                const imageResponse = await axios.get(imageUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 25000,
                    headers: {
                        'Referer': 'https://www.google.com/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const imageBuffer = Buffer.from(imageResponse.data, 'binary');
                
                // Generate caption aesthetic
                const caption = `
╭━━━━━━━━━━━━━━━━━━━━━╮
       🎭  𝐂𝐎𝐒𝐏𝐋𝐀𝐘  🎭
╰━━━━━━━━━━━━━━━━━━━━━╯

🎨 *Detail Cosplay:*
├── 🧵 Kualitas: ${getRandomQuality()}
├── 💄 Makeup: ${getRandomMakeup()}
├── 👗 Kostum: ${getRandomCostume()}
└── ⭐ Rating: ${getRandomRating()}/10

━━━━━━━━━━━━━━━━━━━━━━━

⚡ *Diproses oleh:* ${config.botName || "Bot"}

_🎭 Kategori tersedia: ${cosplayCategories.slice(0, 5).join(", ")}..._
_📝 Gunakan: .cosplay [kategori] untuk spesifik!_
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
                
                // Send additional info message
                setTimeout(async () => {
                    try {
                        const tips = [
                            "💡 *Tips Cosplay:* Mulailah dengan karakter yang kamu sukai!",
                            "🎨 *Fun Fact:* Cosplay pertama kali populer di Jepang tahun 1970-an",
                            "👗 *Costume Tip:* Gunakan bahan yang nyaman dan breathable",
                            "📸 *Photo Tip:* Pencahayaan alami memberikan hasil terbaik!",
                            "🌟 *Remember:* Cosplay is about having fun, not perfection!"
                        ];
                        const randomTip = tips[Math.floor(Math.random() * tips.length)];
                        
                        await bot.sendMessage(
                            m.key.remoteJid,
                            { text: randomTip },
                            { quoted: m }
                        );
                    } catch (e) {
                        // Ignore if fails
                    }
                }, 1500);
                
            } catch (mediaErr) {
                console.error("[COSPLAY MEDIA ERROR]", mediaErr);
                // Kirim link jika gagal download
                await bot.sendMessage(
                    m.key.remoteJid,
                    { 
                        text: `🎭 **Cosplay Image** 🎭\n\n*Karakter:* ${characterName}\n*Kategori:* ${category}\n\nGagal mengirim gambar, berikut linknya:\n${imageUrl}\n\n_Source: ${sourceName}_`
                    },
                    { quoted: m }
                );
            }
            
        } catch (err) {
            console.error("[COSPLAY ERROR]", err);
            
            try {
                await bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ **Cosplay not found!** 🎭\n\nGagal mendapatkan gambar cosplay. Coba kategori lain atau coba lagi nanti!\n\n_Kategori tersedia:_ " + cosplayCategories.slice(0, 8).join(", ") },
                    { quoted: m }
                );
            } catch (sendErr) {
                console.error("[COSPLAY SEND ERROR]", sendErr);
            }
        }
    }
};

// Helper functions
function generateCharacterName(category) {
    const names = {
        anime: ["Hatsune Miku", "Rem", "Naruto", "Goku", "Sailor Moon", "Luffy", "Nezuko"],
        game: ["Lara Croft", "Cloud", "2B", "Jill Valentine", "Aloy", "Master Chief"],
        vtuber: ["Gawr Gura", "Korone", "Pekora", "Calliope", "Kizuna AI"],
        maid: ["Maid-sama", "Rem", "Ram", "Tohru"],
        ninja: ["Naruto", "Kakashi", "Sasuke", "Itachi"],
        knight: ["Saber", "Mordred", "Artoria", "Dark Knight"],
        witch: ["Megumin", "Yennefer", "Cirilla", "Hermione"],
        angel: ["Angel", "Krul", "Miku", "Holy Maiden"],
        demon: ["Nezuko", "Albedo", "Rias", "Demon Lord"],
        school: ["School Idol", "Student", "Class Rep", "Delinquent"],
        gothic: ["Gothic Lolita", "Vampire", "Dark Princess"],
        steampunk: ["Steam Engineer", "Aviator", "Mechanist"],
        fantasy: ["Elf Archer", "Dark Mage", "Holy Paladin"]
    };
    
    const categoryNames = names[category] || names.anime;
    return categoryNames[Math.floor(Math.random() * categoryNames.length)];
}

function generateCosplayInfo(category, character) {
    const infos = {
        anime: `Cosplay ${character} dari anime terkenal`,
        game: `Cosplay karakter ${character} dari video game`,
        vtuber: `Cosplay VTuber ${character} dengan detail sempurna`,
        maid: `Maid cosplay ${character} dengan apron lucu`,
        ninja: `Ninja cosplay ${character} dengan shuriken dan kunai`,
        knight: `Knight cosplay ${character} dengan armor mengkilap`,
        witch: `Witch cosplay ${character} dengan staff ajaib`,
        angel: `Angel cosplay ${character} dengan sayap putih`,
        demon: `Demon cosplay ${character} dengan tanduk dan ekor`,
        school: `School uniform cosplay ${character}`,
        gothic: `Gothic cosplay ${character} dengan tema gelap`,
        steampunk: `Steampunk cosplay ${character} dengan gear dan brass`,
        fantasy: `Fantasy cosplay ${character} dari dunia magis`
    };
    
    return infos[category] || `Cosplay ${character} dengan kostum detail`;
}

function getRandomQuality() {
    const qualities = ["Excellent", "Amazing", "Professional", "High Quality", "Detailed"];
    return qualities[Math.floor(Math.random() * qualities.length)];
}

function getRandomMakeup() {
    const makeup = ["Perfect", "On Point", "Artistic", "Detailed", "Professional"];
    return makeup[Math.floor(Math.random() * makeup.length)];
}

function getRandomCostume() {
    const costumes = ["Handmade", "Custom Tailored", "Accurate", "Detailed", "Screen Accurate"];
    return costumes[Math.floor(Math.random() * costumes.length)];
}

function getRandomRating() {
    return Math.floor(Math.random() * 3) + 8; // 8-10
}