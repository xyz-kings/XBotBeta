const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["binaryencode"],
  category: "convert",
  description: "Encode teks ke Binary ASCII",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.binaryencode <text>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/binaryencode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal encode ke Binary ASCII." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *BINARY ASCII ENCODE*

📥 *Text:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[BINARY ENCODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat encode Binary ASCII." },
        { quoted: m }
      );
    }
  },
};