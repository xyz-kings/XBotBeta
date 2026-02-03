// File: plugins/tools/Slap.js

const fetch = require('node-fetch');

module.exports = {
    command: ['slap'], // Command: .slap
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['slap'],
    description: 'Random gambar slap dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari slap terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/slap`;
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
                caption: `✨ *Random slap*\n\nSumber: api.waifu.pics\nKategori: slap`
            }, { quoted: m });

        } catch (error) {
            console.error('[SLAP COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
