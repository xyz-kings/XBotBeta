// File: plugins/tools/Shinobu.js

const fetch = require('node-fetch');

module.exports = {
    command: ['shinobu'], // Command: .shinobu
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['shinobu'],
    description: 'Random gambar Shinobu dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '🦋 Lagi cari Shinobu terbaik buat kamu...' 
        }, { quoted: m });

        try {
            // Menggunakan API waifu.pics untuk kategori shinobu
            const url = `https://api.waifu.pics/sfw/shinobu`;
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
                caption: `🌸 *Random Shinobu*\n\nShinobu Kochou - The Insect Hashira 🦋\n\nSumber: api.waifu.pics\nKategori: shinobu`
            }, { quoted: m });

        } catch (error) {
            console.error('[SHINOBU COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Shinobu lagi sibuk melawan iblis, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};