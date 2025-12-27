const fs = require('fs').promises;
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Path database
const userRankPath = path.join(__dirname, '../../DataDase/game/user_rank.json');
const banDataPath = path.join(__dirname, '../../DataDase/game/ban.json');

module.exports = {
    command: ['devgame'], // PERBAIKAN: Tanda kutip ditutup dengan benar
    hidden: true, // Command tersembunyi
    ownerOnly: true, // Hanya owner yang bisa akses
    limit: true,
    tags: 'tools',
    description: 'Developer tools untuk manajemen game',
    
    // Baca data ban
    async readBanData() {
        try {
            await fs.mkdir(path.dirname(banDataPath), { recursive: true });
            const data = await fs.readFile(banDataPath, 'utf8');
            if (!data.trim()) return {};
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    },
    
    // Tulis data ban
    async writeBanData(data) {
        try {
            await fs.mkdir(path.dirname(banDataPath), { recursive: true });
            await fs.writeFile(banDataPath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('[DEVGAME] Error writing ban data:', error);
            return false;
        }
    },
    
    // Baca data user rank
    async readUserRank() {
        try {
            await fs.mkdir(path.dirname(userRankPath), { recursive: true });
            const data = await fs.readFile(userRankPath, 'utf8');
            if (!data.trim()) return {};
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    },
    
    // Tulis data user rank
    async writeUserRank(data) {
        try {
            await fs.mkdir(path.dirname(userRankPath), { recursive: true });
            await fs.writeFile(userRankPath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('[DEVGAME] Error writing user rank:', error);
            return false;
        }
    },
    
    // Fungsi untuk melihat statistik game
    async getGameStats() {
        try {
            const banData = await this.readBanData();
            const userRank = await this.readUserRank();
            
            const totalUsers = Object.keys(userRank).length;
            const bannedUsers = Object.keys(banData).length;
            
            // Hitung total poin semua user
            let totalPoints = 0;
            let activeUsers = 0;
            let topUsers = [];
            
            for (const userId in userRank) {
                if (userRank[userId] && userRank[userId].points) {
                    totalPoints += userRank[userId].points || 0;
                    activeUsers++;
                    
                    // Kumpulkan data untuk top users
                    topUsers.push({
                        userId: userId,
                        name: userRank[userId].userName || userId.split('@')[0],
                        points: userRank[userId].points || 0,
                        rank: userRank[userId].rank || '🐣 Pemula'
                    });
                }
            }
            
            // Urutkan berdasarkan poin
            topUsers.sort((a, b) => b.points - a.points);
            
            return {
                totalUsers,
                activeUsers,
                bannedUsers,
                totalPoints,
                topUsers: topUsers.slice(0, 5)
            };
            
        } catch (error) {
            console.error('[DEVGAME] Error getting game stats:', error);
            return null;
        }
    },
    
    // Fungsi untuk reset data user
    async resetUserData(userId) {
        try {
            const userRank = await this.readUserRank();
            
            if (!userRank[userId]) {
                return {
                    success: false,
                    message: `❌ User ${userId.split('@')[0]} tidak ditemukan di database.`
                };
            }
            
            const oldData = userRank[userId];
            
            // Reset data user (tapi jangan hapus total)
            userRank[userId] = {
                ...userRank[userId],
                wrongCount: 0,
                isBanned: false,
                banUntil: null,
                winStreak: 0
            };
            
            await this.writeUserRank(userRank);
            
            return {
                success: true,
                message: `✅ Data @${userId.split('@')[0]} berhasil direset!\n\n📊 Sebelum:\n• Wrong Count: ${oldData.wrongCount || 0}\n• Banned: ${oldData.isBanned ? 'Ya' : 'Tidak'}\n• Win Streak: ${oldData.winStreak || 0}\n\n📊 Sesudah:\n• Wrong Count: 0\n• Banned: Tidak\n• Win Streak: 0`,
                oldData: oldData,
                newData: userRank[userId]
            };
            
        } catch (error) {
            console.error('[DEVGAME] Error resetting user data:', error);
            return {
                success: false,
                message: `❌ Error: ${error.message}`
            };
        }
    },
    
    async execute(bot, m, args) {
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        
        // Cek apakah owner
        const isOwner = config.ownerNumber?.includes(senderId) || m.key.fromMe;
        
        if (!isOwner) {
            return await bot.sendMessage(chatId, {
                text: `⛔ Fitur ini hanya untuk developer/owner bot.`
            });
        }
        
        // Jika tidak ada argumen, tampilkan menu
        if (args.length === 0) {
            const menuText = `🔧 *DEVELOPER GAME TOOLS*\n\n` +
                            `*Stats & Info:*\n` +
                            `• ${config.prefix}devgame stats - Lihat statistik game\n` +
                            `• ${config.prefix}devgame active - Cek game aktif\n` +
                            `• ${config.prefix}devgame users - Lihat total users\n\n` +
                            
                            `*User Management:*\n` +
                            `• ${config.prefix}devgame reset @user - Reset data user\n` +
                            `• ${config.prefix}devgame banlist - Lihat daftar ban\n` +
                            `• ${config.prefix}devgame unban @user - Unban user\n\n` +
                            
                            `*System:*\n` +
                            `• ${config.prefix}devgame cleanup - Cleanup data expired\n` +
                            `• ${config.prefix}devgame reload - Reload game handlers\n` +
                            `• ${config.prefix}devgame backup - Buat backup data\n\n` +
                            
                            `📝 *Note:* Semua command untuk maintenance system game.`;
            
            return await bot.sendMessage(chatId, {
                text: menuText
            });
        }
        
        const action = args[0].toLowerCase();
        
        // Handle "devgame stats"
        if (action === 'stats') {
            const stats = await this.getGameStats();
            
            if (!stats) {
                return await bot.sendMessage(chatId, {
                    text: `❌ Gagal mengambil statistik game.`
                });
            }
            
            let statsText = `📊 *GAME STATISTICS*\n\n`;
            statsText += `👥 *Users:*\n`;
            statsText += `┣ Total Terdaftar: ${stats.totalUsers}\n`;
            statsText += `┣ Active Players: ${stats.activeUsers}\n`;
            statsText += `┗ Banned Users: ${stats.bannedUsers}\n\n`;
            
            statsText += `🎮 *Game Stats:*\n`;
            statsText += `┣ Total Points: ${stats.totalPoints}\n`;
            statsText += `┣ Avg Points/User: ${stats.activeUsers > 0 ? Math.round(stats.totalPoints / stats.activeUsers) : 0}\n`;
            statsText += `┗ Active Games: ${gameManager.activeGames.size}\n\n`;
            
            statsText += `🏆 *TOP 5 PLAYERS:*\n`;
            if (stats.topUsers.length > 0) {
                stats.topUsers.forEach((user, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    statsText += `${medal} @${user.name}\n`;
                    statsText += `  ⭐ ${user.points} poin | ${user.rank}\n`;
                });
            } else {
                statsText += `Belum ada data pemain.\n`;
            }
            
            statsText += `\n🔄 Terakhir update: ${new Date().toLocaleString('id-ID')}`;
            
            return await bot.sendMessage(chatId, {
                text: statsText
            });
        }
        
        // Handle "devgame active"
        if (action === 'active') {
            const activeGames = Array.from(gameManager.activeGames.entries());
            
            if (activeGames.length === 0) {
                return await bot.sendMessage(chatId, {
                    text: `ℹ️ Tidak ada game yang aktif saat ini.`
                });
            }
            
            let gamesText = `🎮 *ACTIVE GAMES* (${activeGames.length})\n\n`;
            
            activeGames.forEach(([chatId, gameData], index) => {
                const chatName = chatId.split('@')[0];
                const gameType = gameData.type || 'unknown';
                const starter = gameData.data?.starter?.split('@')[0] || 'unknown';
                const timeStarted = gameData.startedAt ? 
                    Math.floor((Date.now() - gameData.startedAt) / 1000) + ' detik lalu' : 
                    'unknown';
                
                gamesText += `${index + 1}. *${gameType.toUpperCase()}*\n`;
                gamesText += `   Chat: ${chatName}\n`;
                gamesText += `   Starter: @${starter}\n`;
                gamesText += `   Waktu: ${timeStarted}\n\n`;
            });
            
            return await bot.sendMessage(chatId, {
                text: gamesText
            });
        }
        
        // Handle "devgame reset @user"
        if (action === 'reset') {
            if (args.length < 2) {
                return await bot.sendMessage(chatId, {
                    text: `❌ Format: ${config.prefix}devgame reset @user`
                });
            }
            
            let targetUserId = '';
            
            // Cek jika ada mentioned user
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                targetUserId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } 
            // Cek jika args berupa @username
            else if (args[1].includes('@')) {
                const mentionedUsername = args[1].replace('@', '');
                targetUserId = `${mentionedUsername}@s.whatsapp.net`;
            }
            
            if (!targetUserId) {
                return await bot.sendMessage(chatId, {
                    text: `❌ Tag user yang ingin direset.`
                });
            }
            
            const result = await this.resetUserData(targetUserId);
            
            return await bot.sendMessage(chatId, {
                text: result.message,
                mentions: [targetUserId, senderId]
            });
        }
        
        // Handle "devgame banlist"
        if (action === 'banlist' || action === 'banned') {
            try {
                const banData = await this.readBanData();
                const bannedUsers = Object.keys(banData);
                
                if (bannedUsers.length === 0) {
                    return await bot.sendMessage(chatId, {
                        text: `✅ Tidak ada user yang sedang diban.`
                    });
                }
                
                let banListText = `⛔ *BANNED USERS LIST* (${bannedUsers.length})\n\n`;
                
                bannedUsers.slice(0, 15).forEach((userId, index) => {
                    const username = userId.split('@')[0];
                    const banInfo = banData[userId];
                    
                    banListText += `${index + 1}. @${username}\n`;
                    
                    try {
                        if (typeof banInfo === 'string') {
                            const banUntil = new Date(banInfo);
                            const now = new Date();
                            const timeLeft = Math.ceil((banUntil - now) / (1000 * 60)); // menit
                            
                            if (timeLeft > 0) {
                                banListText += `   ⏰ Sisa: ${timeLeft} menit\n`;
                            } else {
                                banListText += `   ⌛ Kadaluarsa\n`;
                            }
                        } else {
                            banListText += `   📅 ${banInfo}\n`;
                        }
                    } catch (e) {
                        banListText += `   📅 ${banInfo}\n`;
                    }
                    
                    banListText += `\n`;
                });
                
                if (bannedUsers.length > 15) {
                    banListText += `\n... dan ${bannedUsers.length - 15} user lainnya.`;
                }
                
                banListText += `\n\n🔄 Gunakan ${config.prefix}devgame unban @user untuk membatalkan ban.`;
                
                return await bot.sendMessage(chatId, {
                    text: banListText
                });
                
            } catch (error) {
                console.error('[DEVGAME] Error getting banlist:', error);
                return await bot.sendMessage(chatId, {
                    text: `❌ Error: ${error.message}`
                });
            }
        }
        
        // Handle "devgame unban @user"
        if (action === 'unban') {
            if (args.length < 2) {
                return await bot.sendMessage(chatId, {
                    text: `❌ Format: ${config.prefix}devgame unban @user`
                });
            }
            
            let targetUserId = '';
            
            // Cek jika ada mentioned user
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                targetUserId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } 
            // Cek jika args berupa @username
            else if (args[1].includes('@')) {
                const mentionedUsername = args[1].replace('@', '');
                targetUserId = `${mentionedUsername}@s.whatsapp.net`;
            }
            
            if (!targetUserId) {
                return await bot.sendMessage(chatId, {
                    text: `❌ Tag user yang ingin diunban.`
                });
            }
            
            try {
                const banData = await this.readBanData();
                const userRank = await this.readUserRank();
                
                let message = '';
                let unbanned = false;
                
                // Hapus dari ban data
                if (banData[targetUserId]) {
                    delete banData[targetUserId];
                    message += `✅ Dihapus dari ban.json\n`;
                    unbanned = true;
                }
                
                // Update user rank data
                if (userRank[targetUserId]) {
                    userRank[targetUserId].isBanned = false;
                    userRank[targetUserId].banUntil = null;
                    userRank[targetUserId].wrongCount = 0;
                    message += `✅ Status ban di user_rank.json direset\n`;
                    unbanned = true;
                }
                
                // Simpan perubahan
                if (unbanned) {
                    await this.writeBanData(banData);
                    await this.writeUserRank(userRank);
                    
                    message += `\n🎮 @${targetUserId.split('@')[0]} sekarang sudah bisa main game lagi!`;
                    message += `\n👤 Unban dilakukan oleh: @${senderId.split('@')[0]}`;
                } else {
                    message = `ℹ️ @${targetUserId.split('@')[0]} tidak sedang dalam status ban.`;
                }
                
                return await bot.sendMessage(chatId, {
                    text: message,
                    mentions: [targetUserId, senderId]
                });
                
            } catch (error) {
                console.error('[DEVGAME] Error unbanning user:', error);
                return await bot.sendMessage(chatId, {
                    text: `❌ Error: ${error.message}`
                });
            }
        }
        
        // Handle "devgame cleanup"
        if (action === 'cleanup') {
            try {
                const cleanedCount = await gameManager.cleanupExpiredGames();
                
                return await bot.sendMessage(chatId, {
                    text: `🧹 *GAME CLEANUP COMPLETE*\n\n✅ ${cleanedCount} expired games telah dibersihkan.\n🎮 ${gameManager.activeGames.size} game masih aktif.\n⏰ Cleanup otomatis setiap 30 menit.`
                });
                
            } catch (error) {
                console.error('[DEVGAME] Error during cleanup:', error);
                return await bot.sendMessage(chatId, {
                    text: `❌ Error: ${error.message}`
                });
            }
        }
        
        // Handle "devgame reload"
        if (action === 'reload') {
            try {
                await gameManager.loadGameHandlers();
                const handlerCount = gameManager.gameHandlers.size;
                
                return await bot.sendMessage(chatId, {
                    text: `🔄 *GAME HANDLERS RELOADED*\n\n✅ ${handlerCount} game handler berhasil di-reload.\n🎮 Game yang tersedia:\n${Array.from(gameManager.gameHandlers.keys()).map(g => `• ${g}`).join('\n')}`
                });
                
            } catch (error) {
                console.error('[DEVGAME] Error reloading handlers:', error);
                return await bot.sendMessage(chatId, {
                    text: `❌ Error: ${error.message}`
                });
            }
        }
        
        // Handle "devgame users"
        if (action === 'users') {
            try {
                const stats = await this.getGameStats();
                
                if (!stats) {
                    return await bot.sendMessage(chatId, {
                        text: `❌ Gagal mengambil data users.`
                    });
                }
                
                return await bot.sendMessage(chatId, {
                    text: `👥 *USERS DATABASE*\n\n📊 Total Users: ${stats.totalUsers}\n🎮 Active Players: ${stats.activeUsers}\n⛔ Banned Users: ${stats.bannedUsers}\n⭐ Total Points: ${stats.totalPoints}\n📈 Avg Points: ${stats.activeUsers > 0 ? Math.round(stats.totalPoints / stats.activeUsers) : 0}\n\n💾 Database: user_rank.json`
                });
                
            } catch (error) {
                console.error('[DEVGAME] Error getting users:', error);
                return await bot.sendMessage(chatId, {
                    text: `❌ Error: ${error.message}`
                });
            }
        }
        
        // Jika action tidak dikenali
        await bot.sendMessage(chatId, {
            text: `❌ Action tidak dikenali: ${action}\n\nGunakan ${config.prefix}devgame untuk melihat menu.`
        });
    }
};