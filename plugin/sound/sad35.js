const axios = require("axios");
const path = require("path");

const BASE_RAW = "https://raw.githubusercontent.com/Leoo7z/Music/main";

module.exports = {
  command: ["sad35"],
  category: "sound",
  description: "Play sad sound",

  async execute(bot, m) {
    const num = "35";
    const url = `${BASE_RAW}/sad-music/sad${num}.mp3`;

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
