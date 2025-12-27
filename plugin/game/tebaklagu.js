const fetch = require('node-fetch');
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Game Type
const GAME_TYPE = 'tebaklagu';

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
    const correctJudul = question.judul;
    const correctArtis = question.artis;
    
    const normalizedUser = normalizeText(userAnswer);
    const normalizedJudul = normalizeText(correctJudul);
    const normalizedArtis = normalizeText(correctArtis);
    
    const threshold = 0.7;  // Threshold untuk tebak lagu
    
    console.log(`[TEBAK LAGU] Checking: "${userAnswer}" vs "${correctJudul}" (${correctArtis})`);
    
    // Cek similarity dengan judul lagu
    const simScoreJudul = similarity(normalizedUser, normalizedJudul);
    console.log(`[TEBAK LAGU] Similarity with title: ${simScoreJudul}`);
    
    // Cek similarity dengan artis
    const simScoreArtis = similarity(normalizedUser, normalizedArtis);
    console.log(`[TEBAK LAGU] Similarity with artist: ${simScoreArtis}`);
    
    // Bisa jawab dengan judul ATAU artis
    if (simScoreJudul >= threshold) {
        return {
            correct: true,
            message: `🎵 *LAGU TERIDENTIFIKASI!*\n\n🎤 **Judul:** ${correctJudul}\n👨‍🎤 **Artis:** ${correctArtis}\n✅ **Ditebak via judul lagu**`,
            similarity: simScoreJudul,
            answerType: 'judul'
        };
    }
    
    if (simScoreArtis >= threshold) {
        return {
            correct: true,
            message: `🎵 *LAGU TERIDENTIFIKASI!*\n\n🎤 **Judul:** ${correctJudul}\n👨‍🎤 **Artis:** ${correctArtis}\n✅ **Ditebak via nama artis**`,
            similarity: simScoreArtis,
            answerType: 'artis'
        };
    }
    
    // Cek kata per kata untuk judul lagu yang panjang
    const userWords = normalizedUser.split(' ').filter(w => w.length > 0);
    const judulWords = normalizedJudul.split(' ').filter(w => w.length > 0);
    const artisWords = normalizedArtis.split(' ').filter(w => w.length > 0);
    
    if (userWords.length > 0) {
        // Cek match dengan kata dalam judul
        let judulMatches = 0;
        for (const uWord of userWords) {
            for (const jWord of judulWords) {
                if (similarity(uWord, jWord) >= 0.85) {
                    judulMatches++;
                    break;
                }
            }
        }
        
        const judulMatchRatio = judulMatches / Math.max(userWords.length, judulWords.length);
        console.log(`[TEBAK LAGU] Judul word match: ${judulMatchRatio} (${judulMatches}/${Math.max(userWords.length, judulWords.length)})`);
        
        if (judulMatchRatio >= 0.6 && judulMatches >= 2) {
            return {
                correct: true,
                message: `🎵 *LAGU TERIDENTIFIKASI!*\n\n🎤 **Judul:** ${correctJudul}\n👨‍🎤 **Artis:** ${correctArtis}\n✅ **Kata kunci judul cocok:** ${judulMatches}/${Math.max(userWords.length, judulWords.length)} kata`,
                similarity: judulMatchRatio,
                answerType: 'partial_judul'
            };
        }
        
        // Cek match dengan kata dalam artis
        let artisMatches = 0;
        for (const uWord of userWords) {
            for (const aWord of artisWords) {
                if (similarity(uWord, aWord) >= 0.85) {
                    artisMatches++;
                    break;
                }
            }
        }
        
        const artisMatchRatio = artisMatches / Math.max(userWords.length, artisWords.length);
        console.log(`[TEBAK LAGU] Artis word match: ${artisMatchRatio} (${artisMatches}/${Math.max(userWords.length, artisWords.length)})`);
        
        if (artisMatchRatio >= 0.6 && artisMatches >= 1) {
            return {
                correct: true,
                message: `🎵 *LAGU TERIDENTIFIKASI!*\n\n🎤 **Judul:** ${correctJudul}\n👨‍🎤 **Artis:** ${correctArtis}\n✅ **Kata kunci artis cocok:** ${artisMatches}/${Math.max(userWords.length, artisWords.length)} kata`,
                similarity: artisMatchRatio,
                answerType: 'partial_artis'
            };
        }
    }
    
    // Berikan clue berdasarkan jawaban user
    let hintMessage = '❌ *Salah!* Coba dengar lagi.\n\n';
    
    // Berikan hint berdasarkan kata yang mendekati
    const judulWordsArray = judulWords;
    const artisWordsArray = artisWords;
    const matchedJudulWords = [];
    const matchedArtisWords = [];
    
    for (const uWord of userWords) {
        for (const jWord of judulWordsArray) {
            if (similarity(uWord, jWord) >= 0.6) {
                matchedJudulWords.push(jWord);
            }
        }
        for (const aWord of artisWordsArray) {
            if (similarity(uWord, aWord) >= 0.6) {
                matchedArtisWords.push(aWord);
            }
        }
    }
    
    if (matchedJudulWords.length > 0) {
        hintMessage += `💡 **Kata yang mendekati judul:** ${matchedJudulWords.slice(0, 3).join(', ')}\n`;
    }
    if (matchedArtisWords.length > 0) {
        hintMessage += `💡 **Kata yang mendekati artis:** ${matchedArtisWords.slice(0, 3).join(', ')}\n`;
    }
    
    // Berikan hint umum
    const judulLength = correctJudul.length;
    const firstLetterJudul = correctJudul.charAt(0).toUpperCase();
    const artisWordsCount = artisWords.length;
    
    hintMessage += `\n🎵 **Petunjuk:**\n`;
    hintMessage += `• Huruf pertama judul: **${firstLetterJudul}**\n`;
    hintMessage += `• Panjang judul: ${judulLength} karakter\n`;
    
    if (artisWordsCount > 1) {
        hintMessage += `• Artis terdiri dari ${artisWordsCount} kata\n`;
    }
    
    hintMessage += `• Durasi audio: 15-30 detik\n`;
    hintMessage += `• ID Lagu: ${question.id}`;
    
    return {
        correct: false,
        message: hintMessage,
        similarity: Math.max(simScoreJudul, simScoreArtis)
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
        console.log('[TEBAK LAGU] Starting new game...');
        
        // Ambil data dari API
        const url = `${config.baseURL}/game/tebaklagu/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Data lagu kosong!' });
            return;
        }
        
        // Pilih soal random
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const question = data.data[randomIndex];
        
        console.log('[TEBAK LAGU] Question ID:', question.id);
        console.log('[TEBAK LAGU] Title:', question.judul);
        console.log('[TEBAK LAGU] Artist:', question.artis);
        console.log('[TEBAK LAGU] Audio URL:', question.lagu);
        
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
        
        try {
            // Kirim audio terlebih dahulu
            await bot.sendMessage(chatId, {
                audio: { url: question.lagu },
                mimetype: 'audio/mp4',
                ptt: false,
                fileName: 'tebaklagu.mp3'
            });
            
            console.log('[TEBAK LAGU] Audio sent successfully');
            
            // Tunggu sebentar agar audio dikirim
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (audioError) {
            console.error('[TEBAK LAGU] Error sending audio:', audioError);
            await bot.sendMessage(chatId, {
                text: `❌ Gagal mengirim audio!\nURL: ${question.lagu}\n\nTapi game tetap berlanjut, coba tebak judul lagunya!`
            });
        }
        
        // Kirim instruksi game
        const teks = `🎵 *TEBAK JUDUL LAGU* 🎶\n\n🎧 *Dengarkan audio di atas!*\n\n👤 *Starter:* @${starterName}\n⏱️ *Waktu:* 60 detik\n💡 *Hint:* Ketik "hint" (maks 2x)\n🛑 *Stop:* .tebaklagu stop\n\n📝 *Cara Bermain:*\n1. Dengarkan potongan audio di atas\n2. REPLY pesan ini dengan jawabanmu\n3. Bisa jawab dengan JUDUL atau ARTIS\n4. Contoh: "${question.judul}" atau "${question.artis}"\n5. Dapatkan +1 poin jika benar!\n\n⚠️ *Peraturan:*\n• Starter salah = -1 poin\n• Salah 3x = ban 1 jam\n• Bukan starter = tidak kena penalti\n• Bisa jawab judul ATAU artis`;
        
        const gameMessage = await bot.sendMessage(chatId, { 
            text: teks, 
            mentions: [senderId] 
        });
        
        // Set game message ID untuk reply tracking
        if (gameMessage.key && gameMessage.key.id) {
            gameManager.setGameMessage(chatId, gameMessage.key.id);
        }
        
        // Set timeout via Game Manager (60 detik untuk tebak lagu)
        gameManager.setTimeout(chatId, async () => {
            try {
                const gameData = gameManager.getActiveGame(chatId);
                if (gameData && gameData.type === GAME_TYPE) {
                    const question = gameData.data.currentQuestion;
                    
                    await bot.sendMessage(chatId, { 
                        text: `⏰ *Waktu habis!*\n\n🎵 **Judul lagu:** ${question.judul}\n👨‍🎤 **Artis:** ${question.artis}\n🎧 **Audio URL:** ${question.lagu}\n\n🔄 Main lagi? .tebaklagu` 
                    });
                    
                    await gameManager.stopGame(chatId, 'timeout');
                }
            } catch (error) {
                console.error('[TEBAK LAGU] Timeout callback error:', error);
            }
        }, 60000); // 60 detik
        
    } catch (error) {
        console.error('[TEBAK LAGU] Error:', error);
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
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .tebaklagu` 
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
    
    // Berikan hint berdasarkan lagu
    const judul = question.judul;
    const artis = question.artis;
    const judulWords = judul.split(' ').filter(w => w.length > 0);
    const artisWords = artis.split(' ').filter(w => w.length > 0);
    
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Huruf pertama judul dan info artis
        const firstLetter = judul.charAt(0).toUpperCase();
        const artisFirstWord = artisWords[0] || artis;
        
        hint = `💡 *Hint 1:*\n• Huruf pertama judul: **${firstLetter}**\n• Kata pertama artis: **${artisFirstWord}**\n• Jumlah kata judul: ${judulWords.length}`;
        
        if (judulWords.length > 2) {
            hint += `\n• Kata kedua judul: **${judulWords[1] || '-'}**`;
        }
    } else if (hintsUsed === 2) {
        // Hint 2: Panjang judul dan genre petunjuk
        const judulLength = judul.length;
        const artisLength = artis.length;
        
        // Tentukan genre berdasarkan artis/judul
        let genreHint = 'pop/rock';
        const judulLower = judul.toLowerCase();
        const artisLower = artis.toLowerCase();
        
        if (judulLower.includes('love') || judulLower.includes('heart') || judulLower.includes('cinta')) {
            genreHint = 'lagu cinta';
        } else if (artisLower.includes('band') || artisLower.includes('kangen')) {
            genreHint = 'band Indonesia';
        } else if (artisLower.includes('alan') || artisLower.includes('walker')) {
            genreHint = 'EDM/instrumental';
        } else if (artisLower.includes('rihana') || artisLower.includes('eminem')) {
            genreHint = 'lagu internasional';
        }
        
        hint = `💡 *Hint 2:*\n• Panjang judul: ${judulLength} karakter\n• Panjang nama artis: ${artisLength} karakter\n• Genre: ${genreHint}\n• ID Lagu: ${question.id}\n• Tahun rilis: 2010-2023`;
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Sisa hint: ${maxHints - hintsUsed}\n\n🎧 **Dengarkan audio dengan seksama!**`
    });
}

// ======================
// HANDLER UNTUK GAME MANAGER
// ======================

async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    const answerType = result.answerType || 'judul';
    
    const answerTypeText = answerType === 'judul' ? 'judul lagu' : 
                          answerType === 'artis' ? 'nama artis' : 
                          answerType.includes('partial') ? 'kata kunci' : 'jawaban';
    
    const message = `🎉 *BENAR!* @${userName} berhasil menebak lagu!\n\n${result.message}\n\n➕ *+1 poin* (via ${answerTypeText})\n🎵 Selamat, pendengaranmu tajam!\n\n🔄 Main lagi? Ketik .tebaklagu!`;
    
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
    command: ['tebaklagu', 'tebakmusik', 'songguess'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['tebaklagu'],
    description: 'Game tebak judul lagu dari potongan audio',
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
        
        console.log(`[TEBAK LAGU COMMAND] Received: "${text}" from ${senderId}`);
        
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
                    text: `⚠️ Tidak ada game Tebak Lagu yang aktif!` 
                });
            }
            return;
        }
        
        // Cek jika command stats
        if (args[0] && args[0].toLowerCase() === 'stats') {
            try {
                const statsText = await gameManager.getUserStats(senderId);
                await bot.sendMessage(chatId, {
                    text: `🎵 *STATISTIK TEBAK LAGU*\n\n${statsText}\n\n🎧 *Tips Bermain:*\n• Dengarkan intro lagu dengan seksama\n• Perhatikan vokal dan instrumentasi\n• Bisa jawab dengan judul ATAU artis\n• Gunakan hint jika benar-benar bingung`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[TEBAK LAGU] Error getting stats:', error);
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
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .tebaklagu`
                });
                return;
            }
        }
        
        // Cek jika command leaderboard
        if (args[0] && (args[0].toLowerCase() === 'leaderboard' || args[0] === 'lb' || args[0] === 'top')) {
            try {
                const leaderboard = await gameManager.getLeaderboard(10);
                await bot.sendMessage(chatId, {
                    text: `🏆 *LEADERBOARD TEBAK LAGU* 🎵\n\n${leaderboard}\n\n🎶 Main game untuk naik peringkat! .tebaklagu`
                });
            } catch (error) {
                console.error('[TEBAK LAGU] Error getting leaderboard:', error);
            }
            return;
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🎵 *BANTUAN GAME TEBAK LAGU* 🎶\n\n*Commands:*\n• .tebaklagu - Mulai game baru\n• .tebaklagu stop - Stop game aktif (hanya starter)\n• .tebaklagu stats - Lihat statistik\n• .tebaklagu hint - Minta petunjuk (saat game aktif)\n• .tebaklagu leaderboard - Lihat peringkat global\n\n*Cara Main:*\n1. Ketik .tebaklagu untuk mulai\n2. Bot akan mengirim potongan audio lagu\n3. Dengarkan dengan seksama\n4. REPLY dengan JUDUL lagu atau NAMA ARTIS\n5. Sistem akan cek kecocokan jawaban\n\n*Contoh:*\nAudio: Potongan lagu "Faded"\nJawaban: "Faded" atau "Alan Walker"\n\n*Peraturan:*\n• Waktu: 60 detik\n• Starter benar: +1 poin\n• Starter salah: -1 poin\n• Bukan starter: tidak kena penalti\n• Salah 3x berturut-turut: ban 1 jam\n• Threshold kecocokan: 70%\n• Bisa jawab dengan judul ATAU artis\n\n*Fitur:*\n• Support partial match (kata kunci)\n• Hint system (2x per game)\n• Integrasi rank system global\n• Audio streaming dari GitHub\n• Database 45+ lagu populer`
            });
            return;
        }
        
        // Cek jika command list (untuk debug/total lagu)
        if (args[0] && args[0].toLowerCase() === 'list') {
            try {
                const url = `${config.baseURL}/game/tebaklagu/questions?apikey=${config.apiKey}`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.status && data.data) {
                    const sampleLagu = data.data.slice(0, 5).map((lagu, idx) => 
                        `${idx + 1}. ${lagu.judul} - ${lagu.artis}`
                    ).join('\n');
                    
                    await bot.sendMessage(chatId, {
                        text: `📋 *DAFTAR LAGU TERSEDIA*\n\n• Total lagu: ${data.data.length}\n• Creator: ${data.creator || 'ZVex Dev'}\n• Status API: ✅ Aktif\n\n*Contoh lagu:*\n${sampleLagu}\n\n🎧 Gunakan .tebaklagu untuk main!`
                    });
                }
            } catch (error) {
                console.error('[TEBAK LAGU] Error getting list:', error);
            }
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};