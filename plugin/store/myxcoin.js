const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['myxcoin', 'cekxcoin', 'xcoin'],
    description: 'Cek jumlah XCoin kamu',
    category: 'store',
    example: '.myxcoin',
    
    execute: async (bot, m, args) => {
        const userId = m.key.participant || m.key.remoteJid;
        const pushName = m.pushName || userId.split('@')[0];
        
        // CEK APAKAH INI BOT/OWNER
        const config = require('../../config.json');
        const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
        
        const rankPath = path.join(__dirname, '../../DataDase/game/user_rank.json');
        
        // Untuk owner/bot, tampilkan unlimited
        if (isOwner) {
            // Cek premium status untuk owner
            const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
            let premiumInfo = "";
            
            if (fs.existsSync(premiumPath)) {
                try {
                    const premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
                    const premiumUser = premiumData[userId];
                    
                    if (premiumUser && premiumUser.isPremium && premiumUser.expiryDate) {
                        const expiry = new Date(premiumUser.expiryDate);
                        const now = new Date();
                        
                        if (expiry > now) {
                            const timeDiff = expiry - now;
                            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                            
                            premiumInfo = `⏳ *Premium Expiry:* ${days}d ${hours}h ${minutes}m\n`;
                        }
                    }
                } catch (error) {}
            }
            
            const message = `💰 *XCOIN INFO*\n\n` +
                           `👤 *User:* ${pushName}\n` +
                           `🎯 *Status:* VVIP (Owner)\n` +
                           `${premiumInfo}` +
                           `💎 *XCoin:* ∞ (Unlimited)\n\n` +
                           `🎮 *Owner Special:*\n` +
                           `• XCoin unlimited\n` +
                           `• Bisa beli premium gratis\n` +
                           `• Status VVIP permanen\n\n` +
                           `💡 *Info Premium:*\n` +
                           `1 hari = 5 XCoin\n` +
                           `Gunakan: *.xbuy status <hari>*`;
            
            return bot.sendMessage(m.key.remoteJid, { 
                text: message
            }, { quoted: m });
        }
        
        // Untuk user biasa, load dari database
        let rankData = {};
        if (fs.existsSync(rankPath)) {
            try {
                rankData = JSON.parse(fs.readFileSync(rankPath, 'utf8'));
            } catch (error) {
                rankData = {};
            }
        }
        
        // Cek apakah user ada di database
        if (!rankData[userId]) {
            return bot.sendMessage(m.key.remoteJid, { 
                text: `❌ Kamu belum memiliki XCoin!\n\n` +
                      `💡 Main game untuk dapatkan XCoin.\n` +
                      `💰 1 kemenangan = 1 XCoin\n\n` +
                      `🎮 Mulai game dengan: *.game tebakgambar*`
            }, { quoted: m });
        }
        
        const userRank = rankData[userId];
        const xcoin = userRank.points || 0;
        
        // Cek premium status
        const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
        let premiumStatus = "Free";
        let expiryInfo = "";
        
        if (fs.existsSync(premiumPath)) {
            try {
                const premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
                const premiumUser = premiumData[userId];
                
                if (premiumUser && premiumUser.isPremium && premiumUser.expiryDate) {
                    const expiry = new Date(premiumUser.expiryDate);
                    const now = new Date();
                    
                    if (expiry > now) {
                        const timeDiff = expiry - now;
                        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        
                        premiumStatus = "Dark VVIP";
                        expiryInfo = `⏳ *Expiry:* ${days}d ${hours}h ${minutes}m`;
                    }
                }
            } catch (error) {}
        }
        
        // Format pesan
        const message = `💰 *XCOIN INFO*\n\n` +
                       `👤 *User:* ${pushName}\n` +
                       `🎯 *Status:* ${premiumStatus}\n` +
                       `${expiryInfo}\n` +
                       `💎 *XCoin:* ${xcoin}\n\n` +
                       `📊 *Game Stats:*\n` +
                       `├ Total Games: ${userRank.totalGames || 0}\n` +
                       `├ Games Won: ${userRank.gamesWon || 0}\n` +
                       `├ Games Lost: ${userRank.gamesLost || 0}\n` +
                       `└ Win Rate: ${userRank.winRate || 0}%\n\n` +
                       `💡 *Info Premium:*\n` +
                       `1 hari = 5 XCoin\n` +
                       `Gunakan: *.xbuy status <hari>*`;
        
        await bot.sendMessage(m.key.remoteJid, { 
            text: message
        }, { quoted: m });
    }
};