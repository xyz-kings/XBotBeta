const config = require("../../config.json");

module.exports = {
    command: ["mulai", "m"],
    category: "menfess",
    description: "Mulai menfess",
    
    async execute(bot, m, args) {
        try {
            await bot.sendMessage(
                m.key.remoteJid,
                { text: `🎯 *MULAI MENFESS*\n\nPilih:\n\n💬 .anonymous - Chat random\n📤 .confess - Kirim confess\n📨 .menfess - Kirim ke admin\n\nℹ️ .start untuk menu lengkap` },
                { quoted: m }
            );
        } catch (err) {
            console.error("[MULAI ERROR]", err);
        }
    },
};