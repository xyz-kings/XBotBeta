const { translate } = require("@vitalets/google-translate-api");
const axios = require("axios");

module.exports = {
    command: ["translate", "tr", "terjemah"],
    category: "tools",
    description: "Terjemahkan teks antar bahasa",
    
    async execute(bot, m, args) {
        try {
            // Cek format: .translate en teks atau .translate teks (auto detect)
            if (!args[0]) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: `🌐 *TRANSLATE BOT*\n\n*Format 1 (Spesifik Bahasa):*\n\`.translate <kode-bahasa> <teks>\`\n*Contoh:* \`.translate en halo dunia\`\n\n*Format 2 (Auto Detect):*\n\`.translate <teks>\`\n*Contoh:* \`.translate hello world\`\n\n*Bahasa yang didukung:*\n🇮🇩 id - Indonesia\n🇬🇧 en - Inggris\n🇯🇵 ja - Jepang\n🇰🇷 ko - Korea\n🇨🇳 zh - Mandarin\n🇸🇦 ar - Arab\n🇫🇷 fr - Prancis\n🇪🇸 es - Spanyol\n🇩🇪 de - Jerman\n🇷🇺 ru - Rusia\n🇵🇹 pt - Portugis\n🇮🇹 it - Italia\n\n*Contoh lengkap:*\n\`.translate en selamat pagi\` → Good morning\n\`.translate id good morning\` → Selamat pagi`
                }, { quoted: m });
            }
            
            let targetLang, text, detectedLang = 'auto';
            
            // Cek apakah argumen pertama adalah kode bahasa
            const langCodes = ['id', 'en', 'ja', 'ko', 'zh', 'ar', 'fr', 'es', 'de', 'ru', 'pt', 'it', 'nl', 'th', 'vi'];
            
            if (langCodes.includes(args[0].toLowerCase())) {
                targetLang = args[0].toLowerCase();
                text = args.slice(1).join(" ");
                if (!text) {
                    return bot.sendMessage(m.key.remoteJid, {
                        text: "❌ *Teks tidak ditemukan!*\nContoh: `.translate en halo dunia`"
                    }, { quoted: m });
                }
            } else {
                // Auto detect bahasa target (default ke Indonesia)
                targetLang = 'id';
                text = args.join(" ");
                
                // Coba deteksi bahasa asli
                try {
                    const detection = await translate(text.substring(0, 100), { to: 'en' });
                    detectedLang = detection.from.language.iso;
                } catch (e) {
                    detectedLang = 'auto';
                }
            }
            
            const loading = await bot.sendMessage(m.key.remoteJid, {
                text: `🌍 *Menerjemahkan...*`
            }, { quoted: m });
            
            try {
                const result = await translate(text, { 
                    to: targetLang,
                    from: detectedLang === 'auto' ? undefined : detectedLang
                });
                
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                // Nama bahasa
                const languageMap = {
                    'id': { name: 'Indonesia', flag: '🇮🇩' },
                    'en': { name: 'Inggris', flag: '🇬🇧' },
                    'ja': { name: 'Jepang', flag: '🇯🇵' },
                    'ko': { name: 'Korea', flag: '🇰🇷' },
                    'zh': { name: 'Mandarin', flag: '🇨🇳' },
                    'ar': { name: 'Arab', flag: '🇸🇦' },
                    'fr': { name: 'Prancis', flag: '🇫🇷' },
                    'es': { name: 'Spanyol', flag: '🇪🇸' },
                    'de': { name: 'Jerman', flag: '🇩🇪' },
                    'ru': { name: 'Rusia', flag: '🇷🇺' },
                    'pt': { name: 'Portugis', flag: '🇵🇹' },
                    'it': { name: 'Italia', flag: '🇮🇹' },
                    'nl': { name: 'Belanda', flag: '🇳🇱' },
                    'th': { name: 'Thailand', flag: '🇹🇭' },
                    'vi': { name: 'Vietnam', flag: '🇻🇳' }
                };
                
                let report = `🌐 *HASIL TERJEMAHAN*\n\n`;
                
                // Info bahasa
                const fromLang = detectedLang === 'auto' ? 'Auto-detect' : 
                               languageMap[detectedLang]?.name || detectedLang;
                const toLang = languageMap[targetLang]?.name || targetLang;
                
                report += `📊 *Detail:*\n`;
                report += `   ${languageMap[detectedLang]?.flag || '🌐'} *Dari:* ${fromLang}\n`;
                report += `   ${languageMap[targetLang]?.flag || '🎯'} *Ke:* ${toLang}\n\n`;
                
                // Teks asli (potong jika terlalu panjang)
                if (text.length > 300) {
                    report += `📝 *Teks Asli:*\n${text.substring(0, 300)}...\n\n`;
                } else {
                    report += `📝 *Teks Asli:*\n${text}\n\n`;
                }
                
                // Hasil terjemahan
                report += `🎯 *Hasil Terjemahan:*\n${result.text}\n\n`;
                
                // Pronunciation jika tersedia
                if (result.raw && result.raw[0] && result.raw[0][0] && result.raw[0][0][0]) {
                    const pronunciation = result.raw[0][0][0];
                    if (pronunciation !== result.text) {
                        report += `🔊 *Pengucapan:* ${pronunciation}\n`;
                    }
                }
                
                // Contoh penggunaan jika tersedia
                if (result.raw && result.raw[1] && result.raw[1][0]) {
                    const examples = result.raw[1][0];
                    if (examples.length > 0) {
                        report += `\n💡 *Contoh Penggunaan:*\n`;
                        examples.slice(0, 2).forEach((example, idx) => {
                            if (example[0] && example[1]) {
                                report += `${idx + 1}. ${example[0]} → ${example[1]}\n`;
                            }
                        });
                    }
                }
                
                // Karakter count
                report += `\n📏 *Statistik:*\n`;
                report += `   • Karakter asli: ${text.length}\n`;
                report += `   • Karakter hasil: ${result.text.length}\n`;
                
                // Accuracy info
                if (result.raw && result.raw[6] !== undefined) {
                    const confidence = Math.round(result.raw[6] * 100);
                    report += `   • Akurasi: ${confidence}%\n`;
                }
                
                report += `\n⏰ *Diterjemahkan menggunakan Google Translate*`;
                
                await bot.sendMessage(m.key.remoteJid, {
                    text: report
                }, { quoted: m });
                
            } catch (translateErr) {
                await bot.sendMessage(m.key.remoteJid, {
                    delete: loading.key
                });
                
                // Fallback menggunakan API alternatif
                try {
                    const fallbackText = encodeURIComponent(text);
                    const fallbackRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${fallbackText}`);
                    
                    if (fallbackRes.data && fallbackRes.data[0]) {
                        const translatedText = fallbackRes.data[0].map(item => item[0]).join('');
                        
                        await bot.sendMessage(m.key.remoteJid, {
                            text: `🌐 *HASIL TERJEMAHAN (Fallback)*\n\n📝 *Asli:* ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n\n🎯 *Hasil:* ${translatedText.substring(0, 200)}${translatedText.length > 200 ? '...' : ''}`
                        }, { quoted: m });
                    } else {
                        throw new Error("No translation result");
                    }
                    
                } catch (fallbackErr) {
                    await bot.sendMessage(m.key.remoteJid, {
                        text: `❌ *Gagal menerjemahkan!*\n\n*Kemungkinan penyebab:*\n• Teks terlalu panjang\n• Bahasa tidak didukung\n• Koneksi internet bermasalah\n\n*Tips:*\n• Gunakan teks maksimal 5000 karakter\n• Pastikan kode bahasa valid\n• Coba lagi beberapa saat`
                    }, { quoted: m });
                }
            }
            
        } catch (err) {
            console.error("[TRANSLATE ERROR]", err);
            await bot.sendMessage(m.key.remoteJid, {
                text: "❌ Error sistem saat menerjemahkan."
            }, { quoted: m });
        }
    }
};