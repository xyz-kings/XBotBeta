const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["mimpitadi"],
  category: "fun",
  description: "Tafsir mimpi",

  async execute(bot, m, args) {
    try {
      const arg = args.join(" ").trim();
      
      if (!arg) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Masukkan deskripsi mimpi!\nContoh: `.mimpitadi melihat burung terbang`" },
          { quoted: m }
        );
      }
      
      const res = await axios.get(
        `${config.Funv2BaseURL}/xyz/mimpitadi`,
        { params: { teks: arg } }
      );

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal menafsirkan mimpi. Coba lagi nanti." },
          { quoted: m }
        );
      }

      const result = res.data.result;
      let caption = `*💭 Tafsir Mimpi*\n\n📝 *Mimpi:* ${arg}\n\n🔮 *Interpretasi:* ${result.interpretasi}\n\n💡 *Nasihat:* ${result.nasihat}\n\n${res.data.note ? res.data.note + "\n\n" : ""}_${config.copyright || ""}_`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: caption },
        { quoted: m }
      );

    } catch (err) {
      console.error("[MIMPITADI ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat menafsirkan mimpi." },
        { quoted: m }
      );
    }
  },
};