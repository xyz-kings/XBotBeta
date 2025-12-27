const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["ytstalk"],
  category: "tools",
  description: "Stalk channel YouTube",

  async execute(bot, m, args) {
    try {
      const username = args[0];
      if (!username) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Username mana?\nContoh: *.ytstalk verlangid*" },
          { quoted: m }
        );
      }

      const url = `${config.baseURL}/stalk/youtube`;
      const res = await axios.get(url, {
        params: {
          apikey: config.apiKey,
          user: username
        }
      });

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Channel YouTube tidak ditemukan." },
          { quoted: m }
        );
      }

      const data = res.data.result;
      const meta = data.channelMetadata;
      const videos = data.videoDataList.slice(0, 5); // ambil 5 video terakhir

      let text = `
📺 *YOUTUBE STALKER*

👤 Channel : ${meta.username}
📝 Description : ${meta.description || "-"}
📊 Subscribers : ${meta.subscriberCount}
🎬 Total Videos : ${meta.videoCount}
🔗 Channel URL : ${meta.channelUrl}

🎞️ *5 Video Terakhir*:
`.trim();

      videos.forEach((v, i) => {
        text += `
${i + 1}. ${v.title}
📅 ${v.publishedTime} | 👁️ ${v.viewCount} | ⏱️ ${v.duration}
🔗 https://www.youtube.com${v.navigationUrl}
`;
      });

      // kirim thumbnail channel + caption
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: meta.avatarUrl },
          caption: text
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[YT STALK ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Error saat stalk YouTube." },
        { quoted: m }
      );
    }
  }
};