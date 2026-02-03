// File: plugins/tools/Smile.js

const fetch = require('node-fetch');

module.exports = {
    command: ['smile'], // Command: .smile
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['smile'],
    description: 'Random gambar smile dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari smile terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/smile`;
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
                caption: `✨ *Random smile*\n\nSumber: api.waifu.pics\nKategori: smile`
            }, { quoted: m });

        } catch (error) {
            console.error('[SMILE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
