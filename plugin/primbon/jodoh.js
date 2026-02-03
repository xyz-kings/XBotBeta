const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["jodoh"],
  category: "primbon",
  description: "Cek kecocokan jodoh berdasarkan nama (primbon)",

  async execute(bot, m, args) {
    try {
      if (!args.length || !args.join(" ").includes("|")) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.jodoh <nama1>|<nama2>" },
          { quoted: m }
        );
      }

      const [name1, name2] = args.join(" ").split("|").map(s => s.trim());

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/jodoh`,
        { params: { name1, name2 } }
      );

      if (!res.data || !res.data.kecocokan) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Data jodoh tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`❤️ *CEK JODOH (PRIMBON)*

👤 *Nama 1:* ${res.data.pasangan[0]}
👤 *Nama 2:* ${res.data.pasangan[1]}
💞 *Kecocokan:* ${res.data.kecocokan}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[JODOH ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengecek jodoh." },
        { quoted: m }
      );
    }
  },
};