const axios = require("axios");
const path = require("path");

const BASE_RAW = "https://raw.githubusercontent.com/Leoo7z/Music/main";

module.exports = {
  command: ["kane11"],
  category: "sound",
  description: "Play kane sound",

  async execute(bot, m) {
    const num = "11";
    const url = `${BASE_RAW}/kene-music/kane${num}.mp3`;

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
