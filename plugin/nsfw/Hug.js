// File: plugins/tools/Hug.js

const fetch = require('node-fetch');

module.exports = {
    command: ['hug'], // Command: .hug
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['hug'],
    description: 'Random gambar hug dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari hug terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/hug`;
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
                caption: `✨ *Random hug*\n\nSumber: api.waifu.pics\nKategori: hug`
            }, { quoted: m });

        } catch (error) {
            console.error('[HUG COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
