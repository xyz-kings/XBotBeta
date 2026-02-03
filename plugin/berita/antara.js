const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["antara"],
  category: "berita",
  description: "Tampilkan berita terbaru dari Antara News",

  async execute(bot, m, args) {
    try {
      const res = await axios.get(
        `${config.newsBaseURL}/news/antara`
      );

      if (
        !res.data ||
        res.data.status !== "success" ||
        !res.data.articles ||
        res.data.articles.length === 0
      ) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal mengambil berita Antara." },
          { quoted: m }
        );
      }

      const berita = res.data.articles.slice(0, 10);
      let text = `📰 *=== ANTARA NEWS ===*\n`;
      text += `📡 Source: ${res.data.source}\n\n`;

      berita.forEach((b, i) => {
        text += `*${i + 1}. ${b.title}*\n`;
        text += `🗓️ ${b.date}\n`;
        text += `🏷️ ${b.category}\n`;
        text += `👤 ${b.author}\n`;
        text += `👁️ ${b.views}\n`;
        text += `🔗 ${b.link}\n`;
        text += `────────────────────────────\n`;
      });

      text += `_✅ Berhasil mengambil ${berita.length} berita terbaru_`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text },
        { quoted: m }
      );

    } catch (err) {
      console.error("[ANTARA NEWS ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi error saat mengambil berita Antara." },
        { quoted: m }
      );
    }
  },
};