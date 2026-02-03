// File: plugins/tools/Kiss.js

const fetch = require('node-fetch');

module.exports = {
    command: ['kiss'], // Command: .kiss
    ownerOnly: false,
    limit: true,
    tags: 'tools',
    help: ['kiss'],
    description: 'Random gambar kiss dari waifu.pics',

    async execute(bot, m) {
        await bot.sendMessage(m.key.remoteJid, { 
            text: '✨ Lagi cari kiss terbaik buat kamu...' 
        }, { quoted: m });

        try {
            const url = `https://api.waifu.pics/sfw/kiss`;
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
                caption: `✨ *Random kiss*\n\nSumber: api.waifu.pics\nKategori: kiss`
            }, { quoted: m });

        } catch (error) {
            console.error('[KISS COMMAND] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ Gagal ambil gambar, coba lagi nanti!'
            }, { quoted: m });
        }
    }
};
