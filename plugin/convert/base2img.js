const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "base2img",
  category: "convert",
  description: "Convert file .txt berisi Base64 menjadi image/jpeg",
  
  async execute(bot, m) {
    try {
      await reactLoading(bot, m); // tampil animasi loading

      const msg = m.message;
      const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted || !quoted.documentMessage) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "⚠️ Reply file .txt hasil Base64 dengan caption `.base2img`" },
          { quoted: m }
        );
      }

      // download file
      const stream = await downloadContentFromMessage(quoted.documentMessage, "document");
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      const base64Data = buffer.toString("utf8");
      const imageBuffer = Buffer.from(base64Data, "base64");

      // simpan sementara
      const tmpPath = path.join(process.cwd(), `xconvert_img_${Date.now()}.jpg`);
      fs.writeFileSync(tmpPath, imageBuffer);

      // kirim hasil image
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: fs.readFileSync(tmpPath),
          caption: "✅ Berhasil convert Base64 ke image/jpeg",
        },
        { quoted: m }
      );

      fs.unlinkSync(tmpPath);
      console.log("[CONVERT] Base64 berhasil di-convert menjadi image");

    } catch (error) {
      console.error("[CONVERT BASE64 -> IMG] Error:", error);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Gagal convert Base64 ke image. Cek console." },
        { quoted: m }
      );
    }
  }
};