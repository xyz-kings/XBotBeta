const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Path database
const gameDataPath = path.join(__dirname, '../../DataDase/game/data_game.json');
const userRankPath = path.join(__dirname, '../../DataDase/game/user_rank.json');
const banDataPath = path.join(__dirname, '../../DataDase/game/ban.json');

// Pangkat
const ranks = [
    { min: 0, max: 99, name: 'Novice' },
    { min: 100, max: 199, name: 'Apprentice' },
    { min: 200, max: 299, name: 'Warrior' },
    { min: 300, max: 399, name: 'Knight' },
    { min: 400, max: 500, name: 'Legend' }
];

// Game Type
const GAME_TYPE = 'kuisislam';

// Baca & Tulis JSON
async function readJson(filePath) {
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

async function writeJson(filePath, data) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}

// Fungsi untuk normalisasi teks
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Fungsi untuk cek similarity
function similarity(s1, s2) {
    const str1 = normalizeText(s1);
    const str2 = normalizeText(s2);
    
    if (str1 === str2) return 1;
    
    if (str1.includes(str2) || str2.includes(str1)) {
        const minLength = Math.min(str1.length, str2.length);
        const maxLength = Math.max(str1.length, str2.length);
        return minLength / maxLength;
    }
    
    let matches = 0;
    const window = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    
    for (let i = 0; i < str1.length; i++) {
        const start = Math.max(0, i - window);
        const end = Math.min(i + window + 1, str2.length);
        
        for (let j = start; j < end; j++) {
            if (str1[i] === str2[j]) {
                matches++;
                break;
            }
        }
    }
    
    if (matches === 0) return 0;
    
    const m = matches;
    const t = 0;
    const similarity = ((m / str1.length) + (m / str2.length) + ((m - t) / m)) / 3;
    
    return similarity;
}

// Fungsi untuk cek jawaban (untuk Game Manager)
async function checkAnswer(userAnswer, gameData) {
    const question = gameData.currentQuestion;
    const correctAnswer = question.jawaban;
    const normalizedUser = normalizeText(userAnswer);
    const threshold = 0.8;
    
    console.log(`[KUIS ISLAM] Checking answer: "${userAnswer}"`);
    console.log(`[KUIS ISLAM] Correct answer: "${correctAnswer}"`);
    console.log(`[KUIS ISLAM] Options:`, question.pilihan);
    
    // Cek apakah jawaban berupa nomor pilihan
    const answerNumber = parseInt(userAnswer);
    let isCorrect = false;
    let selectedAnswer = '';
    
    if (!isNaN(answerNumber) && answerNumber >= 1 && answerNumber <= question.pilihan.length) {
        // User menjawab dengan nomor
        selectedAnswer = question.pilihan[answerNumber - 1];
        isCorrect = checkSimilarity(selectedAnswer, correctAnswer, threshold);
        
        if (isCorrect) {
            return {
                correct: true,
                message: `✅ Jawaban benar!\n\n📖 **Jawaban:** ${correctAnswer}\n📝 **Penjelasan:**\n${question.deskripsi}\n\n➕ +1 poin`,
                selectedAnswer: selectedAnswer
            };
        }
    } else {
        // User menjawab dengan teks langsung
        isCorrect = checkSimilarity(userAnswer, correctAnswer, threshold);
        
        if (isCorrect) {
            return {
                correct: true,
                message: `✅ Jawaban benar!\n\n📖 **Jawaban:** ${correctAnswer}\n📝 **Penjelasan:**\n${question.deskripsi}\n\n➕ +1 poin`,
                selectedAnswer: userAnswer
            };
        }
    }
    
    // Coba cek semua pilihan
    for (let i = 0; i < question.pilihan.length; i++) {
        const option = question.pilihan[i];
        if (checkSimilarity(userAnswer, option, threshold)) {
            // User memilih pilihan yang ada, tapi belum tentu benar
            selectedAnswer = option;
            break;
        }
    }
    
    return {
        correct: false,
        message: `❌ Jawaban salah!\n\n📖 **Jawaban yang benar:** ${correctAnswer}\n📝 **Penjelasan:**\n${question.deskripsi}\n\nCoba lagi!`,
        selectedAnswer: selectedAnswer || userAnswer
    };
}

// Helper function untuk cek similarity dengan threshold
function checkSimilarity(text1, text2, threshold) {
    const normalized1 = normalizeText(text1);
    const normalized2 = normalizeText(text2);
    const simScore = similarity(normalized1, normalized2);
    
    console.log(`[KUIS ISLAM] Similarity: "${text1}" vs "${text2}" = ${simScore}`);
    
    if (simScore >= threshold) {
        return true;
    }
    
    // Cek kata per kata
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    
    if (words1.length > 1 || words2.length > 1) {
        let wordMatches = 0;
        for (const w1 of words1) {
            for (const w2 of words2) {
                if (similarity(w1, w2) >= 0.9) {
                    wordMatches++;
                    break;
                }
            }
        }
        
        const wordMatchRatio = wordMatches / Math.max(words1.length, words2.length);
        console.log(`[KUIS ISLAM] Word match ratio: ${wordMatchRatio}`);
        
        if (wordMatchRatio >= 0.7) {
            return true;
        }
    }
    
    return false;
}

// Fungsi untuk memulai game
async function startGame(bot, m, args) {
    const chatId = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;
    
    // Cek apakah sudah ada game aktif
    if (gameManager.hasActiveGame(chatId)) {
        await bot.sendMessage(chatId, {
            text: `⚠️ Masih ada game yang berjalan! Selesaikan dulu atau tunggu timeout.`
        });
        return;
    }
    
    try {
        console.log('[KUIS ISLAM] Starting new game...');
        const url = `${config.baseURL}/game/kuisislam/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Soal lagi kosong!' });
            return;
        }
        
        const question = data.data[Math.floor(Math.random() * data.data.length)];
        console.log('[KUIS ISLAM] Question:', question.soal);
        console.log('[KUIS ISLAM] Answer:', question.jawaban);
        console.log('[KUIS ISLAM] Options:', question.pilihan);
        
        // Format pilihan untuk ditampilkan
        let optionsText = '';
        if (question.pilihan && question.pilihan.length > 0) {
            question.pilihan.forEach((option, index) => {
                optionsText += `${index + 1}. ${option}\n`;
            });
        } else {
            optionsText = "Tidak ada pilihan, jawab langsung dengan teks.";
        }
        
        // Baca data user untuk ban check
        let userRank = await readJson(userRankPath);
        let banData = await readJson(banDataPath);
        
        // Cek ban
        if (banData[senderId]) {
            try {
                const banEnd = new Date(banData[senderId]);
                if (banEnd > new Date()) {
                    const timeLeft = Math.ceil((banEnd - new Date()) / (1000 * 60));
                    await bot.sendMessage(chatId, { 
                        text: `⛔ @${senderId.split('@')[0]} kena ban game ${timeLeft} menit lagi!`, 
                        mentions: [senderId] 
                    });
                    return;
                } else {
                    delete banData[senderId];
                    userRank[senderId] = userRank[senderId] || { points: 0, rank: 'Novice', wrongCount: 0 };
                    userRank[senderId].wrongCount = 0;
                    await writeJson(banDataPath, banData);
                    await writeJson(userRankPath, userRank);
                }
            } catch (error) {
                delete banData[senderId];
                await writeJson(banDataPath, banData);
            }
        }
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now(),
            userRank: userRank[senderId] || { points: 0, rank: 'Novice', wrongCount: 0 },
            banData: banData
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        const teks = `🕌 *Kuis Islam Dimulai oleh @${starterName}!*\n\n📖 *Soal:*\n${question.soal}\n\n📝 *Pilihan Jawaban:*\n${optionsText}\n\n*Petunjuk:*\n• Reply pesan ini dengan jawaban (nomor atau teks)\n• Contoh: "1" atau "${question.pilihan && question.pilihan[0] ? question.pilihan[0] : 'jawaban'}"\n• Timeout: 30 detik\n• Starter: @${starterName}`;
        
        const gameMessage = await bot.sendMessage(chatId, { 
            text: teks, 
            mentions: [senderId] 
        });
        
        // Set game message ID untuk reply tracking
        if (gameMessage.key && gameMessage.key.id) {
            gameManager.setGameMessage(chatId, gameMessage.key.id);
        }
        
        // Set timeout via Game Manager
        gameManager.setTimeout(chatId, async () => {
            try {
                const gameData = gameManager.getActiveGame(chatId);
                if (gameData && gameData.type === GAME_TYPE) {
                    const question = gameData.data.currentQuestion;
                    
                    await bot.sendMessage(chatId, { 
                        text: `⏰ *Waktu habis!*\n\n📖 **Jawaban yang benar:**\n${question.jawaban}\n\n📝 **Penjelasan:**\n${question.deskripsi || 'Tidak ada penjelasan tambahan.'}\n\n🔄 Main lagi? .kuisislam` 
                    });
                }
            } catch (error) {
                console.error('[KUIS ISLAM] Timeout callback error:', error);
            }
        }, 30000);
        
    } catch (error) {
        console.error('[KUIS ISLAM] Error:', error);
        await bot.sendMessage(chatId, { text: '❌ Server error!' });
    }
}

// Fungsi untuk stop game
async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .kuisislam` 
    });
}

// Handler untuk jawaban salah (untuk Game Manager extension)
async function handleWrongAnswer(bot, chatId, userId, gameData, result) {
    const userRank = gameData.data.userRank || { points: 0, rank: 'Novice', wrongCount: 0 };
    const banData = gameData.data.banData || {};
    
    // Update user data
    userRank.wrongCount = (userRank.wrongCount || 0) + 1;
    
    if (userId === gameData.data.starter) {
        if (userRank.points > 0) {
            userRank.points -= 1;
        }
        
        const wrongCount = userRank.wrongCount || 0;
        
        if (wrongCount >= 3) {
            // Ban user
            banData[userId] = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            
            // Save data
            await writeJson(banDataPath, banData);
            
            const allUserRank = await readJson(userRankPath);
            allUserRank[userId] = userRank;
            await writeJson(userRankPath, allUserRank);
            
            const userName = userId.split('@')[0];
            await bot.sendMessage(chatId, {
                text: `⛔ @${userName} salah 3x! Kena ban game 1 jam!\n\n${result.message}`,
                mentions: [userId]
            });
            
            // Stop game
            await gameManager.stopGame(chatId, 'banned');
            return;
        }
    }
    
    // Save user data
    const allUserRank = await readJson(userRankPath);
    allUserRank[userId] = userRank;
    await writeJson(userRankPath, allUserRank);
    
    // Update ban data
    await writeJson(banDataPath, banData);
    
    const userName = userId.split('@')[0];
    const wrongCountText = userId === gameData.data.starter ? 
        `\n❌ Wrong count: ${userRank.wrongCount}/3\n🏆 Poin: ${userRank.points}` : 
        `\n⚠️ Nggak kena penalti karena bukan starter.`;
    
    await bot.sendMessage(chatId, {
        text: `❌ Salah @${userName}!\n${wrongCountText}\n\nCoba lagi!`,
        mentions: [userId]
    });
}

// Handler untuk jawaban benar (extension untuk Game Manager)
async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const userRank = gameData.data.userRank || { points: 0, rank: 'Novice', wrongCount: 0 };
    const banData = gameData.data.banData || {};
    
    // Update poin
    userRank.points = (userRank.points || 0) + 1;
    userRank.wrongCount = 0;
    
    // Update rank
    const userPoints = userRank.points;
    const newRank = ranks.find(r => userPoints >= r.min && userPoints <= r.max)?.name || 'Novice';
    userRank.rank = newRank;
    
    // Save data
    const allUserRank = await readJson(userRankPath);
    allUserRank[userId] = userRank;
    await writeJson(userRankPath, allUserRank);
    
    // Clear ban jika ada
    if (banData[userId]) {
        delete banData[userId];
        await writeJson(banDataPath, banData);
    }
    
    const userName = userId.split('@')[0];
    await bot.sendMessage(chatId, {
        text: `🎉 *BENAR!* @${userName} jawab benar!\n\n${result.message}\n\n🏆 Poin: *${userRank.points}* (${userRank.rank})\n\n🔄 Main lagi? Ketik .kuisislam!`,
        mentions: [userId]
    });
}

module.exports = {
    command: ['kuisislam', 'quizislam', 'islamquiz', 'ki'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['kuisislam'],
    description: 'Kuis Islam - Uji pengetahuan agama Islam!',
    gameType: GAME_TYPE, // Important for Game Manager registration
    
    // Function untuk Game Manager
    checkAnswer,
    
    // Additional handlers untuk Game Manager
    handleCorrectAnswer: handleCorrectAnswerExtended,
    handleWrongAnswer: handleWrongAnswer,
    
    // Fungsi utama untuk command
    async execute(bot, m, args) {
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        
        // Cek jika command stop
        if (args[0] && args[0].toLowerCase() === 'stop') {
            // Cek apakah user adalah starter game
            const gameData = gameManager.getActiveGame(chatId);
            if (gameData && gameData.type === GAME_TYPE) {
                if (gameData.data.starter === senderId || 
                    config.ownerNumber?.includes(senderId) || 
                    m.key.fromMe) {
                    await stopGame(bot, chatId);
                } else {
                    await bot.sendMessage(chatId, { 
                        text: `⚠️ Hanya starter game atau owner yang bisa stop game!` 
                    });
                }
            } else {
                await bot.sendMessage(chatId, { 
                    text: `⚠️ Tidak ada game Kuis Islam yang aktif!` 
                });
            }
            return;
        }
        
        // Cek jika command stats
        if (args[0] && args[0].toLowerCase() === 'stats') {
            try {
                const userRank = await readJson(userRankPath);
                const userData = userRank[senderId] || { points: 0, rank: 'Novice', wrongCount: 0 };
                const userName = senderId.split('@')[0];
                
                await bot.sendMessage(chatId, {
                    text: `📊 *STATISTIK KUIS ISLAM* - @${userName}\n\n🏆 Poin: *${userData.points}*\n📊 Rank: *${userData.rank}*\n❌ Wrong Count: ${userData.wrongCount || 0}\n\n*Leaderboard:*\n${await getTopPlayers(userRank, 5)}`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[KUIS ISLAM] Error getting stats:', error);
            }
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};

// Helper function untuk leaderboard
async function getTopPlayers(userRank, limit = 5) {
    try {
        // Convert object ke array
        const players = Object.entries(userRank).map(([userId, data]) => ({
            userId,
            points: data.points || 0,
            rank: data.rank || 'Novice'
        }));
        
        // Sort by points descending
        players.sort((a, b) => b.points - a.points);
        
        // Ambil top N
        const topPlayers = players.slice(0, limit);
        
        // Format text
        let text = '';
        topPlayers.forEach((player, index) => {
            const name = player.userId.split('@')[0];
            text += `${index + 1}. @${name} - ${player.points} poin (${player.rank})\n`;
        });
        
        return text || 'Belum ada data pemain.';
    } catch (error) {
        console.error('[KUIS ISLAM] Error getting top players:', error);
        return 'Error loading leaderboard.';
    }
}