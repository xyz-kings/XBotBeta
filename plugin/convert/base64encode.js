const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["base64encode"],
  category: "convert",
  description: "Encode teks ke Base64",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.base64encode <text>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/base64encode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal encode ke Base64." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *BASE64 ENCODE*

📥 *Text:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[BASE64 ENCODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat encode Base64." },
        { quoted: m }
      );
    }
  },
};