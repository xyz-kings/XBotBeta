const fs = require('fs');
const path = require('path');

class AFKHandler {
  constructor() {
    this.dbPath = path.join(__dirname, '../DataDase/afk.json');
    this.cooldown = new Map(); // Untuk mencegah spam
  }
  
  async checkAFK(bot, m) {
    try {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      const isFromBot = m.key.fromMe;
      
      // JANGAN proses jika pesan dari bot sendiri
      if (isFromBot) return false;
      
      // Baca database
      let afkData = {};
      if (fs.existsSync(this.dbPath)) {
        try {
          afkData = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        } catch (e) {
          return false;
        }
      }
      
      // 1. Cek kalo user AFK balik chat
      if (afkData[sender] && afkData[sender].group === jid) {
        delete afkData[sender];
        fs.writeFileSync(this.dbPath, JSON.stringify(afkData, null, 2));
        
        await bot.sendMessage(
          jid,
          { text: "Welcome back!" },
          { quoted: m }
        );
        return true;
      }
      
      // 2. Cek target AFK (mention atau reply)
      let targetUser = null;
      
      // Cek mention
      const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length > 0) {
        for (const mentionedUser of mentioned) {
          // Skip jika mention bot sendiri
          if (mentionedUser.includes(bot.user.id.split(':')[0])) continue;
          
          if (afkData[mentionedUser] && afkData[mentionedUser].group === jid) {
            targetUser = mentionedUser;
            break;
          }
        }
      }
      
      // Cek reply (jika belum ketemu dari mention)
      if (!targetUser) {
        const contextInfo = m.message.extendedTextMessage?.contextInfo || 
                           m.message?.stickerMessage?.contextInfo ||
                           m.message?.imageMessage?.contextInfo ||
                           m.message?.videoMessage?.contextInfo;
        
        const quotedParticipant = contextInfo?.participant;
        if (quotedParticipant && afkData[quotedParticipant] && afkData[quotedParticipant].group === jid) {
          targetUser = quotedParticipant;
        }
      }
      
      // Jika ada target user AFK
      if (targetUser) {
        // Cek cooldown untuk mencegah spam
        const cooldownKey = `${jid}:${targetUser}`;
        const now = Date.now();
        const lastResponse = this.cooldown.get(cooldownKey) || 0;
        
        // Cooldown 10 detik untuk user yang sama di grup yang sama
        if (now - lastResponse < 10000) {
          return true; // Sudah dihandle, tapi jangan kirim pesan lagi
        }
        
        const afkInfo = afkData[targetUser];
        const timeAgo = this.getTimeAgo(afkInfo.time);
        
        await bot.sendMessage(
          jid,
          { 
            text: `*${targetUser.split('@')[0]}* sedang AFK:\n${afkInfo.reason}\n\nSejak: ${timeAgo}`,
            mentions: [targetUser]
          },
          { quoted: m }
        );
        
        // Set cooldown
        this.cooldown.set(cooldownKey, now);
        
        // Cleanup cooldown map setiap 30 detik
        if (Math.random() < 0.1) { // 10% chance untuk cleanup
          this.cleanupCooldown();
        }
        
        return true;
      }
      
      return false;
    } catch (e) {
      console.error("AFK Handler Error:", e);
      return false;
    }
  }
  
  cleanupCooldown() {
    const now = Date.now();
    for (const [key, timestamp] of this.cooldown.entries()) {
      if (now - timestamp > 30000) { // Hapus yang lebih dari 30 detik
        this.cooldown.delete(key);
      }
    }
  }
  
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return "baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  }
}

module.exports = AFKHandler;