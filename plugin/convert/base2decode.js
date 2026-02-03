const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["base2decode"],
  category: "convert",
  description: "Decode teks dari binary (base2) ke string",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.base2decode <binary>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/base2decode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal decode binary." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *BINARY DECODE*

📥 *Binary:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[BASE2 DECODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat decode binary." },
        { quoted: m }
      );
    }
  },
};