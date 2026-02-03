const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["suara"],
  category: "berita",
  description: "Tampilkan berita terbaru dari Suara",

  async execute(bot, m) {
    try {
      const res = await axios.get(`${config.newsBaseURL}/news/suara`);

      if (!res.data || res.data.status !== "success") {
        return bot.sendMessage(m.key.remoteJid, { text: "❌ Gagal mengambil berita Suara." }, { quoted: m });
      }

      let text = `📰 *=== SUARA NEWS ===*\n\n`;
      res.data.articles.slice(0, 10).forEach((b, i) => {
        text += `*${i + 1}. ${b.title}*\n`;
        text += `🗓️ ${b.date}\n`;
        text += `🔗 ${b.link}\n`;
        text += `────────────────────────────\n`;
      });

      await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });
    } catch (e) {
      await bot.sendMessage(m.key.remoteJid, { text: "❌ Error mengambil berita Suara." }, { quoted: m });
    }
  },
};