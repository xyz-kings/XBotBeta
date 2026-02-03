const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["ramaljodoh"],
  category: "primbon",
  description: "Ramalan jodoh berdasarkan nama & tanggal lahir (primbon)",

  async execute(bot, m, args) {
    try {
      const input = args.join(" ");

      if (!input.includes("|") || !input.includes(",")) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❗ Cara pakai:\n.ramaljodoh <nama1>,<tgl1>|<nama2>,<tgl2>" },
          { quoted: m }
        );
      }

      const [p1, p2] = input.split("|");

      const [nama1, tgl1] = p1.split(",").map(s => s.trim());
      const [nama2, tgl2] = p2.split(",").map(s => s.trim());

      const res = await axios.get(
        `${config.newsBaseURL}/primbon/rmlanjdoh`,
        {
          params: { nama1, tgl1, nama2, tgl2 }
        }
      );

      if (!res.data || !res.data.ramalan) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Data ramalan jodoh tidak ditemukan." },
          { quoted: m }
        );
      }

      const reply =
`💑 *RAMALAN JODOH (PRIMBON)*

👤 *${res.data.pasangan[0].nama}* (${res.data.pasangan[0].tgl})
👤 *${res.data.pasangan[1].nama}* (${res.data.pasangan[1].tgl})

🔮 *Ramalan:* ${res.data.ramalan}
💯 *Skor:* ${res.data.skor}`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error("[RAMAL JODOH ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat mengambil ramalan jodoh." },
        { quoted: m }
      );
    }
  },
};