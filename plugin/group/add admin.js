const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: "promote",
  async execute(bot, m, args) {
    try {
      const jid = m.key.remoteJid;
      if (!jid.endsWith("@g.us")) {
        return bot.sendMessage(
          jid,
          { text: "Ini cuma bisa di grup njirr 🗿" },
          { quoted: m }
        );
      }

      const sender = m.key.participant || m.key.remoteJid;
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
      // cek admin
      const meta = await bot.groupMetadata(jid);
      const admins = meta.participants
        .filter(p => p.admin)
        .map(p => p.id);

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

      // ambil target
      let target = [];

      // dari tag
      const mentioned =
        m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentioned.length) {
        target = mentioned;
      } 
      // dari nomor
      else if (args[0]) {
        const num = args[0].replace(/\D/g, "");
        if (!num) {
          return bot.sendMessage(
            jid,
            { text: "Nomor nya ngaco njirr" },
            { quoted: m }
          );
        }
        target = [`${num}@s.whatsapp.net`];
      }

      if (!target.length) {
        return bot.sendMessage(
          jid,
          {
            text:
`Target mana njirr 😭

Contoh:
.promote @user
.promote 62812xxxxxxx`
          },
          { quoted: m }
        );
      }

      await bot.groupParticipantsUpdate(jid, target, "promote");

      await bot.sendMessage(
        jid,
        { text: "🆙 *PROMOTE BERHASIL*\nSekarang dia admin 😎" },
        { quoted: m }
      );

    } catch (e) {
      console.error("[PROMOTE ERROR]", e);
      await bot.sendMessage(
        m.key.remoteJid,
        { text: "Promote gagal njirr, cek console 🗿" },
        { quoted: m }
      );
    }
  }
};