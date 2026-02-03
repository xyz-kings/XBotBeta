const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['listprem', 'listpremium', 'daftarpremium'],
    description: 'Lihat daftar semua user premium',
    category: 'store',
    example: '.listprem',
    
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
        
        // Filter hanya user yang masih premium (expiry date masih valid)
        const now = new Date();
        const activePremiumUsers = [];
        const expiredPremiumUsers = [];
        
        Object.keys(premiumData).forEach(jid => {
            const user = premiumData[jid];
            if (user && user.isPremium) {
                const expiryDate = new Date(user.expiryDate);
                if (expiryDate > now) {
                    activePremiumUsers.push(user);
                } else {
                    expiredPremiumUsers.push(user);
                }
            }
        });
        
        // Urutkan berdasarkan expiry date (terdekat duluan)
        activePremiumUsers.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        expiredPremiumUsers.sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));
        
        // Format daftar premium aktif
        let activeList = '';
        if (activePremiumUsers.length > 0) {
            activeList = `🎯 *PREMIUM AKTIF (${activePremiumUsers.length})*\n\n`;
            
            activePremiumUsers.forEach((user, index) => {
                const expiryDate = new Date(user.expiryDate);
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                const expiryFormatted = expiryDate.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                const number = user.userId.split('@')[0];
                const displayName = user.userName || "💤";
                
                activeList += `${index + 1}. ${displayName}\n`;
                activeList += `   📞 ${number}\n`;
                activeList += `   ⏱️ ${daysLeft} hari lagi\n`;
                activeList += `   📅 ${expiryFormatted}\n`;
                activeList += `   💎 XCoin: ${user.remainingXcoin === "∞" ? "∞" : user.remainingXcoin}\n\n`;
            });
        } else {
            activeList = '📭 *Tidak ada user premium aktif*\n\n';
        }
        
        // Format daftar premium expired
        let expiredList = '';
        if (expiredPremiumUsers.length > 0) {
            expiredList = `⏰ *PREMIUM EXPIRED (${expiredPremiumUsers.length})*\n\n`;
            
            expiredPremiumUsers.forEach((user, index) => {
                const expiryDate = new Date(user.expiryDate);
                const daysAgo = Math.floor((now - expiryDate) / (1000 * 60 * 60 * 24));
                const expiryFormatted = expiryDate.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                const number = user.userId.split('@')[0];
                const displayName = user.userName || "💤";
                
                expiredList += `${index + 1}. ${displayName}\n`;
                expiredList += `   📞 ${number}\n`;
                expiredList += `   ⏰ ${daysAgo} hari yang lalu\n`;
                expiredList += `   📅 ${expiryFormatted}\n\n`;
            });
        } else {
            expiredList = '📭 *Tidak ada user premium expired*\n\n';
        }
        
        const message = `📊 *DAFTAR USER PREMIUM*\n\n` +
                       `👑 *Owner:* ${pushName}\n` +
                       `📅 *Tanggal:* ${now.toLocaleDateString('id-ID')}\n\n` +
                       `${activeList}` +
                       `${expiredList}` +
                       `ℹ️ *Total Premium Aktif:* ${activePremiumUsers.length}\n` +
                       `ℹ️ *Total Premium Expired:* ${expiredPremiumUsers.length}\n` +
                       `ℹ️ *Total Semua:* ${activePremiumUsers.length + expiredPremiumUsers.length}`;
        
        await bot.sendMessage(m.key.remoteJid, { 
            text: message
        }, { quoted: m });
    }
};