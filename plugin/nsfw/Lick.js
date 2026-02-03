// File: plugins/tools/Lick.js

const fetch = require('node-fetch');

module.exports = {
    command: ['lick'], // Command: .lick
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['lick'],
    description: 'Random gambar lick dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari lick terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/lick`;
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
                caption: `✨ *Random lick*\n\nSumber: api.waifu.pics\nKategori: lick`
            }, { quoted: m });

        } catch (error) {
            console.error('[LICK COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
