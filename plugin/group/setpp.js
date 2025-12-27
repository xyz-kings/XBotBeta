const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

function log(step, data = "") {
  console.log(`[SET_PP] ${step}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
}

module.exports = {
  command: ["setpp"],
  category: "group",
  description: "Ganti foto profil grup (Fixed Multi-ID Support)",
  async execute(bot, m, args) {
    log("COMMAND CALLED");
    log("CHAT", m.key.remoteJid);
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
    // Cek apakah di grup
    if (!m.key.remoteJid.endsWith("@g.us")) {
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "⚠️ Command ini hanya bisa digunakan di grup!" },
        { quoted: m }
      );
    }

    let metadata;
    try {
      metadata = await bot.groupMetadata(m.key.remoteJid);
      log("GROUP METADATA", {
        subject: metadata.subject,
        participantsCount: metadata.participants?.length || 0,
      });
    } catch (error) {
      log("METADATA ERROR", error.message);
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Gagal mengambil informasi grup." },
        { quoted: m }
      );
    }

    const participants = metadata.participants || [];
    const senderJid = m.key.participant || m.key.from;

    // === CEK ADMIN PENGIRIM ===
    const senderParticipant = participants.find((p) => p.id === senderJid);
    const isSenderAdmin = senderParticipant && 
                         (senderParticipant.admin === "admin" || 
                          senderParticipant.admin === "superadmin");
    
    log("SENDER DETAILS", {
      senderJid,
      found: !!senderParticipant,
      admin: senderParticipant?.admin,
      isSenderAdmin,
    });

    if (!isSenderAdmin) {
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Hanya admin grup yang bisa menggunakan command ini!" },
        { quoted: m }
      );
    }

    // === CEK ADMIN BOT (FIXED MULTI-ID SUPPORT) ===
    const botUser = bot.user;
    log("BOT USER OBJECT", botUser);
    
    // Dapatkan semua ID yang mungkin untuk bot
    const botPossibleIds = [];
    
    // 1. ID standar dari bot.user.id
    if (botUser.id) {
      botPossibleIds.push(botUser.id.split(':')[0]); // Hapus device ID
      botPossibleIds.push(botUser.id.replace(/:\d+/, '')); // Hapus :13
    }
    
    // 2. LID dari bot.user.lid
    if (botUser.lid) {
      botPossibleIds.push(botUser.lid.split(':')[0]); // Hapus device ID
      botPossibleIds.push(botUser.lid.replace(/:\d+/, '')); // Hapus :13
    }
    
    // 3. Nomor dasar dari kedua ID
    if (botUser.id) {
      const baseNum = botUser.id.split('@')[0].replace(/:\d+/, '').replace(/\D/g, '');
      botPossibleIds.push(baseNum);
    }
    
    if (botUser.lid) {
      const baseNum = botUser.lid.split('@')[0].replace(/:\d+/, '').replace(/\D/g, '');
      botPossibleIds.push(baseNum);
    }
    
    log("BOT POSSIBLE IDs", [...new Set(botPossibleIds)]);
    
    // Fungsi untuk normalisasi ID
    const normalizeId = (id) => {
      if (!id) return '';
      // Hapus device ID (:13), hapus @lid/@s.whatsapp.net, ambil angka saja
      return id
        .replace(/:\d+/g, '')      // Hapus :13
        .replace(/@.+$/, '')       // Hapus @lid atau @s.whatsapp.net
        .replace(/\D/g, '');       // Hanya angka
    };
    
    // Cari bot di daftar peserta
    let botParticipant = null;
    let isBotAdmin = false;
    
    for (const participant of participants) {
      const participantId = participant.id;
      const normalizedParticipantId = normalizeId(participantId);
      
      log(`CHECKING PARTICIPANT`, {
        participantId,
        normalizedParticipantId,
      });
      
      // Cocokkan dengan semua kemungkinan ID bot
      for (const botId of botPossibleIds) {
        const normalizedBotId = normalizeId(botId);
        
        if (normalizedParticipantId === normalizedBotId && normalizedBotId !== '') {
          botParticipant = participant;
          isBotAdmin = participant.admin === "admin" || participant.admin === "superadmin";
          log("BOT IDENTIFIED!", {
            matchedBotId: botId,
            participantId,
            normalizedMatch: normalizedParticipantId,
            adminStatus: participant.admin,
          });
          break;
        }
      }
      
      if (botParticipant) break;
    }
    
    // METODE ALTERNATIF: Jika masih tidak ketemu, coba matching dengan logika sederhana
    if (!botParticipant) {
      log("Trying alternative matching...");
      
      // Dalam kasus Anda, bot dan sender mungkin sama nomornya!
      // Cek apakah sender adalah bot itu sendiri
      const senderNormalized = normalizeId(senderJid);
      const botFromLid = normalizeId(botUser.lid);
      
      log("ALTERNATIVE CHECK", {
        senderNormalized,
        botFromLid,
        match: senderNormalized === botFromLid
      });
      
      if (senderNormalized === botFromLid) {
        // Jika sender adalah bot itu sendiri, gunakan participant sender sebagai bot
        botParticipant = senderParticipant;
        isBotAdmin = senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin";
        log("BOT IDENTIFIED AS SENDER!", {
          botParticipant,
          isBotAdmin
        });
      }
    }
    
    log("FINAL BOT CHECK", {
      botPossibleIds: [...new Set(botPossibleIds)],
      botParticipantFound: !!botParticipant,
      botParticipant,
      isBotAdmin,
      totalParticipants: participants.length,
    });

    if (!isBotAdmin) {
      // DEBUG: Tampilkan semua peserta untuk analisis
      log("ALL PARTICIPANTS FOR DEBUG", participants.map(p => ({
        id: p.id,
        normalized: normalizeId(p.id),
        admin: p.admin
      })));
      
      return bot.sendMessage(
        m.key.remoteJid,
        { 
          text: "🤖 Bot belum menjadi admin di grup ini!\n\n" +
                "Pastikan:\n" +
                "1. Bot sudah dijadikan admin\n" +
                "2. Bot aktif di grup\n" +
                "3. Coba kick dan invite ulang bot" 
        },
        { quoted: m }
      );
    }

    // === AMBIL GAMBAR ===
    let imageMessage = null;
    
    if (m.message?.imageMessage) {
      log("IMAGE FROM DIRECT MESSAGE");
      imageMessage = m.message.imageMessage;
    }
    else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
      log("IMAGE FROM QUOTED MESSAGE");
      imageMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
    }
    else if (m.message?.documentMessage?.mimetype?.startsWith("image/")) {
      log("IMAGE AS DOCUMENT");
      imageMessage = m.message.documentMessage;
    }
    else {
      log("NO IMAGE DETECTED");
      return bot.sendMessage(
        m.key.remoteJid,
        { 
          text: `📸 Kirim atau reply gambar dengan caption *${args[0] || ".setpp"}* untuk mengganti foto profil grup!` 
        },
        { quoted: m }
      );
    }

    // === DOWNLOAD GAMBAR ===
    log("DOWNLOADING IMAGE...");
    let imageBuffer = Buffer.from([]);
    
    try {
      const stream = await downloadContentFromMessage(imageMessage, "image");
      
      for await (const chunk of stream) {
        imageBuffer = Buffer.concat([imageBuffer, chunk]);
      }
      
      log("DOWNLOAD COMPLETE", {
        size: imageBuffer.length,
        sizeKB: Math.round(imageBuffer.length / 1024),
      });
      
      if (imageBuffer.length === 0) {
        throw new Error("Downloaded image is empty");
      }
    } catch (downloadError) {
      log("DOWNLOAD ERROR", downloadError.message);
      return bot.sendMessage(
        m.key.remoteJid,
        { text: "❌ Gagal mengunduh gambar. Pastikan format gambar valid." },
        { quoted: m }
      );
    }

    // === SET PROFILE PICTURE ===
    log("SETTING GROUP PROFILE PICTURE...");
    
    try {
      await bot.updateProfilePicture(m.key.remoteJid, imageBuffer);
      
      log("PROFILE PICTURE UPDATED SUCCESSFULLY");
      
      await bot.sendMessage(
        m.key.remoteJid,
        { 
          text: "✅ Foto profil grup berhasil diperbarui!" 
        },
        { quoted: m }
      );
      
    } catch (setPpError) {
      log("SET PP ERROR", setPpError.message);
      
      let errorMessage = "❌ Gagal mengubah foto profil grup.";
      
      if (setPpError.message.includes("not authorized")) {
        errorMessage = "❌ Bot tidak memiliki izin untuk mengubah foto profil grup.";
      } else if (setPpError.message.includes("rate limit")) {
        errorMessage = "❌ Terlalu banyak permintaan. Coba lagi nanti.";
      }
      
      return bot.sendMessage(
        m.key.remoteJid,
        { text: errorMessage },
        { quoted: m }
      );
    }
  }
};