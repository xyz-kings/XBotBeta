// File: plugins/tools/Kick.js

const fetch = require('node-fetch');

module.exports = {
    command: ['kick'], // Command: .kick
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['kick'],
    description: 'Random gambar kick dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari kick terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/kick`;
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
                caption: `✨ *Random kick*\n\nSumber: api.waifu.pics\nKategori: kick`
            }, { quoted: m });

        } catch (error) {
            console.error('[KICK COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
