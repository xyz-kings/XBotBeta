const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['listcoin', 'listxcoin', 'daftarcoin', 'topcoin'],
    description: 'Lihat daftar user dengan XCoin tertinggi',
    category: 'store',
    example: '.listcoin\n.listcoin 10 (top 10 saja)',
    
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
        
        // Convert object ke array dan filter yang memiliki XCoin > 0
        const usersWithCoins = Object.keys(rankData)
            .map(jid => {
                const user = rankData[jid];
                return {
                    jid,
                    name: user.userName || jid.split('@')[0],
                    xcoin: user.points || 0,
                    games: user.totalGames || 0,
                    wins: user.gamesWon || 0,
                    winRate: user.winRate || 0,
                    lastUpdate: user.lastUpdate || new Date().toISOString()
                };
            })
            .filter(user => user.xcoin > 0)
            .sort((a, b) => b.xcoin - a.xcoin); // Urutkan dari tertinggi ke terendah
        
        // Ambil jumlah user yang ditampilkan (default 20, bisa diatur dengan args)
        const limit = args[0] ? parseInt(args[0]) : 20;
        const topUsers = usersWithCoins.slice(0, limit);
        
        // Cek database premium untuk status
        const premiumPath = path.join(__dirname, '../../DataDase/users_premium.json');
        let premiumData = {};
        if (fs.existsSync(premiumPath)) {
            try {
                premiumData = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
            } catch (error) {
                premiumData = {};
            }
        }
        
        // Format daftar top XCoin
        let coinList = '';
        if (topUsers.length > 0) {
            coinList = `🏆 *TOP ${Math.min(topUsers.length, limit)} XCOIN*\n\n`;
            
            topUsers.forEach((user, index) => {
                const isPremium = premiumData[user.jid] && premiumData[user.jid].isPremium;
                const status = isPremium ? '🌟' : '🔹';
                const number = user.jid.split('@')[0];
                const displayName = user.name || "💤";
                
                coinList += `${status} *${index + 1}. ${displayName}*\n`;
                coinList += `   📞 ${number}\n`;
                coinList += `   💎 XCoin: ${user.xcoin}\n`;
                
                if (user.games > 0) {
                    coinList += `   🎮 Games: ${user.games} (${user.wins}W - ${user.winRate}%)\n`;
                }
                
                if (isPremium) {
                    const premiumUser = premiumData[user.jid];
                    const expiryDate = new Date(premiumUser.expiryDate);
                    const now = new Date();
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    coinList += `   ⏱️ Premium: ${daysLeft} hari lagi\n`;
                }
                
                coinList += '\n';
            });
        } else {
            coinList = '📭 *Tidak ada user dengan XCoin*\n\n';
        }
        
        // Hitung total XCoin semua user
        const totalXCoin = usersWithCoins.reduce((sum, user) => sum + user.xcoin, 0);
        
        // Hitung statistik
        const usersWith1000Plus = usersWithCoins.filter(u => u.xcoin >= 1000).length;
        const usersWith500Plus = usersWithCoins.filter(u => u.xcoin >= 500).length;
        const usersWith100Plus = usersWithCoins.filter(u => u.xcoin >= 100).length;
        
        const message = `💰 *DAFTAR USER XCOIN*\n\n` +
                       `👑 *Owner:* ${pushName}\n` +
                       `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID')}\n\n` +
                       `${coinList}` +
                       `📊 *STATISTIK XCOIN*\n` +
                       `├ Total User: ${usersWithCoins.length}\n` +
                       `├ Total XCoin: ${totalXCoin}\n` +
                       `├ 1000+ XCoin: ${usersWith1000Plus} user\n` +
                       `├ 500+ XCoin: ${usersWith500Plus} user\n` +
                       `└ 100+ XCoin: ${usersWith100Plus} user`;
        
        await bot.sendMessage(m.key.remoteJid, { 
            text: message
        }, { quoted: m });
    }
};