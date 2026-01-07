module.exports = {
  command: "setgn",
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

      // Ambil text dari args
      const newName = args.join(" ").trim();
      
      if (!newName) {
        await bot.sendMessage(
          jid,
          {
            text: `Kasih nama baru dong! 😭\n\nContoh:\n.setgn Nama Grup Baru\n.setgn Grup Seru Banget`
          },
          { quoted: m }
        );
        return;
      }

      // Cek panjang nama (WhatsApp batas 250 karakter untuk subject)
      const maxLength = 250;
      if (newName.length > maxLength) {
        await bot.sendMessage(
          jid,
          { 
            text: `Nama grup kepanjangan njirr! 🥲\nMaksimal ${maxLength} karakter.\n\nSekarang: ${newName.length} karakter\nContoh yang benar: ${newName.substring(0, maxLength)}`
          },
          { quoted: m }
        );
        return;
      }

      // Cek nama sama dengan yang sekarang
      const currentName = meta.subject;
      if (newName === currentName) {
        await bot.sendMessage(
          jid,
          { text: "Nama grup masih sama aja 🤔\nKasih nama yang beda dong!" },
          { quoted: m }
        );
        return;
      }

      // Coba update nama grup
      await bot.groupUpdateSubject(jid, newName);
      
      // Kirim konfirmasi dengan format menarik
      await bot.sendMessage(
        jid,
        { 
          text: `✅ *NAMA GRUP BERHASIL DIUBAH*\n\n📛 **Nama Lama:**\n${currentName}\n\n📛 **Nama Baru:**\n${newName}\n\n📊 **Info:**\n• Diubah oleh: @${sender.split("@")[0]}\n• Panjang: ${newName.length}/${maxLength} karakter`,
          mentions: [sender]
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("[SETGN ERROR]", e);
      
      let errorMsg = "Gagal ubah nama grup njirr 🥲";
      if (e.message.includes("not authorized")) {
        errorMsg = "Bot gak punya permission untuk ubah nama grup! Pastikan bot admin.";
      } else if (e.message.includes("too long")) {
        errorMsg = "Nama grup kepanjangan! Maksimal 25 karakter.";
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { text: errorMsg },
        { quoted: m }
      );
    }
  }
};