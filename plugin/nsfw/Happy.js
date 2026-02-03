// File: plugins/tools/Happy.js

const fetch = require('node-fetch');

module.exports = {
    command: ['happy'], // Command: .happy
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['happy'],
    description: 'Random gambar happy dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari happy terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/happy`;
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
                caption: `✨ *Random happy*\n\nSumber: api.waifu.pics\nKategori: happy`
            }, { quoted: m });

        } catch (error) {
            console.error('[HAPPY COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
