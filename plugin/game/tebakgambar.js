const fs = require('fs').promises;
const path = require('path');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Path database
const tebakGambarJsonPath = path.join(__dirname, '../../DataDase/GameJson/tebakgambar.json');

// Game Type
const GAME_TYPE = 'tebakgambar';

// Fungsi untuk normalisasi teks
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

// Fungsi untuk cek similarity (sama seperti di Game Manager)
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
    const threshold = 0.7; // Threshold untuk tebak gambar
    
    console.log(`[TEBAK GAMBAR] Checking: "${userAnswer}" vs "${correctAnswer}"`);
    console.log(`[TEBAK GAMBAR] Normalized: "${normalizedUser}" vs "${normalizedCorrect}"`);
    
    // Cek similarity langsung
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[TEBAK GAMBAR] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `🎯 *Jawaban Benar!*\n📝 **Jawaban:** ${correctAnswer}\n💡 **Deskripsi:** ${question.deskripsi || 'Tidak ada deskripsi'}`,
            similarity: simScore
        };
    }
    
    // Cek kata per kata untuk jawaban multi-kata
    const userWords = normalizedUser.split(' ').filter(w => w.length > 0);
    const correctWords = normalizedCorrect.split(' ').filter(w => w.length > 0);
    
    if (userWords.length > 0 && correctWords.length > 0) {
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
        console.log(`[TEBAK GAMBAR] Word match ratio: ${wordMatchRatio} (${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata)`);
        
        // Untuk tebak gambar yang jawabannya panjang, lebih longgar
        if (wordMatchRatio >= 0.6 && wordMatches >= 2) {
            return {
                correct: true,
                message: `🎯 *Jawaban Benar!*\n📝 **Jawaban:** ${correctAnswer}\n✅ **Kata kunci cocok:** ${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata\n💡 **Deskripsi:** ${question.deskripsi || 'Tidak ada deskripsi'}`,
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
        hintMessage += `💡 **Kata yang hampir benar:** ${matchedWords.slice(0, 3).join(', ')}\n`;
    }
    hintMessage += `🎨 **Petunjuk:** ${question.deskripsi ? question.deskripsi.substring(0, 100) + (question.deskripsi.length > 100 ? '...' : '') : 'Perhatikan gambar dengan seksama!'}`;
    
    return {
        correct: false,
        message: hintMessage,
        similarity: simScore
    };
}

// Baca data tebak gambar dari file JSON
async function readTebakGambarData() {
    try {
        await fs.mkdir(path.dirname(tebakGambarJsonPath), { recursive: true });
        const data = await fs.readFile(tebakGambarJsonPath, 'utf8');
        if (!data.trim()) {
            console.error('[TEBAK GAMBAR] File JSON kosong!');
            return [];
        }
        
        const parsedData = JSON.parse(data);
        console.log(`[TEBAK GAMBAR] Loaded ${parsedData.length} questions from JSON`);
        return parsedData;
    } catch (error) {
        console.error('[TEBAK GAMBAR] Error reading tebakgambar.json:', error.message);
        
        // Return data default jika file tidak ada
        return [
            {
                "index": 0,
                "img": "https://www.cademedia.com/wp-content/uploads/2020/12/tebak-gambar-level-1-nomor-1.jpg",
                "jawaban": "TANTANGAN SERU",
                "deskripsi": "Gambar tang (huruf G dicoret), tangan dan tanda seru (pentung)."
            },
            {
                "index": 1,
                "img": "https://www.cademedia.com/wp-content/uploads/2020/12/tebak-gambar-level-1-nomor-2.jpg",
                "jawaban": "TENAGA LISTRIK",
                "deskripsi": "Gambar huruf TE, ular naga dan tegangan listrik (petir)."
            }
        ];
    }
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
        console.log('[TEBAK GAMBAR] Starting new game...');
        
        // Baca data dari file JSON
        const questions = await readTebakGambarData();
        
        if (questions.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Data soal tebak gambar kosong!' });
            return;
        }
        
        // Pilih soal random
        const randomIndex = Math.floor(Math.random() * questions.length);
        const question = questions[randomIndex];
        
        console.log('[TEBAK GAMBAR] Question index:', question.index);
        console.log('[TEBAK GAMBAR] Answer:', question.jawaban);
        console.log('[TEBAK GAMBAR] Image URL:', question.img);
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now(),
            hintsUsed: 0,
            maxHints: 3
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        
        // Kirim gambar terlebih dahulu
        try {
            await bot.sendMessage(chatId, {
                image: { url: question.img },
                caption: `🎨 *TEBAK GAMBAR*\n\n👤 Starter: @${starterName}\n🔢 Soal ke-${question.index + 1}\n\n*Reply pesan di bawah dengan jawabanmu!*`,
                mentions: [senderId]
            });
        } catch (imageError) {
            console.error('[TEBAK GAMBAR] Error sending image:', imageError);
            await bot.sendMessage(chatId, {
                text: `❌ Gagal mengirim gambar!\nURL: ${question.img}\n\nSilakan coba lagi.`
            });
            await gameManager.stopGame(chatId, 'image_error');
            return;
        }
        
        // Kirim pesan instruksi game
        const teks = `🎮 *GAME TEBAK GAMBAR DIMULAI!*\n\n👤 *Starter:* @${starterName}\n⏱️ *Waktu:* 60 detik\n💡 *Hint:* Ketik "hint" (maks 3x)\n🛑 *Stop:* .tebakgambar stop\n\n📝 *Cara Bermain:*\n1. Lihat gambar di atas\n2. Reply pesan ini dengan jawabanmu\n3. Contoh jawaban: "${question.jawaban.split(' ')[0]} ..."\n4. Dapatkan +1 poin jika benar!\n\n⚠️ *Peraturan:*\n• Starter salah = -1 poin\n• Salah 3x = ban 1 jam\n• Bukan starter = tidak kena penalti`;
        
        const gameMessage = await bot.sendMessage(chatId, { 
            text: teks, 
            mentions: [senderId] 
        });
        
        // Set game message ID untuk reply tracking
        if (gameMessage.key && gameMessage.key.id) {
            gameManager.setGameMessage(chatId, gameMessage.key.id);
        }
        
        // Set timeout via Game Manager (60 detik untuk tebak gambar)
        gameManager.setTimeout(chatId, async () => {
            try {
                const gameData = gameManager.getActiveGame(chatId);
                if (gameData && gameData.type === GAME_TYPE) {
                    const question = gameData.data.currentQuestion;
                    
                    await bot.sendMessage(chatId, { 
                        text: `⏰ *Waktu habis!*\n\n🎯 **Jawaban yang benar:**\n${question.jawaban}\n\n💡 **Deskripsi:**\n${question.deskripsi || 'Tidak ada deskripsi'}\n\n🔄 Main lagi? .tebakgambar` 
                    });
                }
            } catch (error) {
                console.error('[TEBAK GAMBAR] Timeout callback error:', error);
            }
        }, 60000); // 60 detik
        
    } catch (error) {
        console.error('[TEBAK GAMBAR] Error:', error);
        await bot.sendMessage(chatId, { text: '❌ Error memulai game! ' + error.message });
    }
}

// Fungsi untuk stop game
async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .tebakgambar` 
    });
}

// Fungsi untuk memberikan hint
async function giveHint(bot, chatId, gameData) {
    const question = gameData.data.currentQuestion;
    const hintsUsed = gameData.data.hintsUsed || 0;
    const maxHints = gameData.data.maxHints || 3;
    
    if (hintsUsed >= maxHints) {
        await bot.sendMessage(chatId, {
            text: `ℹ️ *Hint habis!*\nKamu sudah menggunakan semua hint (${maxHints}).\nCoba tebak sendiri ya!`
        });
        return;
    }
    
    // Berikan hint berdasarkan jawaban
    const answer = question.jawaban;
    const answerWords = answer.split(' ').filter(w => w.length > 0);
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Jumlah kata dan huruf
        const totalLetters = answer.replace(/\s/g, '').length;
        hint = `💡 *Hint 1:*\n• Jawaban terdiri dari ${answerWords.length} kata\n• Total ${totalLetters} huruf\n• Kata pertama: "${answerWords[0]}"`;
    } else if (hintsUsed === 2) {
        // Hint 2: Kata pertama dan terakhir
        const firstWord = answerWords[0];
        const lastWord = answerWords[answerWords.length - 1];
        hint = `💡 *Hint 2:*\n• Kata pertama: "${firstWord}" (${firstWord.length} huruf)\n• Kata terakhir: "${lastWord}" (${lastWord.length} huruf)`;
    } else if (hintsUsed === 3) {
        // Hint 3: Huruf pertama setiap kata
        const firstLetters = answerWords.map(word => word.charAt(0).toUpperCase()).join(' ');
        hint = `💡 *Hint 3:*\n• Huruf pertama setiap kata: ${firstLetters}\n• Deskripsi: ${question.deskripsi ? question.deskripsi.substring(0, 150) + (question.deskripsi.length > 150 ? '...' : '') : 'Lihat gambar dengan teliti!'}`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Sisa hint: ${maxHints - hintsUsed}`
    });
}

// Handler untuk jawaban benar (extension untuk Game Manager)
async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    
    const message = `🎉 *BENAR!* @${userName} jawab benar!\n\n${result.message}\n\n🔄 Main lagi? Ketik .tebakgambar!`;
    
    await bot.sendMessage(chatId, {
        text: message,
        mentions: [userId]
    });
}

// Handler untuk jawaban salah (extension untuk Game Manager)
async function handleWrongAnswer(bot, chatId, userId, gameData, result) {
    const userName = userId.split('@')[0];
    
    await bot.sendMessage(chatId, {
        text: result.message,
        mentions: [userId]
    });
}

module.exports = {
    command: ['tebakgambar', 'tebakgbr', 'tg'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['tebakgambar'],
    description: 'Game tebak gambar dengan sistem poin dan rank',
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
        
        console.log(`[TEBAK GAMBAR COMMAND] Received: "${text}" from ${senderId}`);
        
        // Cek jika command stop
        if (args[0] && args[0].toLowerCase() === 'stop') {
            // Cek apakah user adalah starter game
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
                    text: `⚠️ Tidak ada game Tebak Gambar yang aktif!` 
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
                console.error('[TEBAK GAMBAR] Error getting stats:', error);
            }
            return;
        }
        
        // Cek jika command hint (hanya saat game aktif)
        if ((args[0] && args[0].toLowerCase() === 'hint') || text.toLowerCase() === 'hint') {
            const gameData = gameManager.getActiveGame(chatId);
            if (gameData && gameData.type === GAME_TYPE) {
                // Cek apakah user adalah peserta game
                const starterName = gameData.data.starter.split('@')[0];
                await bot.sendMessage(chatId, {
                    text: `💡 @${starterName} menggunakan hint!`,
                    mentions: [gameData.data.starter]
                });
                await giveHint(bot, chatId, gameData);
                return;
            } else {
                await bot.sendMessage(chatId, {
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .tebakgambar`
                });
                return;
            }
        }
        
        // Cek jika command leaderboard
        if (args[0] && (args[0].toLowerCase() === 'leaderboard' || args[0] === 'lb' || args[0] === 'top')) {
            try {
                const leaderboard = await gameManager.getLeaderboard(10);
                await bot.sendMessage(chatId, {
                    text: leaderboard
                });
            } catch (error) {
                console.error('[TEBAK GAMBAR] Error getting leaderboard:', error);
            }
            return;
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🎮 *BANTUAN GAME TEBAK GAMBAR*\n\n*Commands:*\n• .tebakgambar - Mulai game baru\n• .tebakgambar stop - Stop game aktif (hanya starter)\n• .tebakgambar stats - Lihat statistik\n• .tebakgambar hint - Minta petunjuk (saat game aktif)\n• .tebakgambar leaderboard - Lihat peringkat global\n\n*Cara Main:*\n1. Ketik .tebakgambar untuk mulai\n2. Bot akan mengirim gambar\n3. REPLY pesan game dengan jawabanmu\n4. Gunakan "hint" jika bingung (max 3x)\n5. Sistem akan otomatis cek jawaban\n\n*Peraturan:*\n• Waktu: 60 detik\n• Starter benar: +1 poin\n• Starter salah: -1 poin\n• Bukan starter: tidak kena penalti\n• Salah 3x berturut-turut: ban 1 jam\n\n*Sistem Rank Global:*\n• Poin dari semua game terkumpul\n• Naik rank berdasarkan total poin\n• Lihat rank dengan .tebakgambar stats`
            });
            return;
        }
        
        // Cek jika command list (untuk debug)
        if (args[0] && args[0].toLowerCase() === 'list') {
            try {
                const questions = await readTebakGambarData();
                await bot.sendMessage(chatId, {
                    text: `📊 *Data Tebak Gambar*\n\nTotal soal: ${questions.length}\n\nContoh soal:\n1. ${questions[0]?.jawaban || 'Tidak ada'}\n2. ${questions[1]?.jawaban || 'Tidak ada'}\n3. ${questions[2]?.jawaban || 'Tidak ada'}\n\nGunakan .tebakgambar untuk main!`
                });
            } catch (error) {
                console.error('[TEBAK GAMBAR] Error getting list:', error);
            }
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};