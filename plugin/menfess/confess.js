const config = require("../../config.json");

module.exports = {
    command: ["confess", "cf", "💌"],
    category: "menfess",
    description: "Fitur confess - Coming Soon!",
    
    async execute(bot, m, args) {
        try {
            const comingSoon = `🎯 *CONFESS FEATURE* 🎯

🚧 *SEDANG DALAM PENGEMBANGAN* 🚧

✨ *Fitur yang akan datang:*
• Kirim pesan rahasia ke nomor WhatsApp
• Balas confess secara anonymous
• 100% private & aman

⏳ *Estimated Release:*
Segera! Stay tuned!

🔔 *Follow update terbaru bot ini*
untuk tahu kapan fitur confess rilis!

💝 *Terima kasih sudah menunggu!*`;
            
            await bot.sendMessage(
                m.key.remoteJid,
                { 
                    text: comingSoon,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: false
                    }
                },
                { quoted: m }
            );
            
        } catch (err) {
            console.error("[CONFESS ERROR]", err);
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Error menampilkan info" },
                { quoted: m }
            );
        }
    },
};