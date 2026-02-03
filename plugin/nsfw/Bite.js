// File: plugins/tools/Bite.js

const fetch = require('node-fetch');

module.exports = {
    command: ['bite'], // Command: .bite
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['bite'],
    description: 'Random gambar bite dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari bite terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/bite`;
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
                caption: `✨ *Random bite*\n\nSumber: api.waifu.pics\nKategori: bite`
            }, { quoted: m });

        } catch (error) {
            console.error('[BITE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
