const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['addcoin', 'addxcoin', 'tambahcoin'],
    description: 'Tambahkan XCoin ke user',
    category: 'store',
    example: '.addcoin @user 100\n.addcoin 628xxx 500\n.addcoin 08xxx 1000\n.addcoin +1xxx 50',
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
                      '• `.addcoin @user 100` (100 XCoin)\n' +
                      '• `.addcoin 6281234567890 500` (500 XCoin)\n' +
                      '• `.addcoin 081234567890 1000` (1000 XCoin)\n' +
                      '• `.addcoin +14155552671 50` (50 XCoin)\n\n' +
                      '💡 *Parameter:*\n' +
                      '1. Target user (@tag atau nomor)\n' +
                      '2. Jumlah XCoin (angka)'
            }, { quoted: m });
        }
        
        // Ambil target user dan jumlah XCoin
        const targetInput = args[0];
        const coinAmount = parseInt(args[1]);
        
        if (isNaN(coinAmount) || coinAmount <= 0) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Jumlah XCoin harus angka positif!'
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
        
        // Path ke database XCoin
        const rankPath = path.join(__dirname, '../../DataDase/game/user_rank.json');
        
        // Load atau buat database XCoin
        let rankData = {};
        if (fs.existsSync(rankPath)) {
            try {
                rankData = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
            } catch (error) {
                rankData = {};
            }
        }
        
        // Cek apakah user sudah ada di database XCoin
        const existingRank = rankData[targetJid];
        let currentXCoin = 0;
        
        if (existingRank) {
            // Tambahkan XCoin ke jumlah yang ada
            const currentPoints = existingRank.points || 0;
            currentXCoin = currentPoints + coinAmount;
            rankData[targetJid] = {
                ...existingRank,
                points: currentXCoin,
                lastUpdate: new Date().toISOString()
            };
        } else {
            // Buat data baru untuk user
            currentXCoin = coinAmount;
            rankData[targetJid] = {
                userId: targetJid,
                userName: targetName,
                points: coinAmount,
                totalGames: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
                lastUpdate: new Date().toISOString(),
                createdDate: new Date().toISOString()
            };
        }
        
        // Simpan ke file XCoin
        try {
            fs.writeFileSync(rankPath, JSON.stringify(rankData, null, 2), 'utf8');
            
            // Update XCoin di database premium jika user premium
            const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
            let isPremium = false;
            
            if (fs.existsSync(premiumPath)) {
                try {
                    const premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
                    const premiumUser = premiumData[targetJid];
                    
                    if (premiumUser && premiumUser.isPremium) {
                        isPremium = true;
                        // Update XCoin di premium database
                        const currentRemaining = parseInt(premiumUser.remainingXcoin) || 0;
                        const currentOriginal = parseInt(premiumUser.originalXcoin) || 0;
                        
                        premiumData[targetJid] = {
                            ...premiumUser,
                            originalXcoin: (currentOriginal + coinAmount).toString(),
                            remainingXcoin: (currentRemaining + coinAmount).toString()
                        };
                        
                        fs.writeFileSync(premiumPath, JSON.stringify(premiumData, null, 2), 'utf8');
                    }
                } catch (error) {
                    console.error('Error updating premium data:', error);
                }
            }
            
            const statusText = isPremium ? "Premium" : "Free";
            const message = `✅ *BERHASIL MENAMBAHKAN XCOIN*\n\n` +
                           `👤 *User:* ${targetName}\n` +
                           `📞 *Nomor:* ${targetJid.split('@')[0]}\n` +
                           `📊 *Status:* ${statusText}\n` +
                           `💰 *XCoin Ditambah:* ${coinAmount}\n` +
                           `💎 *XCoin Sekarang:* ${currentXCoin}\n` +
                           `👑 *Added by:* ${pushName}`;
            
            await bot.sendMessage(m.key.remoteJid, { 
                text: message
            }, { quoted: m });
            
        } catch (error) {
            console.error(error);
            return bot.sendMessage(m.key.remoteJid, { 
                text: '❌ Gagal menyimpan data XCoin!\n' +
                      `Error: ${error.message}`
            }, { quoted: m });
        }
    }
};