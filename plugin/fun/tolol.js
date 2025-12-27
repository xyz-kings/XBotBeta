const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "sertitol",
  async execute(bot, m, args) {
    try {
      const nama = args.join(" ");

      if (!nama) {
        return bot.sendMessage(
          m.key.remoteJid,
          {
            text:
`Nama nya mana woi 😭

Cara pakai:
.sertitol <nama>

Contoh:
.sertitol UdinPetok`
          },
          { quoted: m }
        );
      }

      const apiURL =
        `https://sertifikat-tolol.vercel.app/sertitol?nama=${encodeURIComponent(nama)}`;
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: apiURL },
          caption:
`🤡 SERTIFIKAT TOLOL RESMI

Atas nama:
${nama}

Status:
Terlalu tolol untuk disangkal.

_*© Fun Certificate By XyzBots*_`
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("[SERTITOL ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Server nya ikut tolol, coba lagi 😭" },
        { quoted: m }
      );
    }
  }
};