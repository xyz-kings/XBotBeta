// File: plugins/tools/Bully.js

const fetch = require('node-fetch');

module.exports = {
    command: ['bully'], // Command: .bully
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['bully'],
    description: 'Random gambar bully dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari bully terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/bully`;
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
                caption: `✨ *Random bully*\n\nSumber: api.waifu.pics\nKategori: bully`
            }, { quoted: m });

        } catch (error) {
            console.error('[BULLY COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
