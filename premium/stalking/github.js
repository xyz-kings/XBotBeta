const axios = require("axios");
const config = require("../../config.json");

module.exports = {
  command: ["gitstalk"],
  category: "tools",
  premiumOnly: true, // INI SAJA YANG DITAMBAH
  description: "Stalk akun GitHub",

  async execute(bot, m, args) {
    try {
      const username = args[0];
      if (!username) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Username mana?\nContoh: *.gitstalk xyz-kings*" },
          { quoted: m }
        );
      }

      const url = `${config.baseURL}/stalk/github`;
      const res = await axios.get(url, {
        params: {
          apikey: config.apiKey,
          user: username
        }
      });

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ User GitHub tidak ditemukan." },
          { quoted: m }
        );
      }

      const r = res.data.result;

      const text = `
🐙 *GITHUB STALKER*

👤 Username : ${r.username}
📝 Nickname : ${r.nickname || "-"}
🧬 Bio :
${r.bio || "-"}

🆔 ID : ${r.id}
📦 Type : ${r.type}
🛡️ Admin : ${r.admin ? "Yes" : "No"}

📊 Repositories : ${r.public_repo}
📁 Gists : ${r.public_gists}
👥 Followers : ${r.followers}
➡️ Following : ${r.following}

🏢 Company : ${r.company || "-"}
🌍 Location : ${r.location || "-"}
🔗 Blog : ${r.blog || "-"}

📅 Created : ${r.ceated_at}
♻️ Updated : ${r.updated_at}

🌐 Profile :
${r.url}
`.trim();

      // kirim foto profil + caption
      await bot.sendMessage(
        m.key.remoteJid,
        {
          image: { url: r.profile_pic },
          caption: text
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[GITSTALK ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Error saat stalk GitHub." },
        { quoted: m }
      );
    }
  }
};