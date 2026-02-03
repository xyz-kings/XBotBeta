const fs = require("fs");
const path = require("path");
const config = require("./config.json");

// Import Game Manager
const gameManager = require("./lib/helpergame");
// Import AFK Handler
const AFKHandler = require("./lib/afkHandler");
const afkHandler = new AFKHandler();
// Import Premium Handler
const premiumHandler = require("./lib/helperpremium");

// ===== IMPORT MODULE MENU BARU =====
const menuModule = require("./xyz/menu");
const allmenuModule = require("./xyz/allmenu");
const submenuModule = require("./xyz/submenu");
const constants = require("./xyz/constants");

require("jimp");

// ===== PENGATURAN IGNORE OLD MESSAGES (FIXED) =====
let botStartTime = Date.now();

// Fungsi untuk cek apakah pesan diterima SEBELUM bot start
function isMessageBeforeBotStart(messageTimestamp) {
    const messageTime = messageTimestamp * 1000;
    return messageTime < botStartTime;
}

// Set waktu bot start
function setBotStartTime() {
    botStartTime = Date.now();
}
// ===== END PENGATURAN IGNORE OLD MESSAGES =====

// ===== TAMPILAN ASCII SAAT START =====
function displayAsciiArt() {
    console.clear();
    
    const colors = {
        reset: "\x1b[0m",
        green: "\x1b[32m",
        white: "\x1b[37m"
    };

    const asciiArt = `${colors.green}
▒██   ██▒▓██   ██▓▒███████▒ ▄▄▄▄    ▒█████  ▄▄▄█████▓  ██████ 
▒▒ █ █ ▒░ ▒██  ██▒▒ ▒ ▒ ▄▀░▓█████▄ ▒██▒  ██▒▓  ██▒ ▓▒▒██    ▒ 
░░  █   ░  ▒██ ██░░ ▒ ▄▀▒░ ▒██▒ ▄██▒██░  ██▒▒ ▓██░ ▒░░ ▓██▄   
 ░ █ █ ▒   ░ ▐██▓░  ▄▀▒   ░▒██░█▀  ▒██   ██▒░ ▓██▓ ░   ▒   ██▒
▒██▒ ▒██▒  ░ ██▒▓░▒███████▒░▓█  ▀█▓░ ████▓▒░  ▒██▒ ░ ▒██████▒▒
▒▒ ░ ░▓ ░   ██▒▒▒ ░▒▒ ▓░▒░▒░▒▓███▀▒░ ▒░▒░▒░   ▒ ░░   ▒ ▒▓▒ ▒ ░
░░   ░▒ ░ ▓██ ░▒░ ░░▒ ▒ ░ ▒▒░▒   ░   ░ ▒ ▒░     ░    ░ ░▒  ░ ░
 ░    ░   ▒ ▒ ░░  ░ ░ ░ ░ ░ ░    ░ ░ ░ ░ ▒    ░      ░  ░  ░  
 ░    ░   ░ ░       ░ ░     ░          ░ ░                 ░  
          ░ ░     ░              ░${colors.reset}
    `;
    
    console.log(asciiArt);
    console.log(`${colors.green}Welcome To Script By ©XyzKings${colors.reset}`);
    
    // Format tanggal
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    console.log(`${colors.white}${dayName} ${hours}:${minutes}:${seconds} ${date} ${month} ${year}${colors.reset}`);
    console.log("\n");
}

// Panggil fungsi displayAsciiArt
displayAsciiArt();
// ===== END TAMPILAN ASCII =====

// ===== CUSTOM LOGGER UNTUK FILTER LOG BAILEYS & SESSION =====
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Daftar kata kunci untuk filter log Baileys yang tidak perlu
const BAILEYS_LOG_KEYWORDS = [
    'SessionEntry', 'Closing session:', 'Removing old closed session:', 'registrationId:',
    'currentRatchet:', 'ephemeralKeyPair:', 'rootKey:', 'indexInfo:', 'pendingPreKey:',
    '_chains:', '<Buffer', 'chainKey:', 'messageKeys:', 'baseKey:', 'remoteIdentityKey:',
    'signedKeyId:', 'preKeyId:', 'lastRemoteEphemeralKey:', 'previousCounter:', 'baseKeyType:',
    'closed:', 'used:', 'created:', 'ws connect', 'ws close', 'ws connection',
    'connection update', 'qr', 'connection', 'creds updated', 'processing message',
    'message from', 'sending message', 'sent message', 'receiving messages',
    'presence update', 'chatstate', 'group update', 'group participants',
    'received notify', 'stream:', 'baileys', 'socket', 'handshake', 'login', 'user logged in'
];

// Fungsi untuk menentukan apakah log harus difilter
function shouldFilterLog(message) {
    const lowerMessage = message.toLowerCase();
    
    if (message.includes('pubKey:') && message.includes('privKey:')) {
        return true;
    }
    
    if (message.includes('0x') && message.length > 100) {
        return true;
    }
    
    return BAILEYS_LOG_KEYWORDS.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
    );
}

// Override console.log
console.log = function(...args) {
    const message = args.join(' ');
    
    // Filter log yang tidak diinginkan
    if (shouldFilterLog(message)) {
        return;
    }
    
    // Format log agar lebih rapi
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    originalConsoleLog.call(console, formattedMessage);
};

// Override console.error
console.error = function(...args) {
    const message = args.join(' ');
    
    if (shouldFilterLog(message)) {
        return;
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ❌ ${message}`;
    
    originalConsoleError.call(console, formattedMessage);
};

// Override console.warn
console.warn = function(...args) {
    const message = args.join(' ');
    
    if (shouldFilterLog(message)) {
        return;
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ⚠️ ${message}`;
    
    originalConsoleWarn.call(console, formattedMessage);
};

// Clean log untuk pesan koneksi awal
console.info = function(...args) {
    const message = args.join(' ');
    const timestamp = new Date().toLocaleTimeString();
    
    if (message.includes('Bot connected') || 
        message.includes('Connected to') || 
        message.includes('Initializing') ||
        message.includes('ready')) {
        const formattedMessage = `[${timestamp}] ✅ ${message}`;
        originalConsoleLog.call(console, formattedMessage);
    }
};
// ===== END CUSTOM LOGGER =====

const plugins = new Map();
let loaded = false;

// Variables untuk cleanup periodik
let cleanupInterval = null;
const CLEANUP_INTERVAL_MINUTES = 30;
const GAME_EXPIRY_MINUTES = 60;

function loadPlugins() {
    if (loaded) return;
    
    // ===== LOAD REGULAR PLUGINS =====
    const pluginDir = path.join(__dirname, "plugin");
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir, { recursive: true });

    const categories = fs.readdirSync(pluginDir).filter(f => fs.statSync(path.join(pluginDir, f)).isDirectory());

    for (const category of categories) {
        const catPath = path.join(pluginDir, category);
        const files = fs.readdirSync(catPath).filter(f => f.endsWith(".js"));
        plugins.set(category.toLowerCase(), []);

        for (const file of files) {
            try {
                delete require.cache[require.resolve(path.join(catPath, file))];
                const command = require(path.join(catPath, file));
                if (typeof command === "object" && command.command) {
                    command._sendWithTyping = async function(content, options = {}) {
                        return constants.sendMessageWithTyping(bot, m.key.remoteJid, content, m, options);
                    };
                    
                    plugins.get(category.toLowerCase()).push(command);
                    
                    if (category.toLowerCase() === 'game' && command.gameType) {
                        gameManager.registerGameHandler(command.gameType, command);
                    }
                }
            } catch (e) {
                console.error(`❌ Error loading plugin ${category}/${file}:`, e);
            }
        }
    }
    
    // ===== LOAD PREMIUM PLUGINS (TERPISAH) =====
    const premiumDir = path.join(__dirname, "premium");
    if (fs.existsSync(premiumDir)) {
        const premiumCategories = fs.readdirSync(premiumDir).filter(f => 
            fs.statSync(path.join(premiumDir, f)).isDirectory()
        );
        
        for (const category of premiumCategories) {
            const catPath = path.join(premiumDir, category);
            const files = fs.readdirSync(catPath).filter(f => f.endsWith(".js"));
            
            // Tambahkan ke plugins map dengan prefix "premium_"
            const pluginCategory = `premium_${category.toLowerCase()}`;
            plugins.set(pluginCategory, []);
            
            for (const file of files) {
                try {
                    delete require.cache[require.resolve(path.join(catPath, file))];
                    const command = require(path.join(catPath, file));
                    if (typeof command === "object" && command.command) {
                        command._sendWithTyping = async function(content, options = {}) {
                            return constants.sendMessageWithTyping(bot, m.key.remoteJid, content, m, options);
                        };
                        
                        // Tandai sebagai premium
                        command.premiumOnly = true;
                        command.category = pluginCategory;
                        
                        plugins.get(pluginCategory).push(command);
                        console.log(`💎 Loaded premium: ${category}/${file}`);
                    }
                } catch (e) {
                    console.error(`❌ Error loading premium plugin ${category}/${file}:`, e);
                }
            }
        }
    }
    
    loaded = true;
    
    // Log summary
    const allCategories = Array.from(plugins.keys()).filter(cat => !cat.startsWith('premium_'));
    const premiumCategories = Array.from(plugins.keys()).filter(cat => cat.startsWith('premium_'));
    
    console.log(`📦 Plugin dimuat: ${allCategories.join(', ')}`);
    if (premiumCategories.length > 0) {
        console.log(`💎 Premium plugins: ${premiumCategories.length} categories`);
        // Hitung total premium commands
        let totalPremiumCmds = 0;
        for (const cat of premiumCategories) {
            totalPremiumCmds += plugins.get(cat).length;
        }
        console.log(`💎 Total premium commands: ${totalPremiumCmds}`);
    }
}

// ===== CUSTOM LOGGING SYSTEM =====
function logMessage(message, m = null) {
    const timestamp = new Date().toLocaleTimeString();
    let formattedMessage = `[${timestamp}] ${message}`;
    
    if (m && m.key) {
        const isFromBot = m.key.fromMe;
        const userId = m.key.participant || m.key.remoteJid;
        const pushname = m.pushName || "Unknown";
        
        if (isFromBot) {
            formattedMessage = `[${timestamp}] 🤖 BOT: ${message}`;
        } else {
            const shortId = userId.replace(/[^0-9]/g, '').slice(-6);
            formattedMessage = `[${timestamp}] 👤 ${pushname} (${shortId}): ${message}`;
        }
    }
    
    originalConsoleLog.call(console, formattedMessage);
}

// ===== FUNGSI CLEANUP PERIODIK =====
async function performCleanup() {
    try {
        const startTime = Date.now();
        
        const cleanedCount = await gameManager.cleanupExpiredGames(GAME_EXPIRY_MINUTES);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleanup selesai: ${cleanedCount} game expired dibersihkan (${duration}ms)`);
        }
        
        return {
            success: true,
            gamesCleaned: cleanedCount,
            duration: duration
        };
    } catch (error) {
        console.error('❌ Error saat cleanup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Start periodic cleanup
function startCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
    }
    
    const intervalMs = CLEANUP_INTERVAL_MINUTES * 60 * 1000;
    
    cleanupInterval = setInterval(async () => {
        try {
            const result = await performCleanup();
            if (result.success && result.gamesCleaned > 0) {
                console.log(`🧹 [AUTO CLEANUP] ${result.gamesCleaned} game expired dibersihkan`);
            }
        } catch (error) {
            console.error(`❌ [AUTO CLEANUP] Error:`, error);
        }
    }, intervalMs);
    
    console.log(`🔧 Cleanup periodik dimulai (setiap ${CLEANUP_INTERVAL_MINUTES} menit)`);
}

// Stop cleanup interval
function stopCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log(`🔧 Cleanup periodik dihentikan`);
    }
}

// Manual cleanup command
async function handleCleanupGames(bot, m) {
    const chatId = m.key.remoteJid;
    try {
        await constants.sendMessageWithTyping(bot, chatId, { 
            text: `🔄 *Memulai cleanup manual...*\nMembersihkan game yang sudah expired...` 
        }, m);
        
        const result = await performCleanup();
        
        if (result.success) {
            await constants.sendMessageWithTyping(bot, chatId, { 
                text: `✅ *Cleanup selesai!*\n\n` +
                      `📊 **Hasil:**\n` +
                      `• Game dibersihkan: ${result.gamesCleaned}\n` +
                      `• Durasi: ${result.duration}ms\n` +
                      `• Status: Berhasil\n\n` +
                      `Cleanup otomatis berjalan setiap ${CLEANUP_INTERVAL_MINUTES} menit.`
            }, m);
        }
    } catch (error) {
        console.error(`❌ [CLEANUP MANUAL] Error:`, error);
    }
}

// ===== HANDLE OWNER COMMANDS =====
async function handleOwnerCommands(bot, m, command, args) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    const chatId = m.key.remoteJid;
    
    if (!isOwner) return false;
    
    switch(command) {
        case 'self':
            constants.botMode = "self";
            await constants.sendMessageWithTyping(bot, chatId, { 
                text: "✅ Bot mode diubah ke *Self Mode*\nHanya owner yang bisa menggunakan bot" 
            }, m);
            return true;
            
        case 'public':
            constants.botMode = "public";
            await constants.sendMessageWithTyping(bot, chatId, { 
                text: "✅ Bot mode diubah ke *Public Mode*\nSemua orang bisa menggunakan bot" 
            }, m);
            return true;
            
        case 'autoread':
            if (args[0] === 'on') {
                constants.autoRead = true;
                await constants.sendMessageWithTyping(bot, chatId, { text: "✅ Auto Read diaktifkan" }, m);
            } else if (args[0] === 'off') {
                constants.autoRead = false;
                await constants.sendMessageWithTyping(bot, chatId, { text: "✅ Auto Read dimatikan" }, m);
            }
            return true;
            
        case 'effectketik':
            if (args[0] === 'on') {
                constants.typingEffectEnabled = true;
                await constants.sendMessageWithTyping(bot, chatId, { text: "✅ Efek mengetik diaktifkan" }, m);
            } else if (args[0] === 'off') {
                constants.typingEffectEnabled = false;
                await constants.sendMessageWithTyping(bot, chatId, { text: "✅ Efek mengetik dimatikan" }, m);
            }
            return true;
            
        case 'stopgame':
            const stoppedCount = gameManager.activeGames.size;
            gameManager.cleanup();
            await constants.sendMessageWithTyping(bot, chatId, { 
                text: `✅ Semua game dihentikan!\nTotal: ${stoppedCount} game aktif` 
            }, m);
            return true;
            
        case 'cleanupgames':
            await handleCleanupGames(bot, m);
            return true;
            
        case 'hidenfeatures':
            await allmenuModule.showHiddenFeatures(bot, m, plugins, premiumHandler);
            return true;
    }
    
    return false;
}

// ===== FUNGSI UTAMA UNTUK HANDLE MESSAGES =====
async function messageHandler(bot, m) {
    if (!m.message) return;
    
    // ===== CEK JIKA PESAN DITERIMA SEBELUM BOT START =====
    if (m.messageTimestamp && isMessageBeforeBotStart(m.messageTimestamp)) {
        return; // Langsung return, ABORT PROCESS tanpa log
    }
    
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
    const pushname = m.pushName || "Unknown";
    
    // ===== CEK BOT MODE =====
    if (constants.botMode === "self" && !isOwner) {
        logMessage(`🚫 Non-owner di self mode: ${pushname}`, m);
        return;
    }
    
    // ===== AUTO READ =====
    if (constants.autoRead) {
        try {
            await bot.readMessages([m.key]);
        } catch (error) {
            console.error('❌ Error auto read:', error);
        }
    }
    
    // Ekstrak teks
    let text = '';
    let messageType = 'text';
    
    if (m.message?.conversation) {
        text = m.message.conversation;
    } else if (m.message?.extendedTextMessage?.text) {
        text = m.message.extendedTextMessage.text;
    } else if (m.message?.imageMessage?.caption) {
        text = m.message.imageMessage.caption;
        messageType = 'image';
    } else if (m.message?.videoMessage?.caption) {
        text = m.message.videoMessage.caption;
        messageType = 'video';
    } else if (m.message?.stickerMessage) {
        messageType = 'sticker';
    } else if (m.message?.audioMessage) {
        messageType = 'audio';
    } else if (m.message?.documentMessage) {
        messageType = 'document';
    }
    
    text = text ? text.trim() : '';
    
    // Log setiap pesan yang masuk
    let logText = text;
    if (logText.length > 50) {
        logText = logText.substring(0, 50) + '...';
    }
    
    if (messageType === 'text' && text) {
        logMessage(`💬 "${logText}"`, m);
    } else if (messageType !== 'text') {
        logMessage(`📎 ${messageType.toUpperCase()}`, m);
    }
    
    // ===== PRIORITAS 1: HANDLE AFK SYSTEM =====
    const isPrefixed = text.toLowerCase().startsWith(config.prefix);
    
    if (text && !isPrefixed) {
        const afkProcessed = await afkHandler.checkAFK(bot, m);
        if (afkProcessed) {
            return;
        }
        
        const gameResult = await gameManager.processGameInput(bot, m);
        if (gameResult.processed) {
            return;
        }
        
        // ===== INTRO REPLY HANDLER =====
        try {
            const introModule = require('./plugin/group/intro.js');
            if (introModule.handleIntroReply) {
                await introModule.handleIntroReply(bot, m);
            }
        } catch (error) {}
        
        // ===== ANTI TOXIC CHECK =====
        try {
            const antitoxicModule = require('./plugin/group/antitoxic.js');
            if (antitoxicModule.checkToxicMessage) {
                await antitoxicModule.checkToxicMessage(bot, m);
            }
        } catch (error) {}
        
        return;
    }
    
    // ===== STEP 2: HANDLE COMMANDS (dengan prefix) =====
    if (!isPrefixed) {
        return;
    }
    
    const args = text.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // ===== HANDLE MENU COMMANDS =====
    if (command === "menu") {
        logMessage(`📋 Menu utama`, m);
        return menuModule.sendMainMenu(bot, m, plugins, premiumHandler);
    }
    
    if (command === "allmenu") {
        logMessage(`📚 All menu`, m);
        return allmenuModule.sendAllMenu(bot, m, plugins, premiumHandler, false);
    }
    
    if (command === "hidenfeatures") {
        if (!isOwner) return;
        logMessage(`👻 Hidden features`, m);
        await allmenuModule.showHiddenFeatures(bot, m, plugins, premiumHandler);
        return;
    }
    
    if (command.startsWith("menu_")) {
        const cat = command.slice(5);
        logMessage(`📂 Submenu: ${cat}`, m);
        return submenuModule.sendSubMenu(bot, m, cat, plugins);
    }
    
    // ===== HANDLE PREMIUM MENU COMMANDS =====
    if (command === "prem_menu" || command === "premium_menu") {
        logMessage(`💎 Premium menu`, m);
        return submenuModule.sendPremiumMenu(bot, m, plugins, premiumHandler, false);
    }
    
    if (command === "prem_allmenu" || command === "premium_allmenu") {
        logMessage(`💎 Premium all menu`, m);
        return submenuModule.sendPremiumMenu(bot, m, plugins, premiumHandler, true);
    }
    
    // Handle premium submenu (prem_<category>)
    if (command.startsWith("prem_") && command !== "prem_menu" && command !== "prem_allmenu") {
        const category = command.slice(5);
        logMessage(`💎 Premium submenu: ${category}`, m);
        return submenuModule.sendPremiumSubMenu(bot, m, category, plugins, premiumHandler);
    }
    
    // Handle owner commands terlebih dahulu
    const handled = await handleOwnerCommands(bot, m, command, args);
    if (handled) {
        return;
    }
    
    // Handler plugin commands
    let executed = false;
    let isOwnerOnlyCommand = false;
    let isPremiumOnlyCommand = false;
    
    // Cek di semua plugins (termasuk premium)
    for (const [cat, cmds] of plugins) {
        for (const cmd of cmds) {
            let cmdName = cmd.command;
            let commandFound = false;
            
            if (Array.isArray(cmdName)) {
                const found = cmdName.find(c => c.toLowerCase() === command);
                if (!found) continue;
                cmdName = found;
                commandFound = true;
            } else {
                if (cmdName.toLowerCase() !== command) continue;
                commandFound = true;
            }
            
            if (!commandFound) continue;
            
            // ===== CEK APAKAH COMMAND HANYA UNTUK OWNER =====
            if (cmd.ownerOnly && !isOwner) {
                logMessage(`🚫 Owner-only: ${cmdName}`, m);
                isOwnerOnlyCommand = true;
                executed = true;
                break;
            }
            
            // ===== CEK APAKAH COMMAND PREMIUM ONLY =====
            if (cmd.premiumOnly) {
                const premiumStatus = premiumHandler.isPremium(userId, m);
                if (!premiumStatus.isPremium && !premiumStatus.isOwner && !premiumStatus.isBot) {
                    logMessage(`🚫 Premium-only: ${cmdName}`, m);
                    
                    // Kirim pesan bahwa ini hanya untuk premium
                    const premiumMsg = `❌ *Fitur Premium Only!*\n\n` +
                                      `Fitur *${cmdName}* hanya untuk user premium.\n\n` +
                                      `💎 *Upgrade ke Premium:*\n` +
                                      `Gunakan: ${config.prefix}xbuy status <hari>\n` +
                                      `1 hari = 5 XCoin\n\n` +
                                      `💰 *Cek XCoin:* ${config.prefix}myxcoin`;
                    
                    await constants.sendMessageWithTyping(bot, chatId, { text: premiumMsg }, m);
                    
                    isPremiumOnlyCommand = true;
                    executed = true;
                    break;
                }
            }
            
            try {
                logMessage(`⚡ Executing: ${cmdName}`, m);
                
                await cmd.execute(bot, m, args);
                executed = true;
                logMessage(`✅ Success: ${cmdName}`, m);
            } catch (e) {
                logMessage(`❌ Error: ${cmdName}`, m);
            }
            break;
        }
        if (executed) break;
    }
    
    // ===== HANDLE TYPO / COMMAND NOT FOUND =====
    if (!executed && !isOwnerOnlyCommand && !isPremiumOnlyCommand) {
        logMessage(`❓ Tidak ditemukan: ${command}`, m);
        return;
    }
}

// ===== INITIALIZE PREMIUM HANDLER =====
async function initialize(bot) {
    try {
        // Initialize game manager
        await gameManager.init();
        console.log('🎮 Game Manager siap');
        
        // Jalankan cleanup expired games saat start
        const initialCleanup = await performCleanup();
        if (initialCleanup.success && initialCleanup.gamesCleaned > 0) {
            console.log(`🧹 ${initialCleanup.gamesCleaned} game expired dibersihkan`);
        }
        
        // Cleanup expired premium
        const premiumCleanup = premiumHandler.cleanup();
        if (premiumCleanup.cleaned > 0) {
            console.log(`👑 ${premiumCleanup.cleaned} premium expired dibersihkan`);
        }
        
        console.log(`⌨️ Efek mengetik: ${constants.typingEffectEnabled ? 'ON' : 'OFF'}`);
        console.log(`👑 Premium Handler: READY`);
        console.log(`🖼️  Thumbnail URL: ${config.thumbnail || 'Tidak ada'}`);
        
        // Start cleanup interval
        startCleanupInterval();
        
    } catch (error) {
        console.error('❌ Error Game Manager:', error);
    }
}

// Cleanup saat bot shutdown
async function shutdown() {
    console.log('🛑 Shutting down...');
    
    stopCleanupInterval();
    
    try {
        await gameManager.cleanup();
        console.log('🧹 Data game dibersihkan');
    } catch (error) {
        console.error('❌ Error saat shutdown:', error);
    }
}

function notifyOwner(bot) {
    setBotStartTime();
    
    if (config.ownerNumber) {
        bot.sendMessage(config.ownerNumber, { 
            text: `🤖 Bot berhasil connect!\n\n` +
                  `📊 Status Bot:\n` +
                  `• Mode: ${constants.botMode}\n` +
                  `• Auto Read: ${constants.autoRead ? 'ON' : 'OFF'}\n` +
                  `• Typing Effect: ${constants.typingEffectEnabled ? 'ON' : 'OFF'}\n` +
                  `• Active Games: ${gameManager.activeGames.size}\n` +
                  `• Cleanup: ${CLEANUP_INTERVAL_MINUTES} menit\n` +
                  `👑 Premium System: AKTIF\n` +
                  `↪️ Continue Chat System: AKTIF\n` +
                  `🖼️  Thumbnail: ${config.thumbnail ? 'ADA' : 'TIDAK ADA'}`
        });
    }
}

module.exports = {
    loadPlugins,
    messageHandler,
    notifyOwner,
    initialize,
    shutdown,
    getBotMode: () => constants.botMode,
    getAutoRead: () => constants.autoRead,
    getTypingEffect: () => constants.typingEffectEnabled,
    gameManager,
    premiumHandler
};