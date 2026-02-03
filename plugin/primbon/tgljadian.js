const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["tgljadian"],
  category: "primbon",
  description: "Rekomendasi tanggal jadian berdasarkan primbon",

  async execute(bot, m, args) {
    try {
      if (!args.length) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.tgljadian <yyyy-mm-dd>" },
          { quoted: m }
        );
      }

      const tgl = args[0];

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/tgljadian`,
        { params: { tgl } }
      );

      if (!res.data || !res.data.tanggal_disarankan) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Data tanggal jadian tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`💘 *TANGGAL JADIAN (PRIMBON)*

📅 *Tanggal Awal:* ${res.data.tanggal_awal}
✨ *Tanggal Disarankan:* ${res.data.tanggal_disarankan}
📝 *Keterangan:* ${res.data.keterangan}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[TGL JADIAN ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengambil tanggal jadian." },
        { quoted: m }
      );
    }
  },
};