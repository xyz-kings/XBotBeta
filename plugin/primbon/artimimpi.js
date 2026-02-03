const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["artimimpi"],
  category: "primbon",
  description: "Mengetahui arti mimpi berdasarkan primbon",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.artimimpi <mimpi>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/artimimpi`,
        { params: { text } }
      );

      if (!res.data || !res.data.arti) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Arti mimpi tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`🌙 *ARTI MIMPI (PRIMBON)*

📝 *Mimpi:* ${res.data.mimpi}
🔮 *Arti:* ${res.data.arti}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[ARTI MIMPI ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengambil arti mimpi." },
        { quoted: m }
      );
    }
  },
};