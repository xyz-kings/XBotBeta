// File: plugins/tools/Glomp.js

const fetch = require('node-fetch');

module.exports = {
    command: ['glomp'], // Command: .glomp
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['glomp'],
    description: 'Random gambar glomp dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari glomp terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/glomp`;
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
                caption: `✨ *Random glomp*\n\nSumber: api.waifu.pics\nKategori: glomp`
            }, { quoted: m });

        } catch (error) {
            console.error('[GLOMP COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
