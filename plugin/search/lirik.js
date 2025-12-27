// File: plugin/search/Lyrics.js

const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    command: ['lirksrch'], // Hanya satu command: .lirksrch
    ownerOnly: false,
    limit: true,
    tags: 'search',
    help: ['lirksrch <judul lagu>'],
    description: 'Mencari lirik lagu',

    async execute(bot, m, args) {
        const query = args.join(' ').trim();

        if (!query) {
            return bot.sendMessage(m.key.remoteJid, {
                text: `❌ Pakai format: ${config.prefix}lirksrch <judul lagu>\n\nContoh: ${config.prefix}lirksrch last child`
            }, { quoted: m });
        }

        await bot.sendMessage(m.key.remoteJid, { text: '🔍 Sedang cari lirik lagu...' }, { quoted: m });

        try {
            const url = `${config.baseURL}/search/lyrics`;
            const params = new URLSearchParams({
                apikey: config.apiKey,
                q: query
            });

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();

            if (!data.status || !data.result) {
                return bot.sendMessage(m.key.remoteJid, {
                    text: '❌ Lirik tidak ditemukan bree, coba judul lain!'
                }, { quoted: m });
            }

            // Bersihin lirik dari karakter aneh & format rapi
            let lyrics = data.result.trim();
            lyrics = lyrics.replace(/\\n/g, '\n'); // Ganti \n jadi newline beneran
            lyrics = lyrics.replace(/ +/g, ' ');   // Hilangkan spasi berlebih

            const teks = `*[ LIRIK LAGU ]*\n\nJudul: *${query.toUpperCase()}*\n\n\`\`\`${lyrics}\`\`\`\n\n${config.copyright || ''}`;

            await bot.sendMessage(m.key.remoteJid, { text: teks.trim() }, { quoted: m });

        } catch (error) {
            console.error('[LYRICS SEARCH] Error:', error);
            await bot.sendMessage(m.key.remoteJid, {
                text: '❌ API lagi error bree, coba lagi nanti ya!'
            }, { quoted: m });
        }
    }
};