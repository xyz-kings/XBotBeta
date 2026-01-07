module.exports = {
  command: "kick",
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
        
        // Filter untuk tidak bisa kick diri sendiri
        target = target.filter(id => id !== sender);
        
        // Filter untuk tidak bisa kick owner
        const ownerId = meta.owner;
        target = target.filter(id => id !== ownerId);
      }
      
      // Atau dari argumen (opsional)
      else if (args[0]) {
        const num = args[0].replace(/\D/g, "");
        if (num && num.length >= 10) {
          const targetId = num + '@s.whatsapp.net';
          const ownerId = meta.owner;
          
          if (targetId === sender) {
            await bot.sendMessage(
              jid,
              { text: "Gak bisa kick diri sendiri njirr 🤡" },
              { quoted: m }
            );
            return;
          }
          
          if (targetId === ownerId) {
            await bot.sendMessage(
              jid,
              { text: "Waduh, gak bisa kick owner grup lah! 🤯" },
              { quoted: m }
            );
            return;
          }
          
          target.push(targetId);
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
            text: `Target mana njirr 😭\n\nContoh:\n.kick @user\n.kick @user1 @user2`
          },
          { quoted: m }
        );
        return;
      }

      // Cek apakah mencoba kick admin lain (hanya admin bisa kick admin lain)
      const isSenderOwner = sender === meta.owner;
      const targetAdmins = target.filter(id => admins.includes(id));
      
      if (targetAdmins.length > 0 && !isSenderOwner) {
        // Hanya owner yang bisa kick admin
        await bot.sendMessage(
          jid,
          { 
            text: `Gak bisa kick admin lain! Hanya owner yang bisa kick admin. 😤\nAdmin yang ditarget: ${targetAdmins.map(id => `@${id.split("@")[0]}`).join(', ')}`,
            mentions: targetAdmins
          },
          { quoted: m }
        );
        return;
      }

      // Cek apakah target ada di grup
      const participantsIds = meta.participants.map(p => p.id);
      const validTargets = target.filter(id => participantsIds.includes(id));
      
      if (validTargets.length === 0) {
        await bot.sendMessage(
          jid,
          { 
            text: "Target gak ada di grup ini! 🤔",
            mentions: target
          },
          { quoted: m }
        );
        return;
      }

      // Kick target
      await bot.groupParticipantsUpdate(jid, validTargets, "remove");
      
      // Format response
      const successList = validTargets.map(id => `• @${id.split("@")[0]}`).join("\n");
      const kickedCount = validTargets.length;
      
      await bot.sendMessage(
        jid,
        { 
          text: `👢 *KICK BERHASIL*\n\nBerhasil mengeluarkan ${kickedCount} user dari grup:\n${successList}`,
          mentions: validTargets
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[KICK ERROR]", e);
      
      let errorMsg = "Kick gagal njirr 🥲";
      if (e.message.includes("not authorized")) {
        errorMsg = "Bot gak punya permission untuk kick! Pastikan bot admin.";
      } else if (e.message.includes("not in group")) {
        errorMsg = "User tersebut gak ada di grup!";
      } else if (e.message.includes("owner")) {
        errorMsg = "Gak bisa kick owner grup!";
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { text: errorMsg },
        { quoted: m }
      );
    }
  }
};