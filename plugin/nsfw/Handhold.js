// File: plugins/tools/Handhold.js

const fetch = require('node-fetch');

module.exports = {
    command: ['handhold'], // Command: .handhold
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['handhold'],
    description: 'Random gambar handhold dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari handhold terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/handhold`;
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
                caption: `✨ *Random handhold*\n\nSumber: api.waifu.pics\nKategori: handhold`
            }, { quoted: m });

        } catch (error) {
            console.error('[HANDHOLD COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
