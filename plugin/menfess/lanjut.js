const config = require("../../config.json");

// Data sendiri
const data = {
    users: new Map(),
    waiting: [],
    active: new Map()
};

module.exports = {
    command: ["lanjut", "continue", "nextpartner"],
    category: "menfess",
    description: "Lanjut cari partner",
    
    async execute(bot, m, args) {
        try {
            // Panggil next.js logic langsung
            const sender = m.key.participant || m.key.from || m.key.remoteJid;
            
            if (!data.users.has(sender)) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ Belum mulai anonymous!\n\n.anonymous dulu" },
                    { quoted: m }
                );
            }
            
            // Sama persis kayak next.js
            const oldPartner = data.users.get(sender);
            
            if (oldPartner) {
                data.users.delete(oldPartner);
                data.active.delete(oldPartner);
                
                try {
                    await bot.sendMessage(
                        oldPartner,
                        { text: "🔄 Partner cari orang lain." }
                    );
                } catch (e) {}
                
                data.waiting.push(oldPartner);
                data.users.set(oldPartner, null);
            }
            
            data.users.delete(sender);
            data.active.delete(sender);
            data.waiting.push(sender);
            data.users.set(sender, null);
            
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "🔍 Cari partner baru..." },
                { quoted: m }
            );
            
        } catch (err) {
            console.error("[LANJUT ERROR]", err);
        }
    },
};