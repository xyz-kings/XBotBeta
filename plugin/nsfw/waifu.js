// File: plugins/tools/Waifu.js

const fetch = require('node-fetch');

module.exports = {
    command: ['waifu'], // Command: .waifu
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['waifu'],
    description: 'Random gambar waifu dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '🌸 Lagi cari waifu terbaik buat kamu...' 
        }, { quoted: m });

        try {
            // Menggunakan API waifu.pics untuk kategori waifu
            const url = `https://api.waifu.pics/sfw/waifu`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('API response not ok');
            }

            const data = await res.json();
            
            if (!data || !data.url) {
                throw new Error('Invalid API response');
            }

            // Download gambar dari URL yang diberikan API
            const imageRes = await fetch(data.url);
            const buffer = await imageRes.buffer();

            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `🌸 *Random Waifu*\n\nWaifu spesial hari ini untukmu! 💖\n\nSumber: api.waifu.pics\nKategori: waifu`
            }, { quoted: m });

        } catch (error) {
            console.error('[WAIFU COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Waifunya lagi malu-malu, coba lagi ya!'
            }, { quoted: m });
        }
    }
};