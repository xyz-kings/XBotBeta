const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Game Type
const GAME_TYPE = 'susunkata';

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
    const threshold = 0.7; // Threshold lebih rendah untuk susun kata
    
    console.log(`[SUSUN KATA] Checking: "${userAnswer}" vs "${correctAnswer}"`);
    
    // Cek similarity langsung
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[SUSUN KATA] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `🎯 **Jawaban:** ${correctAnswer}`,
            similarity: simScore
        };
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
        console.log(`[SUSUN KATA] Word match ratio: ${wordMatchRatio}`);
        
        if (wordMatchRatio >= 0.6) {
            return {
                correct: true,
                message: `🎯 **Jawaban:** ${correctAnswer}\n📝 **Kata kunci cocok:** ${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata`,
                similarity: wordMatchRatio
            };
        }
    }
    
    return {
        correct: false,
        message: `❌ Salah! Coba susun lagi.\n💡 **Petunjuk:** Tipe: ${question.tipe}`,
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
        console.log('[SUSUN KATA] Starting new game...');
        const url = `${config.baseURL}/game/susunkata/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Soal lagi kosong!' });
            return;
        }
        
        const question = data.data[Math.floor(Math.random() * data.data.length)];
        console.log('[SUSUN KATA] Soal:', question.soal);
        console.log('[SUSUN KATA] Jawaban:', question.jawaban);
        console.log('[SUSUN KATA] Tipe:', question.tipe);
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now(),
            hintsUsed: 0,
            maxHints: 2,
            wrongAttempts: 0
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        const teks = `🔠 *SUSUN KATA* - Dimulai oleh @${starterName}!\n\n*Susun huruf ini menjadi kata yang benar:*\n\n📝 *Huruf Acak:*\n\`${question.soal}\`\n\n🏷️ *Tipe:* ${question.tipe}\n\n*Petunjuk:*\n• Reply pesan ini dengan jawaban\n• Contoh: "DOKTER" atau "MOBIL"\n• Waktu: 30 detik\n• Hint: ketik "hint" untuk petunjuk\n• Starter: @${starterName}`;
        
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
                        text: `⏰ *Waktu habis!*\n\n🔠 **Jawaban yang benar:**\n${question.jawaban}\n\n🔄 Main lagi? .susunkata` 
                    });
                    
                    await gameManager.stopGame(chatId, 'timeout');
                }
            } catch (error) {
                console.error('[SUSUN KATA] Timeout callback error:', error);
            }
        }, 30000);
        
    } catch (error) {
        console.error('[SUSUN KATA] Error:', error);
        await bot.sendMessage(chatId, { text: '❌ Server error!' });
    }
}

// Fungsi untuk stop game
async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .susunkata` 
    });
}

// Handler untuk memberikan hint
async function giveHint(bot, chatId, gameData) {
    const question = gameData.data.currentQuestion;
    const hintsUsed = gameData.data.hintsUsed || 0;
    const maxHints = gameData.data.maxHints || 2;
    
    if (hintsUsed >= maxHints) {
        await bot.sendMessage(chatId, {
            text: `ℹ️ *Hint habis!*\nKamu sudah menggunakan semua hint (${maxHints}).\nCoba susun sendiri ya!`
        });
        return;
    }
    
    // Berikan hint berdasarkan jawaban
    const answer = question.jawaban;
    const answerLength = answer.length;
    const tipe = question.tipe;
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Panjang kata dan huruf pertama
        const firstLetter = answer.charAt(0).toUpperCase();
        hint = `💡 *Hint 1:*\n• Kata terdiri dari ${answerLength} huruf\n• Huruf pertama: ${firstLetter}`;
    } else if (hintsUsed === 2) {
        // Hint 2: Huruf pertama dan terakhir + definisi tipe
        const firstLetter = answer.charAt(0).toUpperCase();
        const lastLetter = answer.charAt(answerLength - 1).toUpperCase();
        
        // Penjelasan tipe
        let tipeDesc = '';
        switch(tipe.toLowerCase()) {
            case 'profesi': tipeDesc = '📋 *Profesi/Pekerjaan*'; break;
            case 'benda': tipeDesc = '🛠️ *Benda/Barang*'; break;
            case 'hewan': tipeDesc = '🐾 *Hewan/Animal*'; break;
            case 'makanan': tipeDesc = '🍴 *Makanan/Food*'; break;
            case 'buah': tipeDesc = '🍎 *Buah/Fruit*'; break;
            case 'tempat': tipeDesc = '📍 *Tempat/Location*'; break;
            case 'sayuran': tipeDesc = '🥦 *Sayuran/Vegetable*'; break;
            case 'organ': tipeDesc = '🫁 *Organ Tubuh*'; break;
            case 'kota': tipeDesc = '🏙️ *Kota/City*'; break;
            default: tipeDesc = `📋 *${tipe}*`;
        }
        
        hint = `💡 *Hint 2:*\n• Huruf pertama: ${firstLetter}\n• Huruf terakhir: ${lastLetter}\n• ${tipeDesc}`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Masih ada ${maxHints - hintsUsed} hint tersisa.`
    });
}

// Fungsi untuk cek huruf valid
function isValidLetterSequence(sequence) {
    // Cek apakah sequence hanya mengandung huruf dan tanda hubung
    return /^[A-Za-z\-]+$/.test(sequence);
}

// Fungsi untuk shuffle huruf
function shuffleLetters(letters) {
    const lettersArray = letters.split('-');
    for (let i = lettersArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
    }
    return lettersArray.join('-');
}

module.exports = {
    command: ['susunkata', 'sk'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['susunkata'],
    description: 'Game susun huruf acak menjadi kata yang benar',
    gameType: GAME_TYPE, // Important for Game Manager registration
    
    // Function untuk Game Manager
    checkAnswer,
    
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
        
        console.log(`[SUSUN KATA COMMAND] Received: "${text}" from ${senderId}`);
        
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
                    text: `⚠️ Tidak ada game Susun Kata yang aktif!` 
                });
            }
            return;
        }
        
        // Cek jika command stats
        if (args[0] && args[0].toLowerCase() === 'stats') {
            try {
                const statsText = await gameManager.getUserStats(senderId);
                await bot.sendMessage(chatId, {
                    text: statsText,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[SUSUN KATA] Error getting stats:', error);
            }
            return;
        }
        
        // Cek jika command leaderboard
        if (args[0] && args[0].toLowerCase() === 'leaderboard' || args[0] === 'lb') {
            try {
                const limit = parseInt(args[1]) || 10;
                const leaderboardText = await gameManager.getLeaderboard(limit);
                await bot.sendMessage(chatId, {
                    text: leaderboardText
                });
            } catch (error) {
                console.error('[SUSUN KATA] Error getting leaderboard:', error);
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
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .susunkata`
                });
                return;
            }
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🎮 *BANTUAN GAME SUSUN KATA*\n\n*Commands:*\n• .susunkata - Mulai game baru\n• .susunkata stop - Stop game aktif\n• .susunkata stats - Lihat statistik\n• .susunkata leaderboard [angka] - Lihat leaderboard\n• .susunkata hint - Minta petunjuk (saat game aktif)\n\n*Cara Main:*\n1. Ketik .susunkata untuk mulai\n2. Bot akan memberikan huruf acak\n3. Susun huruf menjadi kata yang benar\n4. REPLY pesan game dengan jawabanmu\n\n*Tips:*\n• Jawaban dalam huruf KAPITAL\n• Perhatikan tipe kata (Profesi, Benda, dll)\n• Batas waktu: 30 detik\n• Starter yang salah kena penalti -1 poin`
            });
            return;
        }
        
        // Cek jika command shuffle (hanya saat game aktif)
        if ((args[0] && args[0].toLowerCase() === 'shuffle') || text.toLowerCase() === 'shuffle') {
            const gameData = gameManager.getActiveGame(chatId);
            if (gameData && gameData.type === GAME_TYPE) {
                const question = gameData.data.currentQuestion;
                const shuffledLetters = shuffleLetters(question.soal);
                
                await bot.sendMessage(chatId, {
                    text: `🔀 *Huruf diacak ulang:*\n\`${shuffledLetters}\`\n\nCoba susun lagi!`
                });
                return;
            } else {
                await bot.sendMessage(chatId, {
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .susunkata`
                });
                return;
            }
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};

// Handler untuk jawaban salah (extension untuk Game Manager)
async function handleWrongAnswer(bot, chatId, userId, gameData, result) {
    // Game Manager sudah menangani semua sistem rank, ban, dan poin
    // Kita hanya perlu mengirim pesan tambahan jika perlu
    const question = gameData.data.currentQuestion;
    const wrongAttempts = gameData.data.wrongAttempts || 0;
    
    gameData.data.wrongAttempts = wrongAttempts + 1;
    
    // Berikan petunjuk setelah beberapa kesalahan
    if (wrongAttempts >= 2) {
        const answer = question.jawaban;
        const answerLength = answer.length;
        
        await bot.sendMessage(chatId, {
            text: `${result.message}\n\n💡 *Tips:* Kata terdiri dari ${answerLength} huruf. Coba pikirkan ${question.tipe.toLowerCase()} apa yang sesuai.`
        });
    }
}

// Handler untuk jawaban benar (extension untuk Game Manager)
async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    // Game Manager sudah menangani semua sistem rank, ban, dan poin
    // Kita hanya perlu mengirim pesan tambahan jika perlu
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    
    // Tampilkan pesan khusus untuk jawaban benar
    let extraMessage = '';
    if (result.similarity < 0.9) {
        extraMessage = `\n📝 *Catatan:* Jawabanmu mendekati ("${result.userAnswer}") tetapi yang benar adalah "${question.jawaban}"`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${result.message}${extraMessage}\n\n🎯 @${userName} berhasil menyusun kata!\n🔄 Main lagi? Ketik .susunkata!`,
        mentions: [userId]
    });
}