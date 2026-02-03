// File: plugins/tools/Poke.js

const fetch = require('node-fetch');

module.exports = {
    command: ['poke'], // Command: .poke
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['poke'],
    description: 'Random gambar poke dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari poke terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/poke`;
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
                caption: `✨ *Random poke*\n\nSumber: api.waifu.pics\nKategori: poke`
            }, { quoted: m });

        } catch (error) {
            console.error('[POKE COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
