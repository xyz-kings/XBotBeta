const config = require("../../config.json");

module.exports = {
    command: ["start", "help", "menu"],
    category: "menfess",
    description: "Menu menfess",
    
    async execute(bot, m, args) {
        try {
            const text = `🎭 *MENFESS MENU*\n
🔹 *Anonymous Chat:*
.anonymous - Chat random sama orang
.next - Ganti partner
.leave - Keluar dari chat

🔹 *Kirim Confess:*
.confess 628xxx pesan - Kirim ke nomor
.menfess pesan - Kirim ke admin

🔹 *Contoh:*
.confess 6281234567890 aku suka kamu
.menfess aku sedih hari ini

🔹 *Rules:*
• No spam
• No SARA
• No porn
• Jaga sopan

🔒 *100% ANONYMOUS*
Gak ada yang tau siapa lo!`;
            
            await bot.sendMessage(
                m.key.remoteJid,
                { text: text },
                { quoted: m }
            );
            
        } catch (err) {
            console.error("[START ERROR]", err);
        }
    },
};