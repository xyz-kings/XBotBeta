const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["hariburuk"],
  category: "primbon",
  description: "Mengetahui hari buruk berdasarkan tanggal (primbon)",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.hariburuk <yyyy-mm-dd>" },
          { quoted: m }
        );
      }

      const tgl = args[0];

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/hariburuk`,
        { params: { tgl } }
      );

      if (!res.data || !res.data.hasil) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Data hari buruk tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`📅 *HARI BURUK (PRIMBON)*

🗓️ *Tanggal:* ${res.data.tanggal}
📆 *Hari:* ${res.data.hari}
⚠️ *Hasil:* ${res.data.hasil}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[HARI BURUK ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengambil data hari buruk." },
        { quoted: m }
      );
    }
  },
};