const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["heksadesimalencode"],
  category: "convert",
  description: "Encode teks ke Heksadesimal (Hex ASCII)",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.heksadesimalencode <text>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/text/heksadesimalencode`,
        { params: { text } }
      );

      if (!res.data || !res.data.result) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal encode ke heksadesimal." },
          { quoted: m }
        );
      }

      const reply =
`🧩 *HEKSADESIMAL ENCODE*

📥 *Text:* ${text}
📤 *Hasil:* ${res.data.result}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[HEKSA ENCODE ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat encode heksadesimal." },
        { quoted: m }
      );
    }
  },
};