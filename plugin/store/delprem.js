const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['delprem', 'delpremium', 'hapuspremium', 'removeprem'],
    description: 'Hapus status premium user',
    category: 'store',
    example: '.delprem @user\n.delprem 628xxx\n.delprem 08xxx\n.delprem +1xxx\n.delprem 1 (berdasarkan list)\n.delprem all (hapus semua)',
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
        
        if (args.length < 1) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Format salah!\n\n' +
                      '📌 Contoh penggunaan:\n' +
                      '• `.delprem @user` (hapus via mention)\n' +
                      '• `.delprem 6281234567890` (hapus via nomor)\n' +
                      '• `.delprem 1` (hapus nomor 1 dari list premium)\n' +
                      '• `.delprem all` (hapus semua premium)\n\n' +
                      '💡 *Parameter:*\n' +
                      '1. Target user (@tag, nomor, atau angka dari list)'
            }, { quoted: m });
        }
        
        // Path ke database premium
        const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
        
        // Load database premium
        let premiumData = {};
        if (fs.existsSync(premiumPath)) {
            try {
                premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
            } catch (error) {
                premiumData = {};
            }
        }
        
        // Ambil input pertama
        const targetInput = args[0];
        
        // ===== FITUR: HAPUS SEMUA PREMIUM =====
        if (targetInput.toLowerCase() === 'all') {
            // Konfirmasi dulu
            if (args[1] !== 'confirm') {
                const totalPremium = Object.keys(premiumData).length;
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `⚠️ *PERINGATAN!*\n\n` +
                          `Anda akan menghapus SEMUA user premium!\n` +
                          `📊 Total user: ${totalPremium}\n\n` +
                          `Untuk mengkonfirmasi, ketik:\n` +
                          `.delprem all confirm\n\n` +
                          `⚠️ *Aksi ini tidak dapat dibatalkan!*`
                }, { quoted: m });
            }
            
            // Hapus semua premium
            const deletedCount = Object.keys(premiumData).length;
            premiumData = {}; // Reset semua data
            
            try {
                fs.writeFileSync(premiumPath, JSON.stringify(premiumData, null, 2), 'utf8');
                
                const message = `✅ *BERHASIL MENGHAPUS SEMUA PREMIUM*\n\n` +
                               `🗑️ *Total dihapus:* ${deletedCount} user\n` +
                               `👑 *Removed by:* ${pushName}\n\n` +
                               `📊 *Status sekarang:*\n` +
                               `• Premium database kosong\n` +
                               `• Semua user kembali ke status free`;
                
                return await bot.sendMessage(m.key.remoteJid, { 
                    text: message
                }, { quoted: m });
                
            } catch (error) {
                console.error(error);
                return bot.sendMessage(m.key.remoteJid, { 
                    text: '❌ Gagal menghapus semua premium!\n' +
                          `Error: ${error.message}`
                }, { quoted: m });
            }
        }
        
        // ===== FITUR: HAPUS BERDASARKAN ANGKA DARI LIST =====
        if (/^\d+$/.test(targetInput)) {
            const listNumber = parseInt(targetInput);
            
            // Filter hanya user premium aktif
            const now = new Date();
            const activePremiumUsers = [];
            
            Object.keys(premiumData).forEach(jid => {
                const user = premiumData[jid];
                if (user && user.isPremium) {
                    const expiryDate = new Date(user.expiryDate);
                    if (expiryDate > now) {
                        activePremiumUsers.push({
                            jid: jid,
                            ...user
                        });
                    }
                }
            });
            
            // Urutkan berdasarkan expiry date
            activePremiumUsers.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            
            // Cek apakah nomor valid
            if (listNumber < 1 || listNumber > activePremiumUsers.length) {
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `❌ Nomor ${listNumber} tidak valid!\n\n` +
                          `📊 Total premium aktif: ${activePremiumUsers.length}\n` +
                          `Gunakan angka 1 sampai ${activePremiumUsers.length}`
                }, { quoted: m });
            }
            
            // Ambil user berdasarkan nomor list
            const targetUser = activePremiumUsers[listNumber - 1];
            targetJid = targetUser.jid;
            targetName = targetUser.userName || targetUser.userId.split('@')[0];
            
        } else {
            // ===== FITUR: HAPUS BERDASARKAN MENTION ATAU NOMOR =====
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
        }
        
        // Cek apakah user ada di database premium
        if (!premiumData[targetJid]) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: `❌ User ${targetName} tidak memiliki status premium!`
            }, { quoted: m });
        }
        
        // Ambil data sebelum dihapus
        const userData = premiumData[targetJid];
        const userName = userData.userName || targetName;
        const expiryDate = new Date(userData.expiryDate);
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // Hapus user dari database premium
        delete premiumData[targetJid];
        
        // Simpan perubahan
        try {
            fs.writeFileSync(premiumPath, JSON.stringify(premiumData, null, 2), 'utf8');
            
            const message = `✅ *BERHASIL MENGHAPUS PREMIUM*\n\n` +
                           `👤 *User:* ${userName}\n` +
                           `📞 *Nomor:* ${targetJid.split('@')[0]}\n` +
                           `⏱️ *Sisa waktu:* ${daysLeft} hari\n` +
                           `📅 *Expiry:* ${expiryDate.toLocaleDateString('id-ID')}\n` +
                           `👑 *Removed by:* ${pushName}\n\n` +
                           `🗑️ *Data yang dihapus:*\n` +
                           `• Status Premium\n` +
                           `• Expiry Date\n` +
                           `• Premium Data`;
            
            await bot.sendMessage(m.key.remoteJid, { 
                text: message
            }, { quoted: m });
            
        } catch (error) {
            console.error(error);
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Gagal menghapus data premium!\n' +
                      `Error: ${error.message}`
            }, { quoted: m });
        }
    }
};