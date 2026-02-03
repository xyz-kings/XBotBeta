const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const config = require("../../config.json");
const { injectExif, log } = require("../../lib/stickerHelper");
const { reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["qcv2"],
  async execute(bot, m) {
    try {
      log("START", "QC Sticker Maker");

      // Debug: Tampilkan pesan yang diterima
      console.log("Full message:", JSON.stringify(m, null, 2));
      
      // Cara 1: Ambil dari m.body atau m.message
      let messageText = "";
      
      // Cek jika ada m.text (untuk beberapa library)
      if (m.text) {
        messageText = m.text;
      }
      // Cek jika ada m.body
      else if (m.body) {
        messageText = m.body;
      }
      // Cek jika ada m.message.conversation
      else if (m.message?.conversation) {
        messageText = m.message.conversation;
      }
      // Cek jika ada m.message.extendedTextMessage
      else if (m.message?.extendedTextMessage?.text) {
        messageText = m.message.extendedTextMessage.text;
      }
      
      console.log("Raw text:", messageText);
      
      // Bersihkan command dari teks
      // Hapus semua prefix command yang mungkin
      const prefixes = [".qcv2"];
      for (const prefix of prefixes) {
        if (messageText.startsWith(prefix)) {
          messageText = messageText.slice(prefix.length).trim();
          break;
        }
      }
      
      console.log("Cleaned text:", messageText);
      
      // Cek jika teks kosong
      if (!messageText) {
        log("ERROR", "No message text after cleaning");
        return bot.sendMessage(
          m.key.remoteJid,
          { 
            text: "❌ *Format Salah!*\n\nContoh penggunaan:\n`.qcv2 Halo dunia`\n``\n\nIsi pesan setelah command." 
          },
          { quoted: m }
        );
      }

      // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m);
      
      // Ambil info pengguna
      const userId = m.key.participant || m.key.remoteJid;
      console.log("User ID:", userId);
      
      // Ambil profile picture dan nama
      let avatarUrl = null;
      let userName = "User";
      
      try {
        // Profile picture - format yang benar
        const jid = userId.includes('@') ? userId : userId + '@s.whatsapp.net';
        console.log("Trying to get profile for:", jid);
        
        const profilePic = await bot.profilePictureUrl(jid, 'image');
        if (profilePic) {
          avatarUrl = profilePic;
          log("PROFILE", "Got profile picture");
          console.log("Profile URL:", avatarUrl);
        }
      } catch (err) {
        console.log("Profile picture error:", err.message);
        log("INFO", "No profile picture found");
      }
      
      try {
        // Nama kontak
        // Coba ambil dari pushName terlebih dahulu (lebih reliable)
        if (m.pushName) {
          userName = m.pushName;
          console.log("Got name from pushName:", userName);
        }
        // Atau coba dari contacts
        else if (bot.contacts && bot.contacts[userId]) {
          const contact = bot.contacts[userId];
          userName = contact.name || contact.notify || contact.vname || "User";
          console.log("Got name from contacts:", userName);
        }
        
        log("NAME", `Using: ${userName}`);
      } catch (err) {
        console.log("Name error:", err.message);
        log("INFO", "Using default name");
      }

      // Buat URL API
      const encodedName = encodeURIComponent(userName);
      const encodedMessage = encodeURIComponent(messageText);
      let apiUrl = `https://qc-whatsapp.vercel.app/api/qc/v2?name=${encodedName}&message=${encodedMessage}`;
      
      if (avatarUrl) {
        apiUrl += `&avatar=${encodeURIComponent(avatarUrl)}`;
      }
      
      console.log("API URL:", apiUrl);
      log("API", "Calling QC API");

      // Download gambar dari API
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'arraybuffer',
        timeout: 30000,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("API returned empty image");
      }

      log("DOWNLOAD", `Got image: ${response.data.length} bytes`);
      console.log("Image type:", response.headers['content-type']);

      // Gunakan sharp untuk resize ke 512x512
      const sharp = require("sharp");
      const webp = await sharp(response.data)
        .resize(512, 512, { 
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ 
          quality: 85,
          effort: 6
        })
        .toBuffer();
      
      log("CONVERT", "Resized to 512x512 webp");

      // Inject exif
      const sticker = await injectExif(
        webp,
        config.packName || "QC Sticker",
        config.authorSticker || userName
      );

      log("SEND", "Sticker ready to send");

      // Kirim sticker
      await bot.sendMessage(
        m.key.remoteJid,
        { 
          sticker: sticker
        },
        { 
          quoted: m,
          ephemeralExpiration: 86400
        }
      );
      
      log("SUCCESS", "Sticker sent");

    } catch (e) {
      log("ERROR", e.message);
      console.error("Full error:", e);
      
      let errorMsg = "";
      if (e.message.includes("No message text")) {
        errorMsg = "❌ *Pesan kosong!*\nContoh: `.qcv2 Halo teman`";
      } 
      else if (e.code === 'ECONNREFUSED' || e.message.includes("connect")) {
        errorMsg = "❌ *API tidak bisa dihubungi.*\nCoba beberapa saat lagi.";
      } 
      else if (e.message.includes("timeout")) {
        errorMsg = "⏰ *Timeout!* API terlalu lama merespon.";
      } 
      else if (e.response?.status === 404) {
        errorMsg = "❌ *API tidak ditemukan.*";
      } 
      else if (e.message.includes("sharp")) {
        errorMsg = "🔧 *Sharp module error.*\nInstall: `npm install sharp`";
      }
      else if (e.message.includes("API returned empty")) {
        errorMsg = "🖼️ *API tidak mengembalikan gambar.*\nCek URL API.";
      }
      else {
        errorMsg = `❌ *Error:* ${e.message.substring(0, 100)}`;
      }
      
      await bot.sendMessage(
        m.key.remoteJid,
        { 
          text: errorMsg
        },
        { quoted: m }
      );
    }
  }
};