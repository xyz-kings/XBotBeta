const qrcode = require("qrcode");

module.exports = {
    command: ["qrgen", "qrcode", "generateqr"],
    category: "tools",
    description: "Buat QR code dari teks/link",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Cara pakai:* `.qrgen <teks/link>`\nContoh: `.qrgen https://google.com`"
                }, { quoted: m });
            }
            
            const text = args.join(" ");
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: "🎨 *Membuat QR Code...*"
            }, { quoted: m });
            
            const qrDataUrl = await qrcode.toDataURL(text, {
                width: 400,
                margin: 2
            });
            
            const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            await bot.sendMessage(m.key.remoteJid, {
                delete: loading.key
            });
            
            const caption = `✅ *QR Code Generated*\n\n📝 *Teks:* ${text.length > 50 ? text.substring(0, 50) + '...' : text}\n📏 *Panjang:* ${text.length} karakter\n🖼️ *Ukuran:* 400x400 px`;
            
            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: caption
            }, { quoted: m });
            
        } catch (err) {
            console.error("[QRGEN ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Gagal membuat QR code."
            }, { quoted: m });
        }
    }
};