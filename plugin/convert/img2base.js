const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "img2base64",
  category: "convert",
  description: "Convert image ke Base64 dan kirim sebagai file .txt",
  
  async execute(bot, m) {
    try {
      await reactLoading(bot, m); // tampil animasi loading

      // Ambil pesan dan cek reply
      const msg = m.message;
      const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted || !quoted.imageMessage) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "⚠️ Reply image dengan caption `.base64` untuk convert." },
          { quoted: m }
        );
      }

      // Download image
      const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      // Convert ke base64
      const base64Data = buffer.toString("base64");

      // Simpan ke file txt
      const tmpPath = path.join(process.cwd(), "xconvertbs64.txt");
      fs.writeFileSync(tmpPath, base64Data, "utf8");

      // Kirim file txt ke chat
      await bot.sendMessage(
        m.key.remoteJid,
        {
          document: fs.readFileSync(tmpPath),
          mimetype: "text/plain",
          fileName: "xconvertbs64.txt",
          caption: "✅ Berikut hasil convert image ke Base64"
        },
        { quoted: m }
      );

      // Hapus file sementara
      fs.unlinkSync(tmpPath);
      console.log("[CONVERT] Image berhasil di-convert ke Base64");

    } catch (error) {
      console.error("[CONVERT BASE64] Error:", error);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Gagal convert image ke Base64. Cek console." },
        { quoted: m }
      );
    }
  }
};