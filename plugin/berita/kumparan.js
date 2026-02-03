const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["kumparan"],
  category: "berita",
  description: "Tampilkan berita terbaru dari Kumparan",

  async execute(bot, m) {
    try {
      const res = await axios.get(`${config.newsBaseURL}/news/kumparan`);

      if (!res.data || res.data.status !== "success") {
        return bot.sendMessage(m.key.remoteJid, { text: "❌ Gagal mengambil berita Kumparan." }, { quoted: m });
      }

      let text = `📰 *=== KUMPARAN NEWS ===*\n\n`;
      res.data.articles.slice(0, 10).forEach((b, i) => {
        text += `*${i + 1}. ${b.title}*\n`;
        text += `🗓️ ${b.date}\n`;
        text += `🔗 ${b.link}\n`;
        text += `────────────────────────────\n`;
      });

      await bot.sendMessage(m.key.remoteJid, { text }, { quoted: m });
    } catch (e) {
      await bot.sendMessage(m.key.remoteJid, { text: "❌ Error mengambil berita Kumparan." }, { quoted: m });
    }
  },
};