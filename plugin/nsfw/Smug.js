// File: plugins/tools/Smug.js

const fetch = require('node-fetch');

module.exports = {
    command: ['smug'], // Command: .smug
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['smug'],
    description: 'Random gambar smug dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari smug terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/smug`;
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
                caption: `✨ *Random smug*\n\nSumber: api.waifu.pics\nKategori: smug`
            }, { quoted: m });

        } catch (error) {
            console.error('[SMUG COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
