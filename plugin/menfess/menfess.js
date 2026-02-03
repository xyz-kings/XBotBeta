const config = require("../../config.json");

// Data admin (GANTI DENGAN NOMOR LU!)
const ADMIN_NOMOR = ["628xxxxxxxxxx"]; // GANTI INI!

// Data menfess sendiri
const menfessList = [];

module.exports = {
    command: ["menfess", "mf", "curhat"],
    category: "menfess",
    description: "Kirim menfess ke admin",
    
    async execute(bot, m, args) {
        try {
            if (args.length === 0) {
                return bot.sendMessage(
                    m.key.remoteJid,
                    { 
                        text: `📝 *KIRIM MENFESS*\n\nGunakan: .menfess <pesan>\n\nContoh:\n.menfess aku sedih hari ini\n.menfess ada yang mau curhat`
                    },
                    { quoted: m }
                );
            }
            
            const sender = m.key.participant || m.key.from || m.key.remoteJid;
            const pesan = args.join(" ");
            
            // ID menfess
            const mfId = 'MF' + Date.now().toString().slice(-6);
            
            // Format buat admin
            const adminMsg = `📨 *MENFESS BARU*\n\nID: ${mfId}\n\nPesan: "${pesan}"\n\nWaktu: ${new Date().toLocaleTimeString('id-ID')}`;
            
            // Kirim ke admin
            let terkirim = 0;
            
            for (const nomor of ADMIN_NOMOR) {
                try {
                    let adminJid = nomor;
                    
                    if (nomor.startsWith('0')) {
                        adminJid = '62' + nomor.slice(1) + '@s.whatsapp.net';
                    } else if (!nomor.includes('@')) {
                        adminJid = nomor + '@s.whatsapp.net';
                    }
                    
                    await bot.sendMessage(adminJid, { text: adminMsg });
                    terkirim++;
                    
                } catch (e) {
                    console.log(`Gagal ke admin ${nomor}:`, e.message);
                }
            }
            
            // Simpen
            menfessList.push({
                id: mfId,
                sender: sender,
                pesan: pesan,
                waktu: new Date().toISOString()
            });
            
            // Konfirmasi
            if (terkirim > 0) {
                await bot.sendMessage(
                    m.key.remoteJid,
                    { 
                        text: `✅ Menfess terkirim ke ${terkirim} admin!\n\nID: ${mfId}\nPesan: "${pesan}"\n\n🔄 Nunggu balasan ya`
                    },
                    { quoted: m }
                );
            } else {
                await bot.sendMessage(
                    m.key.remoteJid,
                    { 
                        text: "❌ Admin lagi offline.\nCoba lagi nanti."
                    },
                    { quoted: m }
                );
            }
            
        } catch (err) {
            console.error("[MENFESS ERROR]", err);
            await bot.sendMessage(
                m.key.remoteJid,
                { text: "❌ Gagal kirim menfess." },
                { quoted: m }
            );
        }
    },
};