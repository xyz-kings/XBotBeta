const config = require("../../config.json");

module.exports = {
    command: ["newgc"],
    
    execute: async function(bot, m, args) {
        try {
            const chatId = m.key.remoteJid;
            
            // Hanya private chat
            if (chatId.includes('@g.us')) {
                return bot.sendMessage(chatId, { text: "❌ Hanya di private chat!" });
            }
            
            if (!args.length) {
                return bot.sendMessage(chatId, { 
                    text: `Format: ${config.prefix}newgc <nama grup>\nContoh: ${config.prefix}newgc GrupSaya` 
                });
            }
            
            const groupName = args.join(" ").trim();
            
            if (groupName.length < 3 || groupName.length > 25) {
                return bot.sendMessage(chatId, { 
                    text: "❌ Nama grup 3-25 karakter!" 
                });
            }
            
            await bot.sendMessage(chatId, { 
                text: `🔄 Membuat grup "${groupName}"...` 
            });
            
            // ===== SOLUSI: GUNAKAN JID YANG BENAR =====
            // Dari log, bot JID adalah: 6287718203240:33@s.whatsapp.net
            // User JID alternatif adalah: 6287718203240@s.whatsapp.net
            
            const participants = [
                "6287718203240@s.whatsapp.net",  // User (dari remoteJidAlt)
                "6287718203240:33@s.whatsapp.net" // Bot
            ];
            
            console.log("🎯 Creating group with participants:", participants);
            
            try {
                const result = await bot.groupCreate(groupName, participants);
                
                if (result && result.gid) {
                    // Tunggu sebentar
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Coba buat link
                    let link = "";
                    try {
                        const code = await bot.groupInviteCode(result.gid);
                        if (code) link = `https://chat.whatsapp.com/${code}`;
                    } catch (e) {}
                    
                    await bot.sendMessage(chatId, { 
                        text: `✅ *BERHASIL!*\n\n` +
                              `Grup "${groupName}" telah dibuat!\n` +
                              `${link ? `🔗 ${link}` : ''}` 
                    });
                    
                    console.log("✅ Group created successfully!");
                } else {
                    throw new Error("No group ID returned");
                }
                
            } catch (error) {
                console.error("Group creation error:", error);
                
                // Coba dengan participant berbeda
                try {
                    // Coba hanya dengan user saja
                    const result = await bot.groupCreate(groupName, ["6287718203240@s.whatsapp.net"]);
                    
                    if (result && result.gid) {
                        await bot.sendMessage(chatId, { 
                            text: `✅ Grup "${groupName}" berhasil dibuat!` 
                        });
                    }
                } catch (error2) {
                    console.error("Second attempt failed:", error2);
                    
                    await bot.sendMessage(chatId, { 
                        text: `❌ Gagal: ${error.message}\n\n` +
                              `*Kemungkinan penyebab:*\n` +
                              `• WhatsApp tidak mengizinkan pembuatan grup via bot\n` +
                              `• JID tidak valid\n` +
                              `• Batasan API\n\n` +
                              `Coba buat grup manual via WhatsApp.` 
                    });
                }
            }
            
        } catch (error) {
            console.error("Fatal error:", error);
        }
    }
};