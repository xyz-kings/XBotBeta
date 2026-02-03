const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["morseencode"],
  category: "convert",
  description: "Encode teks ke Morse Code",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.morseencode <text>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/morseencode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal encode ke Morse Code." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *MORSE CODE ENCODE*

📥 *Text:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[MORSE ENCODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat encode Morse Code." },
        { quoted: m }
      );
    }
  },
};