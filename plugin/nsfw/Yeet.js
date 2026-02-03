// File: plugins/tools/Yeet.js

const fetch = require('node-fetch');

module.exports = {
    command: ['yeet'], // Command: .yeet
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['yeet'],
    description: 'Random gambar yeet dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari yeet terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/yeet`;
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
                caption: `✨ *Random yeet*\n\nSumber: api.waifu.pics\nKategori: yeet`
            }, { quoted: m });

        } catch (error) {
            console.error('[YEET COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
