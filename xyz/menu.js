// xyz/menu.js - WITH CUSTOM THUMBNAIL
const { 
    config, 
    getGreetingTime, 
    getRuntime, 
    getUserRole,
    sendMessageWithTyping,
    getMenuConfig
} = require("./constants.js");

async function sendMainMenu(bot, m, plugins, premiumHandler) {
    const userId = m.key.participant || m.key.remoteJid;
    const isOwner = m.key.fromMe || (config.ownerNumber && config.ownerNumber.includes(userId));
    
    const pushname = m.pushName || "Pengguna";
    const greetingTime = getGreetingTime();
    
    // Dapatkan role user dari premium handler
    const userRole = await getUserRole(premiumHandler, userId, isOwner);
    
    // Waktu respon
    const responseTime = Date.now() - (m.messageTimestamp * 1000);
    
    // Bot global start time
    const botStartTimeGlobal = require("./constants.js").botStartTimeGlobal || Date.now();
    
    // Dapatkan current bot mode
    const currentBotMode = require("./constants.js").botMode;
    
    // ===== BAGIAN ATAS MENU =====
    let text = `          「 𝙼𝙴𝙽𝚄 𝚄𝚃𝙰𝙼𝙰 」\n`;
    text += `ʜᴀʟᴏ ᴋᴀᴋ *${pushname}* sᴇʟᴀᴍᴀᴛ ${greetingTime}\n\n`;
    
    // Pesan peringatan
    text += `> *ᴍᴏʜᴏɴ ᴜɴᴛᴜᴋ ᴍᴇᴍʙᴀᴄᴀ ʀᴜʟᴇs ʙᴏᴛ ʙɪᴀʀ ᴛᴇʀʜɪɴᴅᴀʀ ᴅᴀʀɪ ᴋᴇɴᴏɴ*\n`;
    text += `> *ᴋɴᴘ ʙᴀɴɢ?, ʜᴇʏ ɢᴡ ᴋᴀsɪʜ ᴛᴀᴜ ʏᴀ ʟᴜ sᴘᴀᴍ ɪᴛᴜ ʙɪᴋɪɴ ʙᴏᴛ ɴʏᴇᴘᴀᴍ*\n\n`;
    
    text += `ᴍᴏʜᴏɴ ᴜɴᴛᴜᴋ ᴘᴇɴɢᴇʀᴛɪᴀɴʏᴀ ᴀɢᴀʀ ɴᴏᴍᴇʀ ʙᴏᴛ ᴛɪᴅᴀᴋ ᴋᴇɴᴏɴ\n\n`;
    
    text += `*ᴋᴀʟᴀᴜ ᴀᴅᴀ ғɪᴛᴜʀ ʙᴜɢ ᴀᴛᴀᴜ ᴇʀʀᴏʀ ᴋᴏɴᴛᴀᴋ ᴏɴᴡᴇʀ ʏᴀ*\n\n`;
    
    // ===== INFO USER =====
    text += `╔═━━━━『 \`ɪɴғᴏ ᴜsᴇʀ\` 』━━━━━❍\n`;
    text += `╠═ [ ɴᴀᴍᴀ : ${pushname}\n`;
    text += `╠═ [ ʀᴏʟᴇ : ${userRole}\n`;
    text += `╠═ [ ᴍᴏᴅᴇ : ${currentBotMode}\n`;
    text += `╠═ [ ᴀᴜᴛʜᴏʀ : ${config.author || "Unknown"}\n`;
    text += `╚═━━━━━━━━━━━━━━━━━〣ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    
    // ===== INFO BOT =====
    text += `╔═━━━━『 \`ɪɴғᴏ ʙᴏᴛ\` 』━━━━━❍\n`;
    text += ` > ⎆ ʀᴜɴᴛɪᴍᴇ : ${getRuntime(botStartTimeGlobal)}\n`;
    text += ` > ⎆ ᴠᴇʀsɪ : ${config.version || "1.0.0"}\n`;
    text += ` > ⎆ ʀᴇsᴘᴏɴ : ${responseTime}ms\n`;
    text += `╚═━━━━━━━━━━━━━━━━━〣ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    
    // ===== XCOIN EXCHANGE =====
    text += `*🎮 xᴄᴏɪɴ ᴇxᴄʜᴀɴɢᴇ*\n`;
    text += `ɢᴜɴᴀᴋᴀɴ ${config.prefix}xʙᴜʏ sᴛᴀᴛᴜs <ʜᴀʀɪ> ᴜɴᴛᴜᴋ ᴜᴘɢʀᴀᴅᴇ ᴋᴇ ᴅᴀʀᴋ ᴠᴠɪᴘ!\n`;
    text += `1 ʜᴀʀɪ = 5 xᴄᴏɪɴ\n\n`;
    
    // ===== LIST MENU =====
    text += `╔━━━━━━━━「 *LIST MENU* 」━━━━━━━❒\n`;
    const categories = Array.from(plugins.keys())
        .filter(cat => !cat.startsWith('premium_'))
        .sort();
    
    for (const cat of categories) {
        text += `│${config.prefix}menu_${cat}\n`;
    }
    
    // Tambahkan menu premium jika user premium
    const premiumStatus = premiumHandler.isPremium(userId, m);
    if (premiumStatus.isPremium || premiumStatus.isOwner || premiumStatus.isBot) {
        const premiumCategories = Array.from(plugins.keys())
            .filter(cat => cat.startsWith('premium_'))
            .map(cat => cat.replace('premium_', ''));
        
        if (premiumCategories.length > 0) {
            text += `│\n│💎 *PREMIUM MENU:*\n`;
            text += `│${config.prefix}prem_menu - Menu premium\n`;
            text += `│${config.prefix}prem_allmenu - Semua fitur premium\n`;
        }
    }
    
    text += `╚═════════════════ꪶ ཻུ۪۪ꦽꦼ̷\n\n`;
    
    // ===== OWNER MENU =====
    if (isOwner) {
        text += `👑 *OWNER MENU*\n`;
        text += `├ ${config.prefix}self - Mode hanya owner\n`;
        text += `├ ${config.prefix}public - Mode publik\n`;
        text += `├ ${config.prefix}autoread on/off\n`;
        text += `├ ${config.prefix}effectketik on/off\n`;
        text += `├ ${config.prefix}stopgame - Stop semua game\n`;
        text += `├ ${config.prefix}cleanupgames - Bersihkan game expired\n`;
        text += `└ ${config.prefix}hidenfeatures - Lihat semua fitur tersembunyi\n\n`;
    }
    
    // Tambahkan copyright dari config
    text += config.copyright || '';

    // Dapatkan config menu
    const menuConfig = getMenuConfig('main');
    
    console.log(`[MENU] Mengirim main menu dengan thumbnail: ${menuConfig.thumbnail}`);
    
    // Kirim sebagai CONTINUE CHAT dengan THUMBNAIL CUSTOM
    return sendMessageWithTyping(bot, m.key.remoteJid, { text: text }, m, {
        menuType: 'main', // Tandai sebagai main menu (akan dapat thumbnail)
        minDelay: 1500,
        maxDelay: 3000,
        useThumbnail: true,
        thumbnailUrl: menuConfig.thumbnail,
        botName: menuConfig.title,
        body: menuConfig.body || "Main Menu • Fast Response"
    });
}

module.exports = {
    sendMainMenu
};