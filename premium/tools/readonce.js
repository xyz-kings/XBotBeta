const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { reactLoading } = require("../../lib/helperAnimasi");

const mediaDir = path.join(__dirname, "../../media");
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

module.exports = {
  command: ["rvo"],
  category: "tool",
  premiumOnly: true, // INI SAJA YANG DITAMBAH
  description: "Download dan forward media view once",
  async execute(bot, m) {
    const remoteJid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.from || "";
    const senderName = senderJid ? senderJid.split("@")[0] : "unknown";

    console.log(`[RVO] Command called by ${senderJid || "unknown"}`);

    await reactLoading(bot, m);

    // ambil quoted message
    const quotedMsg =
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;

    let viewOnceMessage = null;

    // === PRIORITAS VIEW ONCE (STRUKTUR RESMI BAILEYS) ===
    if (quotedMsg) {
      viewOnceMessage =
        quotedMsg.viewOnceMessageV2?.message ||
        quotedMsg.viewOnceMessageV2Extension?.message ||
        null;
    }

    // === FALLBACK MEDIA BIASA ===
    if (!viewOnceMessage && quotedMsg) {
      const possible = [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "documentMessage",
      ];
      for (const type of possible) {
        if (quotedMsg[type]) {
          viewOnceMessage = { [type]: quotedMsg[type] };
          console.log(`[RVO] Detected direct media: ${type}`);
          break;
        }
      }
    }

    // === GAGAL TOTAL ===
    if (!viewOnceMessage) {
      const debugKeys = quotedMsg
        ? Object.keys(quotedMsg).join(", ")
        : "Tidak ada quoted message";

      return bot.sendMessage(
        remoteJid,
        {
          text:
            `❌ *MEDIA TIDAK DITEMUKAN*\n\n` +
            `Quoted keys:\n${debugKeys}\n\n` +
            `Cara pakai:\nReply media (view once / biasa)\nketik *.rvo*`,
        },
        { quoted: m }
      );
    }

    // === DETEKSI MEDIA ===
    const mediaType = Object.keys(viewOnceMessage)[0];
    if (!mediaType) throw new Error("Media tidak dikenali");

    const mediaMessage = viewOnceMessage[mediaType];
    if (!mediaMessage) throw new Error("Isi media kosong");

    console.log(`[RVO] Media type detected: ${mediaType}`);

    try {
      await bot.sendMessage(
        remoteJid,
        { text: `⏳ Mendownload ${mediaType}...` },
        { quoted: m }
      );

      // === DOWNLOAD ===
      let buffer = Buffer.from([]);
      const stream = await downloadContentFromMessage(
        mediaMessage,
        mediaType.replace("Message", "")
      );

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) throw new Error("Buffer kosong");

      // === EXTENSION AMAN ===
      const extMap = {
        imageMessage: "jpg",
        videoMessage: "mp4",
        audioMessage: "ogg",
        documentMessage: "bin",
      };
      const ext = extMap[mediaType] || "bin";

      const fileName = `viewonce_${Date.now()}.${ext}`;
      const filePath = path.join(mediaDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const fileSizeMB =
        (buffer.length / 1024 / 1024).toFixed(2) + " MB";

      const caption =
        `📥 *MEDIA VIEW ONCE*\n` +
        `• Tipe: ${mediaType.replace("Message", "").toUpperCase()}\n` +
        `• Ukuran: ${fileSizeMB}\n` +
        `• Diambil oleh: @${senderName}`;

      // === KIRIM MEDIA ===
      const sendOpts = {
        caption,
        mentions: senderJid ? [senderJid] : [],
      };

      if (mediaType === "imageMessage") sendOpts.image = buffer;
      else if (mediaType === "videoMessage") sendOpts.video = buffer;
      else if (mediaType === "audioMessage") sendOpts.audio = buffer;
      else if (mediaType === "documentMessage") {
        sendOpts.document = buffer;
        sendOpts.fileName = fileName;
        sendOpts.mimetype =
          mediaMessage.mimetype || "application/octet-stream";
      }

      await bot.sendMessage(remoteJid, sendOpts);
      console.log("[RVO] Media sent successfully");

      // === BERSIHIN FILE ===
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 5000);

      await bot.sendMessage(
        remoteJid,
        {
          text:
            `✅ *BERHASIL*\n` +
            `• Tipe: ${mediaType.replace("Message", "").toUpperCase()}\n` +
            `• Ukuran: ${fileSizeMB}`,
        },
        { quoted: m }
      );
    } catch (err) {
      console.error("[RVO] Error:", err);
      return bot.sendMessage(
        remoteJid,
        { text: `❌ Gagal mengambil media!\n${err.message}` },
        { quoted: m }
      );
    }
  },
};