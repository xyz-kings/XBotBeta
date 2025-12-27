const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { spawn } = require("child_process");
const config = require("../../config.json");
const { injectExif, log } = require("../../lib/stickerHelper");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

const TMP = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);

function exec(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    p.on("error", reject);
    p.on("close", c => c === 0 ? resolve() : reject(new Error(cmd + " failed")));
  });
}

module.exports = {
  command: "brat",
  async execute(bot, m, args) {
    try {
      const text = args.join(" ");
      if (!text) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Teks nya mana njirr 😭\nContoh: .brat woi kucing goreng" },
          { quoted: m }
        );
      }

      log("START", "brat static sticker");
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      // === FETCH IMAGE ===
      const api =
        `https://brat-gamma.vercel.app/api/brat?text=${encodeURIComponent(text)}`;

      const res = await axios.get(api, { responseType: "arraybuffer" });

      const inImg = path.join(TMP, `${Date.now()}.png`);
      const outWebp = path.join(TMP, `${Date.now()}.webp`);

      fs.writeFileSync(inImg, res.data);
      log("DOWNLOAD", `image size=${res.data.length}`);

      // === CONVERT TO WEBP (NO ANIM) ===
      await exec("ffmpeg", [
        "-y",
        "-i", inImg,
        "-vf",
        "scale='if(gt(iw,ih),512,-1)':'if(gt(ih,iw),-1,512)':flags=lanczos",
        "-vcodec", "libwebp",
        "-lossless", "1",
        "-an",
        outWebp
      ]);

      log("CONVERT", "image -> webp");

      const webpBuf = fs.readFileSync(outWebp);

      const sticker = await injectExif(
        webpBuf,
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

      fs.unlinkSync(inImg);
      fs.unlinkSync(outWebp);

    } catch (e) {
      log("ERROR", e.message);
      console.error(e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Brat gagal njirr. Cek console." },
        { quoted: m }
      );
    }
  }
};