const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const sharp = require("sharp");
const config = require("../../config.json");
const { injectExif, log } = require("../../lib/stickerHelper");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["s", "sticker","stiker"],
  async execute(bot, m) {
    try {
      log("START");

      const msg = m.message;
      const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

      let media;
      if (msg?.imageMessage) media = msg.imageMessage;
      else if (quoted?.imageMessage) media = quoted.imageMessage;

      if (!media) {
        log("DETECT", "no image");
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Kirim / reply gambar + *.s*" },
          { quoted: m }
        );
      }
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      log("DETECT", "image ok");

      const stream = await downloadContentFromMessage(media, "image");
      let buffer = Buffer.alloc(0);
      for await (const c of stream) buffer = Buffer.concat([buffer, c]);

      log("DOWNLOAD", `size=${buffer.length}`);

      const webp = await sharp(buffer)
        .resize(512, 512, { fit: "contain" })
        .webp({ quality: 80 })
        .toBuffer();

      log("CONVERT", "to webp");

      const sticker = await injectExif(
        webp,
        config.packName,
        config.authorSticker
      );

      log(
        "SEND",
        `pack="${config.packName}" author="${config.authorSticker}"`
      );

      await bot.sendMessage(
        m.key.remoteJid,
        { sticker },
        { quoted: m }
      );

    } catch (e) {
      log("ERROR", e.message);
      console.error(e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Sticker error. Cek console." },
        { quoted: m }
      );
    }
  }
};