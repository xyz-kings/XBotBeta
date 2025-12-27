const { sleep, reactLoading } = require("../../lib/helperAnimasi");
module.exports = {
  command: ["newgc"],
  category: "tool",
  description: "Buat grup WhatsApp baru dengan berbagai opsi",
  async execute(bot, m, args) {
    const senderJid = m.key.participant || m.key.from;
    const senderNumber = senderJid.split('@')[0];
    
    console.log(`[NEWGC] Command called by ${senderNumber}`);
    
    // Cek apakah ada nama grup
    if (args.length === 0) {
      return bot.sendMessage(
        m.key.remoteJid,
        { 
          text: "👥 *CARA BUAT GRUP BARU*\n\n" +
                "*Mode 1: Grup pribadi dengan bot*\n" +
                ".newgc [nama grup]\n" +
                "*Contoh:* .newgc Chat Pribadi\n\n" +
                "*Mode 2: Grup dengan teman*\n" +
                ".newgc [nama grup] | [nomor]\n" +
                "*Contoh:* .newgc Grup Sahabat | 6281234567890\n\n" +
                "*Mode 3: Dari grup yang ada*\n" +
                "Tag member di grup lalu ketik:\n" +
                ".newgc [nama grup] | @member1 @member2\n\n" +
                "*Catatan:*\n" +
                "• Minimal 3 karakter untuk nama grup\n" +
                "• Bot otomatis jadi admin\n" +
                "• Kamu jadi creator grup"
        },
        { quoted: m }
      );
    }
    
    const fullInput = args.join(" ");
    let groupName = fullInput;
    let additionalParticipants = [];
    // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
    // Cek jika ada separator "|" untuk additional participants
    if (fullInput.includes('|')) {
      const parts = fullInput.split('|').map(part => part.trim());
      groupName = parts[0];
      const participantsInput = parts[1] || "";
      
      // Parse additional participants
      if (participantsInput) {
        // 1. Cek jika ada mention (@) di input
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
          additionalParticipants = m.message.extendedTextMessage.contextInfo.mentionedJid;
          console.log(`[NEWGC] Found ${additionalParticipants.length} mentioned participants`);
        }
        
        // 2. Cek jika ada nomor telepon
        if (additionalParticipants.length === 0 && participantsInput.match(/\d/)) {
          // Parse nomor dari input text
          const numbers = participantsInput.split(/[\s,]+/).filter(num => num.match(/^\d/));
          
          numbers.forEach(num => {
            let phoneNumber = num.replace(/\D/g, '');
            
            // Format nomor
            if (phoneNumber.startsWith('0')) {
              phoneNumber = '62' + phoneNumber.substring(1);
            } else if (phoneNumber.startsWith('8') && phoneNumber.length <= 13) {
              phoneNumber = '62' + phoneNumber;
            } else if (phoneNumber.startsWith('+62')) {
              phoneNumber = '62' + phoneNumber.substring(3);
            }
            
            if (phoneNumber.length >= 10 && phoneNumber.length <= 15) {
              additionalParticipants.push(`${phoneNumber}@s.whatsapp.net`);
            }
          });
        }
      }
    }
    
    // Validasi nama grup
    if (groupName.length > 100) {
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Nama grup terlalu panjang! Maksimal 100 karakter." },
        { quoted: m }
      );
    }
    
    if (groupName.length < 3) {
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Nama grup terlalu pendek! Minimal 3 karakter." },
        { quoted: m }
      );
    }
    
    // Validasi jumlah participants (max 100 termasuk bot dan sender)
    if (additionalParticipants.length > 98) {
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Terlalu banyak participants! Maksimal 98 orang tambahan." },
        { quoted: m }
      );
    }
    
    try {
      // Kirim pesan sedang memproses
      const processingMsg = `⏳ Membuat grup "${groupName}"...\n\n`;
      let statusMsg = processingMsg;
      
      if (additionalParticipants.length > 0) {
        statusMsg += `Menambahkan ${additionalParticipants.length} participant...`;
      } else {
        statusMsg += "Membuat grup pribadi dengan bot...";
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { text: statusMsg },
        { quoted: m }
      );
      
      console.log(`[NEWGC] Creating group: "${groupName}"`);
      
      // === Siapkan participants ===
      // 1. Bot JID
      const botJid = bot.user.id.split(':')[0]; // Format: 6287718203240@s.whatsapp.net
      console.log(`[NEWGC] Bot JID: ${botJid}`);
      
      // 2. Participants array
      const allParticipants = [
        senderJid,      // Pembuat grup
        botJid          // Bot
      ];
      
      // 3. Tambahkan additional participants (jika ada)
      additionalParticipants.forEach(jid => {
        if (!allParticipants.includes(jid) && jid !== senderJid && jid !== botJid) {
          allParticipants.push(jid);
        }
      });
      
      console.log(`[NEWGC] Total participants: ${allParticipants.length}`);
      console.log(`[NEWGC] Participants list:`, allParticipants);
      
      // === Buat grup ===
      const createResult = await bot.groupCreate(groupName, allParticipants);
      
      // Dapatkan group JID
      const groupJid = createResult.id || createResult.gid || createResult;
      console.log(`[NEWGC] Group created: ${groupJid}`);
      
      // Tunggu sebentar untuk grup settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // === Setup grup ===
      // 1. Set deskripsi
      try {
        const description = `📱 Grup dibuat oleh @${senderNumber} via XYZ Bot\n` +
                           `👥 ${allParticipants.length} anggota\n` +
                           `🕐 ${new Date().toLocaleDateString('id-ID')}`;
        await bot.groupUpdateDescription(groupJid, description);
        console.log('[NEWGC] Description set');
      } catch (descError) {
        console.log('[NEWGC] Could not set description:', descError.message);
      }
      
      // 2. Kirim welcome message
      let welcomeMessage = `👋 *Selamat datang di ${groupName}!*\n\n`;
      welcomeMessage += `📌 *Creator:* @${senderNumber}\n`;
      welcomeMessage += `🤖 *Bot:* @${botJid.split('@')[0]}\n`;
      welcomeMessage += `👥 *Total anggota:* ${allParticipants.length} orang\n`;
      welcomeMessage += `📅 *Dibuat:* ${new Date().toLocaleDateString('id-ID')}\n\n`;
      
      if (additionalParticipants.length > 0) {
        welcomeMessage += `*Anggota baru:*\n`;
        additionalParticipants.forEach(jid => {
          if (jid !== senderJid && jid !== botJid) {
            welcomeMessage += `• @${jid.split('@')[0]}\n`;
          }
        });
        welcomeMessage += `\n`;
      }
      
      welcomeMessage += `*Fitur tersedia:*\n`;
      welcomeMessage += `• Welcome message (.welcome on v1)\n`;
      welcomeMessage += `• Anti toxic (.antitoxic on)\n`;
      welcomeMessage += `• Admin tools (.add, .kick, .setpp)\n`;
      welcomeMessage += `• Dan masih banyak lagi!`;
      
      // Kirim dengan mention semua participants
      await bot.sendMessage(
        groupJid,
        { 
          text: welcomeMessage,
          mentions: allParticipants
        }
      );
      
      console.log('[NEWGC] Welcome message sent');
      
      // 3. Kirim link invite ke creator
      try {
        const inviteCode = await bot.groupInviteCode(groupJid);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        
        const inviteMessage = `🔗 *LINK GRUP BARU*\n\n` +
                             `*Nama Grup:* ${groupName}\n` +
                             `*Link:* ${inviteLink}\n` +
                             `*ID Grup:* ${groupJid}\n` +
                             `*Total Anggota:* ${allParticipants.length} orang\n\n`;
        
        if (additionalParticipants.length > 0) {
          inviteMessage += `*Anggota yang diundang:*\n`;
          additionalParticipants.forEach(jid => {
            if (jid !== senderJid && jid !== botJid) {
              inviteMessage += `• ${jid.split('@')[0]}\n`;
            }
          });
          inviteMessage += `\n`;
        }
        
        inviteMessage += `📤 Share link untuk invite lebih banyak member!\n`;
        inviteMessage += `🔧 Gunakan .add [nomor] untuk tambah member`;
        
        // Kirim ke DM creator
        await bot.sendMessage(
          senderJid,
          { text: inviteMessage }
        );
        
        console.log('[NEWGC] Invite link sent to DM');
        
      } catch (inviteError) {
        console.log('[NEWGC] Could not generate invite link:', inviteError.message);
        
        // Kirim fallback message
        await bot.sendMessage(
          senderJid,
          { text: `✅ Grup "${groupName}" berhasil dibuat!\n\nGunakan .add [nomor] untuk menambah member.` }
        );
      }
      
      // === Konfirmasi di chat asal ===
      let confirmationText = `✅ *GRUP BERHASIL DIBUAT!*\n\n`;
      confirmationText += `🏷️ *Nama:* ${groupName}\n`;
      confirmationText += `👤 *Creator:* @${senderNumber}\n`;
      confirmationText += `🤖 *Bot:* @${botJid.split('@')[0]}\n`;
      confirmationText += `📊 *Total Member:* ${allParticipants.length} orang\n`;
      confirmationText += `🔗 *Status:* ✅ Aktif\n\n`;
      
      if (additionalParticipants.length > 0) {
        confirmationText += `*Berhasil diundang:* ${additionalParticipants.length} orang\n\n`;
      }
      
      confirmationText += `Link invite telah dikirim ke DM kamu!\n`;
      confirmationText += `Gunakan .add [nomor] untuk tambah member lain.`;
      
      await bot.sendMessage(
        m.key.remoteJid,
        { 
          text: confirmationText,
          mentions: [senderJid]
        },
        { quoted: m }
      );
      
      console.log(`[NEWGC] Group creation completed successfully`);
      
    } catch (error) {
      console.error('[NEWGC] Error:', error);
      
      let errorMessage = "❌ Gagal membuat grup!";
      
      if (error.message.includes("already exists")) {
        errorMessage = "❌ Grup dengan nama tersebut sudah ada.";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "❌ Terlalu banyak permintaan. Coba lagi nanti.";
      } else if (error.message.includes("participants")) {
        errorMessage = "❌ Gagal menambahkan beberapa participant. Pastikan nomor valid dan terdaftar WhatsApp.";
      } else if (error.message.includes("401") || error.message.includes("not authorized")) {
        errorMessage = "❌ Bot tidak memiliki izin untuk membuat grup.";
      } else if (error.message.includes("invite")) {
        errorMessage = "❌ Gagal membuat link invite.";
      } else if (error.message.includes("number")) {
        errorMessage = "❌ Format nomor tidak valid.";
      }
      
      return bot.sendMessage(
        m.key.remoteJid,
        { 
          text: `${errorMessage}\n\nError: ${error.message}`,
          quoted: m 
        }
      );
    }
  }
};

// Log saat module load
console.log('[NEWGC] Module loaded - Advanced Group Creator ready');