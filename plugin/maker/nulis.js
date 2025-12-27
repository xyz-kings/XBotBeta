const axios = require("axios");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "nulis",
  async execute(bot, m, args) {
    try {
      const text = args.join(" ");

      if (!text) {
        return bot.sendMessage(
          m.key.remoteJid,
          {
            text:
`Teks nya mana njirr 😭

Cara pakai:
.nulis <text>

Contoh:
.nulis Hai
ini baris kedua
- bullet biasa`
          },
          { quoted: m }
        );
      }
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      // encode otomatis (newline & tab ikut kebaca)
      const encoded = encodeURIComponent(text);

      const apiURL =
        `https://api-nulis-iota.vercel.app/api/generate?text=${encoded}`;

      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: apiURL },
          caption:
`✍️ HASIL NULIS

_${text.split("\n")[0]}..._

© Nulis Generator By XyzBots`
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[NULIS ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Nulis nya gagal njirr, server nya capek ✍️💀" },
        { quoted: m }
      );
    }
  }
};