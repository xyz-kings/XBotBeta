// xyz/constants.js - CONTINUE CHAT WITH CUSTOM THUMBNAIL
const fs = require("fs");
const path = require("path");
const config = require("../config.json");

// Bot state variables
let botMode = config.botMode || "public";
let autoRead = config.autoRead !== undefined ? config.autoRead : true;
let typingEffectEnabled = config.sedangmengetik !== undefined ? config.sedangmengetik : true;

// Bot global start time (untuk menu)
const botStartTimeGlobal = Date.now();

// Continue chat config
const continueChatConfig = config.continueChatConfig || {
    forwardingScore: 20,
    showAdAttribution: false,
    renderLargerThumbnail: true,
    containsAutoReply: true,
    defaultBody: "WhatsApp Bot • Fast Response",
    defaultMediaType: 1,
    thumbnailWidth: 300,
    thumbnailHeight: 300
};

// Utility functions
function getGreetingTime() {
    const hour = new Date().getHours();
    
    if (hour >= 4 && hour < 10) return 'pagi';
    if (hour >= 10 && hour < 15) return 'siang';
    if (hour >= 15 && hour < 18) return 'sore';
    if (hour >= 18 && hour < 24) return 'malam';
    return 'subuh';
}

function getRuntime(startTime) {
    const now = Date.now();
    const diff = now - startTime;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days} hari ${hours} jam`;
    } else if (hours > 0) {
        return `${hours} jam ${minutes} menit`;
    } else {
        return `${minutes} menit`;
    }
}

// Format menu sections
function formatCategoryTitle(category) {
    const title = category.toUpperCase();
    return `╔━━━━━━━━「 *${title}* 」━━━━━━━❒\n`;
}

function formatCategoryEnd() {
    return `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
}

// ===== HELPER UNTUK OWNER/BOT ONLY =====
function checkOwnerBotOnly(userId, m) {
    const config = require("../config.json");
    
    // Cek apakah pesan dari bot sendiri
    const isFromBot = m.key.fromMe;
    
    // Cek apakah user adalah owner
    const isOwner = config.ownerNumber && Array.isArray(config.ownerNumber) 
        ? config.ownerNumber.includes(userId)
        : config.ownerNumber === userId;
    
    // Return true jika dari bot atau owner
    return isFromBot || isOwner;
}

function checkOwnerOnly(userId, m = null) {
    const config = require("../config.json");
    
    // Jika ada parameter m, cek juga apakah dari bot
    if (m) {
        const isFromBot = m.key.fromMe;
        if (isFromBot) return true;
    }
    
    // Cek apakah user adalah owner
    const isOwner = config.ownerNumber && Array.isArray(config.ownerNumber) 
        ? config.ownerNumber.includes(userId)
        : config.ownerNumber === userId;
    
    return isOwner;
}

function getOwnerList() {
    const config = require("../config.json");
    
    if (!config.ownerNumber) return [];
    
    if (Array.isArray(config.ownerNumber)) {
        return config.ownerNumber;
    } else {
        return [config.ownerNumber];
    }
}

// ===== CONTINUE CHAT MESSAGE SENDER WITH CUSTOM THUMBNAIL =====
async function sendMessageWithTyping(bot, chatId, content, m, options = {}) {
    const minDelay = options.minDelay || 1000;
    const maxDelay = options.maxDelay || 3000;
    
    if (!typingEffectEnabled) {
        // Kirim langsung tanpa typing effect
        return sendContinueChatWithThumbnail(bot, chatId, content, m, options);
    }
    
    try {
        // Typing indicator
        await bot.sendPresenceUpdate('composing', chatId);
        
        const typingTime = Math.random() * (maxDelay - minDelay) + minDelay;
        await new Promise(resolve => setTimeout(resolve, typingTime));
        
        await bot.sendPresenceUpdate('paused', chatId);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Kirim pesan sebagai continue chat dengan thumbnail
        return await sendContinueChatWithThumbnail(bot, chatId, content, m, options);
    } catch (error) {
        console.error('Error pada efek mengetik:', error);
        return sendContinueChatWithThumbnail(bot, chatId, content, m, options);
    }
}

// Function untuk kirim pesan sebagai continue chat dengan thumbnail custom
async function sendContinueChatWithThumbnail(bot, chatId, content, m, options = {}) {
    try {
        // Cek apakah pesan dari bot sendiri
        const isFromBot = m && m.key && m.key.fromMe;
        const useThumbnail = options.useThumbnail !== false;
        const menuType = options.menuType || 'sub'; // Default ke sub (tanpa thumbnail)
        const thumbnailUrl = options.thumbnailUrl || config.thumbnail || "https://image2url.com/r2/default/images/1769778472772-76624891-7a42-4586-8300-4293e453d304.jpg";
        const botName = options.botName || config.botName || "XYZ Bot";
        const bodyText = options.body || continueChatConfig.defaultBody || "WhatsApp Bot • Fast Response";
        
        // Hanya kirim thumbnail untuk menu utama dan allmenu
        const shouldUseThumbnail = useThumbnail && (menuType === 'main' || menuType === 'all');
        
        console.log(`[CONTINUE CHAT] Type: ${menuType}, Thumbnail: ${shouldUseThumbnail ? 'YA' : 'TIDAK'}`);
        
        if (isFromBot) {
            console.log(`[CONTINUE CHAT] Mengirim ${menuType} ke ${chatId}`);
            
            const messageText = typeof content === 'object' ? content.text : content;
            
            // Format sebagai CONTINUE CHAT dengan THUMBNAIL CUSTOM
            const continueMessage = {
                text: messageText,
                forward: true,
                forwarded: true,
                forwardingScore: continueChatConfig.forwardingScore || 20,
                isForwarded: true,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: continueChatConfig.forwardingScore || 20,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.ownerNumber || '123456789@s.whatsapp.net',
                        newsletterName: botName,
                        serverMessageId: Math.floor(Math.random() * 1000000)
                    },
                    // THUMBNAIL CUSTOM DISINI (hanya jika shouldUseThumbnail true)
                    externalAdReply: shouldUseThumbnail ? {
                        title: botName,
                        body: bodyText,
                        thumbnailUrl: thumbnailUrl,
                        mediaType: continueChatConfig.defaultMediaType || 1,
                        thumbnailWidth: continueChatConfig.thumbnailWidth || 300,
                        thumbnailHeight: continueChatConfig.thumbnailHeight || 300,
                        renderLargerThumbnail: continueChatConfig.renderLargerThumbnail !== false,
                        showAdAttribution: continueChatConfig.showAdAttribution || false,
                        containsAutoReply: continueChatConfig.containsAutoReply !== false,
                        mediaUrl: "",
                        sourceUrl: ""
                    } : undefined
                }
            };
            
            // Kirim sebagai forwarded message dengan thumbnail custom
            return await bot.sendMessage(chatId, continueMessage);
        } else if (m) {
            // Normal reply (tidak pakai continue chat)
            console.log(`[CONTINUE CHAT] Mengirim reply normal ke ${chatId}`);
            return await bot.sendMessage(chatId, content, { quoted: m });
        } else {
            // Normal message tanpa context
            console.log(`[CONTINUE CHAT] Mengirim pesan baru ke ${chatId}`);
            return await bot.sendMessage(chatId, content);
        }
    } catch (error) {
        console.error('[CONTINUE CHAT] Error:', error);
        
        // Fallback: coba kirim sebagai text biasa
        try {
            if (typeof content === 'object' && content.text) {
                return await bot.sendMessage(chatId, { text: content.text });
            }
            return await bot.sendMessage(chatId, content);
        } catch (fallbackError) {
            console.error('[CONTINUE CHAT] Fallback error:', fallbackError);
            throw error;
        }
    }
}

// Function untuk send biasa (tanpa typing effect)
async function sendSimpleMessage(bot, chatId, content, m = null, options = {}) {
    return sendContinueChatWithThumbnail(bot, chatId, content, m, options);
}

// Premium handler
async function getUserRole(premiumHandler, userId, isOwner = false) {
    return premiumHandler.getRole(userId, isOwner);
}

// ===== FUNGSI UNTUK MENDAPATKAN CONFIG MENU =====
function getMenuConfig(menuType = 'main') {
    const defaultConfig = {
        'main': { 
            title: config.botName || "XYZ KINGS BOT", 
            subtitle: "Premium WhatsApp Bot • Main Menu",
            thumbnail: config.thumbnail,
            body: "Main Menu • Fast Response"
        },
        'all': { 
            title: config.botName || "XYZ KINGS BOT", 
            subtitle: "Complete Command List • All Features",
            thumbnail: config.thumbnail,
            body: "All Menu • All Features"
        },
        'sub': { 
            title: config.botName || "XYZ KINGS BOT", 
            subtitle: "Category Menu • Fast Response",
            thumbnail: config.thumbnail,
            body: "Category Menu • Fast Response"
        },
        'premium': { 
            title: config.botName || "XYZ KINGS BOT", 
            subtitle: "Exclusive Features • Premium Access",
            thumbnail: config.thumbnail,
            body: "Premium Menu • Exclusive Access"
        },
        'hidden': { 
            title: config.botName || "XYZ KINGS BOT", 
            subtitle: "Special Access • Owner Only",
            thumbnail: config.thumbnail,
            body: "Hidden Features • Owner Only"
        }
    };
    
    // Jika ada config custom di config.json, gunakan itu
    if (config.menuConfig) {
        if (menuType === 'main' && config.menuConfig.mainMenu) {
            return config.menuConfig.mainMenu;
        } else if (menuType === 'all' && config.menuConfig.allMenu) {
            return config.menuConfig.allMenu;
        } else if (menuType === 'sub' && config.menuConfig.subMenu) {
            return config.menuConfig.subMenu;
        } else if (menuType === 'premium' && config.menuConfig.premiumMenu) {
            return config.menuConfig.premiumMenu;
        } else if (menuType === 'hidden' && config.menuConfig.hiddenMenu) {
            return config.menuConfig.hiddenMenu;
        }
    }
    
    return defaultConfig[menuType] || defaultConfig['main'];
}

// Export semua
module.exports = {
    // Config
    config,
    continueChatConfig,
    
    // Bot state
    botMode,
    autoRead,
    typingEffectEnabled,
    botStartTimeGlobal,
    
    // Utility functions
    getGreetingTime,
    getRuntime,
    formatCategoryTitle,
    formatCategoryEnd,
    
    // Owner/bot checker
    checkOwnerBotOnly,
    checkOwnerOnly,
    getOwnerList,
    
    // Message sending functions (CONTINUE CHAT WITH CUSTOM THUMBNAIL)
    sendMessageWithTyping,
    sendSimpleMessage,
    sendContinueChatWithThumbnail,
    
    // Premium handler
    getUserRole,
    
    // Menu config function
    getMenuConfig
};