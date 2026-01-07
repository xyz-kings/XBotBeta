module.exports = {
  command: "promote",
  async execute(bot, m, args) {
    try {
      const jid = m.key.remoteJid;
      
      if (!jid.endsWith("@g.us")) {
        await bot.sendMessage(
          jid,
          { text: "Ini cuma bisa di grup njirr 🗿" },
          { quoted: m }
        );
        return;
      }

      const meta = await bot.groupMetadata(jid);
      const sender = m.key.participant || m.key.remoteJid;
      
      // Cek apakah pengirim admin
      const admins = meta.participants
        .filter(p => p.admin)
        .map(p => p.id);

      if (!admins.includes(sender)) {
        await bot.sendMessage(
          jid,
          { text: "Lu bukan admin 😭" },
          { quoted: m }
        );
        return;
      }

      // Skip cek admin bot, langsung coba promote
      // Jika bot tidak admin, akan error di groupParticipantsUpdate

      let target = [];
      
      // Ambil dari tag
      if (m.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        const mentioned = m.message.extendedTextMessage.contextInfo.mentionedJid;
        target = mentioned.filter(id => !id.includes('status'));
      }
      
      // Atau dari argumen
      else if (args[0]) {
        const num = args[0].replace(/\D/g, "");
        if (num && num.length >= 10) {
          target.push(num + '@s.whatsapp.net');
        } else {
          await bot.sendMessage(
            jid,
            { text: "Nomor nya ngaco njirr" },
            { quoted: m }
          );
          return;
        }
      }

      if (target.length === 0) {
        await bot.sendMessage(
          jid,
          {
            text: `Target mana njirr 😭\n\nContoh:\n.promote @user\n.promote @user1 @user2`
          },
          { quoted: m }
        );
        return;
      }

      // Coba promote
      await bot.groupParticipantsUpdate(jid, target, "promote");
      
      const successList = target.map(id => `• @${id.split("@")[0]}`).join("\n");
      
      await bot.sendMessage(
        jid,
        { 
          text: `🆙 *PROMOTE BERHASIL*\n\nBerikut user yang naik jabatan jadi admin:\n${successList}`,
          mentions: target
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[PROMOTE ERROR]", e);
      
      let errorMsg = "Promote gagal njirr 🥲";
      if (e.message.includes("not authorized")) {
        errorMsg = "Bot gak punya permission untuk promote! Pastikan bot admin.";
      } else if (e.message.includes("not in group")) {
        errorMsg = "User tersebut gak ada di grup!";
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { text: errorMsg },
        { quoted: m }
      );
    }
  }
};