const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const config = require("../../config.json");
const { injectExif, log } = require("../../lib/stickerHelper");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

const TMP = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);

function exec(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    p.on("error", reject);
    p.on("close", code => code === 0 ? resolve() : reject(new Error(cmd+" failed")));
  });
}

module.exports = {
  command: "svd",
  async execute(bot, m) {
    try {
      // --- PANGGIL REACT LOADING DI TEMPAT BENAR ---
      await reactLoading(bot, m); // 🔁🔃🔄

      log("START", "video sticker");

      const msg = m.message;
      const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

      let media;
      if (msg?.videoMessage) media = msg.videoMessage;
      else if (quoted?.videoMessage) media = quoted.videoMessage;

      if (!media) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Kirim / reply video + *.svd*" },
          { quoted: m }
        );
      }

      log("DETECT", "video ok");

      // download video
      const stream = await downloadContentFromMessage(media, "video");
      let buffer = Buffer.alloc(0);
      for await (const c of stream) buffer = Buffer.concat([buffer, c]);

      const inMp4 = path.join(TMP, `${Date.now()}.mp4`);
      const outWebp = path.join(TMP, `${Date.now()}.webp`);

      fs.writeFileSync(inMp4, buffer);
      log("DOWNLOAD", `size=${buffer.length}`);

      await exec("ffmpeg", [
        "-y",
        "-i", inMp4,
        "-vf",
        "fps=15,scale='if(gt(iw,ih),512,-1)':'if(gt(ih,iw),512,-1)':flags=lanczos,pad=512:512:(512-iw)/2:(512-ih)/2:color=0x00000000",
        "-t", "6",
        "-loop", "0",
        "-an",
        "-vsync", "0",
        outWebp
      ]);

      log("CONVERT", "video -> webp");

      const webpBuf = fs.readFileSync(outWebp);

      const sticker = await injectExif(
        webpBuf,
        config.packName,
        config.authorSticker
      );

      log("SEND", `pack="${config.packName}" author="${config.authorSticker}"`);

      await bot.sendMessage(
        m.key.remoteJid,
        { sticker },
        { quoted: m }
      );

      // Cleanup
      fs.unlinkSync(inMp4);
      fs.unlinkSync(outWebp);

    } catch (e) {
      log("ERROR", e.message);
      console.error(e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Sticker video error. Cek console." },
        { quoted: m }
      );
    }
  }
};