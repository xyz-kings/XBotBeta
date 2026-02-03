const config = require("../../config.json");

// Data sendiri
const data = {
    users: new Map(),
    waiting: [],
    active: new Map()
};

module.exports = {
    command: ["next", "skip", "ganti"],
    category: "menfess",
    description: "Ganti partner anonymous",
    
    async execute(bot, m, args) {
        try {
            const sender = m.key.participant || m.key.from || m.key.remoteJid;
            
            // Cek lagi chat apa enggak
            if (!data.users.has(sender) || !data.active.has(sender)) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: "❌ Lu gak lagi anonymous.\n\n.anonymous untuk mulai" },
                    { quoted: m }
                );
            }
            
            const oldPartner = data.users.get(sender);
            
            // Putusin yang lama
            if (oldPartner) {
                data.users.delete(oldPartner);
                data.active.delete(oldPartner);
                
                try {
                    await bot.sendMessage(
                        oldPartner,
                        { text: "🔄 Partner ganti orang." }
                    );
                } catch (e) {}
                
                // Masukin lagi ke waiting
                data.waiting.push(oldPartner);
                data.users.set(oldPartner, null);
            }
            
            // Hapus diri sendiri dari active
            data.users.delete(sender);
            data.active.delete(sender);
            
            // Masuk waiting lagi
            data.waiting.push(sender);
            data.users.set(sender, null);
            
            // Cari yang lain
            const others = data.waiting.filter(p => p !== sender);
            
            if (others.length > 0) {
                const newPartner = others[0];
                
                // Hapus dari waiting
                const selfIdx = data.waiting.indexOf(sender);
                const partnerIdx = data.waiting.indexOf(newPartner);
                if (selfIdx > -1) data.waiting.splice(selfIdx, 1);
                if (partnerIdx > -1) data.waiting.splice(partnerIdx, 1);
                
                // Connect
                data.users.set(sender, newPartner);
                data.users.set(newPartner, sender);
                data.active.set(sender, newPartner);
                data.active.set(newPartner, sender);
                
                await bot.sendMessage(sender, { text: "🔄 Dapet partner baru!" });
                await bot.sendMessage(newPartner, { text: "🔄 Dapet partner baru!" });
                
            } else {
                await bot.sendMessage(
                    m.key.remoteJid,
                    { text: "⏳ Cari partner baru..." },
                    { quoted: m }
                );
            }
            
        } catch (err) {
            console.error("[NEXT ERROR]", err);
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Gagal ganti partner." },
                { quoted: m }
            );
        }
    },
};