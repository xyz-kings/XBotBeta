// xyz/allmenu.js - WITH CUSTOM THUMBNAIL
const { 
    config, 
    sendMessageWithTyping,
    formatCategoryTitle, 
    formatCategoryEnd,
    getMenuConfig
} = require("./constants.js");

async function sendAllMenu(bot, m, plugins, premiumHandler, showHidden = false) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    
    let text = `${config.allmenuCaption || ''}\n\n          「 𝙰𝙻𝙻 𝙼𝙴𝙽𝚄 」\n\n`;

    if (isOwner) {
        text += `╔━━━━━━━━「 *OWNER COMMANDS* 」━━━━━━━❒\n`;
        text += `│${config.prefix}self - Mode hanya owner\n`;
        text += `│${config.prefix}public - Mode publik\n`;
        text += `│${config.prefix}autoread on/off\n`;
        text += `│${config.prefix}effectketik on/off\n`;
        text += `│${config.prefix}stopgame - Stop semua game\n`;
        text += `│${config.prefix}cleanupgames - Bersihkan game expired\n`;
        text += `│${config.prefix}hidenfeatures - Lihat semua fitur tersembunyi\n`;
        text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    }

    // Regular plugins
    const categories = Array.from(plugins.keys())
        .filter(cat => !cat.startsWith('premium_'))
        .sort();
    
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
                
                text += `│${config.prefix}${cmdName}\n`;
            }
        }
        text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    }

    // ===== PREMIUM MENU SECTION =====
    const userId = m.key.participant || m.key.remoteJid;
    const premiumStatus = premiumHandler.isPremium(userId, m);
    const premiumCategories = Array.from(plugins.keys())
        .filter(cat => cat.startsWith('premium_'))
        .map(cat => cat.replace('premium_', ''));
    
    if ((premiumStatus.isPremium || premiumStatus.isOwner || premiumStatus.isBot) && premiumCategories.length > 0) {
        text += `          「 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝙼𝙴𝙽𝚄 」\n\n`;
        
        for (const category of premiumCategories) {
            const categoryKey = `premium_${category}`;
            const pluginsList = plugins.get(categoryKey) || [];
            if (pluginsList.length === 0) continue;
            
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            text += `╔━━━━━━━━「 *${categoryName.toUpperCase()}* 」━━━━━━━❒\n`;
            
            const visiblePlugins = showHidden ? pluginsList : pluginsList.filter(p => !p.hidden);
            
            for (const plugin of visiblePlugins) {
                if (plugin.command) {
                    const cmdName = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
                    if (plugin.hidden && !showHidden) continue;
                    
                    text += `│${config.prefix}${cmdName}\n`;
                }
            }
            text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
        }
        
        text += `📌 *Premium Commands:*\n`;
        text += `├ ${config.prefix}prem_menu - Menu premium\n`;
        text += `├ ${config.prefix}prem_allmenu - Semua fitur\n`;
        text += `└ Status: ${premiumStatus.isPremium ? 'Premium ✅' : 'Owner ✅'}\n\n`;
    }

    text += `\nKetik ${config.prefix}menu untuk kembali ke menu utama\n\n`;
    text += config.copyright || '';

    // Dapatkan config untuk all menu
    const menuConfig = getMenuConfig('all');
    const pushname = m.pushName || "User";
    
    // Kirim sebagai CONTINUE CHAT dengan THUMBNAIL CUSTOM
    return sendMessageWithTyping(bot, m.key.remoteJid, { text: text }, m, {
        menuType: 'all', // Tandai sebagai all menu (akan dapat thumbnail)
        minDelay: 1500,
        maxDelay: 3000,
        useThumbnail: true,
        thumbnailUrl: menuConfig.thumbnail,
        botName: menuConfig.title,
        body: menuConfig.body || "All Menu • All Features"
    });
}

async function showHiddenFeatures(bot, m, plugins, premiumHandler) {
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(m.key.participant || m.key.remoteJid));
    
    let text = `👻 *HIDDEN FEATURES*\n\n`;
    text += `Berikut adalah semua fitur tersembunyi yang ada di handler.js:\n\n`;
    
    let hiddenPlugins = [];
    let totalHiddenPlugins = 0;
    const categories = Array.from(plugins.keys())
        .filter(cat => !cat.startsWith('premium_'))
        .sort();
    
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
    
    // Tambahkan premium hidden plugins
    const premiumCategories = Array.from(plugins.keys())
        .filter(cat => cat.startsWith('premium_'));
    
    for (const category of premiumCategories) {
        const pluginsList = plugins.get(category);
        for (const plugin of pluginsList) {
            if (plugin.hidden === true && plugin.command) {
                const cmdNames = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                for (const cmdName of cmdNames) {
                    hiddenPlugins.push(`${config.prefix}${cmdName} 💎`);
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
    
    // Hitung premium plugins
    let totalPremiumPlugins = 0;
    for (const category of premiumCategories) {
        totalPremiumPlugins += plugins.get(category).length;
    }
    
    const handlerCommandsCount = 2 + categories.length + (isOwner ? 6 : 0) + 1;
    
    text += `📊 *STATISTIK*\n`;
    text += `├ Total semua commands: ${totalAllCommands}\n`;
    text += `├ Premium commands: ${totalPremiumPlugins}\n`;
    text += `├ Hidden plugins: ${totalHiddenPlugins}\n`;
    text += `├ Total kategori: ${categories.length}\n`;
    text += `├ Premium kategori: ${premiumCategories.length}\n`;
    text += `├ Active Games: ${require("./constants.js").gameManager?.activeGames?.size || 0}\n`;
    text += `├ Typing Effect: ${require("./constants.js").typingEffectEnabled ? "ON" : "OFF"}\n`;
    text += `└ Cleanup Interval: ${require("./constants.js").CLEANUP_INTERVAL_MINUTES || 30} menit\n\n`;
    
    if (isOwner) {
        text += `👑 *INFO OWNER*\n`;
        text += `• Handler commands adalah fitur built-in\n`;
        text += `• Plugin hidden harus punya "hidden: true"\n`;
        text += `• Owner bisa lihat semua via .allmenu\n`;
        text += `• Game Manager v1.0 aktif\n`;
        text += `• Cleanup otomatis setiap ${require("./constants.js").CLEANUP_INTERVAL_MINUTES || 30} menit\n`;
        text += `• Effect ketik: ${require("./constants.js").typingEffectEnabled ? 'AKTIF' : 'NONAKTIF'}\n`;
    }
    
    text += `\n${config.copyright || ''}`;

    // Dapatkan config untuk hidden menu
    const menuConfig = getMenuConfig('hidden');
    
    // Kirim sebagai CONTINUE CHAT TANPA THUMBNAIL (karena ini hidden features, bukan all menu)
    return sendMessageWithTyping(bot, m.key.remoteJid, { text: text }, m, {
        menuType: 'hidden', // Tandai sebagai hidden menu (tanpa thumbnail)
        minDelay: 2000,
        maxDelay: 4000
    });
}

module.exports = {
    sendAllMenu,
    showHiddenFeatures
};