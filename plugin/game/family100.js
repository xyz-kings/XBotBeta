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

// Game Type
const GAME_TYPE = 'family100';

// Fungsi untuk cek jawaban (untuk Game Manager)
async function checkAnswer(userAnswer, gameData) {
    const correctAnswers = gameData.currentQuestion.jawaban;
    const normalizedUser = normalizeText(userAnswer);
    const threshold = 0.8;
    
    for (const correct of correctAnswers) {
        const normalizedCorrect = normalizeText(correct);
        const simScore = similarity(normalizedUser, normalizedCorrect);
        
        console.log(`[FAMILY100] Checking: "${userAnswer}" vs "${correct}"`);
        console.log(`[FAMILY100] Similarity score: ${simScore}`);
        
        if (simScore >= threshold) {
            console.log('[FAMILY100] ✅ Answer accepted!');
            return { correct: true, message: "Jawaban benar!" };
        }
        
        // Cek kata per kata
        const userWords = normalizedUser.split(' ');
        const correctWords = normalizedCorrect.split(' ');
        
        if (userWords.length > 1 || correctWords.length > 1) {
            let wordMatches = 0;
            for (const uWord of userWords) {
                for (const cWord of correctWords) {
                    if (similarity(uWord, cWord) >= 0.9) {
                        wordMatches++;
                        break;
                    }
                }
            }
            
            const wordMatchRatio = wordMatches / Math.max(userWords.length, correctWords.length);
            console.log(`[FAMILY100] Word match ratio: ${wordMatchRatio}`);
            
            if (wordMatchRatio >= 0.7) {
                console.log('[FAMILY100] ✅ Answer accepted by word matching!');
                return { correct: true, message: "Jawaban benar!" };
            }
        }
    }
    
    console.log('[FAMILY100] ❌ Answer rejected');
    return { correct: false, message: "Jawaban salah! Coba lagi." };
}

// Fungsi utama untuk memulai game
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
        console.log('[FAMILY100] Starting new game...');
        const url = `${config.baseURL}/game/famili100/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Soal lagi kosong!' });
            return;
        }
        
        const question = data.data[Math.floor(Math.random() * data.data.length)];
        console.log('[FAMILY100] Question:', question.soal);
        console.log('[FAMILY100] Answers:', question.jawaban);
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now()
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        const teks = `🎮 *Family100 Dimulai oleh @${starterName}!*\n\n*Soal:*\n${question.soal}\n\n*Petunjuk:*\n• ⚠️ REPLY pesan ini dengan jawaban\n• 1 jawaban benar = ronde selesai\n• Timeout: 20 detik\n• Starter: @${starterName}`;
        
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
            await bot.sendMessage(chatId, { 
                text: `⏰ *Waktu habis!* Ronde selesai tanpa jawaban.\n\nMain lagi? .family100` 
            });
        }, 20000);
        
    } catch (error) {
        console.error('[FAMILY100] Error:', error);
        await bot.sendMessage(chatId, { text: '❌ Server error!' });
    }
}

// Fungsi untuk stop game
async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .family100` 
    });
}

module.exports = {
    command: ['family100', 'f100'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['family100'],
    description: 'Main Family100 bareng-bareng!',
    gameType: GAME_TYPE, // Important for Game Manager registration
    
    // Function untuk Game Manager
    checkAnswer,
    
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
                    text: `⚠️ Tidak ada game Family100 yang aktif!` 
                });
            }
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};