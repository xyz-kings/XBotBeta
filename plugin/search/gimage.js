// File: plugin/search/Gimage.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['goglesrcimg'], // Hanya satu command: .goglesrcimg
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['goglesrcimg <keyword>'],
    description: 'Mencari gambar di Google',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();

        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Pakai format: ${config.prefix}goglesrcimg <keyword>\n\nContoh: ${config.prefix}goglesrcimg kucing lucu`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang cari gambar di Google...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/gimage`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Nihil hasil gambar bree, coba keyword lain!'
                }, { quoted: m });
            }

            let teks = `*[ HASIL GOOGLE IMAGE ]*\n\nPencarian: *${query}*\n\n`;

            // Ambil hanya URL unik & batasi 15 hasil
            const uniqueUrls = [...new Set(data.result.map(item => item.url))];
            uniqueUrls.slice(0, 15).forEach((imgUrl, i) => {
                teks += `${i + 1}. ${imgUrl}\n\n`;
            });

            teks += `💡 Klik/copy link di atas untuk buka gambar!\n`;
            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[GIMAGE SEARCH] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ API lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};