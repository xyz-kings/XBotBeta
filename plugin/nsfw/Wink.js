// File: plugins/tools/Wink.js

const fetch = require('node-fetch');

module.exports = {
    command: ['wink'], // Command: .wink
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['wink'],
    description: 'Random gambar wink dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari wink terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/wink`;
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
                caption: `✨ *Random wink*\n\nSumber: api.waifu.pics\nKategori: wink`
            }, { quoted: m });

        } catch (error) {
            console.error('[WINK COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
