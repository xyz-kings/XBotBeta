// File: plugins/tools/Dance.js

const fetch = require('node-fetch');

module.exports = {
    command: ['dance'], // Command: .dance
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['dance'],
    description: 'Random gambar dance dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari dance terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/dance`;
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
                caption: `✨ *Random dance*\n\nSumber: api.waifu.pics\nKategori: dance`
            }, { quoted: m });

        } catch (error) {
            console.error('[DANCE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
