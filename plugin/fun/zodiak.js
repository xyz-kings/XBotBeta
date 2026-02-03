const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["zodiak"],
  category: "fun",
  description: "Cek zodiak berdasarkan tanggal lahir",

  async execute(bot, m, args) {
    try {
      const arg = args.join(" ").trim();
      
      if (!arg) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Masukkan tanggal lahir!\nContoh: `.zodiak 2005-06-15`\nFormat: YYYY-MM-DD" },
          { quoted: m }
        );
      }
      
      // Validasi format tanggal
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(arg)) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Format tanggal salah!\nGunakan format: YYYY-MM-DD\nContoh: `.zodiak 2005-06-15`" },
          { quoted: m }
        );
      }

      const res = await axios.get(
        `${config.Funv2BaseURL}/xyz/zodiak`,
        { params: { tanggal: arg } }
      );

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal menentukan zodiak. Coba lagi nanti." },
          { quoted: m }
        );
      }

      const result = res.data.result;
      let caption = `*♈♉♊ Zodiak*\n\n📆 *Tanggal:* ${arg}\n\n✨ *Zodiak:* ${result.zodiak}\n\n🎭 *Karakter:* ${result.karakter}\n\n💡 *Nasihat:* ${result.nasihat}\n\n${res.data.note ? res.data.note + "\n\n" : ""}_${config.copyright || ""}_`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: caption },
        { quoted: m }
      );

    } catch (err) {
      console.error("[ZODIAK ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat menentukan zodiak." },
        { quoted: m }
      );
    }
  },
};