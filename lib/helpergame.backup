const fs = require('fs').promises;
const path = require('path');

class GameManager {
    constructor() {
        this.activeGames = new Map();
        this.gameHandlers = new Map();
        this.timeouts = new Map();
        this.gameMessages = new Map();
        
        // Path untuk data game
        this.gameDataPath = path.join(__dirname, '../DataDase/game/data_game.json');
        this.userRankPath = path.join(__dirname, '../DataDase/game/user_rank.json');
        this.banDataPath = path.join(__dirname, '../DataDase/game/ban.json');
        
        // Sistem rank GLOBAL untuk semua game
        this.ranks = [
            { min: 0, max: 9, name: '🐣 Pemula', level: 1 },
            { min: 10, max: 24, name: '🎮 Pemain', level: 2 },
            { min: 25, max: 49, name: '⚔️ Petarung', level: 3 },
            { min: 50, max: 99, name: '🛡️ Kesatria', level: 4 },
            { min: 100, max: 199, name: '👑 Master', level: 5 },
            { min: 200, max: 499, name: '🌟 Grand Master', level: 6 },
            { min: 500, max: 999, name: '🏆 Legend', level: 7 },
            { min: 1000, max: 9999, name: '💎 Immortal', level: 8 }
        ];
    }

    // Initialize game manager
    async init() {
        console.log('[GAME MANAGER] Initializing...');
        await this.ensureGameDataDirectory();
        await this.loadGameHandlers();
    }

    async ensureGameDataDirectory() {
        try {
            const dirPath = path.dirname(this.gameDataPath);
            await fs.mkdir(dirPath, { recursive: true });
            console.log('[GAME MANAGER] Game data directory ensured');
        } catch (error) {
            console.error('[GAME MANAGER] Error ensuring game data directory:', error);
        }
    }

    async loadGameHandlers() {
        const gameDir = path.join(__dirname, '../plugin/game');
        
        try {
            if (!await this.dirExists(gameDir)) {
                console.log('[GAME MANAGER] Game directory not found:', gameDir);
                return;
            }
            
            const files = (await fs.readdir(gameDir)).filter(f => f.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const modulePath = path.join(gameDir, file);
                    delete require.cache[require.resolve(modulePath)];
                    const gameModule = require(modulePath);
                    
                    if (gameModule.gameType) {
                        const gameType = gameModule.gameType.toLowerCase();
                        this.gameHandlers.set(gameType, gameModule);
                        console.log(`[GAME MANAGER] Loaded game handler: ${gameType}`);
                    }
                } catch (error) {
                    console.error(`[GAME MANAGER] Error loading ${file}:`, error.message);
                }
            }
            
            console.log(`[GAME MANAGER] Total game handlers loaded: ${this.gameHandlers.size}`);
        } catch (error) {
            console.error('[GAME MANAGER] Error loading game handlers:', error);
        }
    }

    async dirExists(dir) {
        try {
            await fs.access(dir);
            return true;
        } catch {
            return false;
        }
    }

    registerGameHandler(gameType, handler) {
        this.gameHandlers.set(gameType.toLowerCase(), handler);
        console.log(`[GAME MANAGER] Registered game handler: ${gameType}`);
    }

    // ===== SISTEM RANK GLOBAL =====
    
    // Baca data user rank
    async readUserRank() {
        try {
            const data = await fs.readFile(this.userRankPath, 'utf8');
            if (!data.trim()) return {};
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    // Tulis data user rank
    async writeUserRank(data) {
        try {
            await fs.mkdir(path.dirname(this.userRankPath), { recursive: true });
            await fs.writeFile(this.userRankPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('[GAME MANAGER] Error writing user rank:', error);
        }
    }

    // Get atau create user data (STRUKTUR SEDERHANA)
    async getUserData(userId) {
        const userRankData = await this.readUserRank();
        
        if (!userRankData[userId]) {
            // Create new user dengan data sederhana
            const userName = userId.split('@')[0];
            userRankData[userId] = {
                userId: userId,
                userName: userName,
                points: 0,
                rank: '🐣 Pemula',
                level: 1,
                totalGames: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
                winStreak: 0,
                maxWinStreak: 0,
                dailyStreak: 0,
                lastPlayed: null,
                gameStats: {
                    played: 0,
                    won: 0
                },
                wrongCount: 0,
                isBanned: false,
                banUntil: null,
                achievements: [],
                firstPlayed: new Date().toISOString()
            };
            
            await this.writeUserRank(userRankData);
        }
        
        return userRankData[userId];
    }

    // Update user points dengan sistem rank global
    async updateUserPoints(userId, gameType, pointsChange, isWin = true) {
        try {
            const userRankData = await this.readUserRank();
            let userData = await this.getUserData(userId);
            
            // Update points (global) - BENAR: +1, SALAH (starter): -1
            const oldPoints = userData.points || 0;
            userData.points = Math.max(0, oldPoints + pointsChange);
            
            // Update GLOBAL game stats (TIDAK DIPISAH PER GAME)
            userData.totalGames = (userData.totalGames || 0) + 1;
            userData.gameStats.played = (userData.gameStats.played || 0) + 1;
            
            if (isWin) {
                userData.gamesWon = (userData.gamesWon || 0) + 1;
                userData.gameStats.won = (userData.gameStats.won || 0) + 1;
                userData.winStreak = (userData.winStreak || 0) + 1;
                userData.wrongCount = 0; // Reset wrong count kalau menang
                
                // Update max win streak
                if (userData.winStreak > (userData.maxWinStreak || 0)) {
                    userData.maxWinStreak = userData.winStreak;
                }
            } else {
                userData.gamesLost = (userData.gamesLost || 0) + 1;
                userData.winStreak = 0; // Reset streak kalau kalah
                userData.wrongCount = (userData.wrongCount || 0) + 1;
            }
            
            // Update win rate
            if (userData.totalGames > 0) {
                userData.winRate = Math.round((userData.gamesWon / userData.totalGames) * 100);
            }
            
            // Update rank berdasarkan points global
            const newRank = this.getRankByPoints(userData.points);
            userData.rank = newRank.name;
            userData.level = newRank.level;
            
            // Update last played
            userData.lastPlayed = new Date().toISOString();
            
            // Save data
            userRankData[userId] = userData;
            await this.writeUserRank(userRankData);
            
            console.log(`[GAME MANAGER] ${userId} (${gameType}): ${pointsChange > 0 ? '+' : ''}${pointsChange} poin`);
            console.log(`[GAME MANAGER] Total: ${userData.points} poin | Rank: ${userData.rank} (Lv.${userData.level})`);
            console.log(`[GAME MANAGER] Game Stats: ${userData.gameStats.won}/${userData.gameStats.played} menang`);
            
            return {
                success: true,
                userData: userData,
                pointsChange: pointsChange,
                oldRank: this.getRankByPoints(oldPoints).name,
                newRank: userData.rank,
                rankUp: oldPoints < userData.points && this.getRankByPoints(oldPoints).level !== newRank.level
            };
        } catch (error) {
            console.error('[GAME MANAGER] Error updating user points:', error);
            return { success: false, error: error.message };
        }
    }

    // Get rank berdasarkan points
    getRankByPoints(points) {
        for (let i = this.ranks.length - 1; i >= 0; i--) {
            if (points >= this.ranks[i].min) {
                return this.ranks[i];
            }
        }
        return this.ranks[0]; // Default ke rank pertama
    }

    // Get user stats untuk display
    async getUserStats(userId) {
        try {
            const userData = await this.getUserData(userId);
            const userName = userData.userName || userId.split('@')[0];
            
            // Format stats text
            let statsText = `📊 *STATISTIK* - @${userName}\n`;
            statsText += `══════════════════\n\n`;
            
            statsText += `🏆 *RANK GLOBAL*\n`;
            statsText += `┣ ${userData.rank} (Level ${userData.level})\n`;
            statsText += `┣ ⭐ Poin: ${userData.points}\n`;
            statsText += `┗ 📈 Progres: ${userData.points}/${this.getNextRankPoints(userData.points)} poin\n\n`;
            
            statsText += `🎮 *STATISTIK PERMAINAN*\n`;
            statsText += `┣ 🕹️ Total Game: ${userData.totalGames}\n`;
            statsText += `┣ ✅ Menang: ${userData.gamesWon}\n`;
            statsText += `┣ ❌ Kalah: ${userData.gamesLost}\n`;
            statsText += `┣ 📊 Win Rate: ${userData.winRate}%\n`;
            statsText += `┣ 🔥 Win Streak: ${userData.winStreak}\n`;
            statsText += `┣ 💪 Max Streak: ${userData.maxWinStreak}\n`;
            statsText += `┗ 🎲 Game Stats: ${userData.gameStats.won || 0}/${userData.gameStats.played || 0} menang\n\n`;
            
            statsText += `📅 *INFO LAINNYA*\n`;
            statsText += `┣ ❌ Wrong Count: ${userData.wrongCount || 0}/3\n`;
            statsText += `┣ 📆 Daily Streak: ${userData.dailyStreak || 0} hari\n`;
            
            if (userData.lastPlayed) {
                const lastPlayed = new Date(userData.lastPlayed);
                const now = new Date();
                const diffHours = Math.floor((now - lastPlayed) / (1000 * 60 * 60));
                
                if (diffHours < 24) {
                    statsText += `┣ ⏰ Terakhir main: ${diffHours} jam lalu\n`;
                } else {
                    const diffDays = Math.floor(diffHours / 24);
                    statsText += `┣ ⏰ Terakhir main: ${diffDays} hari lalu\n`;
                }
            }
            
            const firstPlayed = new Date(userData.firstPlayed);
            const daysSinceFirst = Math.floor((new Date() - firstPlayed) / (1000 * 60 * 60 * 24));
            statsText += `┗ 📅 Bermain sejak: ${daysSinceFirst} hari lalu`;
            
            return statsText;
        } catch (error) {
            console.error('[GAME MANAGER] Error getting user stats:', error);
            return '❌ Gagal memuat statistik.';
        }
    }

    // Get points needed for next rank
    getNextRankPoints(currentPoints) {
        for (const rank of this.ranks) {
            if (currentPoints < rank.max) {
                return rank.max + 1;
            }
        }
        return this.ranks[this.ranks.length - 1].max;
    }

    // Get leaderboard
    async getLeaderboard(limit = 10) {
        try {
            const userRankData = await this.readUserRank();
            const users = Object.entries(userRankData);
            
            // Sort by points descending
            users.sort((a, b) => (b[1].points || 0) - (a[1].points || 0));
            
            // Take top N
            const topUsers = users.slice(0, limit);
            
            // Format leaderboard
            let leaderboardText = `🏆 *GLOBAL LEADERBOARD*\n`;
            leaderboardText += `══════════════════\n\n`;
            
            topUsers.forEach(([userId, userData], index) => {
                const rankEmoji = this.getRankEmoji(index + 1);
                const userName = userData.userName || userId.split('@')[0];
                const points = userData.points || 0;
                const rank = userData.rank || '🐣 Pemula';
                const gamesWon = userData.gameStats?.won || 0;
                const gamesPlayed = userData.gameStats?.played || 0;
                const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
                
                leaderboardText += `${rankEmoji} @${userName}\n`;
                leaderboardText += `  ⭐ ${points} poin | ${rank}\n`;
                leaderboardText += `  🎮 ${gamesWon}/${gamesPlayed} (${winRate}%)\n`;
                
                if (index < topUsers.length - 1) {
                    leaderboardText += `  ───────────────────\n`;
                }
            });
            
            // Total players info
            const totalPlayers = users.length;
            const totalPoints = users.reduce((sum, [, user]) => sum + (user.points || 0), 0);
            const totalGames = users.reduce((sum, [, user]) => sum + (user.gameStats?.played || 0), 0);
            
            leaderboardText += `\n📊 *STATISTIK*\n`;
            leaderboardText += `┣ Total Pemain: ${totalPlayers}\n`;
            leaderboardText += `┣ Total Poin: ${totalPoints}\n`;
            leaderboardText += `┗ Total Game: ${totalGames}`;
            
            return leaderboardText;
        } catch (error) {
            console.error('[GAME MANAGER] Error getting leaderboard:', error);
            return '❌ Gagal memuat leaderboard.';
        }
    }

    // Get rank emoji for position
    getRankEmoji(position) {
        switch(position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${position}.`;
        }
    }

    // ===== FUNGSI GAME MANAGER LAINNYA =====
    
    async startGame(chatId, gameType, data) {
        try {
            const handler = this.gameHandlers.get(gameType.toLowerCase());
            if (!handler) {
                throw new Error(`Game handler not found for type: ${gameType}`);
            }

            const gameInfo = {
                type: gameType,
                data: data,
                startedAt: Date.now(),
                messageId: null,
                handler: handler
            };
            
            this.activeGames.set(chatId, gameInfo);
            await this.saveGameToFile(chatId, gameInfo);

            console.log(`[GAME MANAGER] Game started: ${chatId} -> ${gameType}`);
            return true;
        } catch (error) {
            console.error('[GAME MANAGER] Error starting game:', error);
            throw error;
        }
    }

    async saveGameToFile(chatId, gameData) {
        try {
            const allGameData = await this.readJson(this.gameDataPath);
            allGameData[chatId] = {
                ...gameData,
                savedAt: new Date().toISOString()
            };
            await this.writeJson(this.gameDataPath, allGameData);
            console.log(`[GAME MANAGER] Game saved to file: ${chatId}`);
        } catch (error) {
            console.error('[GAME MANAGER] Error saving game to file:', error);
        }
    }

    async readJson(filePath) {
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            const data = await fs.readFile(filePath, 'utf8');
            if (!data.trim()) return {};
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error.message);
            return {};
        }
    }

    async writeJson(filePath, data) {
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`Error writing ${filePath}:`, error);
        }
    }

    async removeGameFromFile(chatId) {
        try {
            const allGameData = await this.readJson(this.gameDataPath);
            if (allGameData[chatId]) {
                delete allGameData[chatId];
                await this.writeJson(this.gameDataPath, allGameData);
                console.log(`[GAME MANAGER] Game removed from file: ${chatId}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[GAME MANAGER] Error removing game from file:', error);
            return false;
        }
    }

    async stopGame(chatId, reason = 'stopped') {
        try {
            this.clearTimeout(chatId);
            this.activeGames.delete(chatId);
            this.gameMessages.delete(chatId);
            await this.removeGameFromFile(chatId);
            console.log(`[GAME MANAGER] Game stopped: ${chatId} - ${reason}`);
            return true;
        } catch (error) {
            console.error('[GAME MANAGER] Error stopping game:', error);
            return false;
        }
    }

    hasActiveGame(chatId) {
        return this.activeGames.has(chatId);
    }

    getActiveGame(chatId) {
        return this.activeGames.get(chatId);
    }

    setGameMessage(chatId, messageId) {
        this.gameMessages.set(chatId, messageId);
        console.log(`[GAME MANAGER] Game message set: ${chatId} -> ${messageId}`);
    }

    isReplyToGame(chatId, repliedMsgId) {
        const gameMsgId = this.gameMessages.get(chatId);
        if (!gameMsgId) return false;
        const isReply = gameMsgId === repliedMsgId;
        console.log(`[GAME MANAGER] Reply check: ${repliedMsgId} vs ${gameMsgId} = ${isReply}`);
        return isReply;
    }

    // ===== FUNGSI UTAMA PROSES JAWABAN =====
    
    async processGameInput(bot, m) {
        const chatId = m.key.remoteJid;
        const userId = m.key.participant || m.key.remoteJid;
        
        const isReply = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (!isReply) {
            console.log('[GAME MANAGER] Not a reply message, ignoring');
            return { processed: false, reason: 'not_reply' };
        }
        
        if (!this.hasActiveGame(chatId)) {
            console.log('[GAME MANAGER] No active game in chat');
            return { processed: false, reason: 'no_active_game' };
        }
        
        if (!this.isReplyToGame(chatId, isReply)) {
            console.log('[GAME MANAGER] Not reply to game message');
            await bot.sendMessage(chatId, {
                text: `⚠️ *Harus REPLY ke pesan game!*\nKlik pesan game di atas, lalu reply dengan jawabanmu.`,
                mentions: [userId]
            });
            return { processed: true, reason: 'wrong_reply' };
        }
        
        const gameData = this.getActiveGame(chatId);
        if (!gameData) {
            return { processed: false, reason: 'game_data_missing' };
        }
        
        // Cek apakah user banned
        const userData = await this.getUserData(userId);
        if (userData.isBanned && userData.banUntil && new Date(userData.banUntil) > new Date()) {
            const timeLeft = Math.ceil((new Date(userData.banUntil) - new Date()) / (1000 * 60));
            await bot.sendMessage(chatId, {
                text: `⛔ @${userId.split('@')[0]} kena ban game ${timeLeft} menit lagi!`,
                mentions: [userId]
            });
            return { processed: true, reason: 'user_banned' };
        }
        
        let text = '';
        if (m.message?.conversation) {
            text = m.message.conversation;
        } else if (m.message?.extendedTextMessage?.text) {
            text = m.message.extendedTextMessage.text;
        } else if (m.message?.imageMessage?.caption) {
            text = m.message.imageMessage.caption;
        } else if (m.message?.videoMessage?.caption) {
            text = m.message.videoMessage.caption;
        }
        
        text = text ? text.trim() : '';
        
        if (!text) {
            console.log('[GAME MANAGER] No text in message');
            return { processed: false, reason: 'no_text' };
        }
        
        console.log(`[GAME MANAGER] Processing answer: "${text}" for game ${gameData.type}`);
        
        try {
            if (gameData.handler && gameData.handler.checkAnswer) {
                const result = await gameData.handler.checkAnswer(text, gameData.data);
                
                if (result && result.correct) {
                    await this.handleCorrectAnswer(bot, chatId, userId, gameData, result);
                } else {
                    await this.handleWrongAnswer(bot, chatId, userId, gameData, result);
                }
                
                return { 
                    processed: true, 
                    reason: 'answer_processed', 
                    correct: result?.correct || false 
                };
            } else {
                console.log('[GAME MANAGER] Game handler has no checkAnswer method');
                return { processed: false, reason: 'no_check_method' };
            }
        } catch (error) {
            console.error('[GAME MANAGER] Error processing game input:', error);
            return { processed: false, reason: 'error', error: error.message };
        }
    }

    async handleCorrectAnswer(bot, chatId, userId, gameData, result) {
        console.log(`[GAME MANAGER] Correct answer from ${userId}`);
        
        this.clearTimeout(chatId);
        
        // Update points dengan rank global
        const updateResult = await this.updateUserPoints(userId, gameData.type, 1, true);
        
        const userName = userId.split('@')[0];
        const userData = updateResult.userData;
        const points = userData.points || 0;
        const rank = userData.rank || '🐣 Pemula';
        const gamesWon = userData.gameStats.won || 0;
        const gamesPlayed = userData.gameStats.played || 0;
        
        await this.stopGame(chatId, 'completed');
        
        let message = result.message || '🎉 Jawaban benar!';
        message += `\n\n👤 @${userName}`;
        message += `\n➕ +1 poin`;
        message += `\n⭐ Total: *${points}* poin`;
        message += `\n🏆 Rank: ${rank} (Lv.${userData.level || 1})`;
        message += `\n🎮 Stats: ${gamesWon}/${gamesPlayed} menang`;
        
        // Check if rank up
        if (updateResult.rankUp) {
            message += `\n\n🎉 *RANK UP!* 🎉`;
            message += `\n🎮 Selamat! Naik ke rank ${rank}!`;
        }
        
        message += `\n\n🎮 Game selesai!`;
        
        await bot.sendMessage(chatId, { text: message, mentions: [userId] });
    }

    async handleWrongAnswer(bot, chatId, userId, gameData, result) {
        console.log(`[GAME MANAGER] Wrong answer from ${userId}`);
        
        const userName = userId.split('@')[0];
        const isStarter = userId === gameData.data.starter;
        
        if (isStarter) {
            // Update points (-1) untuk starter
            const updateResult = await this.updateUserPoints(userId, gameData.type, -1, false);
            const userData = updateResult.userData;
            const points = userData.points || 0;
            const wrongCount = userData.wrongCount || 0;
            const gamesWon = userData.gameStats.won || 0;
            const gamesPlayed = userData.gameStats.played || 0;
            
            // Cek apakah sudah 3x salah (ban system)
            if (wrongCount >= 3) {
                // Ban user untuk 1 jam
                const banUntil = new Date(Date.now() + 60 * 60 * 1000);
                userData.isBanned = true;
                userData.banUntil = banUntil.toISOString();
                userData.wrongCount = 0;
                
                // Save ban data
                const userRankData = await this.readUserRank();
                userRankData[userId] = userData;
                await this.writeUserRank(userRankData);
                
                // Stop game
                await this.stopGame(chatId, 'starter_banned');
                
                await bot.sendMessage(chatId, {
                    text: `⛔ @${userName} salah 3x! Kena ban game 1 jam!\n\n❌ Ronde dibatalkan.\n🏆 Poin: ${points}\n🎮 Stats: ${gamesWon}/${gamesPlayed} menang`,
                    mentions: [userId]
                });
                return;
            }
            
            await bot.sendMessage(chatId, {
                text: `❌ Salah @${userName}!\n\n${result.message || 'Coba lagi!'}\n❌ Wrong count: ${wrongCount}/3\n🏆 Poin: ${points}\n🎮 Stats: ${gamesWon}/${gamesPlayed} menang`,
                mentions: [userId]
            });
        } else {
            // Bukan starter, tetap update stats tapi tanpa poin penalty
            const userData = await this.getUserData(userId);
            const gamesWon = userData.gameStats.won || 0;
            const gamesPlayed = userData.gameStats.played || 0;
            
            // Update hanya stats tanpa poin
            userData.totalGames = (userData.totalGames || 0) + 1;
            userData.gameStats.played = (userData.gameStats.played || 0) + 1;
            userData.gamesLost = (userData.gamesLost || 0) + 1;
            userData.winStreak = 0;
            
            // Update win rate
            if (userData.totalGames > 0) {
                userData.winRate = Math.round((userData.gamesWon / userData.totalGames) * 100);
            }
            
            // Save data
            const userRankData = await this.readUserRank();
            userRankData[userId] = userData;
            await this.writeUserRank(userRankData);
            
            await bot.sendMessage(chatId, {
                text: `❌ Salah @${userName}!\n\n${result.message || 'Coba lagi!'}\n⚠️ Nggak kena penalti karena bukan starter.\n🎮 Stats: ${gamesWon}/${gamesPlayed} menang`,
                mentions: [userId]
            });
        }
    }

    setTimeout(chatId, callback, delay) {
        this.clearTimeout(chatId);
        
        const timeoutId = setTimeout(async () => {
            try {
                await callback();
                await this.stopGame(chatId, 'timeout');
            } catch (error) {
                console.error('[GAME MANAGER] Timeout callback error:', error);
            }
        }, delay);
        
        this.timeouts.set(chatId, timeoutId);
        console.log(`[GAME MANAGER] Timeout set: ${chatId} -> ${delay}ms`);
    }

    clearTimeout(chatId) {
        const timeoutId = this.timeouts.get(chatId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(chatId);
            console.log(`[GAME MANAGER] Timeout cleared: ${chatId}`);
        }
    }

    async cleanup() {
        try {
            for (const timeoutId of this.timeouts.values()) {
                clearTimeout(timeoutId);
            }
            
            this.timeouts.clear();
            this.activeGames.clear();
            this.gameMessages.clear();
            
            await this.writeJson(this.gameDataPath, {});
            
            console.log('[GAME MANAGER] Cleaned up all games');
            return true;
        } catch (error) {
            console.error('[GAME MANAGER] Error during cleanup:', error);
            return false;
        }
    }

    async cleanupExpiredGames(maxAgeMinutes = 30) {
        try {
            const allGameData = await this.readJson(this.gameDataPath);
            const now = Date.now();
            let cleanedCount = 0;
            
            for (const [chatId, gameData] of Object.entries(allGameData)) {
                if (gameData.savedAt) {
                    const savedTime = new Date(gameData.savedAt).getTime();
                    const ageMinutes = (now - savedTime) / (1000 * 60);
                    
                    if (ageMinutes > maxAgeMinutes) {
                        delete allGameData[chatId];
                        cleanedCount++;
                    }
                }
            }
            
            if (cleanedCount > 0) {
                await this.writeJson(this.gameDataPath, allGameData);
                console.log(`[GAME MANAGER] Cleaned ${cleanedCount} expired games`);
            }
            
            return cleanedCount;
        } catch (error) {
            console.error('[GAME MANAGER] Error cleaning expired games:', error);
            return 0;
        }
    }
}

// Create singleton instance
const gameManager = new GameManager();

module.exports = gameManager;