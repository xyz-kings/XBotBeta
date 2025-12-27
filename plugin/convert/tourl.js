const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
 const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["tourl"],
  async execute(bot, m, args) {
    try {
      const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) return bot.sendMessage(m.key.remoteJid, { text: "Reply file gambar/video dengan caption .tourl" }, { quoted: m });

      let mediaMessage;
      let fileName = "file";

      if (quoted.imageMessage) {
        mediaMessage = quoted.imageMessage;
        fileName += ".jpg";
      } else if (quoted.videoMessage) {
        mediaMessage = quoted.videoMessage;
        fileName += ".mp4";
      } else {
        return bot.sendMessage(m.key.remoteJid, { text: "File bukan image/video!" }, { quoted: m });
      }
      // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄

      // Download media
      const stream = await downloadContentFromMessage(mediaMessage, mediaMessage.mimetype.split("/")[0]);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Upload ke Catbox
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", buffer, { filename: fileName });

      const res = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: form,
      });

      const url = await res.text();
      bot.sendMessage(m.key.remoteJid, { text: `File berhasil diupload!\n\n${url}` }, { quoted: m });
    } catch (err) {
      console.log(err);
      bot.sendMessage(m.key.remoteJid, { text: "Gagal upload file ke catbox." }, { quoted: m });
    }
  },
};