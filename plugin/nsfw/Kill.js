// File: plugins/tools/Kill.js

const fetch = require('node-fetch');

module.exports = {
    command: ['kill'], // Command: .kill
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['kill'],
    description: 'Random gambar kill dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari kill terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/kill`;
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
                caption: `✨ *Random kill*\n\nSumber: api.waifu.pics\nKategori: kill`
            }, { quoted: m });

        } catch (error) {
            console.error('[KILL COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
