const fs = require('fs');
const path = require('path');

module.exports = {
  command: "afk",
  async execute(bot, m, args) {
    try {
      const jid = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      
      // Database path
      const dbPath = path.join(__dirname, '../../DataDase/afk.json');
      
      // Buat folder kalo belum ada
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Baca database
      let afkData = {};
      if (fs.existsSync(dbPath)) {
        try {
          afkData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
          afkData = {};
        }
      }
      
      // Kalo gak ada alasan -> matikan AFK
      if (!args.length) {
        if (afkData[sender] && afkData[sender].group === jid) {
          delete afkData[sender];
          fs.writeFileSync(dbPath, JSON.stringify(afkData, null, 2));
          
          await bot.sendMessage(
            jid,
            { text: "AFK mode off, welcome back!" },
            { quoted: m }
          );
          return;
        } else {
          await bot.sendMessage(
            jid,
            { text: "Kamu lagi gak AFK. Ketik .afk <alasan> buat AFK." },
            { quoted: m }
          );
          return;
        }
      }
      
      // Set AFK
      const reason = args.join(' ');
      afkData[sender] = {
        reason: reason,
        group: jid,
        time: Date.now()
      };
      
      fs.writeFileSync(dbPath, JSON.stringify(afkData, null, 2));
      
      await bot.sendMessage(
        jid,
        { text: `Sekarang AFK: ${reason}` },
        { quoted: m }
      );
      
    } catch (e) {
      console.error(e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Error" },
        { quoted: m }
      );
    }
  }
};