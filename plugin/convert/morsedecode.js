const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["morsedecode"],
  category: "convert",
  description: "Decode morse code ke teks",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.morsedecode <morse>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/morsedecode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal decode morse code." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *MORSE CODE DECODE*

📥 *Morse:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[MORSE DECODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat decode morse code." },
        { quoted: m }
      );
    }
  },
};