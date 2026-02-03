const config = require("../../config.json");

// Data sendiri
const data = {
    users: new Map(),
    waiting: [],
    active: new Map()
};

module.exports = {
    command: ["keluar", "quit", "berhenti", "selesai"],
    category: "menfess",
    description: "Keluar dari chat",
    
    async execute(bot, m, args) {
        try {
            const sender = m.key.participant || m.key.from || m.key.remoteJid;
            
            if (!data.users.has(sender) && !data.waiting.includes(sender)) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ Lu gak lagi chat anonymous." },
                    { quoted: m }
                );
            }
            
            // Hapus dari semua
            const partner = data.users.get(sender);
            
            data.users.delete(sender);
            data.users.delete(partner);
            data.active.delete(sender);
            data.active.delete(partner);
            
            const waitIdx = data.waiting.indexOf(sender);
            if (waitIdx > -1) data.waiting.splice(waitIdx, 1);
            
            const partnerWaitIdx = data.waiting.indexOf(partner);
            if (partnerWaitIdx > -1) data.waiting.splice(partnerWaitIdx, 1);
            
            // Notif partner kalo ada
            if (partner) {
                try {
                    await bot.sendMessage(
                        partner,
                        { text: "💔 Chat anonymous berakhir." }
                    );
                } catch (e) {}
            }
            
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "👋 Chat anonymous berakhir." },
                { quoted: m }
            );
            
        } catch (err) {
            console.error("[KELUAR ERROR]", err);
        }
    },
};