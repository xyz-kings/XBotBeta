// File: plugins/tools/Cry.js

const fetch = require('node-fetch');

module.exports = {
    command: ['cry'], // Command: .cry
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['cry'],
    description: 'Random gambar cry dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari cry terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/cry`;
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
                caption: `✨ *Random cry*\n\nSumber: api.waifu.pics\nKategori: cry`
            }, { quoted: m });

        } catch (error) {
            console.error('[CRY COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
