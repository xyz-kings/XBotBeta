const fetch = require("node-fetch");
const config = require("../../config.json"); // pastikan path bener
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["ssweb"],
  category: "tools",
  async execute(bot, m, args) {
    try {
      if (!args[0]) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Masukkan URL untuk di screenshot, contoh:\n.ssweb https://google.com" },
          { quoted: m }
        );
      }

      const targetUrl = encodeURIComponent(args[0]);
      const apiUrl = `${config.baseURL}/tools/ssweb?apikey=${config.apiKey}&url=${targetUrl}`;


      // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄

      // Panggil API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.status || !data.result || !data.result.iurl) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Gagal mengambil screenshot dari URL tersebut." },
          { quoted: m }
        );
      }

      // Ambil buffer image
      const imageRes = await fetch(data.result.iurl);
      const buffer = await imageRes.arrayBuffer();
      const imageBuffer = Buffer.from(buffer);

      // Kirim hasil screenshot
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: imageBuffer,
          caption: `> *📷Hasil SS Web*\n>\n> *Status : Success*\n\n_© Xbot's Features_`,
        },
        { quoted: m }
      );

    } catch (err) {
      console.log(err);
      bot.sendMessage(
        m.key.remoteJid,
        { text: "Terjadi kesalahan saat memproses screenshot." },
        { quoted: m }
      );
    }
  },
};