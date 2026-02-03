const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['delcoin', 'delxcoin', 'hapuscoin', 'removecoin'],
    description: 'Hapus XCoin user (reset ke 0)',
    category: 'store',
    example: '.delcoin @user\n.delcoin 628xxx\n.delcoin 08xxx\n.delcoin +1xxx\n.delcoin 1 (berdasarkan list)\n.delcoin all (reset semua)',
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
                      '• `.delcoin @user` (hapus via mention)\n' +
                      '• `.delcoin 6281234567890` (hapus via nomor)\n' +
                      '• `.delcoin 1` (hapus nomor 1 dari list XCoin)\n' +
                      '• `.delcoin all` (reset semua XCoin)\n\n' +
                      '💡 *Parameter:*\n' +
                      '1. Target user (@tag, nomor, atau angka dari list)'
            }, { quoted: m });
        }
        
        // Path ke database XCoin
        const rankPath = path.join(__dirname, '../../DataDase/game/user_rank.json');
        
        // Load database XCoin
        let rankData = {};
        if (fs.existsSync(rankPath)) {
            try {
                rankData = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
            } catch (error) {
                rankData = {};
            }
        }
        
        // Ambil input pertama
        const targetInput = args[0];
        
        // ===== FITUR: RESET SEMUA XCOIN =====
        if (targetInput.toLowerCase() === 'all') {
            // Konfirmasi dulu
            if (args[1] !== 'confirm') {
                const totalUsers = Object.keys(rankData).length;
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `⚠️ *PERINGATAN!*\n\n` +
                          `Anda akan mereset SEMUA XCoin user!\n` +
                          `📊 Total user: ${totalUsers}\n\n` +
                          `Untuk mengkonfirmasi, ketik:\n` +
                          `.delcoin all confirm\n\n` +
                          `⚠️ *Aksi ini tidak dapat dibatalkan!*`
                }, { quoted: m });
            }
            
            // Reset semua XCoin ke 0
            const resetCount = Object.keys(rankData).length;
            let totalXCoinReset = 0;
            
            Object.keys(rankData).forEach(jid => {
                const user = rankData[jid];
                totalXCoinReset += user.points || 0;
                rankData[jid] = {
                    ...user,
                    points: 0,
                    lastUpdate: new Date().toISOString()
                };
            });
            
            try {
                fs.writeFileSync(rankPath, JSON.stringify(rankData, null, 2), 'utf8');
                
                const message = `✅ *BERHASIL RESET SEMUA XCOIN*\n\n` +
                               `📊 *Statistik Reset:*\n` +
                               `├ Total user: ${resetCount}\n` +
                               `├ Total XCoin: ${totalXCoinReset}\n` +
                               `└ Semua direset ke: 0\n\n` +
                               `👑 *Reset by:* ${pushName}`;
                
                return await bot.sendMessage(m.key.remoteJid, { 
                    text: message
                }, { quoted: m });
                
            } catch (error) {
                console.error(error);
                return bot.sendMessage(m.key.remoteJid, { 
                    text: '❌ Gagal reset semua XCoin!\n' +
                          `Error: ${error.message}`
                }, { quoted: m });
            }
        }
        
        // ===== FITUR: HAPUS BERDASARKAN ANGKA DARI LIST =====
        if (/^\d+$/.test(targetInput)) {
            const listNumber = parseInt(targetInput);
            
            // Filter hanya user dengan XCoin > 0
            const usersWithCoins = Object.keys(rankData)
                .map(jid => {
                    const user = rankData[jid];
                    return {
                        jid,
                        name: user.userName || jid.split('@')[0],
                        xcoin: user.points || 0,
                        ...user
                    };
                })
                .filter(user => user.xcoin > 0)
                .sort((a, b) => b.xcoin - a.xcoin); // Urutkan dari tertinggi
            
            // Cek apakah nomor valid
            if (listNumber < 1 || listNumber > usersWithCoins.length) {
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `❌ Nomor ${listNumber} tidak valid!\n\n` +
                          `📊 Total user dengan XCoin: ${usersWithCoins.length}\n` +
                          `Gunakan angka 1 sampai ${usersWithCoins.length}`
                }, { quoted: m });
            }
            
            // Ambil user berdasarkan nomor list
            const targetUser = usersWithCoins[listNumber - 1];
            targetJid = targetUser.jid;
            targetName = targetUser.name;
            oldXCoin = targetUser.xcoin;
            
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
            
            // Cek apakah user ada di database XCoin
            if (!rankData[targetJid]) {
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `❌ User ${targetName} tidak memiliki XCoin!`
                }, { quoted: m });
            }
            
            // Ambil data sebelum dihapus
            const userData = rankData[targetJid];
            const userName = userData.userName || targetName;
            oldXCoin = userData.points || 0;
        }
        
        // Reset XCoin ke 0
        rankData[targetJid] = {
            ...rankData[targetJid],
            points: 0,
            lastUpdate: new Date().toISOString()
        };
        
        // Simpan perubahan
        try {
            fs.writeFileSync(rankPath, JSON.stringify(rankData, null, 2), 'utf8');
            
            // Update database premium jika user premium
            const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
            let isPremium = false;
            
            if (fs.existsSync(premiumPath)) {
                try {
                    const premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
                    const premiumUser = premiumData[targetJid];
                    
                    if (premiumUser && premiumUser.isPremium) {
                        isPremium = true;
                        // Reset XCoin di premium database
                        premiumData[targetJid] = {
                            ...premiumUser,
                            originalXcoin: "0",
                            remainingXcoin: "0"
                        };
                        
                        fs.writeFileSync(premiumPath, JSON.stringify(premiumData, null, 2), 'utf8');
                    }
                } catch (error) {
                    console.error('Error updating premium data:', error);
                }
            }
            
            const statusText = isPremium ? "Premium" : "Free";
            const message = `✅ *BERHASIL MENGHAPUS XCOIN*\n\n` +
                           `👤 *User:* ${targetName}\n` +
                           `📞 *Nomor:* ${targetJid.split('@')[0]}\n` +
                           `📊 *Status:* ${statusText}\n` +
                           `💎 *XCoin Sebelum:* ${oldXCoin}\n` +
                           `💎 *XCoin Sekarang:* 0\n` +
                           `👑 *Removed by:* ${pushName}`;
            
            await bot.sendMessage(m.key.remoteJid, { 
                text: message
            }, { quoted: m });
            
        } catch (error) {
            console.error(error);
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Gagal menghapus XCoin!\n' +
                      `Error: ${error.message}`
            }, { quoted: m });
        }
    }
};