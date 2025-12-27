const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "demote",
  async execute(bot, m) {
    try {
      const jid = m.key.remoteJid;
      if (!jid.endsWith("@g.us")) {
        return bot.sendMessage(
          jid,
          { text: "Ini cuma bisa dipake di grup njirr 🗿" },
          { quoted: m }
        );
      }

      const sender = m.key.participant || m.key.remoteJid;

      const meta = await bot.groupMetadata(jid);
      const admins = meta.participants
        .filter(p => p.admin)
        .map(p => p.id);
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      // cek admin
      if (!admins.includes(sender)) {
        return bot.sendMessage(
          jid,
          { text: "Lu bukan admin 😭" },
          { quoted: m }
        );
      }

      if (!admins.includes(bot.user.id)) {
        return bot.sendMessage(
          jid,
          { text: "Bot bukan admin njirr 🥲" },
          { quoted: m }
        );
      }

      // WAJIB TAG
      const mentioned =
        m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

      if (!mentioned.length) {
        return bot.sendMessage(
          jid,
          {
            text:
`Tag orangnya njirr 😭

Cara pakai:
.demote @member`
          },
          { quoted: m }
        );
      }

      await bot.groupParticipantsUpdate(jid, mentioned, "demote");

      await bot.sendMessage(
        jid,
        {
          text:
`⬇️ *DEMOTE BERHASIL*
Jabatan admin dicabut 🗿`
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[DEMOTE ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Demote gagal njirr, cek console 😭" },
        { quoted: m }
      );
    }
  }
};