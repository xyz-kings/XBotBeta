const config = require("../../config.json");

// Data sendiri (sama kayak anonymous.js tapi beda instance)
const anonData = {
    users: new Map(),
    waiting: [],
    active: new Map()
};

module.exports = {
    command: ["leave", "stop", "end", "exit"],
    category: "menfess",
    description: "Keluar dari anonymous chat",
    
    async execute(bot, m, args) {
        try {
            const sender = m.key.participant || m.key.from || m.key.remoteJid;
            
            // Cek waiting
            const waitIdx = anonData.waiting.indexOf(sender);
            if (waitIdx > -1) {
                anonData.waiting.splice(waitIdx, 1);
                anonData.users.delete(sender);
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "✅ Keluar dari antrian." },
                    { quoted: m }
                );
            }
            
            // Cek active
            if (anonData.users.has(sender)) {
                const partner = anonData.users.get(sender);
                
                // Hapus semua
                anonData.users.delete(sender);
                anonData.users.delete(partner);
                anonData.active.delete(sender);
                anonData.active.delete(partner);
                
                // Notif ke partner
                if (partner) {
                    try {
                        await bot.sendMessage(
                            partner,
                            { text: "⚠️ Partner keluar dari chat." }
                        );
                    } catch (e) {}
                }
                
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "✅ Keluar dari anonymous chat." },
                    { quoted: m }
                );
            }
            
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Lu gak lagi anonymous." },
                { quoted: m }
            );
            
        } catch (err) {
            console.error("[LEAVE ERROR]", err);
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Gagal keluar." },
                { quoted: m }
            );
        }
    },
};