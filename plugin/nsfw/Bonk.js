// File: plugins/tools/Bonk.js

const fetch = require('node-fetch');

module.exports = {
    command: ['bonk'], // Command: .bonk
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['bonk'],
    description: 'Random gambar bonk dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari bonk terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/bonk`;
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
                caption: `✨ *Random bonk*\n\nSumber: api.waifu.pics\nKategori: bonk`
            }, { quoted: m });

        } catch (error) {
            console.error('[BONK COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
