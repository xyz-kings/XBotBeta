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
  command: "bratanim",
  async execute(bot, m, args) {
    try {
      const text = args.join(" ");
      if (!text) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "Teks nya mana njirr 😭\nContoh: .bratanim woi kucing goreng" },
          { quoted: m }
        );
      }

      log("START", "brat anim sticker");
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      // === FETCH BRAT ANIM ===
      const api = `https://brat-anim.vercel.app/api/bratanim?text=${encodeURIComponent(text)}`;
      const res = await axios.get(api, { responseType: "arraybuffer" });

      const inFile = path.join(TMP, `${Date.now()}.mp4`);
      const outWebp = path.join(TMP, `${Date.now()}.webp`);

      fs.writeFileSync(inFile, res.data);
      log("DOWNLOAD", `brat anim size=${res.data.length}`);

      // === CONVERT TO STICKER (AUTO RESIZE, NO MAKSA KOTAK) ===
      await exec("ffmpeg", [
        "-y",
        "-i", inFile,
        "-vf",
        "fps=15,scale='if(gt(iw,ih),512,-1)':'if(gt(ih,iw),-1,512)':flags=lanczos",
        "-loop", "0",
        "-t", "6",
        "-an",
        "-vsync", "0",
        outWebp
      ]);

      log("CONVERT", "brat anim -> webp");

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

      fs.unlinkSync(inFile);
      fs.unlinkSync(outWebp);

    } catch (e) {
      log("ERROR", e.message);
      console.error(e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Brat anim gagal njirr. Cek console." },
        { quoted: m }
      );
    }
  }
};