const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["binarydec"],
  category: "convert",
  description: "Decode binary 8-bit (ASCII) ke teks",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.binarydec <binary>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/binarydec`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal decode binary ASCII." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *BINARY ASCII DECODE*

📥 *Binary:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[BINARY DEC ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat decode binary ASCII." },
        { quoted: m }
      );
    }
  },
};