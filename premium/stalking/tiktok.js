const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["ttstalk"],
  category: "tools",
  premiumOnly: true, // INI SAJA YANG DITAMBAH
  description: "Stalk akun TikTok",

  async execute(bot, m, args) {
    try {
      const username = args[0];
      if (!username) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Username mana?\nContoh: *.tiktokstalk  xyz123" },
          { quoted: m }
        );
      }

      const url = `${config.baseURL}/stalk/tiktok`;
      const res = await axios.get(url, {
        params: {
          apikey: config.apiKey,
          user: username
        }
      });

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ User TikTok tidak ditemukan." },
          { quoted: m }
        );
      }

      const r = res.data.result;

      const text = `
🎵 *TIKTOK STALKER*

👤 Username : ${r.uniqueId}
📝 Nickname : ${r.nickname || "-"}
💬 Bio :
${r.signature || "-"}

🆔 ID : ${r.id}
✅ Verified : ${r.verified ? "Yes" : "No"}
🔒 Private : ${r.privateAccount ? "Yes" : "No"}

❤️ Likes : ${r.heart.toLocaleString()}
👥 Followers : ${r.followerCount.toLocaleString()}
➡️ Following : ${r.followingCount.toLocaleString()}

📌 Profile URL : https://www.tiktok.com/@${r.uniqueId}
`.trim();

      // kirim foto profil + caption
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: r.avatarLarger },
          caption: text
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[TIKTOK STALK ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Error saat stalk TikTok." },
        { quoted: m }
      );
    }
  }
};