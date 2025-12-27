const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "sertiganteng",
  async execute(bot, m, args) {
    try {
      const nama = args.join(" ");

      if (!nama) {
        return bot.sendMessage(
          m.key.remoteJid,
          {
            text:
`Nama mana njirr 😭

Cara pakai:
.sertiganteng <nama>

Contoh:
.sertiganteng UdinPetok`
          },
          { quoted: m }
        );
      }

      const apiURL =
        `https://sertifikat-ganteng.vercel.app/sertifteng?nama=${encodeURIComponent(nama)}`;
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: apiURL },
          caption:
`🏆 SERTIFIKAT GANTENG RESMI

Atas nama:
${nama}

_*© Fun Certificate By XyzBots*_`
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[SERTIGANTENG ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Gagal njirr, tapi kegantengan lu tetep sah 😎" },
        { quoted: m }
      );
    }
  }
};