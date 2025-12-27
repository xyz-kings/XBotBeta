const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["gclink"],
  category: "group",
  description: "Generate link invite grup baru",
  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;
    // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
    // Cek apakah di grup
    if (!remoteJid.endsWith("@g.us")) {
      return bot.sendMessage(
        remoteJid,
        { text: "⚠️ Command ini hanya bisa digunakan di grup!" },
        { quoted: m }
      );
    }
    
    // Cek apakah sender adalah admin
    try {
      const metadata = await bot.groupMetadata(remoteJid);
      const senderJid = m.key.participant || m.key.from;
      const senderParticipant = metadata.participants.find(p => p.id === senderJid);
      
      // Cek admin status
      const isAdmin = senderParticipant && 
                     (senderParticipant.admin === "admin" || 
                      senderParticipant.admin === "superadmin");
      
      if (!isAdmin) {
        return bot.sendMessage(
          remoteJid,
          { text: "❌ Hanya admin yang bisa generate link grup!" },
          { quoted: m }
        );
      }
      
      console.log(`[LINKGC] Generating new link for ${metadata.subject}`);
      
      // Kirim pesan sedang memproses
      await bot.sendMessage(
        remoteJid,
        { text: "⏳ Membuat link invite baru..." },
        { quoted: m }
      );
      
      // Generate link invite baru
      const inviteCode = await bot.groupInviteCode(remoteJid);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
      
      // Dapatkan info grup
      const groupName = metadata.subject || "Grup Tanpa Nama";
      const totalMembers = metadata.participants?.length || 0;
      const groupDescription = metadata.desc || "Tidak ada deskripsi";
      
      // Format response
      const responseText = `📢 *LINK GRUP TELAH DI SETEL ULANG*\n\n` +
                          `*Link :*\n${inviteLink}\n\n` +
                          `*Nama group :*\n${groupName}\n\n` +
                          `*Jumlah anggota :*\n${totalMembers} anggota\n\n` +
                          `*Admin yang generate :*\n@${senderJid.split('@')[0]}\n\n` +
                          `_Link invite baru telah dibuat!_`;
      
      // Kirim response
      await bot.sendMessage(
        remoteJid,
        { 
          text: responseText,
          mentions: [senderJid]
        },
        { quoted: m }
      );
      
      console.log(`[LINKGC] New link generated for ${groupName}: ${inviteLink}`);
      
      // Optional: Kirim juga ke DM admin
      try {
        const dmMessage = `🔗 *LINK GRUP BARU*\n\n` +
                         `*Group:* ${groupName}\n` +
                         `*Link:* ${inviteLink}\n` +
                         `*Members:* ${totalMembers} orang\n` +
                         `*Generated:* ${new Date().toLocaleDateString('id-ID')}\n\n` +
                         `Simpan link ini untuk invite member baru!`;
        
        await bot.sendMessage(
          senderJid,
          { text: dmMessage }
        );
        
        console.log(`[LINKGC] DM sent to admin ${senderJid.split('@')[0]}`);
      } catch (dmError) {
        console.log('[LINKGC] Could not send DM:', dmError.message);
      }
      
    } catch (error) {
      console.error('[LINKGC] Error:', error);
      
      let errorMessage = "❌ Gagal membuat link invite!";
      
      if (error.message.includes("not authorized") || error.message.includes("401")) {
        errorMessage = "❌ Bot tidak memiliki izin untuk membuat link invite!";
      } else if (error.message.includes("not admin")) {
        errorMessage = "❌ Bot belum menjadi admin di grup ini!";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "❌ Terlalu banyak permintaan. Tunggu beberapa saat.";
      } else if (error.message.includes("404") || error.message.includes("not found")) {
        errorMessage = "❌ Grup tidak ditemukan atau bot sudah tidak di grup.";
      } else if (error.message.includes("invite")) {
        errorMessage = "❌ Gagal generate link. Coba lagi.";
      }
      
      return bot.sendMessage(
        remoteJid,
        { text: errorMessage },
        { quoted: m }
      );
    }
  }
};

// Log saat module load
console.log('[LINKGC] Module loaded - Group Link Generator ready');