const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["haribaik"],
  category: "primbon",
  description: "Mengetahui hari baik berdasarkan tanggal (primbon)",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.haribaik <yyyy-mm-dd>" },
          { quoted: m }
        );
      }

      const tgl = args[0];

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/haribaik`,
        { params: { tgl } }
      );

      if (!res.data || !res.data.hasil) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Data hari baik tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`📆 *HARI BAIK (PRIMBON)*

🗓️ *Tanggal:* ${res.data.tanggal}
📅 *Hari:* ${res.data.hari}
✨ *Hasil:* ${res.data.hasil}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[HARI BAIK ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengambil data hari baik." },
        { quoted: m }
      );
    }
  },
};