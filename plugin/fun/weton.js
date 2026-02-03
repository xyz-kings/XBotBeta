const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["weton"],
  category: "fun",
  description: "Cek weton berdasarkan tanggal",

  async execute(bot, m, args) {
    try {
      const arg = args.join(" ").trim();
      
      if (!arg) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Masukkan tanggal lahir!\nContoh: `.weton 2005-06-15`\nFormat: YYYY-MM-DD" },
          { quoted: m }
        );
      }
      
      // Validasi format tanggal
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(arg)) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Format tanggal salah!\nGunakan format: YYYY-MM-DD\nContoh: `.weton 2005-06-15`" },
          { quoted: m }
        );
      }

      const res = await axios.get(
        `${config.Funv2BaseURL}/xyz/weton`,
        { params: { tanggal: arg } }
      );

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal menghitung weton. Coba lagi nanti." },
          { quoted: m }
        );
      }

      const result = res.data.result;
      let caption = `*📅 Cek Weton*\n\n📆 *Tanggal:* ${arg}\n\n🔮 *Weton:* ${result.weton}\n\n🎭 *Karakter:* ${result.karakter}\n\n💡 *Saran:* ${result.saran}\n\n${res.data.note ? res.data.note + "\n\n" : ""}_${config.copyright || ""}_`;

      await bot.sendMessage(
        m.key.remoteJid,
        { text: caption },
        { quoted: m }
      );

    } catch (err) {
      console.error("[WETON ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat menghitung weton." },
        { quoted: m }
      );
    }
  },
};