// xyz/submenu.js - WITHOUT THUMBNAIL (for submenus)
const { 
    config, 
    sendMessageWithTyping,
    getMenuConfig
} = require("./constants.js");

async function sendSubMenu(bot, m, category, plugins) {
    const lowerCat = category.toLowerCase();
    const cmds = plugins.get(lowerCat);
    if (!cmds || cmds.length === 0) {
        const errorText = `❌ *CATEGORY NOT FOUND!*\n\n` +
                         `Kategori "${category}" tidak ditemukan.\n\n` +
                         `📌 Gunakan ${config.prefix}menu untuk melihat daftar menu.`;
        
        return sendMessageWithTyping(bot, m.key.remoteJid, { text: errorText }, m, {
            menuType: 'sub', // Tandai sebagai submenu
            minDelay: 1000,
            maxDelay: 2500
        });
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

    // Kirim sebagai CONTINUE CHAT TANPA THUMBNAIL (karena ini submenu)
    return sendMessageWithTyping(bot, m.key.remoteJid, { text: text }, m, {
        menuType: 'sub', // Tandai sebagai submenu
        minDelay: 1000,
        maxDelay: 2500
    });
}

// Premium menu functions
async function sendPremiumMenu(bot, m, plugins, premiumHandler, showAll = false) {
    const userId = m.key.participant || m.key.remoteJid;
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
    const pushname = m.pushName || "User";
    
    // Cek premium status
    const premiumStatus = premiumHandler.isPremium(userId, m);
    
    // Jika bukan premium/owner dan mau lihat premium menu
    if (!premiumStatus.isPremium && !premiumStatus.isOwner && !premiumStatus.isBot) {
        const errorText = `❌ *PREMIUM MENU LOCKED!*\n\n` +
                        `Fitur premium hanya untuk user premium.\n\n` +
                        `💎 *Upgrade ke Premium:*\n` +
                        `Gunakan: ${config.prefix}xbuy status <hari>\n` +
                        `1 hari = 5 XCoin\n\n` +
                        `💰 *Cek XCoin:* ${config.prefix}myxcoin\n\n` +
                        `👑 *Owner/Bot:* Selalu premium`;
        
        return sendMessageWithTyping(bot, m.key.remoteJid, { text: errorText }, m, {
            menuType: 'premium', // Tandai sebagai premium menu
            minDelay: 1000,
            maxDelay: 2500
        });
    }
    
    // Get premium categories dari plugins map
    const premiumCategories = Array.from(plugins.keys())
        .filter(cat => cat.startsWith('premium_'))
        .map(cat => cat.replace('premium_', ''));
    
    let text = `          「 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝙼𝙴𝙽𝚄 」\n\n`;
    
    if (showAll) {
        text += `📋 *ALL PREMIUM COMMANDS*\n\n`;
        
        if (premiumCategories.length === 0) {
            text += `📭 *Belum ada fitur premium*\n`;
            text += `💡 Fitur premium akan ditambahkan segera!\n\n`;
        }
        
        // Tampilkan semua command premium
        for (const category of premiumCategories) {
            const categoryKey = `premium_${category}`;
            const pluginsList = plugins.get(categoryKey) || [];
            if (pluginsList.length === 0) continue;
            
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            text += `╔━━━━━━━━「 *${categoryName.toUpperCase()}* 」━━━━━━━❒\n`;
            
            for (const plugin of pluginsList) {
                const cmdName = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
                text += `│${config.prefix}${cmdName}\n`;
            }
            
            text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
        }
        
    } else {
        text += `📁 *PREMIUM CATEGORIES*\n\n`;
        
        if (premiumCategories.length === 0) {
            text += `📭 *Belum ada kategori premium*\n`;
            text += `💡 Fitur premium akan ditambahkan segera!\n\n`;
        }
        
        // Tampilkan kategori premium
        text += `╔━━━━━━━━「 *𝙼𝙴𝙽𝚄 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 * 」━━━━━━━❒\n`;
        for (const category of premiumCategories) {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            text += `│${config.prefix}prem_${category}\n`;
        }
        text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
        
        text += `📌 *Info:*\n`;
        text += `• Gunakan ${config.prefix}prem_<kategori> untuk lihat fitur\n`;
        text += `• Gunakan ${config.prefix}prem_allmenu untuk lihat semua\n`;
        text += `• Status kamu: ${premiumStatus.isPremium ? 'Premium ✅' : 'Free ❌'}\n\n`;
    }
    
    text += `👑 *Premium Status:*\n`;
    if (premiumStatus.isBot) {
        text += `• Bot: VVIP + Dark VVIP\n`;
    } else if (premiumStatus.isOwner) {
        text += `• Owner: VVIP + Dark VVIP\n`;
    } else if (premiumStatus.isPremium) {
        const days = premiumStatus.daysLeft || 0;
        const hours = premiumStatus.hoursLeft || 0;
        const minutes = premiumStatus.minutesLeft || 0;
        text += `• Dark VVIP: ${days}d ${hours}h ${minutes}m\n`;
    }
    
    text += `\n${config.copyright || ''}`;

    // Kirim sebagai CONTINUE CHAT TANPA THUMBNAIL (karena ini bukan main menu atau allmenu)
    return sendMessageWithTyping(bot, m.key.remoteJid, { text: text }, m, {
        menuType: 'premium', // Tandai sebagai premium menu
        minDelay: 1500,
        maxDelay: 3000
    });
}

async function sendPremiumSubMenu(bot, m, category, plugins, premiumHandler) {
    const userId = m.key.participant || m.key.remoteJid;
    const pushname = m.pushName || "User";
    
    // Cek premium status
    const premiumStatus = premiumHandler.isPremium(userId, m);
    if (!premiumStatus.isPremium && !premiumStatus.isOwner && !premiumStatus.isBot) {
        const errorText = `❌ *PREMIUM FEATURE LOCKED!*\n\n` +
                        `Fitur ini hanya untuk user premium.\n\n` +
                        `💎 *Upgrade ke Premium:*\n` +
                        `${config.prefix}xbuy status <hari>`;
        
        return sendMessageWithTyping(bot, m.key.remoteJid, { text: errorText }, m, {
            menuType: 'premium', // Tandai sebagai premium menu
            minDelay: 1000,
            maxDelay: 2500
        });
    }
    
    const categoryKey = `premium_${category.toLowerCase()}`;
    const pluginsList = plugins.get(categoryKey) || [];
    
    if (pluginsList.length === 0) {
        const errorText = `❌ Kategori premium "${category}" tidak ditemukan atau kosong.\n\n` +
                         `💡 Gunakan ${config.prefix}prem_menu untuk melihat kategori yang tersedia.`;
        
        return sendMessageWithTyping(bot, m.key.remoteJid, { text: errorText }, m, {
            menuType: 'premium', // Tandai sebagai premium menu
            minDelay: 1000,
            maxDelay: 2500
        });
    }
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    let text = `╔━━━━━━━━「 *${categoryName.toUpperCase()}* 」━━━━━━━❒\n`;
    
    for (const plugin of pluginsList) {
        const cmdName = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
        text += `│${config.prefix}${cmdName}\n`;
    }
    
    text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    text += `👑 Status: ${premiumStatus.isPremium ? 'Premium ✅' : 'Free ❌'}\n`;
    text += `📌 Gunakan ${config.prefix}prem_menu untuk kembali\n`;
    text += `📌 Total fitur: ${pluginsList.length}`;

    // Kirim sebagai CONTINUE CHAT TANPA THUMBNAIL
    return sendMessageWithTyping(bot, m.key.remoteJid, { text: text }, m, {
        menuType: 'premium', // Tandai sebagai premium menu
        minDelay: 1500,
        maxDelay: 3000
    });
}

module.exports = {
    sendSubMenu,
    sendPremiumMenu,
    sendPremiumSubMenu
};