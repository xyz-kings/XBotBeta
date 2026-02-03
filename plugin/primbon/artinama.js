const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["artinama"],
  category: "primbon",
  description: "Mengetahui arti dan karakter nama berdasarkan primbon",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.artinama <nama>" },
          { quoted: m }
        );
      }

      const text = args.join(" ");

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/artinama`,
        { params: { text } }
      );

      if (!res.data || !res.data.karakter) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Arti nama tidak ditemukan." },
          { quoted: m }
        );
      }

      const namaBersih = (res.data.nama || "").replace(/"/g, "");

      const reply =
`🔤 *ARTI NAMA (PRIMBON)*

👤 *Nama:* ${namaBersih}
✨ *Karakter:* ${res.data.karakter}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[ARTI NAMA ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengambil arti nama." },
        { quoted: m }
      );
    }
  },
};