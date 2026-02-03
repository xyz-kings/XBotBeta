// File: plugins/tools/Cuddle.js

const fetch = require('node-fetch');

module.exports = {
    command: ['cuddle'], // Command: .cuddle
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['cuddle'],
    description: 'Random gambar cuddle dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari cuddle terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/cuddle`;
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
                caption: `✨ *Random cuddle*\n\nSumber: api.waifu.pics\nKategori: cuddle`
            }, { quoted: m });

        } catch (error) {
            console.error('[CUDDLE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
