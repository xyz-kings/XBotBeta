// File: plugins/tools/Blush.js

const fetch = require('node-fetch');

module.exports = {
    command: ['blush'], // Command: .blush
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['blush'],
    description: 'Random gambar blush dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari blush terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/blush`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('API response not ok');
            }

            const data = await res.json();
            
            if (!data || !data.url) {
                throw new Error('Invalid API response');
            }

            const imageRes = await fetch(data.url);
            const buffer = await imageRes.buffer();

            await bot.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: `✨ *Random blush*\n\nSumber: api.waifu.pics\nKategori: blush`
            }, { quoted: m });

        } catch (error) {
            console.error('[BLUSH COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
