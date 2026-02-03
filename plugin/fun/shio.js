const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["shio"],
  category: "fun",
  description: "Cek shio berdasarkan tahun lahir",

  async execute(bot, m, args) {
    try {
      const arg = args.join(" ").trim();
      
      if (!arg) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Masukkan tahun lahir!\nContoh: `.shio 2005`" },
          { quoted: m }
        );
      }
      
      // Validasi format tahun
      const yearRegex = /^\d{4}$/;
      if (!yearRegex.test(arg)) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Format tahun salah!\nGunakan format: YYYY\nContoh: `.shio 2005`" },
          { quoted: m }
        );
      }

      const year = parseInt(arg);
      if (year < 1900 || year > new Date().getFullYear()) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Tahun tidak valid! Masukkan tahun antara 1900-sekarang." },
          { quoted: m }
        );
      }

      const res = await axios.get(
        `${config.Funv2BaseURL}/xyz/shio`,
        { params: { tahun: arg } }
      );

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal menentukan shio. Coba lagi nanti." },
          { quoted: m }
        );
      }

      const result = res.data.result;
      let caption = `*🐀🐂🐅 Shio*\n\n📅 *Tahun:* ${arg}\n\n🐲 *Shio:* ${result.shio}\n\n🎭 *Karakter:* ${result.karakter}\n\n💡 *Nasihat:* ${result.nasihat}\n\n${res.data.note ? res.data.note + "\n\n" : ""}_${config.copyright || ""}_`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: caption },
        { quoted: m }
      );

    } catch (err) {
      console.error("[SHIO ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat menentukan shio." },
        { quoted: m }
      );
    }
  },
};