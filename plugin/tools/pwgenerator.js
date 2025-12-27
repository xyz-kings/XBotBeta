const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "newpw",
  async execute(bot, m, args) {
    try {
      const level = args[0]?.toLowerCase();
      const length = parseInt(args[1]);

      if (!level || !length || length < 4)
        return bot.sendMessage(m.key.remoteJid, { text: "Format salah.\nContoh: *.newpw hard 16*" }, { quoted: m });

      let chars = "";
      if (level === "medium") chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      else if (level === "hard")
        chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
      else return bot.sendMessage(m.key.remoteJid, { text: "Mode cuma *hard* atau *medium*." }, { quoted: m });

      // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄

      // --- GENERATE PASSWORD ---
      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const result = `
⚔️ PASSWORD ${level.toUpperCase()}
     
➬  ${password}

_*© Generate Pw By XyzBots*_
`;

      await bot.sendMessage(m.key.remoteJid, { text: result.trim() }, { quoted: m });

    } catch (e) {
      console.error("[NEWPW ERROR]", e);
      await bot.sendMessage(m.key.remoteJid, { text: "Error njir. Tapi bukan logika yang goblok." }, { quoted: m });
    }
  }
};