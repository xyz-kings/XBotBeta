const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["setbio"],
  category: "group",
  description: "Ubah deskripsi (bio) grup WhatsApp",
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

    // Cek apakah ada teks bio
    if (args.length === 0) {
      return bot.sendMessage(
        remoteJid,
        { 
          text: "📝 *Cara penggunaan:*\n" +
                ".setbio [teks deskripsi]\n\n" +
                "*Contoh:*\n" +
                ".setbio Ini adalah grup official XYZ Bot\n" +
                ".setbio Welcome to our community! 🤖"
        },
        { quoted: m }
      );
    }

    const newDescription = args.join(" ");
    
    // Validasi panjang teks (WhatsApp limit ~500 chars)
    if (newDescription.length > 500) {
      return bot.sendMessage(
        remoteJid,
        { text: "❌ Deskripsi terlalu panjang! Maksimal 500 karakter." },
        { quoted: m }
      );
    }

    try {
      // Ambil metadata grup untuk cek admin
      const metadata = await bot.groupMetadata(remoteJid);
      const participants = metadata.participants || [];
      const senderJid = m.key.participant || m.key.from;

      // === CEK ADMIN PENGIRIM ===
      const senderParticipant = participants.find((p) => p.id === senderJid);
      const isSenderAdmin = senderParticipant && 
                           (senderParticipant.admin === "admin" || 
                            senderParticipant.admin === "superadmin");
      
      if (!isSenderAdmin) {
        return bot.sendMessage(
          remoteJid,
          { text: "❌ Hanya admin grup yang bisa mengubah deskripsi!" },
          { quoted: m }
        );
      }

      // === CEK ADMIN BOT ===
      const botUser = bot.user;
      let isBotAdmin = false;
      
      // Normalisasi ID
      const normalizeId = (id) => {
        if (!id) return '';
        return id
          .replace(/:\d+/g, '')
          .replace(/@.+$/, '')
          .replace(/\D/g, '');
      };
      
      // Cari bot di peserta
      for (const participant of participants) {
        const participantNormalized = normalizeId(participant.id);
        
        // Cek dari bot.id
        if (botUser.id) {
          const botIdNormalized = normalizeId(botUser.id);
          if (participantNormalized === botIdNormalized && botIdNormalized !== '') {
            isBotAdmin = participant.admin === "admin" || participant.admin === "superadmin";
            break;
          }
        }
        
        // Cek dari bot.lid
        if (botUser.lid && !isBotAdmin) {
          const botLidNormalized = normalizeId(botUser.lid);
          if (participantNormalized === botLidNormalized && botLidNormalized !== '') {
            isBotAdmin = participant.admin === "admin" || participant.admin === "superadmin";
            break;
          }
        }
      }
      
      // Fallback: cek jika sender adalah bot itu sendiri
      if (!isBotAdmin) {
        const senderNormalized = normalizeId(senderJid);
        const botLidNormalized = normalizeId(botUser.lid);
        if (senderNormalized === botLidNormalized) {
          isBotAdmin = senderParticipant?.admin === "admin" || senderParticipant?.admin === "superadmin";
        }
      }

      if (!isBotAdmin) {
        return bot.sendMessage(
          remoteJid,
          { text: "🤖 Bot belum menjadi admin di grup ini!" },
          { quoted: m }
        );
      }

      console.log(`[SET_BIO] Mengubah deskripsi grup ${remoteJid} ke: "${newDescription}"`);

      // Update deskripsi grup
      await bot.groupUpdateDescription(remoteJid, newDescription);
      
      // Kirim konfirmasi
      await bot.sendMessage(
        remoteJid,
        { 
          text: `✅ *Deskripsi grup berhasil diubah!*\n\n` +
                `📝 *Deskripsi baru:*\n` +
                `${newDescription}\n\n` +
                `_Gunakan .setbio [teks] untuk mengubah lagi_`
        },
        { quoted: m }
      );

    } catch (error) {
      console.error("[SET_BIO] ERROR:", error);
      
      let errorMessage = "❌ Gagal mengubah deskripsi grup.";
      
      if (error.message.includes("not authorized")) {
        errorMessage = "❌ Bot tidak memiliki izin untuk mengubah deskripsi.";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "❌ Terlalu banyak permintaan. Tunggu beberapa saat.";
      } else if (error.message.includes("404") || error.message.includes("not found")) {
        errorMessage = "❌ Grup tidak ditemukan atau bot sudah tidak di grup.";
      } else if (error.message.includes("401")) {
        errorMessage = "❌ Akses ditolak. Pastikan bot masih admin.";
      }
      
      return bot.sendMessage(
        remoteJid,
        { text: errorMessage },
        { quoted: m }
      );
    }
  }
};