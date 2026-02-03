const axios = require("axios");
const config = require("../../config.json");

async function getContactInfo(bot, jid) {
    try {
        // Coba ambil nama kontak
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
  command: ["cekrejeki"],
  category: "fun",
  description: "Cek rejeki seseorang",

  async execute(bot, m, args) {
    try {
      let targetJid = null;
      let targetName = "";
      const arg = args.join(" ").trim();
      
      // Cek jika ada tag
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
        // Ambil pengirim
        const senderJid = m.key.participant || m.key.from || m.key.remoteJid;
        const contactInfo = await getContactInfo(bot, senderJid);
        targetJid = senderJid;
        targetName = contactInfo.name;
      }

      if (!targetName) targetName = "Anonymous";

      const res = await axios.get(
        `${config.FunBaseURL}/xyz/cekrejeki`,
        { params: { nama: targetName } }
      );

      if (!res.data || !res.data.status) {
        return bot.sendMessage(
          m.key.remoteJid,
          { text: "❌ Gagal mengambil data. Coba lagi nanti." },
          { quoted: m }
        );
      }

      // Buat caption - GUNAKAN FORMAT UNICODE CHARACTER untuk mention
      let caption = `*🪙 Cek Rejeki*\n\n📛 *Nama:* @${targetJid ? targetJid.split('@')[0] : targetName}\n⭐ *Tingkat Rejeki:* ${res.data.result.score}/100\n💰 *Sumber Rejeki:* ${res.data.result.sumber}\n📝 *Deskripsi:* ${res.data.result.deskripsi}\n🎯 *Waktu Terbaik:* ${res.data.result.waktu_terbaik}\n💡 *Saran:* ${res.data.result.saran}\n\n${res.data.note ? res.data.note + "\n\n" : ""}_${config.copyright || ""}_`;

      // Kirim dengan mention jika ada targetJid
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
      console.error("[CEKREJEKI ERROR]", err);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terjadi kesalahan saat memproses permintaan." },
        { quoted: m }
      );
    }
  },
};