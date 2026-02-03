const axios = require("axios");
const config = require("../../config.json");

async function getContactInfo(bot, jid) {
    try {
        const contact = await bot.onWhatsApp(jid);
        if (contact && contact[0] && contact[0].name) {
            return {
                jid: jid,
                name: contact[0].name,
                number: jid.split('@')[0]
            };
        }
        return {
            jid: jid,
            name: jid.split('@')[0],
            number: jid.split('@')[0]
        };
    } catch (error) {
        return {
            jid: jid,
            name: jid.split('@')[0],
            number: jid.split('@')[0]
        };
    }
}

module.exports = {
  command: ["seberapabucin"],
  category: "fun",
  description: "Cek level bucin seseorang",

  async execute(bot, m, args) {
    try {
      let targetJid = null;
      let targetName = "";
      const arg = args.join(" ").trim();
      
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        const contactInfo = await getContactInfo(bot, targetJid);
        targetName = contactInfo.name;
      } else if (arg) {
        targetName = arg;
        if (arg.match(/^[0-9]+$/)) {
          targetJid = arg + "@s.whatsapp.net";
          const contactInfo = await getContactInfo(bot, targetJid);
          targetName = contactInfo.name;
        }
      } else {
        const senderJid = m.key.participant || m.key.from || m.key.remoteJid;
        const contactInfo = await getContactInfo(bot, senderJid);
        targetJid = senderJid;
        targetName = contactInfo.name;
      }

      if (!targetName) targetName = "Anonymous";

      const res = await axios.get(
        `${config.Funv3BaseURL}/xyz/seberapabucin/user`,
        { params: { nama: targetName } }
      );

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal cek level bucin. Coba lagi nanti." },
          { quoted: m }
        );
      }

      const result = res.data.result;
      let caption = `*😍 Cek Level Bucin*\n\n📛 *Nama:* @${targetJid ? targetJid.split('@')[0] : targetName}\n⭐ *Score:* ${result.score}/100\n🏷️ *Kategori:* ${result.kategori}\n📝 *Deskripsi:* ${result.deskripsi}\n\n${res.data.note ? `💭 *Note:* ${res.data.note}\n\n` : ""}_${config.copyright || ""}_`;

      if (targetJid) {
        await bot.sendMessage(
          m.key.remoteJid,
          { 
            text: caption,
            mentions: [targetJid]
          },
          { quoted: m }
        );
      } else {
        await bot.sendMessage(
          m.key.remoteJid,
          { text: caption },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("[SEBERAPABUCIN ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat cek level bucin." },
        { quoted: m }
      );
    }
  },
};