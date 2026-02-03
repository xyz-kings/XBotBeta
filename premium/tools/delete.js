module.exports = {
  command: ["del", "delete", "hapus"],
  category: "group",
  description: "Hapus pesan dengan cara reply",
  
  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;
    const quotedKey = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
    
    // Cek apakah reply
    if (!quotedKey) {
      const help = await bot.sendMessage(remoteJid, { 
        text: "Reply pesan + ketik .del"
      }, { quoted: m });
      
      // Auto delete pesan help setelah 3 detik
      setTimeout(() => {
        bot.sendMessage(remoteJid, { delete: help.key }).catch(() => {});
      }, 3000);
      return;
    }
    
    try {
      // Hapus pesan yang direply
      await bot.sendMessage(remoteJid, { 
        delete: {
          remoteJid: remoteJid,
          id: quotedKey,
          fromMe: quotedParticipant ? quotedParticipant.includes(bot.user.id.split(':')[0]) : false,
          participant: quotedParticipant
        }
      });
      
      // Kirim konfirmasi
      const confirm = await bot.sendMessage(remoteJid, { 
        text: "✅ Pesan dihapus"
      });
      

      
    } catch (error) {
      console.error('[DELETE] Error:', error);
      const errorMsg = await bot.sendMessage(remoteJid, { 
        text: "❌ Gagal hapus"
      }, { quoted: m });
      
      // Auto delete error setelah 3 detik
      setTimeout(() => {
        bot.sendMessage(remoteJid, { delete: errorMsg.key }).catch(() => {});
      }, 3000);
    }
  }
};

console.log('[DELETE MESSAGE] Module loaded');