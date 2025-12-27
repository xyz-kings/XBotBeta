const fetch = require("node-fetch");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "idcard",
  async execute(bot, m, args) {
    try {
      const text = args.join(" ");
      if (!text.includes("|")) {
        return bot.sendMessage(
          m.key.remoteJid,
          {
            text:
`Format salah njirr 😭

Cara pakai:
.idcard <foto> | <nama> | <umur> | <provinsi> | <kota>

Contoh:
.idcard https://files.catbox.moe/wozyle.jpg | XyzKings | 22 | Sulawesi Tenggara | Raha`
          },
          { quoted: m }
        );
      }

      const [foto, nama, umur, provinsi, kota] = text
        .split("|")
        .map(v => v.trim());
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      if (!foto || !nama || !umur || !provinsi || !kota) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Data kurang. Isi SEMUA, jangan setengah-setengah 🗿" },
          { quoted: m }
        );
      }

      const apiURL =
        `https://generated-profil.vercel.app/api/generate` +
        `?foto=${encodeURIComponent(foto)}` +
        `&nama=${encodeURIComponent(nama)}` +
        `&umur=${encodeURIComponent(umur)}` +
        `&provinsi=${encodeURIComponent(provinsi)}` +
        `&kota=${encodeURIComponent(kota)}`;

      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: apiURL },
          caption:
`🪪 ID CARD BERHASIL

Nama     : ${nama}
Umur     : ${umur}
Provinsi : ${provinsi}
Kota     : ${kota}

_*© ID Card Generator By XyzBots*_`
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[IDCARD ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "API ngambek atau link foto lu aneh 😤" },
        { quoted: m }
      );
    }
  }
};