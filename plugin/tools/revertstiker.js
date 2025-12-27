const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

const TMP = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

module.exports = {
  command: "revstik",
  async execute(bot, m) {
    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted?.stickerMessage) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Reply stikernya goblok, pake *.revstik*" },
          { quoted: m }
        );
      }
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      // ===== DOWNLOAD STICKER =====
      const stream = await downloadContentFromMessage(
        quoted.stickerMessage,
        "sticker"
      );

      let buffer = Buffer.alloc(0);
      for await (const c of stream) buffer = Buffer.concat([buffer, c]);

      const file = path.join(TMP, `${Date.now()}.png`);
      fs.writeFileSync(file, buffer);

      // ===== SEND AS IMAGE =====
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: fs.readFileSync(file),
          mimetype: "image/png"
        },
        { quoted: m }
      );

      fs.unlinkSync(file);

    } catch (e) {
      console.error(e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Gagal balikin stiker. Tapi bukan salah logic 😤" },
        { quoted: m }
      );
    }
  }
};