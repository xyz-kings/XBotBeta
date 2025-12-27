const fetch = require('node-fetch');
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Game Type
const GAME_TYPE = 'tebaklirik';

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
    const correctAnswer = question.answer;
    const questionText = question.question;
    
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    const threshold = 0.8;  // Threshold tinggi untuk tebak lirik (harus akurat)
    
    console.log(`[TEBAK LIRIK] Checking: "${userAnswer}" vs "${correctAnswer}"`);
    console.log(`[TEBAK LIRIK] Normalized: "${normalizedUser}" vs "${normalizedCorrect}"`);
    
    // Cek similarity langsung
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[TEBAK LIRIK] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `🎵 *LIRIK TERISI SEMPURNA!*\n\n📝 **Lirik lengkap:**\n${questionText.replace('_____', `*${correctAnswer}*`)}\n\n🎤 **Jawaban:** ${correctAnswer}`,
            similarity: simScore
        };
    }
    
    // Cek apakah jawaban user adalah sinonim yang umum (untuk kata kerja)
    const synonyms = {
        'memaksa': ['paksa', 'memaksakan', 'desak'],
        'ungkapkan': ['ungkap', 'katakan', 'sampaikan', 'utarakan'],
        'senyum': ['senyuman', 'tersenyum', 'senyam'],
        'bayangkan': ['bayang', 'membayangkan', 'pikirkan'],
        'lakukan': ['kerjakan', 'buat', 'laksanakan'],
        'pergi': ['pergian', 'meninggalkan', 'keluar'],
        'kembali': ['pulang', 'balik', 'datang kembali'],
        'temukan': ['temu', 'dapatkan', 'cari', 'temui'],
        'lengkapi': ['lengkap', 'penuhi', 'sempurnakan'],
        'memanggil': ['panggil', 'sebut', 'memanggil-manggil']
    };
    
    // Cek sinonim
    if (synonyms[normalizedCorrect]) {
        for (const synonym of synonyms[normalizedCorrect]) {
            const synonymScore = similarity(normalizedUser, synonym);
            if (synonymScore >= 0.85) {  // Threshold lebih tinggi untuk sinonim
                console.log(`[TEBAK LIRIK] ✅ Accepted via synonym: ${synonym} (score: ${synonymScore})`);
                return {
                    correct: true,
                    message: `🎵 *LIRIK TERISI SEMPURNA!*\n\n📝 **Lirik lengkap:**\n${questionText.replace('_____', `*${correctAnswer}*`)}\n\n🎤 **Jawaban:** ${correctAnswer}\n✅ **Diterima via sinonim:** ${synonym}`,
                    similarity: synonymScore
                };
            }
        }
    }
    
    // Cek kata per kata untuk jawaban multi-kata
    const userWords = normalizedUser.split(' ').filter(w => w.length > 0);
    const correctWords = normalizedCorrect.split(' ').filter(w => w.length > 0);
    
    if (userWords.length > 0 && correctWords.length > 0) {
        let wordMatches = 0;
        for (const uWord of userWords) {
            for (const cWord of correctWords) {
                if (similarity(uWord, cWord) >= 0.9) {  // Threshold tinggi untuk kata per kata
                    wordMatches++;
                    break;
                }
            }
        }
        
        const wordMatchRatio = wordMatches / Math.max(userWords.length, correctWords.length);
        console.log(`[TEBAK LIRIK] Word match ratio: ${wordMatchRatio} (${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata)`);
        
        if (wordMatchRatio >= 0.9 && wordMatches === correctWords.length) {
            return {
                correct: true,
                message: `🎵 *LIRIK TERISI SEMPURNA!*\n\n📝 **Lirik lengkap:**\n${questionText.replace('_____', `*${correctAnswer}*`)}\n\n🎤 **Jawaban:** ${correctAnswer}\n✅ **Semua kata cocok**`,
                similarity: wordMatchRatio
            };
        }
    }
    
    // Berikan clue berdasarkan jawaban
    const correctWordsArray = correctWords;
    const matchedWords = [];
    
    for (const uWord of userWords) {
        for (const cWord of correctWordsArray) {
            if (similarity(uWord, cWord) >= 0.7) {
                matchedWords.push(cWord);
            }
        }
    }
    
    let hintMessage = '❌ *Salah!* Lirik belum tepat.\n';
    if (matchedWords.length > 0) {
        hintMessage += `💡 **Kata yang mendekati:** ${matchedWords.join(', ')}\n`;
    }
    
    // Berikan hint berdasarkan jawaban
    const answerLength = correctAnswer.length;
    const firstLetter = correctAnswer.charAt(0).toUpperCase();
    
    hintMessage += `🎵 **Petunjuk:**\n`;
    hintMessage += `• Huruf pertama: **${firstLetter}**\n`;
    hintMessage += `• Panjang kata: ${answerLength} huruf\n`;
    
    if (correctWords.length > 1) {
        hintMessage += `• Jumlah kata: ${correctWords.length}\n`;
    }
    
    hintMessage += `\n🎼 **Lirik:**\n${questionText}`;
    
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
        console.log('[TEBAK LIRIK] Starting new game...');
        
        // Ambil data dari API
        const url = `${config.baseURL}/game/tebaklirik/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Data lirik lagu kosong!' });
            return;
        }
        
        // Pilih soal random
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const question = data.data[randomIndex];
        
        console.log('[TEBAK LIRIK] Question ID:', question.id);
        console.log('[TEBAK LIRIK] Question:', question.question);
        console.log('[TEBAK LIRIK] Answer:', question.answer);
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now(),
            hintsUsed: 0,
            maxHints: 2,
            apiData: data
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        
        // Format lirik dengan baris baru yang rapi
        const formattedLyrics = question.question
            .replace('_____', '___________')
            .split(', ')
            .join(',\n');
        
        // Tampilkan lirik yang harus dilengkapi
        const teks = `🎵 *TEBAK LIRIK LAGU* 🎶\n\n📜 **LIRIK:**\n${formattedLyrics}\n\n👤 *Starter:* @${starterName}\n⏱️ *Waktu:* 40 detik\n💡 *Hint:* Ketik "hint" (maks 2x)\n🛑 *Stop:* .tebaklirik stop\n\n📝 *Cara Bermain:*\n1. Lihat lirik di atas yang ada garis (___________)\n2. REPLY pesan ini dengan kata yang tepat\n3. Contoh: "${question.answer}"\n4. Dapatkan +1 poin jika benar!\n\n⚠️ *Peraturan:*\n• Starter salah = -1 poin\n• Salah 3x = ban 1 jam\n• Bukan starter = tidak kena penalti\n• Jawaban harus sesuai dengan konteks lirik`;
        
        const gameMessage = await bot.sendMessage(chatId, { 
            text: teks, 
            mentions: [senderId] 
        });
        
        // Set game message ID untuk reply tracking
        if (gameMessage.key && gameMessage.key.id) {
            gameManager.setGameMessage(chatId, gameMessage.key.id);
        }
        
        // Set timeout via Game Manager (40 detik untuk tebak lirik)
        gameManager.setTimeout(chatId, async () => {
            try {
                const gameData = gameManager.getActiveGame(chatId);
                if (gameData && gameData.type === GAME_TYPE) {
                    const question = gameData.data.currentQuestion;
                    const fullLyrics = question.question.replace('_____', `*${question.answer}*`);
                    
                    await bot.sendMessage(chatId, { 
                        text: `⏰ *Waktu habis!*\n\n🎵 **Lirik lengkap:**\n${fullLyrics}\n\n🎤 **Jawaban yang benar:**\n${question.answer}\n\n🔄 Main lagi? .tebaklirik` 
                    });
                    
                    await gameManager.stopGame(chatId, 'timeout');
                }
            } catch (error) {
                console.error('[TEBAK LIRIK] Timeout callback error:', error);
            }
        }, 40000); // 40 detik
        
    } catch (error) {
        console.error('[TEBAK LIRIK] Error:', error);
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
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .tebaklirik` 
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
    
    // Berikan hint berdasarkan jawaban
    const answer = question.answer;
    const answerWords = answer.split(' ').filter(w => w.length > 0);
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Huruf pertama dan panjang
        const firstLetter = answer.charAt(0).toUpperCase();
        hint = `💡 *Hint 1:*\n• Huruf pertama: **${firstLetter}**\n• Panjang: ${answer.length} huruf`;
        
        if (answerWords.length > 1) {
            hint += `\n• Jumlah kata: ${answerWords.length}`;
        }
    } else if (hintsUsed === 2) {
        // Hint 2: Beberapa huruf pertama dan kategori kata
        const firstThree = answer.substring(0, Math.min(3, answer.length));
        const lastTwo = answer.substring(Math.max(0, answer.length - 2));
        
        // Tentukan kategori kata
        let wordType = 'kata';
        if (answer.endsWith('kan') || answer.endsWith('i')) {
            wordType = 'kata kerja';
        } else if (answer.endsWith('nya') || answer.endsWith('mu') || answer.endsWith('ku')) {
            wordType = 'kata kepemilikan';
        } else if (answer.endsWith('lah') || answer.endsWith('kah')) {
            wordType = 'kata penegas';
        }
        
        hint = `💡 *Hint 2:*\n• Awal kata: **${firstThree.toUpperCase()}...**\n• Akhir kata: **...${lastTwo.toUpperCase()}**\n• Jenis kata: ${wordType}\n• ID Lirik: ${question.id}`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Sisa hint: ${maxHints - hintsUsed}\n\n🎼 **Ingat liriknya:**\n${question.question}`
    });
}

// ======================
// HANDLER UNTUK GAME MANAGER
// ======================

async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    
    const message = `🎉 *BENAR!* @${userName} berhasil melengkapi lirik!\n\n${result.message}\n\n➕ *+1 poin*\n🎵 Lirik lagu berhasil ditebak!\n\n🔄 Main lagi? Ketik .tebaklirik!`;
    
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
    command: ['tebaklirik', 'lirik', 'tebaklagu'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['tebaklirik'],
    description: 'Game tebak melengkapi lirik lagu Indonesia',
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
        
        console.log(`[TEBAK LIRIK COMMAND] Received: "${text}" from ${senderId}`);
        
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
                    text: `⚠️ Tidak ada game Tebak Lirik yang aktif!` 
                });
            }
            return;
        }
        
        // Cek jika command stats
        if (args[0] && args[0].toLowerCase() === 'stats') {
            try {
                const statsText = await gameManager.getUserStats(senderId);
                await bot.sendMessage(chatId, {
                    text: `🎵 *STATISTIK TEBAK LIRIK*\n\n${statsText}\n\n🎤 *Tips Bermain:*\n• Dengarkan lagu Indonesia populer\n• Perhatikan konteks lirik sebelum dan sesudah bagian kosong\n• Gunakan hint jika bingung`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[TEBAK LIRIK] Error getting stats:', error);
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
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .tebaklirik`
                });
                return;
            }
        }
        
        // Cek jika command leaderboard
        if (args[0] && (args[0].toLowerCase() === 'leaderboard' || args[0] === 'lb' || args[0] === 'top')) {
            try {
                const leaderboard = await gameManager.getLeaderboard(10);
                await bot.sendMessage(chatId, {
                    text: `🏆 *LEADERBOARD TEBAK LIRIK* 🎵\n\n${leaderboard}\n\n🎶 Main game untuk naik peringkat! .tebaklirik`
                });
            } catch (error) {
                console.error('[TEBAK LIRIK] Error getting leaderboard:', error);
            }
            return;
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🎵 *BANTUAN GAME TEBAK LIRIK* 🎶\n\n*Commands:*\n• .tebaklirik - Mulai game baru\n• .tebaklirik stop - Stop game aktif (hanya starter)\n• .tebaklirik stats - Lihat statistik\n• .tebaklirik hint - Minta petunjuk (saat game aktif)\n• .tebaklirik leaderboard - Lihat peringkat global\n\n*Cara Main:*\n1. Ketik .tebaklirik untuk mulai\n2. Bot akan menampilkan lirik dengan bagian kosong (_____)\n3. REPLY dengan kata yang tepat untuk melengkapi\n4. Sistem akan cek kecocokan jawaban\n5. Jawaban harus sesuai konteks lirik\n\n*Contoh:*\nLirik: "Ada pelangi, di bola matamu, dan _____ diri tuk bilang aku sayang padamu."\nJawaban: "Memaksa"\n\n*Peraturan:*\n• Waktu: 40 detik\n• Starter benar: +1 poin\n• Starter salah: -1 poin\n• Bukan starter: tidak kena penalti\n• Salah 3x berturut-turut: ban 1 jam\n• Threshold kecocokan: 80%\n\n*Fitur:*\n• Support sinonim kata umum\n• Hint system (2x per game)\n• Integrasi rank system global\n• API lirik lagu Indonesia`
            });
            return;
        }
        
        // Cek jika command list (untuk debug/total soal)
        if (args[0] && args[0].toLowerCase() === 'list') {
            try {
                const url = `${config.baseURL}/game/tebaklirik/questions?apikey=${config.apiKey}`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.status && data.data) {
                    await bot.sendMessage(chatId, {
                        text: `📋 *DAFTAR LIRIK TERSEDIA*\n\n• Total soal: ${data.data.length}\n• Creator: ${data.creator || 'ZVex Dev'}\n• Status API: ✅ Aktif\n\n*Contoh soal:*\n1. "${data.data[0]?.question.substring(0, 50)}..."\n2. "${data.data[1]?.question.substring(0, 50)}..."\n\nGunakan .tebaklirik untuk main!`
                    });
                }
            } catch (error) {
                console.error('[TEBAK LIRIK] Error getting list:', error);
            }
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};