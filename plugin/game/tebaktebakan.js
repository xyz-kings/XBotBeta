const fetch = require('node-fetch');
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Game Type
const GAME_TYPE = 'tebaktebakan';

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
    const correctAnswer = question.jawaban;
    const questionText = question.soal;
    
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    const threshold = 0.7;  // Threshold untuk tebak-tebakan (lebih fleksibel)
    
    console.log(`[TEBAK-TEBAKAN] Checking: "${userAnswer}" vs "${correctAnswer}"`);
    console.log(`[TEBAK-TEBAKAN] Normalized: "${normalizedUser}" vs "${normalizedCorrect}"`);
    
    // Cek similarity langsung
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[TEBAK-TEBAKAN] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `🎯 *TEBAKAN TEPAT!*\n\n🤔 **Soal:** ${questionText}\n✅ **Jawaban:** ${correctAnswer}\n🧠 **Penjelasan:** ${getExplanation(question.id, correctAnswer)}`,
            similarity: simScore
        };
    }
    
    // Cek sinonim untuk tebak-tebakan (karena sering ada jawaban serupa)
    const synonyms = getSynonyms(correctAnswer, question.id);
    
    for (const synonym of synonyms) {
        const synonymScore = similarity(normalizedUser, synonym);
        if (synonymScore >= 0.8) {  // Threshold tinggi untuk sinonim
            console.log(`[TEBAK-TEBAKAN] ✅ Accepted via synonym: ${synonym} (score: ${synonymScore})`);
            return {
                correct: true,
                message: `🎯 *TEBAKAN TEPAT!*\n\n🤔 **Soal:** ${questionText}\n✅ **Jawaban:** ${correctAnswer}\n🔤 **Sinonim diterima:** ${synonym}\n🧠 **Penjelasan:** ${getExplanation(question.id, correctAnswer)}`,
                similarity: synonymScore
            };
        }
    }
    
    // Cek kata per kata untuk jawaban multi-kata
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
        console.log(`[TEBAK-TEBAKAN] Word match ratio: ${wordMatchRatio} (${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata)`);
        
        // Untuk tebak-tebakan, lebih fleksibel dengan kata kunci
        if (wordMatchRatio >= 0.6 && wordMatches >= 1) {
            return {
                correct: true,
                message: `🎯 *TEBAKAN TEPAT!*\n\n🤔 **Soal:** ${questionText}\n✅ **Jawaban:** ${correctAnswer}\n🔤 **Kata kunci cocok:** ${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata\n🧠 **Penjelasan:** ${getExplanation(question.id, correctAnswer)}`,
                similarity: wordMatchRatio
            };
        }
    }
    
    // Berikan clue berdasarkan jawaban user
    const correctWordsArray = correctWords;
    const matchedWords = [];
    
    for (const uWord of userWords) {
        for (const cWord of correctWordsArray) {
            if (similarity(uWord, cWord) >= 0.6) {
                matchedWords.push(cWord);
            }
        }
    }
    
    let hintMessage = '❌ *Salah!* Coba tebak lagi.\n\n';
    
    if (matchedWords.length > 0) {
        hintMessage += `💡 **Kata yang mendekati:** ${matchedWords.slice(0, 3).join(', ')}\n`;
    }
    
    // Berikan hint berdasarkan jenis soal
    const questionType = getQuestionType(question.id);
    hintMessage += `\n🎮 **Petunjuk:**\n`;
    
    switch(questionType) {
        case 'hewan':
            hintMessage += `• Ini tentang hewan\n`;
            hintMessage += `• Huruf pertama: **${correctAnswer.charAt(0).toUpperCase()}**\n`;
            break;
        case 'makanan':
            hintMessage += `• Ini tentang makanan/minuman\n`;
            hintMessage += `• ${correctWords.length > 1 ? `Terdiri dari ${correctWords.length} kata` : 'Satu kata'}\n`;
            break;
        case 'benda':
            hintMessage += `• Ini tentang benda sehari-hari\n`;
            hintMessage += `• Panjang jawaban: ${correctAnswer.length} huruf\n`;
            break;
        case 'tumbuhan':
            hintMessage += `• Ini tentang tumbuhan/buah\n`;
            hintMessage += `• Huruf terakhir: **${correctAnswer.charAt(correctAnswer.length - 1).toUpperCase()}**\n`;
            break;
        default:
            hintMessage += `• Jenis: Tebak-tebakan lucu\n`;
            hintMessage += `• ID Soal: ${question.id}\n`;
    }
    
    hintMessage += `• Waktu berpikir: 30 detik\n`;
    hintMessage += `\n🤔 **Soal:**\n${questionText}`;
    
    return {
        correct: false,
        message: hintMessage,
        similarity: simScore
    };
}

// Fungsi untuk mendapatkan sinonim berdasarkan jawaban
function getSynonyms(answer, questionId) {
    const synonymMap = {
        'kutu': ['kutu', 'tuma', 'kutu rambut'],
        'rujak': ['rujak buah', 'asinan buah', 'buah campur'],
        'biskuit': ['biskuit', 'kue kering', 'cracker'],
        'toge': ['tauge', 'kecambah', 'toge kacang'],
        'kuping': ['telinga', 'daun telinga', 'kuping'],
        'jagung': ['jagung', 'corn', 'jagung manis'],
        'bandeng': ['bandeng', 'ikan bandeng', 'susu bandeng'],
        'buahaya': ['buaya', 'alligator', 'crocodile'],
        'upil': ['upil', 'kotoran hidung', 'booger'],
        'laba-laba': ['laba-laba', 'spider', 'arachnid'],
        'gajah pesek': ['gajah pesek', 'gajah pendek', 'gajah kecil'],
        'sapidol': ['spidol', 'marker', 'spidol whiteboard'],
        'lampu merah': ['lampu merah', 'traffic light', 'lampu lalu lintas'],
        'merem': ['merem', 'pejam mata', 'tutup mata'],
        'bel rumah': ['bel rumah', 'doorbell', 'bel pintu'],
        'resleting': ['resleting', 'zipper', 'selot'],
        'sapi perah': ['sapi perah', 'susu sapi', 'sapi penghasil susu'],
        'bandera': ['bendera', 'flag', 'panji'],
        'nasihat': ['nasihat', 'saran', 'petuah'],
        'kapsul': ['kapsul', 'pil', 'obat kapsul']
    };
    
    return synonymMap[answer.toLowerCase()] || [];
}

// Fungsi untuk mendapatkan penjelasan tebak-tebakan
function getExplanation(questionId, answer) {
    const explanations = {
        1: 'Kutu memang memiliki semua organ di kepala karena ukurannya kecil',
        2: 'Rujak adalah campuran beberapa buah dalam satu piring',
        3: 'Biskuit terdengar seperti "bis" + "kuit" (bisa dimakan)',
        4: 'Toge rasanya sama di semua bagian karena kecil',
        5: 'Kuping bisa dipegang tapi tidak bisa melihat sendiri',
        6: 'Jagung punya kulit, biji, dan tongkol (batang) di dalamnya',
        7: 'Bandeng terdengar seperti "ban" + "deng" (ikan bandeng)',
        8: 'Buahaya = buaya (permainan kata)',
        9: 'Upil memang dicari di hidung lalu dibuang',
        10: 'Laba-laba selalu dapat "laba" (untung) dari jaringnya',
        11: 'Gajah pesek (gajah dengan belalai pendek)',
        12: 'Sapidol = spidol (alat tulis)',
        13: 'Lampu merah punya 3 warna (mata), 1 tiang (kaki), di pinggir jalan',
        14: 'Orang bungkuk tidur dengan mata "merem" (tertutup)',
        15: 'Bel rumah bulat, hitam, dipencet keluar suara (orang)',
        16: 'Resleting memang naik turun di area perut',
        17: 'Sapi perah memang selalu "diperas" susunya',
        18: 'Bandera = bendera (berada di atas tiang)',
        19: 'Nasihat tidak akan basi (selalu relevan)',
        20: 'Kapsul panjang lonjong, huruf K-L'
    };
    
    return explanations[questionId] || 'Tebak-tebakan lucu khas Indonesia!';
}

// Fungsi untuk menentukan jenis soal
function getQuestionType(questionId) {
    const animalQuestions = [1, 10, 11, 17, 57, 58, 84, 99, 104, 134, 135, 142, 143, 147];
    const foodQuestions = [2, 3, 4, 6, 7, 19, 28, 29, 33, 36, 52, 86, 87, 88, 98, 116, 154, 168, 169, 176, 198];
    const objectQuestions = [5, 13, 15, 16, 20, 22, 25, 31, 32, 39, 40, 49, 55, 62, 69, 72, 74, 77, 79, 81, 82, 86, 88, 93, 94, 96, 106, 124, 126, 128, 137, 146, 155, 162, 172, 187, 191];
    const plantQuestions = [4, 6, 8, 36, 60, 91, 118, 148, 174];
    
    if (animalQuestions.includes(questionId)) return 'hewan';
    if (foodQuestions.includes(questionId)) return 'makanan';
    if (objectQuestions.includes(questionId)) return 'benda';
    if (plantQuestions.includes(questionId)) return 'tumbuhan';
    return 'umum';
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
        console.log('[TEBAK-TEBAKAN] Starting new game...');
        
        // Ambil data dari API
        const url = `${config.baseURL}/game/tebaktebakan/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Data tebak-tebakan kosong!' });
            return;
        }
        
        // Pilih soal random
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const question = data.data[randomIndex];
        
        console.log('[TEBAK-TEBAKAN] Question ID:', question.id);
        console.log('[TEBAK-TEBAKAN] Question:', question.soal);
        console.log('[TEBAK-TEBAKAN] Answer:', question.jawaban);
        
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
        
        // Tampilkan soal tebak-tebakan
        const teks = `🤔 *TEBAK-TEBAKAN LUCU* 🎭\n\n🧩 **SOAL:**\n${question.soal}\n\n👤 *Starter:* @${starterName}\n⏱️ *Waktu:* 30 detik\n💡 *Hint:* Ketik "hint" (maks 2x)\n🛑 *Stop:* .tebaktebakan stop\n\n📝 *Cara Bermain:*\n1. Baca soal dengan seksama\n2. REPLY pesan ini dengan jawabanmu\n3. Contoh: "${question.jawaban}"\n4. Dapatkan +1 poin jika benar!\n5. Jawaban bisa berupa 1 kata atau frasa\n\n⚠️ *Peraturan:*\n• Starter salah = -1 poin\n• Salah 3x = ban 1 jam\n• Bukan starter = tidak kena penalti\n• Sistem menerima sinonim/salah ketik ringan\n• Total soal: ${data.data.length}`;
        
        const gameMessage = await bot.sendMessage(chatId, { 
            text: teks, 
            mentions: [senderId] 
        });
        
        // Set game message ID untuk reply tracking
        if (gameMessage.key && gameMessage.key.id) {
            gameManager.setGameMessage(chatId, gameMessage.key.id);
        }
        
        // Set timeout via Game Manager (30 detik untuk tebak-tebakan)
        gameManager.setTimeout(chatId, async () => {
            try {
                const gameData = gameManager.getActiveGame(chatId);
                if (gameData && gameData.type === GAME_TYPE) {
                    const question = gameData.data.currentQuestion;
                    
                    await bot.sendMessage(chatId, { 
                        text: `⏰ *Waktu habis!*\n\n🤔 **Soal:** ${question.soal}\n✅ **Jawaban:** ${question.jawaban}\n🧠 **Penjelasan:** ${getExplanation(question.id, question.jawaban)}\n\n🔄 Main lagi? .tebaktebakan` 
                    });
                    
                    await gameManager.stopGame(chatId, 'timeout');
                }
            } catch (error) {
                console.error('[TEBAK-TEBAKAN] Timeout callback error:', error);
            }
        }, 30000); // 30 detik
        
    } catch (error) {
        console.error('[TEBAK-TEBAKAN] Error:', error);
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
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .tebaktebakan` 
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
    
    // Berikan hint berdasarkan soal
    const answer = question.jawaban;
    const answerWords = answer.split(' ').filter(w => w.length > 0);
    const questionType = getQuestionType(question.id);
    
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Huruf pertama dan jenis soal
        const firstLetter = answer.charAt(0).toUpperCase();
        const answerLength = answer.length;
        
        hint = `💡 *Hint 1:*\n• Huruf pertama: **${firstLetter}**\n• Panjang jawaban: ${answerLength} huruf\n• Jenis: ${questionType === 'hewan' ? 'Hewan' : questionType === 'makanan' ? 'Makanan' : questionType === 'benda' ? 'Benda' : 'Tebakan umum'}`;
        
        if (answerWords.length > 1) {
            hint += `\n• Jumlah kata: ${answerWords.length}`;
        }
    } else if (hintsUsed === 2) {
        // Hint 2: Huruf terakhir dan clue kontekstual
        const lastLetter = answer.charAt(answer.length - 1).toUpperCase();
        
        // Berikan clue berdasarkan jenis soal
        let contextualClue = '';
        switch(questionType) {
            case 'hewan':
                contextualClue = 'Jawaban adalah nama hewan yang umum diketahui';
                break;
            case 'makanan':
                contextualClue = 'Jawaban adalah makanan/minuman yang sering dikonsumsi';
                break;
            case 'benda':
                contextualClue = 'Jawaban adalah benda yang ada di sekitar kita';
                break;
            case 'tumbuhan':
                contextualClue = 'Jawaban adalah tumbuhan/buah yang familiar';
                break;
            default:
                contextualClue = 'Jawaban adalah kata/frasa yang sering didengar';
        }
        
        hint = `💡 *Hint 2:*\n• Huruf terakhir: **${lastLetter}**\n• ${contextualClue}\n• ID Soal: ${question.id}\n• Tipe: Tebak-tebakan "${questionType}"\n• Total kata: ${answerWords.length}`;
        
        if (answerWords.length > 1) {
            const firstWord = answerWords[0];
            const lastWord = answerWords[answerWords.length - 1];
            hint += `\n• Kata pertama: **${firstWord}** | Kata terakhir: **${lastWord}**`;
        }
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Sisa hint: ${maxHints - hintsUsed}\n\n🤔 **Soal:**\n${question.soal}`
    });
}

// ======================
// HANDLER UNTUK GAME MANAGER
// ======================

async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    
    const message = `🎉 *BENAR!* @${userName} berhasil menebak!\n\n${result.message}\n\n➕ *+1 poin*\n🤔 Tebak-tebakan berhasil dipecahkan!\n\n🔄 Main lagi? Ketik .tebaktebakan!`;
    
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
    command: ['tebaktebakan', 'tebaktebak', 'tebak2', 'teka-teki'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['tebaktebakan'],
    description: 'Game tebak-tebakan lucu dan teka-teki Indonesia',
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
        
        console.log(`[TEBAK-TEBAKAN COMMAND] Received: "${text}" from ${senderId}`);
        
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
                    text: `⚠️ Tidak ada game Tebak-Tebakan yang aktif!` 
                });
            }
            return;
        }
        
        // Cek jika command stats
        if (args[0] && args[0].toLowerCase() === 'stats') {
            try {
                const statsText = await gameManager.getUserStats(senderId);
                await bot.sendMessage(chatId, {
                    text: `🤔 *STATISTIK TEBAK-TEBAKAN*\n\n${statsText}\n\n🎯 *Tips Bermain:*\n• Baca soal dengan teliti\n• Perhatikan permainan kata\n• Tebak-tebakan sering menggunakan homonim\n• Jangan terlalu serius, ini game lucu!\n• Gunakan hint jika bingung`,
                    mentions: [senderId]
                });
            } catch (error) {
                console.error('[TEBAK-TEBAKAN] Error getting stats:', error);
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
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .tebaktebakan`
                });
                return;
            }
        }
        
        // Cek jika command leaderboard
        if (args[0] && (args[0].toLowerCase() === 'leaderboard' || args[0] === 'lb' || args[0] === 'top')) {
            try {
                const leaderboard = await gameManager.getLeaderboard(10);
                await bot.sendMessage(chatId, {
                    text: `🏆 *LEADERBOARD TEBAK-TEBAKAN* 🤔\n\n${leaderboard}\n\n🎭 Main game untuk naik peringkat! .tebaktebakan`
                });
            } catch (error) {
                console.error('[TEBAK-TEBAKAN] Error getting leaderboard:', error);
            }
            return;
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🤔 *BANTUAN GAME TEBAK-TEBAKAN* 🎭\n\n*Commands:*\n• .tebaktebakan - Mulai game baru\n• .tebaktebakan stop - Stop game aktif (hanya starter)\n• .tebaktebakan stats - Lihat statistik\n• .tebaktebakan hint - Minta petunjuk (saat game aktif)\n• .tebaktebakan leaderboard - Lihat peringkat global\n• .tebaktebakan list - Info total soal\n\n*Cara Main:*\n1. Ketik .tebaktebakan untuk mulai\n2. Bot akan menampilkan soal tebak-tebakan\n3. REPLY dengan jawaban yang tepat\n4. Sistem akan cek kecocokan jawaban\n5. Bisa jawab dengan 1 kata atau frasa\n\n*Contoh:*\nSoal: "Hewan apa yang perut, kepala, mata, bahkan kakinya di kepala?"\nJawaban: "Kutu"\n\n*Peraturan:*\n• Waktu: 30 detik\n• Starter benar: +1 poin\n• Starter salah: -1 poin\n• Bukan starter: tidak kena penalti\n• Salah 3x berturut-turut: ban 1 jam\n• Threshold kecocokan: 70%\n• Support sinonim/salah ketik ringan\n\n*Fitur:*\n• 199+ soal tebak-tebakan lucu\n• Support sinonim kata\n• Hint system (2x per game)\n• Penjelasan jawaban\n• Integrasi rank system global\n• Kategori soal: hewan, makanan, benda, tumbuhan`
            });
            return;
        }
        
        // Cek jika command list (untuk debug/total soal)
        if (args[0] && args[0].toLowerCase() === 'list') {
            try {
                const url = `${config.baseURL}/game/tebaktebakan/questions?apikey=${config.apiKey}`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.status && data.data) {
                    await bot.sendMessage(chatId, {
                        text: `📋 *DAFTAR TEBAK-TEBAKAN*\n\n• Total soal: ${data.data.length}\n• Creator: ${data.creator || 'ZVex Dev'}\n• Status API: ✅ Aktif\n• Range ID: 1-${data.data.length}\n\n*Contoh soal:*\n1. "${data.data[0]?.soal}"\n2. "${data.data[1]?.soal}"\n3. "${data.data[2]?.soal}"\n\n🤔 Gunakan .tebaktebakan untuk main!`
                    });
                }
            } catch (error) {
                console.error('[TEBAK-TEBAKAN] Error getting list:', error);
            }
            return;
        }
        
        // Mulai game baru
        await startGame(bot, m, args);
    }
};