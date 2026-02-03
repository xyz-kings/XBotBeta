// File: plugins/tools/Pat.js

const fetch = require('node-fetch');

module.exports = {
    command: ['pat'], // Command: .pat
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['pat'],
    description: 'Random gambar pat dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari pat terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/pat`;
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
                caption: `✨ *Random pat*\n\nSumber: api.waifu.pics\nKategori: pat`
            }, { quoted: m });

        } catch (error) {
            console.error('[PAT COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
