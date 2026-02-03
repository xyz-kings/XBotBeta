// plugin/tools/qrread.js
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  command: ["qrread", "scanqr", "readqr", "qrcode"],
  category: "tool",
  description: "Baca QR code dari gambar",
  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;
    const senderJid = m.key.participant || m.key.from;
    
    console.log(`[QRREAD] Command called by ${senderJid}`);

    // Cek apakah ada gambar yang dikirim atau di-reply
    let quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    let imageMessage = null;
    
    // Pengecekan untuk direct image
    if (m.message?.imageMessage) {
      imageMessage = m.message.imageMessage;
      console.log('[QRREAD] Direct image message detected');
    } 
    // Pengecekan untuk quoted image
    else if (quotedMsg?.imageMessage) {
      imageMessage = quotedMsg.imageMessage;
      console.log('[QRREAD] Quoted image message detected');
    }
    // Pengecekan untuk document dengan gambar
    else if (quotedMsg?.documentMessage) {
      const doc = quotedMsg.documentMessage;
      const mimeType = doc.mimetype || '';
      if (mimeType.startsWith('image/')) {
        imageMessage = doc;
        console.log('[QRREAD] Document image detected');
      }
    }
    // Cek juga untuk viewOnce image
    else if (quotedMsg?.viewOnceMessageV2?.message?.imageMessage) {
      imageMessage = quotedMsg.viewOnceMessageV2.message.imageMessage;
      console.log('[QRREAD] View once image detected');
    } 
    else if (quotedMsg?.viewOnceMessage?.message?.imageMessage) {
      imageMessage = quotedMsg.viewOnceMessage.message.imageMessage;
      console.log('[QRREAD] View once image (old) detected');
    }
    // Fallback: cari semua kemungkinan image
    else if (quotedMsg) {
      const keys = Object.keys(quotedMsg);
      for (const key of keys) {
        if (key.toLowerCase().includes('image')) {
          imageMessage = quotedMsg[key];
          console.log(`[QRREAD] Detected image via key: ${key}`);
          break;
        }
      }
    }

    // Jika tidak ada gambar
    if (!imageMessage) {
      return bot.sendMessage(
        remoteJid,
        { 
          text: `📸 *Cara Penggunaan QR Code Reader*\n\nKirim atau reply gambar yang mengandung QR code dengan caption:\n• .qrread\n• .scanqr\n• .readqr\n\n*Contoh:*\n1. Kirim gambar dengan caption .qrread\n2. Reply gambar dengan .qrread\n\n*Format gambar yang didukung:*\n• JPEG, PNG, GIF\n• File gambar sebagai dokumen\n• View once image\n\n*Catatan:*\nPastikan QR code jelas dan tidak blur untuk hasil terbaik!`
        },
        { quoted: m }
      );
    }

    try {
      // Kirim status proses
      await bot.sendMessage(remoteJid, { text: `🔍 *Memproses gambar...*\n\nSedang mendownload dan menganalisis QR code...` }, { quoted: m });

      // Download gambar
      let buffer = Buffer.from([]);
      const mediaType = imageMessage.mimetype?.startsWith('image/') ? 'image' : 'document';
      const stream = await downloadContentFromMessage(imageMessage, mediaType);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer.length) {
        throw new Error('Gambar kosong atau gagal didownload');
      }

      console.log(`[QRREAD] Image downloaded: ${buffer.length} bytes`);

      // Simpan file sementara
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const tempPath = path.join(tempDir, `qr_temp_${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      // Proses gambar dengan Jimp
      const image = await Jimp.read(buffer);
      
      // Resize jika terlalu besar (untuk performa)
      if (image.bitmap.width > 1024 || image.bitmap.height > 1024) {
        image.resize(1024, Jimp.AUTO);
      }

      // Konversi ke grayscale untuk QR detection yang lebih baik
      image.grayscale();
      
      // Simpan versi processed untuk QR reader
      const processedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

      // Coba dengan qrcode-reader
      try {
        const QrCode = require('qrcode-reader');
        const qr = new QrCode();
        
        // Wrap callback dalam Promise
        const qrResult = await new Promise((resolve, reject) => {
          qr.callback = function(err, value) {
            if (err) {
              reject(err);
            } else {
              resolve(value);
            }
          };
          
          // Decode QR code
          qr.decode(image.bitmap);
        });

        console.log('[QRREAD] QR Code detected:', qrResult.result);

        // Format hasil
        const resultText = qrResult.result;
        let formattedResult = resultText;
        
        // Deteksi jenis konten QR
        let detectedType = 'Text';
        if (resultText.startsWith('http://') || resultText.startsWith('https://')) {
          detectedType = 'URL/Link';
        } else if (resultText.startsWith('WIFI:')) {
          detectedType = 'Wi-Fi Configuration';
        } else if (resultText.startsWith('BEGIN:VCARD')) {
          detectedType = 'Contact (vCard)';
        } else if (resultText.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
          detectedType = 'Email';
        } else if (resultText.match(/^(\+\d{1,3}[- ]?)?\d{10}$/)) {
          detectedType = 'Phone Number';
        }

        // Buat response message
        const response = `✅ *QR CODE BERHASIL DIBACA*\n
📊 *Tipe:* ${detectedType}
📝 *Hasil:*
\`\`\`
${formattedResult}
\`\`\`

${detectedType === 'URL/Link' ? '🔗 *Link terdeteksi, bisa langsung diklik!*' : ''}`;

        // Kirim hasil
        await bot.sendMessage(remoteJid, { 
          text: response,
          linkPreview: detectedType === 'URL/Link' ? { url: resultText } : null
        }, { quoted: m });

        // Jika hasil panjang, kirim sebagai file juga
        if (formattedResult.length > 500) {
          const resultPath = path.join(tempDir, `qr_result_${Date.now()}.txt`);
          fs.writeFileSync(resultPath, `QR Code Result\nDate: ${new Date().toLocaleString('id-ID')}\nType: ${detectedType}\n\n${formattedResult}`);
          
          await bot.sendMessage(remoteJid, {
            document: fs.readFileSync(resultPath),
            fileName: `qr_result_${Date.now()}.txt`,
            mimetype: 'text/plain'
          }, { quoted: m });
          
          fs.unlinkSync(resultPath);
        }

        // Cleanup
        fs.unlinkSync(tempPath);

      } catch (qrError) {
        console.error('[QRREAD] QR decode error:', qrError.message);
        
        // Coba alternatif dengan qrcode jika ada
        try {
          const qrcode = require('qrcode');
          const result = await qrcode.decode(buffer);
          
          if (result) {
            await bot.sendMessage(remoteJid, {
              text: `✅ *QR CODE DITEMUKAN*\n\n*Hasil:*\n\`\`\`${result}\`\`\``
            }, { quoted: m });
          } else {
            throw new Error('Tidak bisa membaca QR code');
          }
        } catch (altError) {
          // Jika masih gagal, kirim pesan error
          await bot.sendMessage(remoteJid, {
            text: `❌ *GAGAL MEMBACA QR CODE*\n\n*Penyebab mungkin:*\n1. Gambar tidak mengandung QR code\n2. QR code blur atau rusak\n3. Ukuran terlalu kecil/besar\n4. Format tidak didukung\n\n*Tips:*\n• Pastikan QR code jelas\n• Gunakan gambar dengan pencahayaan cukup\n• Crop area QR code saja jika perlu`
          }, { quoted: m });
        }
        
        // Cleanup
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }

    } catch (error) {
      console.error('[QRREAD] General error:', error);
      
      await bot.sendMessage(remoteJid, {
        text: `❌ *TERJADI KESALAHAN*\n\n${error.message}\n\nSilakan coba lagi dengan gambar yang berbeda.`
      }, { quoted: m });
    }
  }
};

// Helper function untuk QR detection alternatif
async function detectQRWithSharp(buffer) {
  try {
    // Alternatif menggunakan sharp jika tersedia
    const sharp = require('sharp');
    
    // Preprocess image untuk meningkatkan kontras
    const processed = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
    
    return processed;
  } catch (error) {
    console.log('[QRREAD] Sharp not available, using Jimp only');
    return buffer;
  }
}