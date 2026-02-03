// File: plugins/tools/Highfive.js

const fetch = require('node-fetch');

module.exports = {
    command: ['highfive'], // Command: .highfive
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['highfive'],
    description: 'Random gambar highfive dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari highfive terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/highfive`;
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
                caption: `✨ *Random highfive*\n\nSumber: api.waifu.pics\nKategori: highfive`
            }, { quoted: m });

        } catch (error) {
            console.error('[HIGHFIVE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
