const fs = require("fs");
const path = require("path");
const config = require("./config.json");

// Import Game Manager
const gameManager = require("./lib/helpergame");

require("jimp");

const plugins = new Map();
let loaded = false;

// Bot state
let botMode = config.botMode || "public";
let autoRead = config.autoRead !== undefined ? config.autoRead : true;

// Variables untuk cleanup periodik
let cleanupInterval = null;
const CLEANUP_INTERVAL_MINUTES = 30; // Setiap 30 menit
const GAME_EXPIRY_MINUTES = 60; // Game dianggap expired setelah 60 menit

function loadPlugins() {
    if (loaded) return;
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
                    plugins.get(category.toLowerCase()).push(command);
                    
                    // Register game handlers to Game Manager
                    if (category.toLowerCase() === 'game' && command.gameType) {
                        gameManager.registerGameHandler(command.gameType, command);
                        console.log(`[HANDLER] Registered game handler: ${command.gameType}`);
                    }
                }
            } catch (e) {
                console.error(`Error loading plugin ${category}/${file}:`, e);
            }
        }
    }
    loaded = true;
    console.log("Plugins loaded:", Array.from(plugins.keys()));
}

async function sendMainMenu(bot, m) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    
    let text = `${config.menuCaption}\n\n          「 𝙼𝙴𝙽𝚄 𝚄𝚃𝙰𝙼𝙰 」\n\n`;
    
    text += `📊 *STATUS BOT*\n`;
    text += `├ Mode: ${botMode === "self" ? "Self Mode" : "Public Mode"}\n`;
    text += `├ Auto Read: ${autoRead ? "ON" : "OFF"}\n`;
    text += `└ Active Games: ${gameManager.activeGames.size}\n\n`;
    
    const categories = Array.from(plugins.keys()).sort();
    text += `╔━━━━━━━━「 *LIST MENU* 」━━━━━━━❒\n`;
    for (const cat of categories) {
        text += `│Ketik: ${config.prefix}menu_${cat}\n`;
    }
    text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    
    if (isOwner) {
        text += `👑 *OWNER MENU*\n`;
        text += `├ ${config.prefix}self - Mode hanya owner\n`;
        text += `├ ${config.prefix}public - Mode publik\n`;
        text += `├ ${config.prefix}autoread on/off\n`;
        text += `├ ${config.prefix}stopgame - Stop semua game\n`;
        text += `├ ${config.prefix}cleanupgames - Bersihkan game expired\n`;
        text += `└ ${config.prefix}hidenfeatures - Lihat semua fitur tersembunyi\n\n`;
    }
    
    text += config.copyright;
    await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}

async function sendAllMenu(bot, m, showHidden = false) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    
    let text = `${config.allmenuCaption}\n\n          「 𝙰𝙻𝙻 𝙼𝙴𝙽𝚄 」\n\n`;

    if (isOwner) {
        text += `╔━━━━━━━━「 *OWNER COMMANDS* 」━━━━━━━❒\n`;
        text += `│${config.prefix}self - Mode hanya owner\n`;
        text += `│${config.prefix}public - Mode publik\n`;
        text += `│${config.prefix}autoread on/off\n`;
        text += `│${config.prefix}stopgame - Stop semua game\n`;
        text += `│${config.prefix}cleanupgames - Bersihkan game expired\n`;
        text += `│${config.prefix}hidenfeatures - Lihat semua fitur tersembunyi\n`;
        text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    }

    const categories = Array.from(plugins.keys()).sort();
    for (const cat of categories) {
        const title = cat.toUpperCase();
        const cmds = plugins.get(cat);
        if (cmds.length === 0) continue;

        text += `╔━━━━━━━━「 *${title}* 」━━━━━━━❒\n`;
        
        const visibleCommands = showHidden ? cmds : cmds.filter(cmd => !cmd.hidden);
        
        for (const cmd of visibleCommands) {
            if (cmd.command) {
                const cmdName = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;
                if (cmd.hidden && !showHidden) continue;
                
                text += `│${config.prefix}${cmdName}`;
                
                if (showHidden && cmd.hidden) {
                    text += ` 👻`;
                }
                text += `\n`;
            }
        }
        text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    }

    text += `\nKetik ${config.prefix}menu untuk kembali ke menu utama\n\n`;
    text += config.copyright;

    await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}

async function showHiddenFeatures(bot, m) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    
    let text = `👻 *HIDDEN FEATURES*\n\n`;
    text += `Berikut adalah semua fitur tersembunyi yang ada di handler.js:\n\n`;
    
    let hiddenPlugins = [];
    let totalHiddenPlugins = 0;
    const categories = Array.from(plugins.keys()).sort();
    
    for (const cat of categories) {
        const cmds = plugins.get(cat);
        for (const cmd of cmds) {
            if (cmd.hidden === true && cmd.command) {
                const cmdNames = Array.isArray(cmd.command) ? cmd.command : [cmd.command];
                for (const cmdName of cmdNames) {
                    hiddenPlugins.push(`${config.prefix}${cmdName}`);
                    totalHiddenPlugins++;
                }
            }
        }
    }
    
    text += `╔━━━━━━━━「 *HIDDEN PLUGINS* 」━━━━━━━❒\n`;
    
    if (hiddenPlugins.length > 0) {
        hiddenPlugins.sort();
        for (const pluginCmd of hiddenPlugins) {
            text += `│${pluginCmd}\n`;
        }
    } else {
        text += `│<prefiks><namafitur>\n`;
    }
    
    text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    
    let totalAllCommands = 0;
    for (const cat of categories) {
        totalAllCommands += plugins.get(cat).length;
    }
    
    const handlerCommandsCount = 2 + categories.length + (isOwner ? 5 : 0) + 1;
    
    text += `📊 *STATISTIK*\n`;
    text += `├ Total semua commands: ${totalAllCommands}\n`;
    text += `├ Handler commands: ${handlerCommandsCount}\n`;
    text += `├ Hidden plugins: ${totalHiddenPlugins}\n`;
    text += `├ Total kategori: ${categories.length}\n`;
    text += `├ Active Games: ${gameManager.activeGames.size}\n`;
    text += `└ Cleanup Interval: ${CLEANUP_INTERVAL_MINUTES} menit\n\n`;
    
    if (isOwner) {
        text += `👑 *INFO OWNER*\n`;
        text += `• Handler commands adalah fitur built-in\n`;
        text += `• Plugin hidden harus punya "hidden: true"\n`;
        text += `• Owner bisa lihat semua via .allmenu\n`;
        text += `• Game Manager v1.0 aktif\n`;
        text += `• Cleanup otomatis setiap ${CLEANUP_INTERVAL_MINUTES} menit\n`;
    }
    
    text += `\n${config.copyright}`;
    
    await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}

async function sendSubMenu(bot, m, category) {
    const lowerCat = category.toLowerCase();
    const cmds = plugins.get(lowerCat);
    if (!cmds || cmds.length === 0) {
        return bot.sendMessage(m.key.remoteJid, { text: "Kategori tidak ditemukan atau kosong!" }, { quoted: m });
    }

    const title = category.toUpperCase();
    let text = `╔━━━━━━━━「 *${title}* 」━━━━━━━❒\n`;
    for (const cmd of cmds) {
        if (cmd.command) {
            const cmdName = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;
            if (cmd.hidden) continue;
            text += `│${config.prefix}${cmdName}\n`;
        }
    }
    text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    text += `Ketik ${config.prefix}menu untuk kembali ke menu utama`;

    await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}

// ===== FUNGSI CLEANUP PERIODIK =====
async function performCleanup() {
    try {
        console.log(`[CLEANUP] Starting periodic cleanup...`);
        const startTime = Date.now();
        
        // Bersihkan game expired dari file
        const cleanedCount = await gameManager.cleanupExpiredGames(GAME_EXPIRY_MINUTES);
        
        // Bersihkan timeout yang sudah expired
        let timeoutCleaned = 0;
        const now = Date.now();
        
        // Note: GameManager sudah punya cleanup expired games
        // Ini hanya untuk logging
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`[CLEANUP] Completed in ${duration}ms`);
        console.log(`[CLEANUP] Games cleaned from file: ${cleanedCount}`);
        
        return {
            success: true,
            gamesCleaned: cleanedCount,
            timeoutsCleaned: timeoutCleaned,
            duration: duration
        };
    } catch (error) {
        console.error(`[CLEANUP] Error during cleanup:`, error);
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
            if (result.success && (result.gamesCleaned > 0 || result.timeoutsCleaned > 0)) {
                console.log(`[CLEANUP AUTO] Cleaned ${result.gamesCleaned} expired games`);
            }
        } catch (error) {
            console.error(`[CLEANUP AUTO] Error:`, error);
        }
    }, intervalMs);
    
    console.log(`[CLEANUP] Periodic cleanup started (every ${CLEANUP_INTERVAL_MINUTES} minutes)`);
}

// Stop cleanup interval
function stopCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log(`[CLEANUP] Periodic cleanup stopped`);
    }
}

// Manual cleanup command
async function handleCleanupGames(bot, chatId) {
    try {
        await bot.sendMessage(chatId, { 
            text: `🔄 *Memulai cleanup manual...*\nMembersihkan game yang sudah expired...` 
        });
        
        const result = await performCleanup();
        
        if (result.success) {
            await bot.sendMessage(chatId, { 
                text: `✅ *Cleanup selesai!*\n\n` +
                      `📊 **Hasil:**\n` +
                      `• Game dibersihkan: ${result.gamesCleaned}\n` +
                      `• Durasi: ${result.duration}ms\n` +
                      `• Status: Berhasil\n\n` +
                      `Cleanup otomatis berjalan setiap ${CLEANUP_INTERVAL_MINUTES} menit.`
            });
        } else {
            await bot.sendMessage(chatId, { 
                text: `❌ *Cleanup gagal!*\nError: ${result.error}` 
            });
        }
    } catch (error) {
        console.error(`[CLEANUP MANUAL] Error:`, error);
        await bot.sendMessage(chatId, { 
            text: `❌ *Error saat cleanup!*\n${error.message}` 
        });
    }
}

async function handleOwnerCommands(bot, m, command, args) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    if (!isOwner) return false;
    
    const chatId = m.key.remoteJid;
    
    switch(command) {
        case 'self':
            botMode = "self";
            await bot.sendMessage(chatId, { 
                text: "✅ Bot mode diubah ke *Self Mode*\nHanya owner yang bisa menggunakan bot" 
            }, { quoted: m });
            return true;
            
        case 'public':
            botMode = "public";
            await bot.sendMessage(chatId, { 
                text: "✅ Bot mode diubah ke *Public Mode*\nSemua orang bisa menggunakan bot" 
            }, { quoted: m });
            return true;
            
        case 'autoread':
            if (args[0] === 'on') {
                autoRead = true;
                await bot.sendMessage(chatId, { text: "✅ Auto Read diaktifkan" }, { quoted: m });
            } else if (args[0] === 'off') {
                autoRead = false;
                await bot.sendMessage(chatId, { text: "✅ Auto Read dimatikan" }, { quoted: m });
            } else {
                await bot.sendMessage(chatId, { text: `Gunakan: ${config.prefix}autoread on/off` }, { quoted: m });
            }
            return true;
            
        case 'stopgame':
            // Stop all active games
            const stoppedCount = gameManager.activeGames.size;
            gameManager.cleanup();
            await bot.sendMessage(chatId, { 
                text: `✅ Semua game dihentikan!\nTotal: ${stoppedCount} game aktif` 
            }, { quoted: m });
            return true;
            
        case 'cleanupgames':
            // Manual cleanup
            await handleCleanupGames(bot, chatId);
            return true;
            
        case 'hidenfeatures':
            await showHiddenFeatures(bot, m);
            return true;
    }
    
    return false;
}

// ===== FUNGSI UTAMA UNTUK HANDLE MESSAGES =====
async function messageHandler(bot, m) {
    if (!m.message) return;
    
    const chatId = m.key.remoteJid;
    const userId = m.key.participant || m.key.remoteJid;
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
    const isFromBot = m.key.fromMe;
    
    // ===== CEK BOT MODE =====
    if (botMode === "self" && !isOwner) {
        console.log(`[HANDLER] Self mode active, ignoring non-owner`);
        return;
    }
    
    // ===== AUTO READ =====
    if (autoRead) {
        try {
            await bot.readMessages([m.key]);
        } catch (error) {
            console.error('[AUTO READ] Error:', error);
        }
    }
    
    // Ekstrak teks
    let text = '';
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
    
    console.log(`[HANDLER] Message from ${isFromBot ? 'BOT' : userId}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    // ===== PRIORITAS 1: HANDLE GAME INPUT (tanpa prefix) =====
    const isPrefixed = text.toLowerCase().startsWith(config.prefix);
    
    if (text && !isPrefixed) {
        console.log(`[HANDLER] Non-prefix message detected, checking game input...`);
        
        // Coba handle sebagai input game melalui Game Manager
        const gameResult = await gameManager.processGameInput(bot, m);
        
        if (gameResult.processed) {
            console.log(`[HANDLER] ✓ Game input processed: ${gameResult.reason}`);
            return;
        }
        
        console.log(`[HANDLER] ✗ Not a game input (${gameResult.reason}), checking other handlers...`);
        
        // ===== INTRO REPLY HANDLER =====
        try {
            const introModule = require('./plugin/group/intro.js');
            if (introModule.handleIntroReply) {
                console.log(`[HANDLER] Trying intro reply handler...`);
                await introModule.handleIntroReply(bot, m);
            }
        } catch (error) {
            // Module not found, skip
        }
        
        // ===== ANTI TOXIC CHECK =====
        try {
            const antitoxicModule = require('./plugin/group/antitoxic.js');
            if (antitoxicModule.checkToxicMessage) {
                console.log(`[HANDLER] Checking for toxic message...`);
                await antitoxicModule.checkToxicMessage(bot, m);
            }
        } catch (error) {
            // Module not found or error
        }
        
        return;
    }
    
    // ===== STEP 2: HANDLE COMMANDS (dengan prefix) =====
    if (!isPrefixed) {
        return;
    }
    
    console.log(`[HANDLER] Command detected: "${text}"`);
    
    const args = text.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Handle owner commands terlebih dahulu
    const handled = await handleOwnerCommands(bot, m, command, args);
    if (handled) {
        console.log(`[HANDLER] ✓ Owner command handled: ${command}`);
        return;
    }
    
    // Menu commands
    if (command === "menu") {
        console.log(`[HANDLER] Showing main menu`);
        return sendMainMenu(bot, m);
    }
    
    if (command === "allmenu") {
        console.log(`[HANDLER] Showing all menu`);
        return sendAllMenu(bot, m, false);
    }
    
    if (command === "hidenfeatures") {
        console.log(`[HANDLER] Showing hidden features`);
        await showHiddenFeatures(bot, m);
        return;
    }
    
    if (command.startsWith("menu_")) {
        const cat = command.slice(5);
        console.log(`[HANDLER] Showing submenu for: ${cat}`);
        return sendSubMenu(bot, m, cat);
    }
    
    // ===== SPECIAL HANDLING FOR INTROLIST =====
    if (command === "introlist") {
        console.log(`[HANDLER] Handling introlist command`);
        try {
            const introModule = require('./plugin/group/intro.js');
            if (introModule.introList) {
                await introModule.introList(bot, m);
                return;
            }
        } catch (error) {
            console.error(`[HANDLER] Intro module error:`, error);
        }
    }
    
    // Handler plugin commands
    console.log(`[HANDLER] Looking for plugin command: ${command}`);
    let executed = false;
    
    for (const [cat, cmds] of plugins) {
        for (const cmd of cmds) {
            let cmdName = cmd.command;
            if (Array.isArray(cmdName)) {
                const found = cmdName.find(c => c.toLowerCase() === command);
                if (!found) continue;
                cmdName = found;
            } else {
                if (cmdName.toLowerCase() !== command) continue;
            }
            
            console.log(`[HANDLER] Found plugin: ${cmdName} in category: ${cat}`);
            
            if (cmd.ownerOnly && !isOwner) {
                console.log(`[HANDLER] Owner only, rejecting`);
                await bot.sendMessage(chatId, { text: "⚠️ Command ini hanya untuk owner!" }, { quoted: m });
                return;
            }
            
            try {
                console.log(`[HANDLER] Executing plugin: ${cmdName}`);
                await cmd.execute(bot, m, args);
                executed = true;
                console.log(`[HANDLER] ✓ Plugin executed successfully`);
            } catch (e) {
                console.error(`[HANDLER] ✗ Error executing command ${cmdName}:`, e);
                await bot.sendMessage(chatId, { 
                    text: `❌ Terjadi error saat menjalankan command: ${e.message}` 
                }, { quoted: m });
            }
            break;
        }
        if (executed) break;
    }
    
    if (!executed) {
        console.log(`[HANDLER] ✗ Command not found: ${command}`);
    }
}

// Initialize Game Manager on bot start
async function initialize(bot) {
    try {
        await gameManager.init();
        console.log('[HANDLER] Game Manager initialized');
        
        // Jalankan cleanup expired games saat start
        console.log('[HANDLER] Running initial cleanup...');
        const initialCleanup = await performCleanup();
        if (initialCleanup.success && initialCleanup.gamesCleaned > 0) {
            console.log(`[HANDLER] Initial cleanup: ${initialCleanup.gamesCleaned} expired games removed`);
        }
        
        // Start periodic cleanup
        startCleanupInterval();
        
    } catch (error) {
        console.error('[HANDLER] Error initializing Game Manager:', error);
    }
}

// Cleanup saat bot shutdown
async function shutdown() {
    console.log('[HANDLER] Shutting down...');
    
    // Stop cleanup interval
    stopCleanupInterval();
    
    // Bersihkan game data sebelum shutdown
    try {
        await gameManager.cleanup();
        console.log('[HANDLER] Game data cleaned up');
    } catch (error) {
        console.error('[HANDLER] Error during shutdown cleanup:', error);
    }
}

function notifyOwner(bot) {
    if (config.ownerNumber) {
        bot.sendMessage(config.ownerNumber, { 
            text: `🤖 Bot berhasil connect!\n\n` +
                  `📊 Status Game Manager:\n` +
                  `• Game aktif: ${gameManager.activeGames.size}\n` +
                  `• Cleanup: ${CLEANUP_INTERVAL_MINUTES} menit\n` +
                  `• Auto-cleanup: AKTIF`
        });
    }
}

module.exports = {
    loadPlugins,
    messageHandler,
    notifyOwner,
    initialize,
    shutdown, // Export shutdown function
    getBotMode: () => botMode,
    getAutoRead: () => autoRead,
    gameManager
};