// File: plugin/search/Sfile.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['sfilesrch'], // Hanya satu command: .sfilesrch
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['sfilesrch <keyword>'],
    description: 'Mencari file di Sfile.mobi',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();

        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Pakai format: ${config.prefix}sfilesrch <keyword>\n\nContoh: ${config.prefix}sfilesrch bot whatsapp`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang cari di Sfile.mobi...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/sfile`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();

            if (!data.status || !data.result || data.result.length === 0) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Nihil hasil bree, coba keyword lain!'
                }, { quoted: m });
            }

            let teks = `*[ HASIL SFILE SEARCH ]*\n\nPencarian: *${query}*\n\n`;

            data.result.slice(0, 15).forEach((file, i) => {
                const title = file.title.trim();
                const size = file.size.split('-')[0].trim(); // Ambil ukuran aja, buang downloads
                const link = file.link;

                teks += `${i + 1}. *${title}*\n`;
                teks += `   ├ Ukuran: ${size}\n`;
                teks += `   └ ${link}\n\n`;
            });

            teks += `💡 Klik link di atas untuk download langsung!\n`;
            teks += config.copyright || '';

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[SFILE SEARCH] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ API lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};