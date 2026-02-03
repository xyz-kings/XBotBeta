const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["kecocokannama"],
  category: "primbon",
  description: "Cek kecocokan nama dengan tanggal lahir (primbon)",

  async execute(bot, m, args) {
    try {
      if (!args.length || !args.join(" ").includes("|")) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.kecocokannama <yyyy-mm-dd>|<nama>" },
          { quoted: m }
        );
      }

      const [tgl, name] = args.join(" ").split("|").map(s => s.trim());

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/kcocokannama`,
        { params: { tgl, name } }
      );

      if (!res.data || !res.data.kecocokan) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Data kecocokan nama tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`📛 *KECOCOKAN NAMA (PRIMBON)*

👤 *Nama:* ${res.data.nama}
🗓️ *Tanggal Lahir:* ${res.data.tanggal}
💫 *Kecocokan:* ${res.data.kecocokan}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[KECOCOKAN NAMA ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengecek kecocokan nama." },
        { quoted: m }
      );
    }
  },
};