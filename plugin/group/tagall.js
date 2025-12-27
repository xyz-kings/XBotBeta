const { sleep, reactLoading } = require("../../lib/helperAnimasi");
module.exports = {
  command: ["tagall"],
  category: "group",
  description: "Mention semua member di grup",
  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.from;
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
    
    try {
      // Ambil metadata grup
      const metadata = await bot.groupMetadata(remoteJid);
      const participants = metadata.participants || [];
      const groupName = metadata.subject || "Grup Ini";
      
      // Cek apakah sender adalah member grup
      const senderParticipant = participants.find(p => p.id === senderJid);
      if (!senderParticipant) {
        return bot.sendMessage(
          remoteJid,
          { text: "❌ Kamu bukan member grup ini!" },
          { quoted: m }
        );
      }
      
      // Dapatkan nama sender
      let senderName = 'Member';
      try {
        const contact = await bot.getContact(senderJid);
        senderName = contact?.notify || contact?.name || contact?.verifiedName || senderJid.split('@')[0];
      } catch (e) {
        senderName = senderJid.split('@')[0];
      }
      
      // Pesan dari user (jika ada)
      const userMessage = args.length > 0 ? args.join() : " *Hanya pengen tag semuanya biar rame* \n\n _Pesan dari Bot : orang yang pake tag all ini ngk ada pesan apapun, bagusnya di bakar hidup_ ";
      
      console.log(`[TAGALL] ${senderName} tagging ${participants.length} members in ${groupName}`);
      
      // === Siapkan pesan dengan mention semua member ===
      let message = `📢 *ADA PESAN DARI : ${senderName}*\n`;
      message += `☟   ☟   ☟   ☟   ☟   ☟   ☟   ☟   ☟\n\n`;
      message += `*"${userMessage}"*\n\n`;
      message += `📋 *DAFTAR MEMBER (${participants.length} orang) :*\n\n`;
      
      // Siapkan array untuk mentions
      const mentions = [];
      
      // Tambahkan setiap member ke list
      participants.forEach((participant, index) => {
        const memberNumber = participant.id.split('@')[0];
        const memberName = participant.id.split('@')[0]; // Default pakai nomor
        
        // Tambahkan ke message
        message += `${index + 1}. @${memberNumber}\n`;
        
        // Tambahkan ke array mentions
        mentions.push(participant.id);
      });
      
      // Tambahkan footer
      message += `\n📍 *Total: ${participants.length} anggota grup*`;
      
      // Kirim pesan dengan mention semua member
      await bot.sendMessage(
        remoteJid,
        {
          text: message,
          mentions: mentions
        },
        { quoted: m }
      );
      
      console.log(`[TAGALL] Successfully tagged ${participants.length} members`);
      
    } catch (error) {
      console.error('[TAGALL] Error:', error);
      
      let errorMessage = "❌ Gagal mention semua member!";
      
      if (error.message.includes("not in group")) {
        errorMessage = "❌ Bot tidak berada di grup ini!";
      } else if (error.message.includes("401") || error.message.includes("not authorized")) {
        errorMessage = "❌ Bot tidak memiliki izin untuk mention member.";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "❌ Terlalu banyak request. Tunggu beberapa saat.";
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
console.log('[TAGALL] Module loaded - Tag All Members ready');