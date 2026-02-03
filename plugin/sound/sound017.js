const axios = require("axios");
const path = require("path");

const BASE_RAW = "https://raw.githubusercontent.com/Leoo7z/Music/main";

module.exports = {
  command: ["sound017"],
  category: "sound",
  description: "Play sound dari GitHub RAW",

  async execute(bot, m) {
    const num = "17";
    const url = `${BASE_RAW}/sound${num}.mp3`;

    await bot.sendMessage(
      m.key.remoteJid,
      {
        audio: { url },
        mimetype: "audio/mpeg" // ✅ ini audio biasa
      },
      { quoted: m }
    );
  },
};
