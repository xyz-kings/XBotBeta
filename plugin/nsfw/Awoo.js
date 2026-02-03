// File: plugins/tools/Awoo.js

const fetch = require('node-fetch');

module.exports = {
    command: ['awoo'], // Command: .awoo
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['awoo'],
    description: 'Random gambar awoo dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari awoo terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/awoo`;
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
                caption: `✨ *Random awoo*\n\nSumber: api.waifu.pics\nKategori: awoo`
            }, { quoted: m });

        } catch (error) {
            console.error('[AWOO COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
