// File: plugins/tools/Cringe.js

const fetch = require('node-fetch');

module.exports = {
    command: ['cringe'], // Command: .cringe
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['cringe'],
    description: 'Random gambar cringe dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari cringe terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/cringe`;
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
                caption: `✨ *Random cringe*\n\nSumber: api.waifu.pics\nKategori: cringe`
            }, { quoted: m });

        } catch (error) {
            console.error('[CRINGE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
