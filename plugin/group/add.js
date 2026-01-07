module.exports = {
  command: "add",
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

      // Cek apakah grup sudah penuh (max 1024 participants)
      const currentMembers = meta.participants.length;
      const maxMembers = 1024;
      
      if (currentMembers >= maxMembers) {
        await bot.sendMessage(
          jid,
          { text: `Grup udah penuh bang! 😱\nSaat ini: ${currentMembers}/${maxMembers} member` },
          { quoted: m }
        );
        return;
      }

      let numbers = [];
      
      // Ambil dari argumen
      if (args.length > 0) {
        for (let arg of args) {
          const num = arg.replace(/\D/g, "");
          if (num && num.length >= 10) {
            const formattedNum = num.startsWith('0') ? '62' + num.slice(1) : 
                                 num.startsWith('8') ? '62' + num : 
                                 num.startsWith('62') ? num : 
                                 '62' + num;
            
            // Format yang benar: 628xxxxxxxxxx@s.whatsapp.net
            const targetId = formattedNum + '@s.whatsapp.net';
            numbers.push(targetId);
          }
        }
      }
      
      // Cek apakah ada tag juga
      if (m.message.extendedTextMessage?.contextInfo?.mentionedJid) {
        const mentioned = m.message.extendedTextMessage.contextInfo.mentionedJid;
        const mentionedNumbers = mentioned.filter(id => !id.includes('status'));
        numbers = [...numbers, ...mentionedNumbers];
      }

      if (numbers.length === 0) {
        await bot.sendMessage(
          jid,
          {
            text: `Nomor mana njirr 😭\n\nContoh:\n.add 6281234567890\n.add 62812 62813 62814\n.add @user (untuk yang sudah ada di kontak)`
          },
          { quoted: m }
        );
        return;
      }

      // Batasi jumlah yang bisa di-add sekaligus (maks 10)
      const maxAddAtOnce = 10;
      const numbersToAdd = numbers.slice(0, maxAddAtOnce);
      
      if (numbers.length > maxAddAtOnce) {
        await bot.sendMessage(
          jid,
          { text: `Batas maksimal add sekaligus: ${maxAddAtOnce}\nHanya akan menambahkan ${maxAddAtOnce} pertama` },
          { quoted: m }
        );
      }

      // Cek slot tersisa
      const remainingSlots = maxMembers - currentMembers;
      if (numbersToAdd.length > remainingSlots) {
        await bot.sendMessage(
          jid,
          { text: `Slot tersisa cuma ${remainingSlots}, tidak bisa add ${numbersToAdd.length} orang sekaligus` },
          { quoted: m }
        );
        return;
      }

      // Filter angka yang sudah ada di grup
      const existingMembers = meta.participants.map(p => p.id);
      const newNumbers = numbersToAdd.filter(num => !existingMembers.includes(num));
      
      if (newNumbers.length === 0) {
        await bot.sendMessage(
          jid,
          { text: "Semua nomor tersebut sudah ada di grup ini! 🤔" },
          { quoted: m }
        );
        return;
      }

      // Filter yang duplikat
      const uniqueNumbers = [...new Set(newNumbers)];
      
      // Kirim progress
      const progressMsg = await bot.sendMessage(
        jid,
        { text: `🔄 Sedang menambahkan ${uniqueNumbers.length} member...` },
        { quoted: m }
      );

      // Add members
      const results = {
        success: [],
        failed: []
      };

      for (const num of uniqueNumbers) {
        try {
          await bot.groupParticipantsUpdate(jid, [num], "add");
          results.success.push(num);
          
          // Delay sedikit agar tidak spam
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.failed.push({
            number: num,
            reason: error.message.includes("not authorized") ? "Privacy setting" :
                   error.message.includes("invite") ? "Gak bisa diinvite" :
                   error.message.includes("group") ? "Gak ada di kontak" : "Unknown error"
          });
        }
      }

      // Format response
      let responseText = "";
      
      if (results.success.length > 0) {
        const successList = results.success.map(num => `• @${num.split("@")[0]}`).join("\n");
        responseText += `✅ *BERHASIL DITAMBAHKAN* (${results.success.length}):\n${successList}\n\n`;
      }
      
      if (results.failed.length > 0) {
        const failedList = results.failed.map(f => `• @${f.number.split("@")[0]} (${f.reason})`).join("\n");
        responseText += `❌ *GAGAL DITAMBAHKAN* (${results.failed.length}):\n${failedList}\n\n`;
      }
      
      // Tambahkan info grup
      const newMemberCount = meta.participants.length + results.success.length;
      responseText += `📊 *INFO GRUP*\n`;
      responseText += `• Total member: ${newMemberCount}/${maxMembers}\n`;
      responseText += `• Slot tersisa: ${maxMembers - newMemberCount}`;

      // Kirim hasil
      await bot.sendMessage(
        jid,
        { 
          text: responseText,
          mentions: results.success
        },
        { quoted: m }
      );

      // Hapus progress message
      try {
        await bot.sendMessage(jid, { delete: progressMsg.key });
      } catch (e) {
        // Ignore jika tidak bisa delete
      }

    } catch (e) {
      console.error("[ADD ERROR]", e);
      
      let errorMsg = "Add member gagal njirr 🥲";
      if (e.message.includes("not authorized")) {
        errorMsg = "Bot gak punya permission untuk add member! Pastikan bot admin.";
      } else if (e.message.includes("invite")) {
        errorMsg = "Gak bisa invite orang tersebut, mungkin privacy setting mereka tinggi.";
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { text: errorMsg },
        { quoted: m }
      );
    }
  }
};