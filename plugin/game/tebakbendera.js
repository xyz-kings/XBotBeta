const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const config = require('../../config.json');

// Import Game Manager
const gameManager = require('../../lib/helpergame');

// Game Type
const GAME_TYPE = 'tebakbendera';

// Sinonim untuk berbagai negara
const synonyms = {
    'kongo - brazzaville': ['kongo', 'brazzaville', 'republik kongo', 'kongo brazzaville'],
    'kepulauan åland': ['åland', 'aland', 'kepulauan aland', 'finlandia aland'],
    'komoro': ['comoros', 'union of comoros', 'kepulauan komoro'],
    'kanada': ['canada', 'canadian', 'amerika utara'],
    'guyana': ['guyana cooperative republic', 'amerika selatan'],
    'samoa amerika': ['american samoa', 'samoa us', 'teritori as'],
    'somalia': ['somalia republic', 'horn of africa'],
    'korea selatan': ['south korea', 'republic of korea', 'rok', 'korsel'],
    'moldova': ['republic of moldova', 'moldova republic'],
    'nauru': ['republic of nauru', 'pulau nauru'],
    'jerman': ['germany', 'deutschland', 'federal republic of germany'],
    'st. pierre & miquelon': ['saint pierre and miquelon', 'collectivité de saint-pierre-et-miquelon'],
    'malta': ['republic of malta', 'pulau malta'],
    'lesotho': ['kingdom of lesotho', 'afrika selatan'],
    'laos': ['lao people\'s democratic republic', 'asia tenggara'],
    'polandia': ['poland', 'republic of poland', 'polska'],
    'argentina': ['argentine republic', 'amerika latin'],
    'kepulauan virgin as': ['u.s. virgin islands', 'virgin islands of the united states'],
    'papua nugini': ['papua new guinea', 'png', 'pacific island'],
    'tajikistan': ['tajikistan republic', 'asia tengah'],
    'el salvador': ['republic of el salvador', 'amerika tengah'],
    'tonga': ['kingdom of tonga', 'polynesia'],
    'estonia': ['republic of estonia', 'europe utara'],
    'kepulauan cook': ['cook islands', 'self-governing island country'],
    'malawi': ['republic of malawi', 'africa tenggara'],
    'peru': ['republic of peru', 'amerika selatan'],
    'benin': ['republic of benin', 'africa barat'],
    'maroko': ['morocco', 'kingdom of morocco', 'maghreb'],
    'san marino': ['republic of san marino', 'microstate'],
    'yunani': ['greece', 'hellenic republic', 'europe selatan'],
    'amerika serikat': ['united states', 'usa', 'us', 'amerika', 'states'],
    'irlandia': ['ireland', 'republic of ireland', 'eire'],
    'ethiopia': ['federal democratic republic of ethiopia', 'africa timur'],
    'tokelau': ['tokelau islands', 'new zealand territory'],
    'jersey': ['bailiwick of jersey', 'channel islands'],
    'antigua & barbuda': ['antigua and barbuda', 'caribbean'],
    'djibouti': ['republic of djibouti', 'africa timur'],
    'andorra': ['principality of andorra', 'pyrenees'],
    'afganistan': ['afghanistan', 'islamic republic of afghanistan'],
    'venezuela': ['bolivarian republic of venezuela', 'amerika selatan'],
    'tanzania': ['united republic of tanzania', 'africa timur'],
    'antartika': ['antarctica', 'south pole', 'continent'],
    'hongaria': ['hungary', 'republic of hungary', 'europe tengah'],
    'turkmenistan': ['turkmenistan republic', 'asia tengah'],
    'bahama': ['bahamas', 'commonwealth of the bahamas', 'caribbean'],
    'grenada': ['grenada island', 'caribbean'],
    'republik ceko': ['czech republic', 'czechia', 'europe tengah'],
    'panama': ['republic of panama', 'amerika tengah'],
    'polinesia prancis': ['french polynesia', 'overseas collectivity'],
    'kaledonia baru': ['new caledonia', 'french overseas territory'],
    'skotlandia': ['scotland', 'united kingdom'],
    'jamaika': ['jamaica', 'caribbean island'],
    'dominika': ['dominica', 'commonwealth of dominica', 'caribbean'],
    'uni eropa': ['european union', 'eu', 'europe'],
    'bosnia & herzegovina': ['bosnia and herzegovina', 'balkans'],
    'seychelles': ['republic of seychelles', 'indian ocean'],
    'angola': ['republic of angola', 'africa selatan'],
    'brunei': ['brunei darussalam', 'nation of brunei'],
    'bahrain': ['kingdom of bahrain', 'arabian gulf'],
    'guatemala': ['republic of guatemala', 'amerika tengah'],
    'kepulauan virgin britania raya': ['british virgin islands', 'bvi', 'caribbean'],
    'kroasia': ['croatia', 'republic of croatia', 'balkans'],
    'mozambik': ['mozambique', 'republic of mozambique', 'africa timur'],
    'rusia': ['russia', 'russian federation', 'eurasia'],
    'kepulauan pitcairn': ['pitcairn islands', 'british overseas territory'],
    'georgia selatan & kepulauan sandwich selatan': ['south georgia and the south sandwich islands', 'british overseas territory'],
    'uganda': ['republic of uganda', 'africa timur'],
    'teritori prancis selatan': ['french southern territories', 'antarctic'],
    'liechtenstein': ['principality of liechtenstein', 'europe tengah'],
    'guinea-bissau': ['republic of guinea-bissau', 'africa barat'],
    'sao tome & principe': ['são tomé and príncipe', 'africa tengah'],
    'indonesia': ['republic of indonesia', 'nusantara', 'asia tenggara'],
    'sint maarten': ['sint maarten island', 'caribbean netherlands'],
    'mikronesia': ['federated states of micronesia', 'pacific islands'],
    'korea utara': ['north korea', 'democratic people\'s republic of korea', 'dprk', 'korut']
};

// Fungsi untuk normalisasi teks
function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s\-&]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/&/g, 'dan')
        .replace(/st\./g, 'saint')
        .replace(/\./g, '')
        .trim();
}

// Fungsi untuk cek similarity
function similarity(s1, s2) {
    const str1 = normalizeText(s1);
    const str2 = normalizeText(s2);
    
    if (str1 === str2) return 1;
    
    // Cek jika salah satu mengandung yang lain
    if (str1.includes(str2) || str2.includes(str1)) {
        const minLength = Math.min(str1.length, str2.length);
        const maxLength = Math.max(str1.length, str2.length);
        return minLength / maxLength;
    }
    
    // Cek dengan algoritma Jaro-Winkler sederhana
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
    
    // Hitung transpositions
    let transpositions = 0;
    let j = 0;
    for (let i = 0; i < str1.length; i++) {
        if (str1[i] === str2[j]) {
            j++;
        } else {
            transpositions++;
        }
    }
    transpositions = transpositions / 2;
    
    const m = matches;
    const t = transpositions;
    const similarity = ((m / str1.length) + (m / str2.length) + ((m - t) / m)) / 3;
    
    return similarity;
}

// Fungsi untuk cek jawaban (untuk Game Manager)
async function checkAnswer(userAnswer, gameData) {
    const question = gameData.currentQuestion;
    const correctAnswer = question.nama;
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    const threshold = 0.6; // Threshold lebih rendah untuk negara (nama panjang)
    
    console.log(`[TEBAK BENDERA] Checking: "${userAnswer}" vs "${correctAnswer}"`);
    console.log(`[TEBAK BENDERA] Normalized: "${normalizedUser}" vs "${normalizedCorrect}"`);
    
    // Cek similarity langsung
    const simScore = similarity(normalizedUser, normalizedCorrect);
    console.log(`[TEBAK BENDERA] Similarity score: ${simScore}`);
    
    if (simScore >= threshold) {
        return {
            correct: true,
            message: `🏳️ **Jawaban:** ${correctAnswer}`,
            similarity: simScore,
            userAnswer: userAnswer
        };
    }
    
    // Cek sinonim
    const lowerCorrect = normalizedCorrect.toLowerCase();
    if (synonyms[lowerCorrect]) {
        for (const synonym of synonyms[lowerCorrect]) {
            const synonymScore = similarity(normalizedUser, synonym);
            console.log(`[TEBAK BENDERA] Checking synonym "${synonym}": ${synonymScore}`);
            if (synonymScore >= threshold) {
                console.log(`[TEBAK BENDERA] ✅ Accepted via synonym: ${synonym} (score: ${synonymScore})`);
                return {
                    correct: true,
                    message: `🏳️ **Jawaban:** ${correctAnswer}\n📝 **Alternatif diterima:** ${synonym}`,
                    similarity: synonymScore,
                    userAnswer: userAnswer
                };
            }
        }
    }
    
    // Cek kata per kata (untuk negara dengan nama panjang)
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
        console.log(`[TEBAK BENDERA] Word match ratio: ${wordMatchRatio} (${wordMatches} matches)`);
        
        if (wordMatchRatio >= 0.5) { // Threshold lebih rendah untuk multi-word
            return {
                correct: true,
                message: `🏳️ **Jawaban:** ${correctAnswer}\n📝 **Kata kunci cocok:** ${wordMatches}/${Math.max(userWords.length, correctWords.length)} kata`,
                similarity: wordMatchRatio,
                userAnswer: userAnswer
            };
        }
    }
    
    // Cek nama pendek (misal: "Jerman" untuk "Jerman", "Indonesia" untuk "Indonesia")
    const shortNames = {
        'kongo - brazzaville': ['kongo'],
        'kepulauan åland': ['åland', 'aland'],
        'samoa amerika': ['samoa'],
        'korea selatan': ['korea'],
        'st. pierre & miquelon': ['saint pierre', 'miquelon'],
        'kepulauan virgin as': ['virgin islands'],
        'papua nugini': ['papua'],
        'el salvador': ['salvador'],
        'kepulauan cook': ['cook'],
        'amerika serikat': ['amerika', 'as'],
        'antigua & barbuda': ['antigua', 'barbuda'],
        'kepulauan virgin britania raya': ['virgin britania'],
        'georgia selatan & kepulauan sandwich selatan': ['georgia', 'sandwich'],
        'teritori prancis selatan': ['prancis selatan'],
        'guinea-bissau': ['guinea'],
        'sao tome & principe': ['sao tome'],
        'sint maarten': ['maarten'],
        'korea utara': ['korea']
    };
    
    if (shortNames[lowerCorrect]) {
        for (const shortName of shortNames[lowerCorrect]) {
            const shortScore = similarity(normalizedUser, shortName);
            if (shortScore >= 0.7) {
                console.log(`[TEBAK BENDERA] ✅ Accepted via short name: ${shortName} (score: ${shortScore})`);
                return {
                    correct: true,
                    message: `🏳️ **Jawaban:** ${correctAnswer}\n📝 **Nama pendek diterima:** ${shortName}`,
                    similarity: shortScore,
                    userAnswer: userAnswer
                };
            }
        }
    }
    
    return {
        correct: false,
        message: `❌ Salah! Bendera ini negara apa?\n💡 **Bendera:** ${question.bendera}`,
        similarity: simScore,
        userAnswer: userAnswer
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
        console.log('[TEBAK BENDERA] Starting new game...');
        const url = `${config.baseURL}/game/tebakbendera/questions?apikey=${config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.status || !data.data || data.data.length === 0) {
            await bot.sendMessage(chatId, { text: '❌ Soal bendera lagi kosong!' });
            return;
        }
        
        const question = data.data[Math.floor(Math.random() * data.data.length)];
        console.log('[TEBAK BENDERA] Bendera:', question.bendera);
        console.log('[TEBAK BENDERA] Jawaban:', question.nama);
        
        // Start game via Game Manager
        const gameData = {
            starter: senderId,
            currentQuestion: question,
            lastAnswerTime: Date.now(),
            hintsUsed: 0,
            maxHints: 2,
            wrongAttempts: 0,
            continent: getContinentHint(question.nama)
        };
        
        await gameManager.startGame(chatId, GAME_TYPE, gameData);
        
        const starterName = senderId.split('@')[0];
        const teks = `🏳️ *TEBAK BENDERA* - Dimulai oleh @${starterName}!\n\n*Tebak ini bendera negara mana?*\n\n${question.bendera} ${question.bendera} ${question.bendera}\n\n*Petunjuk:*\n• Reply pesan ini dengan nama negara\n• Contoh: "Indonesia" atau "Amerika Serikat"\n• Waktu: 40 detik\n• Hint: ketik "hint" untuk petunjuk\n• Starter: @${starterName}`;
        
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
                        text: `⏰ *Waktu habis!*\n\n🏳️ **Jawaban yang benar:**\n${question.nama}\n\n${question.bendera} Bendera ${question.nama}\n\n🔄 Main lagi? .tebakbendera` 
                    });
                    
                    await gameManager.stopGame(chatId, 'timeout');
                }
            } catch (error) {
                console.error('[TEBAK BENDERA] Timeout callback error:', error);
            }
        }, 40000); // 40 detik untuk tebak bendera
        
    } catch (error) {
        console.error('[TEBAK BENDERA] Error:', error);
        await bot.sendMessage(chatId, { text: '❌ Server error!' });
    }
}

// Fungsi untuk mendapatkan hint benua
function getContinentHint(countryName) {
    const asiaCountries = ['indonesia', 'jepang', 'korea', 'china', 'india', 'malaysia', 'thailand', 'vietnam', 'singapura', 'filipina', 'brunei', 'timor leste', 'myanmar', 'laos', 'kamboja', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'bhutan', 'maladewa', 'afganistan', 'iran', 'irak', 'arab saudi', 'yaman', 'oman', 'qatar', 'bahrain', 'kuwait', 'uni emirat arab', 'turki', 'israel', 'yordania', 'lebanon', 'suriah', 'palestina', 'siprus', 'azerbaijan', 'georgia', 'armenia', 'kazakhstan', 'uzbekistan', 'turkmenistan', 'tajikistan', 'kyrgyzstan', 'mongolia'];
    const europeCountries = ['inggris', 'prancis', 'jerman', 'italia', 'spanyol', 'portugal', 'belanda', 'belgia', 'swiss', 'austria', 'swedia', 'norwegia', 'denmark', 'finlandia', 'islandia', 'polandia', 'czech', 'slovakia', 'hungaria', 'rumania', 'bulgaria', 'yunani', 'turki', 'russia', 'ukraina', 'belarus', 'estonia', 'latvia', 'lithuania', 'moldova', 'albania', 'bosnia', 'kroasia', 'slovenia', 'makedonia', 'montenegro', 'serbia', 'kosovo'];
    const africaCountries = ['mesir', 'maroko', 'aljazair', 'tunisia', 'libya', 'sudan', 'afrika selatan', 'nigeria', 'kenya', 'ethiopia', 'tanzania', 'uganda', 'ghana', 'kamerun', 'pantai gading', 'senegal', 'mali', 'niger', 'chad', 'somalia', 'zimbabwe', 'zambia', 'mozambik', 'madagaskar', 'rwanda', 'burundi', 'angola', 'namibia', 'botswana'];
    const americaCountries = ['amerika serikat', 'kanada', 'mexico', 'brazil', 'argentina', 'chile', 'peru', 'colombia', 'venezuela', 'ecuador', 'bolivia', 'paraguay', 'uruguay', 'guatemala', 'honduras', 'el salvador', 'nicaragua', 'costa rica', 'panama', 'kuba', 'jamaika', 'haiti', 'dominika', 'bahama', 'barbados', 'trinidad dan tobago', 'guyana', 'suriname'];
    const oceaniaCountries = ['australia', 'selandia baru', 'papua nugini', 'fiji', 'solomon islands', 'vanuatu', 'samoa', 'tonga', 'kiribati', 'micronesia', 'palau', 'marshall islands', 'nauru', 'tuvalu'];
    
    const lowerName = countryName.toLowerCase();
    
    if (asiaCountries.some(c => lowerName.includes(c))) return 'Asia';
    if (europeCountries.some(c => lowerName.includes(c))) return 'Eropa';
    if (africaCountries.some(c => lowerName.includes(c))) return 'Afrika';
    if (americaCountries.some(c => lowerName.includes(c))) return 'Amerika';
    if (oceaniaCountries.some(c => lowerName.includes(c))) return 'Oseania';
    
    return 'Global';
}

// Fungsi untuk stop game
async function stopGame(bot, chatId) {
    await gameManager.stopGame(chatId, 'stopped_by_user');
    await bot.sendMessage(chatId, { 
        text: `🛑 *Game dihentikan!*\n\nMain lagi? Ketik .tebakbendera` 
    });
}

// Handler untuk memberikan hint
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
    
    // Berikan hint berdasarkan negara
    const answer = question.nama;
    const continent = gameData.data.continent || 'Global';
    let hint = '';
    
    hintsUsed++;
    gameData.data.hintsUsed = hintsUsed;
    
    if (hintsUsed === 1) {
        // Hint 1: Benua/Region
        hint = `🌍 *Hint 1:* Negara ini berada di ${continent}`;
        
        // Tambahan khusus untuk region tertentu
        if (continent === 'Asia') {
            hint += '\n📍 *Region:* Asia (Timur/Tengah/Selatan/Tenggara)';
        } else if (continent === 'Eropa') {
            hint += '\n📍 *Region:* Eropa (Barat/Timur/Utara/Selatan)';
        }
    } else if (hintsUsed === 2) {
        // Hint 2: Huruf pertama dan jumlah kata
        const words = answer.split(' ');
        const firstLetter = answer.charAt(0).toUpperCase();
        const wordCount = words.length;
        
        hint = `🔠 *Hint 2:*\n• Huruf pertama: ${firstLetter}\n• Jumlah kata: ${wordCount}`;
        
        // Berikan clue tentang nama
        if (answer.includes('-')) {
            hint += '\n• Memiliki tanda hubung (-)';
        }
        if (answer.includes('&')) {
            hint += '\n• Nama gabungan dua wilayah';
        }
        if (answer.toLowerCase().includes('kepulauan')) {
            hint += '\n• Berupa kepulauan';
        }
    }
    
    await bot.sendMessage(chatId, {
        text: `${hint}\n\n📊 *Hint digunakan:* ${hintsUsed}/${maxHints}\n💡 Masih ada ${maxHints - hintsUsed} hint tersisa.`
    });
}

module.exports = {
    command: ['tebakbendera', 'tb', 'bendera'],
    ownerOnly: false,
    limit: true,
    tags: 'game',
    help: ['tebakbendera'],
    description: 'Game tebak-tebakan bendera negara',
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
        
        console.log(`[TEBAK BENDERA COMMAND] Received: "${text}" from ${senderId}`);
        
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
                    text: `⚠️ Tidak ada game Tebak Bendera yang aktif!` 
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
                console.error('[TEBAK BENDERA] Error getting stats:', error);
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
                console.error('[TEBAK BENDERA] Error getting leaderboard:', error);
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
                    text: `ℹ️ Tidak ada game aktif. Mulai game dulu dengan .tebakbendera`
                });
                return;
            }
        }
        
        // Cek jika command help
        if (args[0] && args[0].toLowerCase() === 'help') {
            await bot.sendMessage(chatId, {
                text: `🎮 *BANTUAN GAME TEBAK BENDERA*\n\n*Commands:*\n• .tebakbendera - Mulai game baru\n• .tebakbendera stop - Stop game aktif\n• .tebakbendera stats - Lihat statistik\n• .tebakbendera leaderboard [angka] - Lihat leaderboard\n• .tebakbendera hint - Minta petunjuk (saat game aktif)\n\n*Cara Main:*\n1. Ketik .tebakbendera untuk mulai\n2. Bot akan menampilkan bendera negara\n3. Tebak negara pemilik bendera tersebut\n4. REPLY pesan game dengan jawabanmu\n5. Gunakan "hint" jika bingung\n6. Dapatkan poin untuk setiap jawaban benar!\n\n*Tips:*\n• Jawaban bisa nama lengkap atau singkatan\n• Gunakan nama umum negara (Indonesia, bukan Republic of Indonesia)\n• Batas waktu: 40 detik\n• Starter yang salah kena penalti -1 poin`
            });
            return;
        }
        
        // Cek jika command list (daftar negara yang pernah keluar)
        if (args[0] && args[0].toLowerCase() === 'list') {
            try {
                const url = `${config.baseURL}/game/tebakbendera/questions?apikey=${config.apiKey}`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.status && data.data) {
                    const countries = data.data.map(item => `${item.bendera} ${item.nama}`).slice(0, 20);
                    
                    await bot.sendMessage(chatId, {
                        text: `📋 *DAFTAR BENDERA YANG ADA:*\n\n${countries.join('\n')}\n\n...dan ${data.data.length - 20} lebih lainnya!\n\n💡 Total: ${data.data.length} bendera berbeda`
                    });
                }
            } catch (error) {
                console.error('[TEBAK BENDERA] Error getting list:', error);
            }
            return;
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
    if (wrongAttempts >= 1) {
        const continent = gameData.data.continent || 'Global';
        
        await bot.sendMessage(chatId, {
            text: `${result.message}\n\n💡 *Tips:* Negara ini berada di ${continent}.`
        });
    }
}

// Handler untuk jawaban benar (extension untuk Game Manager)
async function handleCorrectAnswerExtended(bot, chatId, userId, gameData, result) {
    // Game Manager sudah menangani semua sistem rank, ban, dan poin
    // Kita hanya perlu mengirim pesan tambahan jika perlu
    const question = gameData.data.currentQuestion;
    const userName = userId.split('@')[0];
    
    // Tampilkan bendera dan nama negara
    let extraMessage = '';
    if (result.similarity < 0.8) {
        extraMessage = `\n📝 *Catatan:* Jawabanmu ("${result.userAnswer}") diterima sebagai alternatif dari "${question.nama}"`;
    }
    
    // Tambahkan fakta menarik tentang negara
    const fact = getCountryFact(question.nama);
    
    await bot.sendMessage(chatId, {
        text: `${result.message}${extraMessage}\n\n${question.bendera} *${question.nama}*${fact}\n\n🎯 @${userName} berhasil menebak bendera!\n🔄 Main lagi? Ketik .tebakbendera!`,
        mentions: [userId]
    });
}

// Fungsi untuk mendapatkan fakta negara
function getCountryFact(countryName) {
    const facts = {
        'Indonesia': '\n💡 *Fakta:* Negara kepulauan terbesar di dunia dengan 17.504 pulau.',
        'Amerika Serikat': '\n💡 *Fakta:* Memiliki 50 negara bagian dan ibu kota Washington D.C.',
        'Jepang': '\n💡 *Fakta:* Dikenal sebagai "Negeri Matahari Terbit".',
        'Brasil': '\n💡 *Fakta:* Negara terbesar di Amerika Selatan.',
        'Rusia': '\n💡 *Fakta:* Negara terluas di dunia.',
        'Australia': '\n💡 *Fakta:* Satu-satunya negara yang juga merupakan benua.',
        'Kanada': '\n💡 *Fakta:* Memiliki garis pantai terpanjang di dunia.',
        'China': '\n💡 *Fakta:* Negara dengan populasi terbesar di dunia.',
        'India': '\n💡 *Fakta:* Negara demokrasi terbesar di dunia.',
        'Mesir': '\n💡 *Fakta:* Memiliki Piramida Giza sebagai salah satu keajaiban dunia.',
        'Prancis': '\n💡 *Fakta:* Menara Eiffel di Paris adalah ikon terkenal.',
        'Jerman': '\n💡 *Fakta:* Dikenal dengan industri otomotifnya (Mercedes, BMW).',
        'Inggris': '\n💡 *Fakta:* Memiliki keluarga kerajaan terkenal.',
        'Italia': '\n💡 *Fakta:* Bentuk seperti sepatu bot.',
        'Spanyol': '\n💡 *Fakta:* Dikenal dengan tradisi matador dan flamenco.',
        'Korea Selatan': '\n💡 *Fakta:* Terkenal dengan gelombang Korea (K-pop, K-drama).',
        'Arab Saudi': '\n💡 *Fakta:* Memiliki kota suci Mekah dan Madinah.',
        'Turki': '\n💡 *Fakta:* Terletak di dua benua (Asia dan Eropa).',
        'Afrika Selatan': '\n💡 *Fakta:* Memiliki tiga ibu kota.',
        'Selandia Baru': '\n💡 *Fakta:* Tempat filming The Lord of the Rings.'
    };
    
    for (const [country, fact] of Object.entries(facts)) {
        if (countryName.toLowerCase().includes(country.toLowerCase())) {
            return fact;
        }
    }
    
    return '';
}