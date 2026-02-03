const config = require("../../config.json");

// DATA SENDIRI - TIDAK SHARE
const anonymousData = {
    users: new Map(),      // user -> partner
    waiting: [],           // yang nunggu
    active: new Map(),     // yang aktif chat
    lastMessage: new Map() // last message time
};

module.exports = {
    command: ["anonymous", "anon", "anonchat"],
    category: "menfess",
    description: "Chat random anonymous",
    
    async execute(bot, m, args) {
        try {
            const sender = m.key.participant || m.key.from || m.key.remoteJid;
            const senderName = sender.split('@')[0];
            
            // Cek udah anonymous?
            if (anonymousData.users.has(sender) || anonymousData.active.has(sender)) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { text: `❌ Lagi anonymous!\n\n.next - ganti partner\n.leave - keluar` },
                    { quoted: m }
                );
            }
            
            // Cari partner
            if (anonymousData.waiting.length > 0) {
                const partner = anonymousData.waiting.shift();
                
                // Connect
                anonymousData.users.set(sender, partner);
                anonymousData.users.set(partner, sender);
                anonymousData.active.set(sender, partner);
                anonymousData.active.set(partner, sender);
                
                // Notif
                const msg = `✅ *TERHUBUNG!*\n\nPartner ditemukan!\n\n💬 Mulai chat sekarang!\n\n⚡ Commands:\n.next - Ganti partner\n.leave - Keluar`;
                
                await bot.sendMessage(sender, { text: msg });
                await bot.sendMessage(partner, { text: msg });
                
            } else {
                // Masuk antrian
                anonymousData.waiting.push(sender);
                anonymousData.users.set(sender, null);
                
                await bot.sendMessage(
                    m.key.remoteJid,
                    { text: `⏳ *Nunggu partner...*\n\nTunggu sebentar ya!\n\n❌ .leave untuk batal` },
                    { quoted: m }
                );
            }
            
        } catch (err) {
            console.error("[ANON ERROR]", err);
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Gagal mulai anonymous." },
                { quoted: m }
            );
        }
    },
};