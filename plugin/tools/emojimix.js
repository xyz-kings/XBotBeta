const axios = require("axios");
const config = require("../../config.json");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "emojimix",

  async execute(bot, m, args) {
    try {
      // ===== TANPA ARGUMENT =====
      if (args.length < 2) {
        return bot.sendMessage(
          m.key.remoteJid,
          {
            text:
`😆 *EMOJI MIX*

Cara pakai:
${config.prefix}emojimix <emoji1> <emoji2>

Contoh:
${config.prefix}emojimix 😄 🥺
${config.prefix}emojimix 🔥 💀

Hasilnya berupa *gambar emoji campuran* 🖼️`
          },
          { quoted: m }
        );
      }

      const emoji1 = args[0];
      const emoji2 = args[1];

      console.log("[EMOJIMIX] emoji1:", emoji1);
      console.log("[EMOJIMIX] emoji2:", emoji2);

      const url =
        `${config.baseURL}/tools/emojimix` +
        `?apikey=${config.apiKey}` +
        `&emoji1=${encodeURIComponent(emoji1)}` +
        `&emoji2=${encodeURIComponent(emoji2)}`;

      console.log("[EMOJIMIX] request:", url);
      // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄


      const res = await axios.get(url, { responseType: "arraybuffer" });

      console.log("[EMOJIMIX] response size:", res.data.length);

      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: Buffer.from(res.data),
          caption: "✨ Emoji Mix"
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[EMOJIMIX ERROR]", e?.response?.data || e.message);

      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Emoji mix error njirr 😑" },
        { quoted: m }
      );
    }
  }
};