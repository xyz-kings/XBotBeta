const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['xbuy', 'xcoinbuy'],
    description: 'Beli premium status dengan XCoin',
    category: 'store',
    example: '.xbuy status 9hari',
    
    execute: async (bot, m, args) => {
        const userId = m.key.participant || m.key.remoteJid;
        const pushName = m.pushName || userId.split('@')[0];
        
        // CEK APAKAH INI BOT OWNER
        const isBotOwner = m.key.fromMe; // Bot sendiri
        const config = require('../../config.json');
        const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
        
        // Cek argumen
        if (args.length < 2) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: `❌ Penggunaan salah!\n\n` +
                      `📌 Contoh: *.xbuy status 9hari*\n` +
                      `💎 1 hari = 5 XCoin\n` +
                      `💰 Cek XCoin mu: *.myxcoin*`
            }, { quoted: m });
        }
        
        if (args[0].toLowerCase() !== 'status') {
            return bot.sendMessage(m.key.remoteJid, { 
                text: `❌ Hanya tersedia untuk beli status premium!\n` +
                      `Gunakan: *.xbuy status <hari>*`
            }, { quoted: m });
        }
        
        // Parse jumlah hari
        const daysInput = args[1].toLowerCase();
        let days = 0;
        
        if (daysInput.includes('hari')) {
            days = parseInt(daysInput.replace('hari', '').trim());
        } else {
            days = parseInt(daysInput);
        }
        
        if (isNaN(days) || days < 1 || days > 365) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: `❌ Jumlah hari tidak valid!\n` +
                      `Minimal 1 hari, maksimal 365 hari.\n` +
                      `Contoh: .xbuy status 7hari`
            }, { quoted: m });
        }
        
        // Hitung total XCoin yang dibutuhkan
        const XCOIN_PER_DAY = 5;
        const totalXCoinNeeded = days * XCOIN_PER_DAY;
        
        // Path ke database - FIXED PATH
        const rankPath = path.join(__dirname, '../../DataDase/game/user_rank.json');
        const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
        
        // Buat folder database jika belum ada
        const dbDir = path.join(__dirname, '../../DataDase');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        
        const gameDir = path.join(dbDir, 'game');
        if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });
        
        // Load atau buat file user_rank.json
        let rankData = {};
        if (fs.existsSync(rankPath)) {
            try {
                const rawData = fs.readFileSync(rankPath, 'utf8');
                rankData = JSON.parse(rawData);
            } catch (error) {
                console.error('❌ Error parsing user_rank.json:', error);
                rankData = {};
            }
        } else {
            // Buat file kosong jika tidak ada
            fs.writeFileSync(rankPath, JSON.stringify({}, null, 2));
        }
        
        // ===== SPECIAL HANDLING UNTUK BOT OWNER =====
        // Bot owner bisa beli tanpa mengurangi XCoin
        let shouldDeductXCoin = true;
        let currentXCoin = 0;
        
        if (isBotOwner || isOwner) {
            shouldDeductXCoin = false;
            console.log(`👑 Owner/bot membeli premium tanpa mengurangi XCoin`);
        }
        
        // Cek apakah user ada di database rank (untuk non-owner)
        if (shouldDeductXCoin) {
            if (!rankData[userId]) {
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `❌ Kamu belum memiliki XCoin!\n` +
                          `💡 Main game dulu untuk dapatkan XCoin.`
                }, { quoted: m });
            }
            
            const userRank = rankData[userId];
            currentXCoin = userRank.points || 0;
            
            // Cek apakah XCoin cukup
            if (currentXCoin < totalXCoinNeeded) {
                const needed = totalXCoinNeeded - currentXCoin;
                return bot.sendMessage(m.key.remoteJid, { 
                    text: `❌ XCoin tidak cukup!\n\n` +
                          `💰 XCoin kamu: ${currentXCoin}\n` +
                          `💎 Dibutuhkan: ${totalXCoinNeeded} (${days} hari × ${XCOIN_PER_DAY})\n` +
                          `📉 Kurang: ${needed} XCoin\n\n` +
                          `💡 Main game lagi untuk dapatkan XCoin!`
                }, { quoted: m });
            }
            
            // Kurangi XCoin untuk non-owner
            userRank.points = currentXCoin - totalXCoinNeeded;
            
            // Simpan perubahan ke user_rank.json
            fs.writeFileSync(rankPath, JSON.stringify(rankData, null, 2));
        }
        
        // Load atau buat file premium.json
        let premiumData = {};
        if (fs.existsSync(premiumPath)) {
            try {
                const rawData = fs.readFileSync(premiumPath, 'utf8');
                premiumData = JSON.parse(rawData);
            } catch (error) {
                console.error('❌ Error parsing premium.json:', error);
                premiumData = {};
            }
        } else {
            // Buat file kosong jika tidak ada
            fs.writeFileSync(premiumPath, JSON.stringify({}, null, 2));
        }
        
        // Hitung tanggal expired
        const now = new Date();
        const expiryDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // Cek apakah user sudah punya premium sebelumnya
        let isRenewal = false;
        let existingExpiry = null;
        
        if (premiumData[userId] && premiumData[userId].isPremium && premiumData[userId].expiryDate) {
            const existing = new Date(premiumData[userId].expiryDate);
            if (existing > now) {
                isRenewal = true;
                existingExpiry = existing;
                // Tambah waktu ke expiry yang sudah ada
                expiryDate.setTime(existing.getTime() + (days * 24 * 60 * 60 * 1000));
            }
        }
        
        // Update premium data
        premiumData[userId] = {
            userId: userId,
            userName: pushName,
            isPremium: true,
            purchaseDate: now.toISOString(),
            expiryDate: expiryDate.toISOString(),
            daysPurchased: days,
            xcoinUsed: shouldDeductXCoin ? totalXCoinNeeded : 0, // 0 untuk owner
            originalXcoin: shouldDeductXCoin ? currentXCoin : '∞', // ∞ untuk owner
            remainingXcoin: shouldDeductXCoin ? (currentXCoin - totalXCoinNeeded) : '∞',
            isRenewal: isRenewal,
            previousExpiry: isRenewal ? existingExpiry?.toISOString() : null,
            purchasedByOwner: isBotOwner || isOwner
        };
        
        // Simpan premium data
        fs.writeFileSync(premiumPath, JSON.stringify(premiumData, null, 2));
        
        // Format waktu tersisa
        const timeDiff = expiryDate - now;
        const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        // Kirim konfirmasi berhasil
        let successMessage = `✅ *PEMBELIAN BERHASIL!*\n\n`;
        
        if (isBotOwner) {
            successMessage += `👑 *Bot Owner membeli premium!*\n`;
        } else if (isOwner) {
            successMessage += `👑 *Owner membeli premium!*\n`;
        }
        
        successMessage += `👤 *Pembeli:* ${pushName}\n`;
        
        if (isRenewal) {
            successMessage += `🔄 *Status:* Perpanjangan Premium\n`;
        } else {
            successMessage += `🆕 *Status:* Premium Baru\n`;
        }
        
        successMessage += `💎 *Paket:* ${days} hari Dark VVIP\n`;
        
        if (shouldDeductXCoin) {
            successMessage += `💰 *Harga:* ${totalXCoinNeeded} XCoin\n`;
            successMessage += `📊 *Sisa XCoin:* ${currentXCoin - totalXCoinNeeded}\n`;
        } else {
            successMessage += `💰 *Harga:* GRATIS (Owner)\n`;
            successMessage += `📊 *Sisa XCoin:* ∞ (Unlimited)\n`;
        }
        
        successMessage += `⏳ *Expiry:* ${expiryDate.toLocaleDateString('id-ID')}\n`;
        successMessage += `⌛ *Tersisa:* ${daysLeft}d ${hoursLeft}h ${minutesLeft}m\n\n`;
        
        if (isBotOwner || isOwner) {
            successMessage += `🎉 *Status kamu sekarang: VVIP + Dark VVIP ${daysLeft}d ${hoursLeft}h ${minutesLeft}m*\n`;
        } else {
            successMessage += `🎉 *Status kamu sekarang: Dark VVIP ${daysLeft}d ${hoursLeft}h ${minutesLeft}m*\n`;
        }
        
        successMessage += `✨ Nikmati fitur premium selama ${days} hari!`;
        
        await bot.sendMessage(m.key.remoteJid, { 
            text: successMessage
        }, { quoted: m });
    }
};