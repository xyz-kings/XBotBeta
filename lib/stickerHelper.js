const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const TMP = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);

function log(step, msg = "") {
  const t = new Date().toLocaleTimeString("id-ID", { hour12: false });
  console.log(`[${t}][STICKER_HELPER][${step}] ${msg}`);
}

function createExif(packname, author) {
  const json = {
    "sticker-pack-id": "xyz-bot-md",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    "android-app-store-link": "",
    "ios-app-store-link": "",
    "emojis": []
  };

  const exifAttr = Buffer.from([
    0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
    0x01,0x00,0x41,0x57,0x07,0x00,
    0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00
  ]);

  const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
  const exif = Buffer.concat([exifAttr, jsonBuff]);
  exif.writeUIntLE(jsonBuff.length, 14, 4);

  return exif;
}

async function injectExif(webpBuffer, packname, author) {
  return new Promise((resolve, reject) => {
    const input = path.join(TMP, `${Date.now()}.webp`);
    const output = path.join(TMP, `${Date.now()}_exif.webp`);
    const exifPath = path.join(TMP, `${Date.now()}.exif`);

    fs.writeFileSync(input, webpBuffer);
    fs.writeFileSync(exifPath, createExif(packname, author));

    log("EXIF", "inject start");

    const proc = spawn("webpmux", [
      "-set", "exif", exifPath,
      input,
      "-o", output
    ]);

    proc.on("error", reject);

    proc.on("close", () => {
      try {
        const result = fs.readFileSync(output);
        fs.unlinkSync(input);
        fs.unlinkSync(output);
        fs.unlinkSync(exifPath);
        log("EXIF", "inject success");
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = { injectExif, log };