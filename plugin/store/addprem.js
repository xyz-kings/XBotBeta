const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['addprem', 'addpremium', 'tambahpremium'],
    description: 'Tambahkan user ke premium',
    category: 'store',
    example: '.addprem @user 30\n.addprem 628xxx 7\n.addprem 08xxx 365\n.addprem +1xxx 90',
    ownerbotOnly: true, // hanya bot dan owner yang bisa gunakan
    
    execute: async (bot, m, args) => {
        const userId = m.key.participant || m.key.remoteJid;
        const pushName = m.pushName || userId.split('@')[0];
        
        // CEK APAKAH INI BOT/OWNER
        const config = require('../../config.json');
        const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
        
        if (!isOwner) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Command ini hanya untuk owner!'
            }, { quoted: m });
        }
        
        if (args.length < 2) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Format salah!\n\n' +
                      '📌 Contoh penggunaan:\n' +
                      '• `.addprem @user 30` (30 hari premium)\n' +
                      '• `.addprem 6281234567890 7` (7 hari premium)\n' +
                      '• `.addprem 081234567890 365` (1 tahun premium)\n' +
                      '• `.addprem +14155552671 90` (90 hari premium)\n\n' +
                      '💡 *Parameter:*\n' +
                      '1. Target user (@tag atau nomor)\n' +
                      '2. Jumlah hari (angka)'
            }, { quoted: m });
        }
        
        // Ambil target user dan hari
        const targetInput = args[0];
        const daysInput = parseInt(args[1]);
        
        if (isNaN(daysInput) || daysInput <= 0) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Jumlah hari harus angka positif!'
            }, { quoted: m });
        }
        
        let targetJid;
        let targetName;
        
        // Cek jika input adalah mention (@user)
        if (targetInput.includes('@') && m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            const mentionedJids = m.message.extendedTextMessage.contextInfo.mentionedJid;
            if (mentionedJids.length > 0) {
                targetJid = mentionedJids[0];
                targetName = m.message.extendedTextMessage.contextInfo.participant || targetJid.split('@')[0];
            }
        }
        
        // Jika bukan mention, coba parse sebagai nomor
        if (!targetJid) {
            try {
                // Bersihkan format nomor
                let phoneNumber = targetInput.replace(/[^0-9+]/g, '');
                
                // Handle format 08xxx -> 628xx
                if (phoneNumber.startsWith('08')) {
                    phoneNumber = '62' + phoneNumber.substring(1);
                }
                // Pastikan ada kode negara
                else if (phoneNumber.startsWith('0')) {
                    phoneNumber = '62' + phoneNumber.substring(1);
                }
                // Jika diawali dengan +, hilangkan +
                else if (phoneNumber.startsWith('+')) {
                    phoneNumber = phoneNumber.substring(1);
                }
                // Jika hanya angka dan panjangnya 10-15, anggap sebagai 62
                else if (/^\d{10,15}$/.test(phoneNumber) && !phoneNumber.startsWith('62')) {
                    phoneNumber = '62' + phoneNumber;
                }
                
                // Tambahkan @s.whatsapp.net untuk jid
                targetJid = phoneNumber + '@s.whatsapp.net';
                targetName = phoneNumber;
                
            } catch (error) {
                return bot.sendMessage(m.key.remoteJid, { 
                    text: '❌ Gagal memproses nomor!\n\n' +
                          'Format yang didukung:\n' +
                          '• 6281234567890\n' +
                          '• 081234567890\n' +
                          '• +14155552671 (luar negeri)'
                }, { quoted: m });
            }
        }
        
        // Validasi targetJid
        if (!targetJid || !targetJid.includes('@s.whatsapp.net')) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Format target tidak valid!'
            }, { quoted: m });
        }
        
        // Path ke database premium
        const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
        
        // Load atau buat database premium
        let premiumData = {};
        if (fs.existsSync(premiumPath)) {
            try {
                premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
            } catch (error) {
                premiumData = {};
            }
        }
        
        // Waktu sekarang
        const now = new Date();
        const purchaseDate = now.toISOString();
        
        // Hitung expiry date
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + daysInput);
        
        // Cek apakah user sudah premium
        const existingUser = premiumData[targetJid];
        let isRenewal = false;
        let previousExpiry = null;
        
        if (existingUser && existingUser.isPremium) {
            isRenewal = true;
            previousExpiry = existingUser.expiryDate;
            
            // Jika expiryDate lama masih lebih besar dari sekarang, tambahkan ke yang lama
            const oldExpiry = new Date(existingUser.expiryDate);
            if (oldExpiry > now) {
                expiryDate.setDate(oldExpiry.getDate() + daysInput);
            }
        }
        
        // Update atau buat data premium
        premiumData[targetJid] = {
            userId: targetJid,
            userName: targetName,
            isPremium: true,
            purchaseDate: purchaseDate,
            expiryDate: expiryDate.toISOString(),
            daysPurchased: daysInput,
            xcoinUsed: 0,
            originalXcoin: "0",
            remainingXcoin: "0",
            isRenewal: isRenewal,
            previousExpiry: previousExpiry,
            purchasedByOwner: true
        };
        
        // Simpan ke file
        try {
            fs.writeFileSync(premiumPath, JSON.stringify(premiumData, null, 2), 'utf8');
            
            // Format tanggal untuk display
            const expiryFormatted = expiryDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const message = `✅ *BERHASIL MENAMBAHKAN PREMIUM*\n\n` +
                           `👤 *User:* ${targetName}\n` +
                           `📞 *Nomor:* ${targetJid.split('@')[0]}\n` +
                           `⏱️ *Durasi:* ${daysInput} hari\n` +
                           `📅 *Expiry:* ${expiryFormatted}\n` +
                           `🔄 *Tipe:* ${isRenewal ? 'Perpanjangan' : 'Baru'}\n` +
                           `💎 *XCoin:* 0 (hanya premium)\n` +
                           `👑 *Added by:* ${pushName}`;
            
            await bot.sendMessage(m.key.remoteJid, { 
                text: message
            }, { quoted: m });
            
        } catch (error) {
            console.error(error);
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Gagal menyimpan data premium!\n' +
                      `Error: ${error.message}`
            }, { quoted: m });
        }
    }
};