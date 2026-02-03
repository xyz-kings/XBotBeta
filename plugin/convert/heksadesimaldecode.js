const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["heksadesimaldecode"],
  category: "convert",
  description: "Decode heksadesimal (hex) ke teks ASCII",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.heksadesimaldecode <hex>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/heksadesimaldecode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal decode heksadesimal." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *HEKSADECIMAL DECODE*

📥 *Hex:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[HEX DECODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat decode heksadesimal." },
        { quoted: m }
      );
    }
  },
};