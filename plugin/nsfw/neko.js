const axios = require("axios");
const config = require("../../config.json");

module.exports = {
    command: ["neko", "catgirl", "nyan"],
    category: "fun",
    description: "Dapatkan gambar neko (cat girl) anime yang imut! 🐱",
    
    async execute(bot, m, args) {
        try {
            // Send loading/wait message
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "🐱 *Mencari neko imut...*" },
                { quoted: m }
            );

            // Fetch from multiple API sources for variety
            const apiSources = [
                "https://api.waifu.pics/sfw/neko",
                "https://nekos.best/api/v2/neko",
                "https://nekos.life/api/v2/img/neko"
            ];

            // Try different APIs until we get a valid image
            let imageUrl = null;
            let apiIndex = 0;
            
            while (!imageUrl && apiIndex < apiSources.length) {
                try {
                    const apiUrl = apiSources[apiIndex];
                    const response = await axios.get(apiUrl, { timeout: 10000 });
                    
                    if (apiUrl.includes("waifu.pics")) {
                        imageUrl = response.data.url;
                    } else if (apiUrl.includes("nekos.best")) {
                        imageUrl = response.data.results[0].url;
                    } else if (apiUrl.includes("nekos.life")) {
                        imageUrl = response.data.url;
                    }
                } catch (apiErr) {
                    console.log(`API ${apiIndex + 1} failed, trying next...`);
                }
                apiIndex++;
            }

            // Fallback if all APIs fail
            if (!imageUrl) {
                imageUrl = "https://i.pinimg.com/originals/7c/60/e0/7c60e0a3c32dc06151d389d0c62d7d0b.gif";
            }

            // Random captions
            const captions = [
                "🐱 *Nyaa~* Ada neko imut datang!",
                "🐾 *Meow!* Neko-chan telah muncul!",
                "🌸 *Kawaii neko desu!* Gambar neko yang lucu!",
                "✨ *Neko power!* Gambar cat girl anime!",
                "💫 *Nyaa!* Seseorang memanggilku?",
                "🎀 *Kawaii!* Neko-chan siap menghiburmu!",
                "🌟 *Meow meow!* Gambar neko special untukmu!",
                "🐈 *Nyan~* Ada yang mau lihat neko imut?",
                "💖 *Cat girl magic!* Gambar neko anime!",
                "🎉 *Neko time!* Gambar cat girl yang menggemaskan!"
            ];

            const randomCaption = captions[Math.floor(Math.random() * captions.length)];
            
            // Add user mention if available
            let finalCaption = randomCaption;
            const sender = m.key.from || m.key.participant || m.key.remoteJid;
            
            if (sender) {
                const userNumber = sender.split('@')[0];
                finalCaption = `${randomCaption}\n\n👤 *Requested by:* @${userNumber}`;
            }

            // Additional footer
            finalCaption += `\n\n📌 *Gunakan:* ${config.prefix || "."}neko\n${config.copyright || ""}`;

            // Send the image with caption
            await bot.sendMessage(
                m.key.remoteJid,
                {
                    image: { url: imageUrl },
                    caption: finalCaption,
                    mentions: sender ? [sender] : []
                },
                { quoted: m }
            );

        } catch (err) {
            console.error("[NEKO ERROR]", err);
            
            // Fallback error image
            const fallbackImage = "https://c.tenor.com/3eOxjfY67tMAAAAC/cat-cat-love.gif";
            const errorCaption = `🐱 *Nyaa~!* Gagal mengambil gambar neko!\n\nTapi tenang, ini neko cadangan untukmu!\n\n${config.copyright || ""}`;
            
            await bot.sendMessage(
                m.key.remoteJid,
                {
                    image: { url: fallbackImage },
                    caption: errorCaption
                },
                { quoted: m }
            );
        }
    }
};