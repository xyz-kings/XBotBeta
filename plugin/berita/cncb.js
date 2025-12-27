const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["cnbc"],
  category: "berita",
  description: "Tampilkan berita terbaru dari CNBC Indonesia",

  async execute(bot, m, args) {
    try {
      const res = await axios.get(`${config.baseURL}/berita/cnbc`, {
        params: { apikey: config.apiKey },
      });

      if (!res.data || !res.data.status || !res.data.result.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal mengambil berita CNBC." },
          { quoted: m }
        );
      }

      const berita = res.data.result.slice(0, 10); // ambil 10 berita terbaru
      let text = `📰 *=== CNBC INDONESIA NEWS ===*\n\n`;

      berita.forEach((b, i) => {
        text += `*${i + 1}. ${b.title}*\n`;
        text += `🕒 ${new Date(b.time).toLocaleString("id-ID")}\n`;
        text += `🔗 ${b.link}\n`;
        text += `────────────────────────────\n`;
      });

      text += `_🎯 News fetched successfully!_`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: text },
        { quoted: m }
      );

    } catch (e) {
      console.error("[CNBC NEWS ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi error saat mengambil berita CNBC." },
        { quoted: m }
      );
    }
  },
};