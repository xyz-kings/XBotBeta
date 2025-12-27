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
const GAME_TYPE = 'siapakahaku';

// Sinonim untuk berbagai jawaban
const synonyms = {
    'topeng': ['topeng', 'masker', 'kedok', 'penutup wajah'],
    'polisi': ['polisi', 'polwan', 'polri', 'brimob', 'satpam', 'security'],
    'kuburan': ['kuburan', 'makam', 'pepunden', 'kijing', 'liang lahat'],
    'selai': ['selai', 'jem', 'marmalade', 'olesan roti'],
    'hantu': ['hantu', 'ghost', 'setan', 'jin', 'pocong', 'kuntilanak', 'genderuwo'],
    'darah': ['darah', 'plasma', 'hemoglobin'],
    'kutu': ['kutu', 'tuma', 'kutu rambut', 'kutu busuk'],
    'tali': ['tali', 'tambang', 'benang', 'senar', 'kawat'],
    'kubis': ['kubis', 'kol', 'sawi putih'],
    'mahkota': ['mahkota', 'crown', 'tiara', 'hiasan kepala'],
    'kunci': ['kunci', 'anak kunci', 'gembok', 'pengunci'],
    'garam': ['garam', 'nacl', 'natrium klorida'],
    'kacamata': ['kacamata', 'spectacles', 'lensa', 'kaca mata'],
    'jam': ['jam', 'arloji', 'watch', 'jam tangan'],
    'pintu': ['pintu', 'gerbang', 'portal', 'gapura'],
    'uang': ['uang', 'duit', 'money', 'rupiah', 'dollar'],
    'api': ['api', 'fire', 'nyala', 'kobaran'],
    'air': ['air', 'water', 'h2o', 'cairan'],
    'angin': ['angin', 'wind', 'bayu', 'udara bergerak'],
    'bumi': ['bumi', 'earth', 'dunia', 'planet'],
    // Tambahkan sinonim lainnya sesuai kebutuhan
};

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
    const normalizedCorrect = normalizeText(correctAnswer);
    const threshold = 0.7; // Threshold lebih rendah untuk tebak-tebakan
    
    console.log(`[SIAPAKAH AKU] Checking: "${userAnswer}" vs "${correctAnswer}"`);
    
    // Cek similarity langsung
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[SIAPAKAH AKU] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `🎭 **Jawaban:** ${correctAnswer}`,
            similarity: simScore
        };
    }
    
    // Cek sinonim
    if (synonyms[normalizedCorrect]) {
        for (const synonym of synonyms[normalizedCorrect]) {
            const synonymScore = similarity(normalizedUser, synonym);
            if (synonymScore >= threshold) {
                console.log(`[SIAPAKAH AKU] ✅ Accepted via synonym: ${synonym} (score: ${synonymScore})`);
                return {
                    correct: true,
                    message: `🎭 **Jawaban:** ${correctAnswer}\n📝 **Sinonim diterima:** ${synonym}`,
                    similarity: synonymScore
                };
            }
        }
    }
    
    // Cek kata per kata (untuk jawaban multi-kata)
    const userWords = normalizedUser.split(' ');
    const correctWords = normalizedCorrect.split(' ');
    
    if (userWords.length > 1 || correctWords.length > 1) {
        let wordMatches = 0;
        for (const uWord of userWords) {
            for (const cWord of correctWords) {
                if (similarity(uWord, cWord) >= 0.8) {
                    wordMatches++;
                    break;
                }
            }
        }
        
        const wordMatchRatio = wordMatches / Math.max(userWords.length, correctWords.length);
        console.log(`[SIAPAKAH AKU] Word match ratio: ${wordMatchRatio}`);
        
        if (wordMatchRatio >= 0.6) {
            return {
                correct: true,
                message: `🎭 **Jawaban:** ${correctAnswer}\n📝 **Kata kunci cocok:** ${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata`,
                similarity: wordMatchRatio
            };
        }
    }
    
    return {
        correct: false,
        message: `❌ Salah! Coba tebak lagi.\n💡 **Petunjuk:** ${question.soal.substring(0, 50)}${question.soal.length > 50 ? '...' : ''}`,
        similarity: simScore
    };
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
        console.log('[SIAPAKAH AKU] Starting new game...');
        const url = `${config.baseURL}/game/siapakahaku/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Soal lagi kosong!' });
            return;
        }
        
        const question = data.data[Math.floor(Math.random() * data.data.length)];
        console.log('[SIAPAKAH AKU] Question:', question.soal);
        console.log('[SIAPAKAH AKU] Answer:', question.jawaban);
        
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
            banData: banData,
            hintsUsed: 0,
            maxHints: 2
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        const teks = `🎭 *Siapakah Aku? Dimulai oleh @${starterName}!*\n\n*Tebak ini apa?*\n"${question.soal}"\n\n*Petunjuk:*\n• Reply pesan ini dengan jawaban\n• Contoh: "Topeng" atau "Polisi"\n• Waktu: 25 detik\n• Hint: ketik "hint" untuk petunjuk\n• Starter: @${starterName}`;
        
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
                        text: `⏰ *Waktu habis!*\n\n🎭 **Jawaban yang benar:**\n${question.jawaban}\n\n🔄 Main lagi? .siapakahaku` 
                    });
                }
            } catch (error) {
                console.error('[SIAPAKAH AKU] Timeout callback error:', error);
            }
        }, 25000);
        
    } catch (error) {
        console.error('[SIAPAKAH AKU] Error:', error);
        await bot.sendMessage(chatId, { text: '❌ Server error!' });
    }
}

// Fungsi untuk stop game
async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .siapakahaku` 
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
                text: `⛔ @${userName} salah 3x! Kena ban game 1 jam!\n\n🎭 **Jawaban yang benar:**\n${gameData.data.currentQuestion.jawaban}\n\n❌ Ronde dibatalkan.`,
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
        text: `${result.message}${wrongCountText}`,
        mentions: [userId]
    });
}

// Handler untuk jawaban benar (extension untuk Game Manager)
async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const userRank = gameData.data.userRank || { points: 0, rank: 'Novice', wrongCount: 0 };
    const banData = gameData.data.banData || {};
    const question = gameData.data.currentQuestion;
    
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
        text: `🎉 *BENAR!* @${userName} jawab benar!\n\n${result.message}\n\n➕ +1 poin\n🏆 Poin: *${userRank.points}* (${userRank.rank})\n\n🔄 Main lagi? Ketik .siapakahaku!`,
        mentions: [userId]
    });
}

// Fungsi untuk memberikan hint
async function giveHint(bot, chatId, gameData) {
    const question = gameData.data.currentQuestion;
    const hintsUsed = gameData.data.hintsUsed || 0;
    const maxHints = gameData.data.maxHints || 2;
    
    if (hintsUsed >= maxHints) {
        await bot.sendMessage(chatId, {
            text: `ℹ️ *Hint habis!*\nKamu sudah menggunakan semua hint (${maxHints}).\nCoba tebak sendiri ya!`
        });
        return;
    }
    
    // Berikan hint berdasarkan jawaban
    const answer = question.jawaban;
    const answerLength = answer.length;
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Panjang kata
        hint = `📏 *Hint 1:* Jawaban terdiri dari ${answerLength} huruf`;
    } else if (hintsUsed === 2) {
        // Hint 2: Huruf pertama dan terakhir
        const firstLetter = answer.charAt(0).toUpperCase();
        const lastLetter = answer.charAt(answerLength - 1).toUpperCase();
        hint = `🔠 *Hint 2:* Huruf pertama: ${firstLetter}, Huruf terakhir: ${lastLetter}`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Masih ada ${maxHints - hintsUsed} hint tersisa.`
    });
}

module.exports = {
    command: ['siapakahaku'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['siapakahaku'],
    description: 'Game tebak-tebakan "Siapakah Aku?"',
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
        let text = '';
        
        // Ambil teks dari pesan
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
        
        console.log(`[SIAPAKAH AKU COMMAND] Received: "${text}" from ${senderId}`);
        
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
                    text: `⚠️ Tidak ada game Siapakah Aku yang aktif!` 
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
                    text: `📊 *STATISTIK SIAPAKAH AKU* - @${userName}\n\n🎭 Total Game: *${userData.points || 0}*\n📊 Rank: *${userData.rank}*\n❌ Wrong Count: ${userData.wrongCount || 0}\n\n*Leaderboard Tebak-Tebakan:*\n${await getTopPlayers(userRank, 5)}`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[SIAPAKAH AKU] Error getting stats:', error);
            }
            return;
        }
        
        // Cek jika command hint (hanya saat game aktif)
        if ((args[0] && args[0].toLowerCase() === 'hint') || text.toLowerCase() === 'hint') {
            const gameData = gameManager.getActiveGame(chatId);
            if (gameData && gameData.type === GAME_TYPE) {
                await giveHint(bot, chatId, gameData);
                return;
            } else {
                await bot.sendMessage(chatId, {
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .siapakahaku`
                });
                return;
            }
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🎮 *BANTUAN GAME SIAPAKAH AKU*\n\n*Commands:*\n• .siapakahaku - Mulai game baru\n• .siapakahaku stop - Stop game aktif\n• .siapakahaku stats - Lihat statistik\n• .siapakahaku hint - Minta petunjuk (saat game aktif)\n\n*Cara Main:*\n1. Ketik .siapakahaku untuk mulai\n2. Bot akan memberikan soal tebak-tebakan\n3. REPLY pesan soal dengan jawabanmu\n4. Gunakan "hint" jika bingung\n5. Dapatkan poin untuk setiap jawaban benar!\n\n*Tips:*\n• Jawaban bisa berupa satu kata\n• Gunakan sinonim jika perlu\n• Batas waktu: 25 detik`
            });
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
        console.error('[SIAPAKAH AKU] Error getting top players:', error);
        return 'Error loading leaderboard.';
    }
}