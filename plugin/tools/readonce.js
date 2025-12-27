const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require('fs');
const path = require('path');
const { sleep, reactLoading } = require("../../lib/helperAnimasi");

const mediaDir = path.join(__dirname, '../../media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

module.exports = {
  command: ["rvo"],
  category: "tool",
  description: "Download dan forward media view once",
  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.from;

    console.log(`[RVO] Command called by ${senderJid}`);

    let quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    let viewOnceMessage = null;
// --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
    // Ambil media view once
    if (quotedMsg) {
      // Cari semua kemungkinan key
      const keys = Object.keys(quotedMsg);
      for (const key of keys) {
        if (key.toLowerCase().includes('viewonce') || key.toLowerCase().includes('ephemeral')) {
          if (quotedMsg[key]?.message) {
            viewOnceMessage = quotedMsg[key].message;
            console.log(`[RVO] Detected view once via key ${key}`);
            break;
          }
        }
      }

      // fallback manual cari image/video/audio
      if (!viewOnceMessage) {
        const possible = ['imageMessage','videoMessage','audioMessage','documentMessage'];
        for (const type of possible) {
          if (quotedMsg[type]) {
            viewOnceMessage = { [type]: quotedMsg[type] };
            console.log(`[RVO] Detected direct media: ${type}`);
            break;
          }
        }
      }
    }

    // Kalau tidak ada view once
    if (!viewOnceMessage) {
      const debugKeys = quotedMsg ? Object.keys(quotedMsg).join(', ') : 'Tidak ada quoted message';
      return bot.sendMessage(
        remoteJid,
        { text: `🔍 *DEBUG INFO*\n\nQuoted message keys:\n${debugKeys}\n\n*Cara penggunaan:*\nReply media view once dengan: .rvo\nAtau kirim media view once dengan caption .rvo` },
        { quoted: m }
      );
    }

    // Tentukan tipe media
    let mediaType = Object.keys(viewOnceMessage)[0];
    let mediaMessage = viewOnceMessage[mediaType];
    console.log(`[RVO] Media type detected: ${mediaType}`);

    try {
      await bot.sendMessage(remoteJid, { text: `⏳ Mendownload ${mediaType}...` }, { quoted: m });

      let buffer = Buffer.from([]);
      const stream = await downloadContentFromMessage(mediaMessage, mediaType.replace('Message','').toLowerCase());
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      if (!buffer.length) throw new Error('Media kosong');

      const ext = mediaType === 'imageMessage' ? 'jpg' :
                  mediaType === 'videoMessage' ? 'mp4' :
                  mediaType === 'audioMessage' ? 'ogg' : 'bin';
      const fileName = `viewonce_${Date.now()}.${ext}`;
      const filePath = path.join(mediaDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2) + ' MB';
      const senderName = senderJid.split('@')[0];
      const caption = `📥 *MEDIA VIEW ONCE*\n• Tipe: ${mediaType.replace('Message','').toUpperCase()}\n• Ukuran: ${fileSizeMB}\n• Diambil oleh: @${senderName}`;

      // Kirim media
      const sendOpts = { caption, mentions: [senderJid] };
      if (mediaType === 'imageMessage') sendOpts.image = buffer;
      else if (mediaType === 'videoMessage') sendOpts.video = buffer;
      else if (mediaType === 'audioMessage') sendOpts.audio = buffer;
      else if (mediaType === 'documentMessage') {
        sendOpts.document = buffer;
        sendOpts.fileName = fileName;
        sendOpts.mimetype = mediaMessage.mimetype || 'application/octet-stream';
      }

      await bot.sendMessage(remoteJid, sendOpts);
      console.log('[RVO] Media sent successfully');

      // Hapus file sementara
      setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 5000);

      await bot.sendMessage(remoteJid, { text: `✅ Media view once berhasil diambil!\n• Tipe: ${mediaType.replace('Message','').toUpperCase()}\n• Ukuran: ${fileSizeMB}` }, { quoted: m });

    } catch (err) {
      console.error('[RVO] Error:', err);
      return bot.sendMessage(remoteJid, { text: `❌ Gagal mengambil media view once!\n${err.message}` }, { quoted: m });
    }
  }
};