module.exports = {
  command: "demote",
  async execute(bot, m, args) {
    try {
      const jid = m.key.remoteJid;
      
      // Cek apakah di grup
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

      let target = [];
      
      // Ambil dari tag
      if (m.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        const mentioned = m.message.extendedTextMessage.contextInfo.mentionedJid;
        target = mentioned.filter(id => !id.includes('status'));
        
        // Filter untuk tidak bisa demote diri sendiri
        target = target.filter(id => id !== sender);
      }
      
      // Atau dari argumen (opsional)
      else if (args[0]) {
        const num = args[0].replace(/\D/g, "");
        if (num && num.length >= 10) {
          const targetId = num + '@s.whatsapp.net';
          if (targetId !== sender) {
            target.push(targetId);
          } else {
            await bot.sendMessage(
              jid,
              { text: "Gak bisa demote diri sendiri njirr 🤡" },
              { quoted: m }
            );
            return;
          }
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
            text: `Target mana njirr 😭\n\nContoh:\n.demote @user\n.demote @user1 @user2`
          },
          { quoted: m }
        );
        return;
      }

      // Cek apakah target adalah admin
      const targetAdmins = target.filter(id => admins.includes(id));
      
      if (targetAdmins.length === 0) {
        await bot.sendMessage(
          jid,
          { 
            text: "Target bukan admin! Gak bisa di demote kalau bukan admin 😐",
            mentions: target
          },
          { quoted: m }
        );
        return;
      }

      // Cek apakah mencoba demote owner
      const ownerId = meta.owner;
      const tryingToDemoteOwner = target.some(id => id === ownerId);
      
      if (tryingToDemoteOwner) {
        await bot.sendMessage(
          jid,
          { text: "Waduh, gak bisa demote owner grup lah! 🤯" },
          { quoted: m }
        );
        return;
      }

      // Demote target
      await bot.groupParticipantsUpdate(jid, targetAdmins, "demote");
      
      // Format response
      const successList = targetAdmins.map(id => `• @${id.split("@")[0]}`).join("\n");
      
      await bot.sendMessage(
        jid,
        { 
          text: `📉 *DEMOTE BERHASIL*\n\nBerikut user yang turun jabatan dari admin:\n${successList}`,
          mentions: targetAdmins
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[DEMOTE ERROR]", e);
      
      let errorMsg = "Demote gagal njirr 🥲";
      if (e.message.includes("not authorized")) {
        errorMsg = "Bot gak punya permission untuk demote! Pastikan bot admin.";
      } else if (e.message.includes("not in group")) {
        errorMsg = "User tersebut gak ada di grup!";
      } else if (e.message.includes("owner")) {
        errorMsg = "Gak bisa demote owner grup!";
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { text: errorMsg },
        { quoted: m }
      );
    }
  }
};