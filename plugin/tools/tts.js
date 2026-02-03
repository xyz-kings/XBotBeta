const gtts = require("node-gtts");
const fs = require("fs");
const path = require("path");

module.exports = {
    command: ["tts", "texttospeech"],
    category: "tools",
    description: "Convert teks ke suara (Text-to-Speech)",
    
    async execute(bot, m, args) {
        try {
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Cara pakai:* `.tts <bahasa> <teks>`\n\n*Bahasa yang tersedia:*\nid (Indonesia), en (Inggris), ja (Jepang), ko (Korea), zh (China), fr (Prancis), es (Spanyol)\n\n*Contoh:*\n`.tts id halo semua`\n`.tts en hello world`"
                }, { quoted: m });
            }
            
            if (args.length < 2) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ *Format salah!*\nContoh: `.tts id halo dunia`"
                }, { quoted: m });
            }
            
            const lang = args[0].toLowerCase();
            const text = args.slice(1).join(" ");
            
            // Validasi bahasa
            const supportedLangs = ['id', 'en', 'ja', 'ko', 'zh', 'fr', 'es', 'de', 'pt', 'ru', 'it'];
            if (!supportedLangs.includes(lang)) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: `❌ Bahasa "${lang}" tidak didukung.\nGunakan: ${supportedLangs.join(', ')}`
                }, { quoted: m });
            }
            
            // Validasi panjang teks
            if (text.length > 200) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: "❌ Teks terlalu panjang! Maksimal 200 karakter."
                }, { quoted: m });
            }
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: "🔊 *Membuat audio TTS...*"
            }, { quoted: m });
            
            try {
                const tts = gtts(lang);
                const filename = `tts_${Date.now()}.mp3`;
                const filepath = path.join(__dirname, '..', '..', 'temp', filename);
                
                // Buat folder temp jika belum ada
                const tempDir = path.join(__dirname, '..', '..', 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                // Generate TTS
                await new Promise((resolve, reject) => {
                    tts.save(filepath, text, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                // Baca file
                const audioBuffer = fs.readFileSync(filepath);
                
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                // Dapatkan info bahasa
                const langInfo = {
                    'id': { name: 'Indonesia', flag: '🇮🇩' },
                    'en': { name: 'Inggris', flag: '🇬🇧' },
                    'ja': { name: 'Jepang', flag: '🇯🇵' },
                    'ko': { name: 'Korea', flag: '🇰🇷' },
                    'zh': { name: 'China', flag: '🇨🇳' },
                    'fr': { name: 'Prancis', flag: '🇫🇷' },
                    'es': { name: 'Spanyol', flag: '🇪🇸' },
                    'de': { name: 'Jerman', flag: '🇩🇪' },
                    'pt': { name: 'Portugis', flag: '🇵🇹' },
                    'ru': { name: 'Rusia', flag: '🇷🇺' },
                    'it': { name: 'Italia', flag: '🇮🇹' }
                };
                
                const caption = `${langInfo[lang]?.flag || '🌐'} *TEXT-TO-SPEECH*\n\n📝 *Teks:* ${text}\n🗣️ *Bahasa:* ${langInfo[lang]?.name || lang}\n🔊 *Format:* MP3\n⏱️ *Durasi:* ~${Math.ceil(text.length / 10)} detik`;
                
                // Kirim audio
                await bot.sendMessage(m.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `tts_${lang}.mp3`
                }, { quoted: m });
                
                // Kirim caption terpisah
                await bot.sendMessage(m.key.remoteJid, {
                    text: caption
                });
                
                // Hapus file temp
                try {
                    fs.unlinkSync(filepath);
                } catch (e) {}
                
            } catch (ttsErr) {
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: `❌ Gagal membuat TTS:\n${ttsErr.message}`
                }, { quoted: m });
            }
            
        } catch (err) {
            console.error("[TTS ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Error saat membuat TTS."
            }, { quoted: m });
        }
    }
};