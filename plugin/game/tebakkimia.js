const fetch = require('node-fetch');
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Game Type
const GAME_TYPE = 'tebakkimia';

// ======================
// FUNGSI UTAMA GAME
// ======================

// Fungsi untuk normalisasi teks (sama seperti di Game Manager)
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
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

// ======================
// FUNGSI CHECK ANSWER (UNTUK GAME MANAGER)
// ======================

async function checkAnswer(userAnswer, gameData) {
    const question = gameData.currentQuestion;
    const correctAnswer = question.nama;  // Nama unsur kimia
    const symbol = question.lambang;      // Lambang unsur
    
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    const threshold = 0.75;  // Threshold untuk tebak kimia
    
    console.log(`[TEBAK KIMIA] Checking: "${userAnswer}" vs "${correctAnswer}" (${symbol})`);
    console.log(`[TEBAK KIMIA] Normalized: "${normalizedUser}" vs "${normalizedCorrect}"`);
    
    // Cek similarity langsung dengan nama
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[TEBAK KIMIA] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `⚗️ *Jawaban Benar!*\n🔬 **Unsur:** ${correctAnswer}\n🧪 **Lambang:** ${symbol}\n📚 **ID Unsur:** ${question.id}`,
            similarity: simScore
        };
    }
    
    // Cek apakah user menjawab dengan lambang unsur
    if (normalizedUser === symbol.toLowerCase()) {
        console.log(`[TEBAK KIMIA] ✅ Accepted via symbol: ${symbol}`);
        return {
            correct: true,
            message: `⚗️ *Jawaban Benar!*\n🔬 **Unsur:** ${correctAnswer}\n🧪 **Lambang:** ${symbol}\n✅ **Diterima via lambang kimia**`,
            similarity: 1
        };
    }
    
    // Cek kata per kata untuk nama unsur yang panjang
    const userWords = normalizedUser.split(' ').filter(w => w.length > 0);
    const correctWords = normalizedCorrect.split(' ').filter(w => w.length > 0);
    
    if (userWords.length > 0 && correctWords.length > 0) {
        let wordMatches = 0;
        for (const uWord of userWords) {
            for (const cWord of correctWords) {
                if (similarity(uWord, cWord) >= 0.85) {
                    wordMatches++;
                    break;
                }
            }
        }
        
        const wordMatchRatio = wordMatches / Math.max(userWords.length, correctWords.length);
        console.log(`[TEBAK KIMIA] Word match ratio: ${wordMatchRatio} (${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata)`);
        
        if (wordMatchRatio >= 0.8) {
            return {
                correct: true,
                message: `⚗️ *Jawaban Benar!*\n🔬 **Unsur:** ${correctAnswer}\n🧪 **Lambang:** ${symbol}\n✅ **Kata kunci cocok:** ${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata`,
                similarity: wordMatchRatio
            };
        }
    }
    
    // Berikan clue jika ada kata yang mendekati
    const correctWordsArray = correctWords;
    const matchedWords = [];
    
    for (const uWord of userWords) {
        for (const cWord of correctWordsArray) {
            if (similarity(uWord, cWord) >= 0.7) {
                matchedWords.push(cWord);
            }
        }
    }
    
    let hintMessage = '❌ *Salah!* Coba tebak lagi.\n';
    if (matchedWords.length > 0) {
        hintMessage += `💡 **Kata yang hampir benar:** ${matchedWords.slice(0, 2).join(', ')}\n`;
    }
    hintMessage += `🔬 **Petunjuk:** Lambangnya adalah "${symbol}"\n`;
    hintMessage += `📏 **Panjang nama:** ${correctAnswer.length} huruf`;
    
    return {
        correct: false,
        message: hintMessage,
        similarity: simScore
    };
}

// ======================
// FUNGSI MEMULAI GAME
// ======================

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
        console.log('[TEBAK KIMIA] Starting new game...');
        
        // Ambil data dari API
        const url = `${config.baseURL}/game/tebakkimia/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Data soal tebak kimia kosong!' });
            return;
        }
        
        // Pilih soal random
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const question = data.data[randomIndex];
        
        console.log('[TEBAK KIMIA] Question ID:', question.id);
        console.log('[TEBAK KIMIA] Element:', question.nama);
        console.log('[TEBAK KIMIA] Symbol:', question.lambang);
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now(),
            hintsUsed: 0,
            maxHints: 2
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        
        // Tampilkan lambang unsur yang harus ditebak
        const teks = `⚗️ *TEBAK UNSUR KIMIA* 🔬\n\n🧪 *Lambang Unsur:*\n**${question.lambang}**\n\n👤 *Starter:* @${starterName}\n⏱️ *Waktu:* 30 detik\n💡 *Hint:* Ketik "hint" (maks 2x)\n🛑 *Stop:* .tebakkimia stop\n\n📝 *Cara Bermain:*\n1. Lihat lambang unsur di atas\n2. REPLY pesan ini dengan nama unsur\n3. Contoh jawaban: "${question.nama}"\n4. Bisa jawab dengan nama atau lambang\n5. Dapatkan +1 poin jika benar!\n\n⚠️ *Peraturan:*\n• Starter salah = -1 poin\n• Salah 3x = ban 1 jam\n• Bukan starter = tidak kena penalti`;
        
        const gameMessage = await bot.sendMessage(chatId, { 
            text: teks, 
            mentions: [senderId] 
        });
        
        // Set game message ID untuk reply tracking
        if (gameMessage.key && gameMessage.key.id) {
            gameManager.setGameMessage(chatId, gameMessage.key.id);
        }
        
        // Set timeout via Game Manager (30 detik untuk tebak kimia)
        gameManager.setTimeout(chatId, async () => {
            try {
                const gameData = gameManager.getActiveGame(chatId);
                if (gameData && gameData.type === GAME_TYPE) {
                    const question = gameData.data.currentQuestion;
                    
                    await bot.sendMessage(chatId, { 
                        text: `⏰ *Waktu habis!*\n\n⚗️ **Jawaban yang benar:**\n🔬 ${question.nama} (${question.lambang})\n\n🔄 Main lagi? .tebakkimia` 
                    });
                    
                    await gameManager.stopGame(chatId, 'timeout');
                }
            } catch (error) {
                console.error('[TEBAK KIMIA] Timeout callback error:', error);
            }
        }, 30000); // 30 detik
        
    } catch (error) {
        console.error('[TEBAK KIMIA] Error:', error);
        await bot.sendMessage(chatId, { 
            text: '❌ Error memulai game! ' + (error.message || 'API tidak merespon') 
        });
    }
}

// ======================
// FUNGSI STOP GAME
// ======================

async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .tebakkimia` 
    });
}

// ======================
// FUNGSI HINT
// ======================

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
    
    // Berikan hint berdasarkan unsur
    const element = question.nama;
    const symbol = question.lambang;
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Huruf pertama dan terakhir
        const firstLetter = element.charAt(0).toUpperCase();
        const lastLetter = element.charAt(element.length - 1).toUpperCase();
        hint = `💡 *Hint 1:*\n• Huruf pertama: **${firstLetter}**\n• Huruf terakhir: **${lastLetter}**\n• Panjang nama: ${element.length} huruf`;
    } else if (hintsUsed === 2) {
        // Hint 2: Kategori unsur dan nomor atom (dari ID)
        const elementLength = element.length;
        const firstHalf = element.substring(0, Math.ceil(elementLength / 2));
        const secondHalf = element.substring(Math.ceil(elementLength / 2));
        
        hint = `💡 *Hint 2:*\n• Bagian pertama: **${firstHalf}...**\n• Bagian kedua: **...${secondHalf}**\n• Lambang: **${symbol}**\n• ID Unsur: ${question.id}`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Sisa hint: ${maxHints - hintsUsed}`
    });
}

// ======================
// HANDLER UNTUK GAME MANAGER
// ======================

async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    
    const message = `🎉 *BENAR!* @${userName} menjawab dengan tepat!\n\n${result.message}\n\n➕ *+1 poin*\n⚗️ Unsur kimia berhasil ditebak!\n\n🔄 Main lagi? Ketik .tebakkimia!`;
    
    await bot.sendMessage(chatId, {
        text: message,
        mentions: [userId]
    });
}

async function handleWrongAnswer(bot, chatId, userId, gameData, result) {
    const userName = userId.split('@')[0];
    
    await bot.sendMessage(chatId, {
        text: result.message,
        mentions: [userId]
    });
}

// ======================
// MODULE EXPORT
// ======================

module.exports = {
    command: ['tebakkimia', 'kimia', 'unsur'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['tebakkimia'],
    description: 'Game tebak nama unsur kimia berdasarkan lambangnya',
    gameType: GAME_TYPE, // Penting untuk registrasi Game Manager
    
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
        
        console.log(`[TEBAK KIMIA COMMAND] Received: "${text}" from ${senderId}`);
        
        // Cek jika command stop
        if (args[0] && args[0].toLowerCase() === 'stop') {
            const gameData = gameManager.getActiveGame(chatId);
            if (gameData && gameData.type === GAME_TYPE) {
                if (gameData.data.starter === senderId || m.key.fromMe) {
                    await stopGame(bot, chatId);
                } else {
                    await bot.sendMessage(chatId, { 
                        text: `⚠️ Hanya starter game yang bisa stop game!` 
                    });
                }
            } else {
                await bot.sendMessage(chatId, { 
                    text: `⚠️ Tidak ada game Tebak Kimia yang aktif!` 
                });
            }
            return;
        }
        
        // Cek jika command stats
        if (args[0] && args[0].toLowerCase() === 'stats') {
            try {
                const statsText = await gameManager.getUserStats(senderId);
                await bot.sendMessage(chatId, {
                    text: `⚗️ *STATISTIK TEBAK KIMIA*\n\n${statsText}\n\n🔬 *Tips:*\n• Hafalkan lambang unsur umum\n• Bisa jawab dengan nama atau lambang\n• Waktu 30 detik per soal`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[TEBAK KIMIA] Error getting stats:', error);
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
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .tebakkimia`
                });
                return;
            }
        }
        
        // Cek jika command leaderboard
        if (args[0] && (args[0].toLowerCase() === 'leaderboard' || args[0] === 'lb' || args[0] === 'top')) {
            try {
                const leaderboard = await gameManager.getLeaderboard(10);
                await bot.sendMessage(chatId, {
                    text: `🏆 *LEADERBOARD TEBAK KIMIA* ⚗️\n\n${leaderboard}\n\n🔬 Main game untuk naik peringkat! .tebakkimia`
                });
            } catch (error) {
                console.error('[TEBAK KIMIA] Error getting leaderboard:', error);
            }
            return;
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `⚗️ *BANTUAN GAME TEBAK KIMIA* 🔬\n\n*Commands:*\n• .tebakkimia - Mulai game baru\n• .tebakkimia stop - Stop game aktif (hanya starter)\n• .tebakkimia stats - Lihat statistik\n• .tebakkimia hint - Minta petunjuk (saat game aktif)\n• .tebakkimia leaderboard - Lihat peringkat global\n\n*Cara Main:*\n1. Ketik .tebakkimia untuk mulai\n2. Bot akan menampilkan LAMBANG unsur kimia\n3. REPLY dengan NAMA unsur tersebut\n4. Bisa juga jawab dengan LAMBANG unsur\n5. Sistem akan otomatis cek jawaban\n\n*Contoh:*\nLambang: **Na**\nJawaban: "Natrium" atau "Na"\n\n*Peraturan:*\n• Waktu: 30 detik\n• Starter benar: +1 poin\n• Starter salah: -1 poin\n• Bukan starter: tidak kena penalti\n• Salah 3x berturut-turut: ban 1 jam\n\n*Sistem Integrasi:*\n• Poin masuk ke sistem rank GLOBAL\n• Data game disimpan otomatis\n• Ban system terintegrasi`
            });
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};