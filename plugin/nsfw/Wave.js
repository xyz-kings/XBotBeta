// File: plugins/tools/Wave.js

const fetch = require('node-fetch');

module.exports = {
    command: ['wave'], // Command: .wave
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['wave'],
    description: 'Random gambar wave dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari wave terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/wave`;
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
                caption: `✨ *Random wave*\n\nSumber: api.waifu.pics\nKategori: wave`
            }, { quoted: m });

        } catch (error) {
            console.error('[WAVE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
